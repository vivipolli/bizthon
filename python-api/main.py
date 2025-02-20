from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ee
import os
import json
from google.oauth2 import service_account

app = FastAPI()

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, liste os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos
    allow_headers=["*"],  # Permite todos os headers
)

# 🔹 Inicialização do Earth Engine com autenticação
LOCAL_JSON_PATH = "service-key.json"

if os.getenv("SERVICE_ACCOUNT_JSON"):
    # Se estiver rodando no Railway, pega o JSON da variável de ambiente
    service_account_json = os.getenv("SERVICE_ACCOUNT_JSON")
    service_account_data = json.loads(service_account_json)

    # Salva em um arquivo temporário no Railway
    temp_filename = "/tmp/service-key.json"
    with open(temp_filename, "w") as f:
        json.dump(service_account_data, f)

    SERVICE_ACCOUNT_FILE = temp_filename
elif os.path.exists(LOCAL_JSON_PATH):
    # Se estiver rodando localmente, usa o arquivo JSON existente
    SERVICE_ACCOUNT_FILE = LOCAL_JSON_PATH
else:
    raise ValueError("Nenhum JSON encontrado para autenticação!")

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=["https://www.googleapis.com/auth/earthengine.readonly"]
)
ee.Initialize(credentials)


# 🔹 Modelo de entrada (dados do cliente)
class AreaRequest(BaseModel):
    coordinates: list  # Lista de coordenadas do polígono ou um ponto [lon, lat]
    buffer_km: int = 5  # Tamanho do buffer ao redor do ponto (default 5km)


# 🔹 Função para buscar imagem de satélite
def get_satellite_image(coordinates, buffer_km):
    try:
        # 🔹 Definir a região de interesse (ponto com buffer ou polígono)
        if len(coordinates) == 1:
            point = ee.Geometry.Point(coordinates[0])
            region = point.buffer(buffer_km * 1000).bounds()
        else:
            region = ee.Geometry.Polygon(coordinates)

        # 🔹 Buscar imagem mais recente do Sentinel-2
        image_collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(region)
            .filterDate("2022-01-01", "2024-02-01")  # Período ampliado
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))  # Reduz imagens com nuvens
            .sort("CLOUDY_PIXEL_PERCENTAGE", True)
        )

        image_list = image_collection.toList(image_collection.size())
        image = ee.Image(image_list.get(0))

        # 🔹 Se não encontrar imagem válida, tenta Landsat 9
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

        # 🔹 Se ainda não encontrar, retorna erro
        if image is None:
            raise HTTPException(status_code=404, detail="Nenhuma imagem encontrada para essa região.")

        # 🔹 Selecionar bandas RGB (diferente para Landsat e Sentinel)
        bands = ["B4", "B3", "B2"]
        if "SR_B4" in image.bandNames().getInfo():
            bands = ["SR_B4", "SR_B3", "SR_B2"]
        image = image.select(bands)

        # 🔹 Remover pixels inválidos (evita partes brancas/cinzas)
        image = image.updateMask(image.select(bands[0]).gt(0))

        # 🔹 Gerar URL do thumbnail (escala ajustada para mais qualidade)
        url = image.getThumbURL({"region": region.getInfo(), "scale": 20, "format": "png"})

        print(f"✅ URL da Imagem: {url}")  # Log para debug

        return url

    except Exception as e:
        print(f"❌ Erro ao gerar imagem: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 🔹 Rota para receber os dados e gerar imagem
@app.post("/get_satellite_image/")
def generate_image(request: AreaRequest):
    image_url = get_satellite_image(request.coordinates, request.buffer_km)
    return {"image_url": image_url}
