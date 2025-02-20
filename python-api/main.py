from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ee
import os
import json
from google.oauth2 import service_account

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, list allowed domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Earth Engine initialization with authentication
LOCAL_JSON_PATH = "service-key.json"

if os.getenv("SERVICE_ACCOUNT_JSON"):
    service_account_json = os.getenv("SERVICE_ACCOUNT_JSON")
    service_account_data = json.loads(service_account_json)

    temp_filename = "/tmp/service-key.json"
    with open(temp_filename, "w") as f:
        json.dump(service_account_data, f)

    SERVICE_ACCOUNT_FILE = temp_filename
elif os.path.exists(LOCAL_JSON_PATH):
    # If running locally, use existing JSON file
    SERVICE_ACCOUNT_FILE = LOCAL_JSON_PATH
else:
    raise ValueError("No JSON found for authentication!")

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=["https://www.googleapis.com/auth/earthengine.readonly"]
)
ee.Initialize(credentials)


class AreaRequest(BaseModel):
    coordinates: list  # List of polygon coordinates or point [lon, lat]
    buffer_km: int = 5  # Buffer size around point (default 5km)


def get_satellite_image(coordinates, buffer_km):
    try:
        # Define region of interest (point with buffer or polygon)
        if len(coordinates) == 1:
            point = ee.Geometry.Point(coordinates[0])
            region = point.buffer(buffer_km * 1000).bounds()
        else:
            region = ee.Geometry.Polygon(coordinates)

        # Get most recent Sentinel-2 image
        image_collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(region)
            .filterDate("2022-01-01", "2024-02-01")
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            .sort("CLOUDY_PIXEL_PERCENTAGE", True)
        )

        image_list = image_collection.toList(image_collection.size())
        image = ee.Image(image_list.get(0))

        # If no valid image found, try Landsat 9
        if image is None:
            image_collection = (
                ee.ImageCollection("LANDSAT/LC09/C02/T1_TOA")
                .filterBounds(region)
                .filterDate("2022-01-01", "2024-02-01")
                .filter(ee.Filter.lt("CLOUD_COVER", 20))
                .sort("CLOUD_COVER", True)
            )

            image_list = image_collection.toList(image_collection.size())
            image = ee.Image(image_list.get(0))

        if image is None:
            raise HTTPException(status_code=404, detail="No images found for this region.")

        # Select RGB bands (different for Landsat and Sentinel)
        bands = ["B4", "B3", "B2"]
        if "SR_B4" in image.bandNames().getInfo():
            bands = ["SR_B4", "SR_B3", "SR_B2"]
        image = image.select(bands)

        # Remove invalid pixels
        image = image.updateMask(image.select(bands[0]).gt(0))

        url = image.getThumbURL({"region": region.getInfo(), "scale": 20, "format": "png"})

        print(f"✅ Image URL: {url}")

        return url

    except Exception as e:
        print(f"❌ Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/get_satellite_image/")
def generate_image(request: AreaRequest):
    image_url = get_satellite_image(request.coordinates, request.buffer_km)
    return {"image_url": image_url}
