const API_BASE_URL = import.meta.env.VITE_API_BASE_PYTHON_URL;

// Interfaces
interface AreaRequest {
  coordinates: number[][]; // Array de arrays com [longitude, latitude]
  buffer_km: number;
}

interface SatelliteImageResponse {
  image_url: string;
}

// Função para buscar imagem de satélite
export async function getSatelliteImage(
  coordinates: number[][],
  bufferKm: number = 5
): Promise<string> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL não está definida nas variáveis de ambiente");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/get_satellite_image/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates,
        buffer_km: bufferKm,
      } as AreaRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Erro ao buscar imagem de satélite");
    }

    const data: SatelliteImageResponse = await response.json();
    return data.image_url;
  } catch (error) {
    console.error("Erro ao buscar imagem de satélite:", error);
    throw error;
  }
}

// Exemplo de uso para um ponto único com buffer
// coordinates = [[longitude, latitude]]
// getSatelliteImage([[-46.123, -23.456]], 5)

// Exemplo de uso para um polígono
// coordinates = [[lon1,lat1], [lon2,lat2], [lon3,lat3], [lon1,lat1]]
// getSatelliteImage([[-46.1,-23.4], [-46.2,-23.4], [-46.2,-23.5], [-46.1,-23.4]])
