interface NFTMetadata {
  vegetationCoverage: string;
  hectaresNumber: string;
  specificAttributes: string;
  waterBodiesCount: string;
  springsCount: string;
  ongoingProjects: string;
  carRegistry: string;
}

interface UploadImageResponse {
  success: boolean;
  imageUrl: string;
}

interface MintNFTResponse {
  success: boolean;
  mintAddress: string;
  metadataUrl: string;
  signature: string;
}

export interface NFTResponse {
  address: string;
  name: string;
  symbol: string;
  uri: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  description: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_NODE_URL;

export const nftService = {
  /**
   * Faz upload de uma imagem para o Pinata
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao fazer upload da imagem");
    }

    const data: UploadImageResponse = await response.json();
    return data.imageUrl;
  },

  /**
   * Minta um novo NFT com a imagem e metadados fornecidos
   */
  async mintCertificationNFT(
    imageUrl: string,
    metadata: NFTMetadata,
    recipientAddress: string
  ): Promise<MintNFTResponse> {
    const response = await fetch(`${API_BASE_URL}/mint-certification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        recipientAddress,
        ...metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao mintar NFT");
    }

    return response.json();
  },

  /**
   * Busca todos os NFTs de uma carteira
   */
  async getNFTs(walletAddress: string): Promise<NFTResponse[]> {
    const response = await fetch(
      `${API_BASE_URL}/nfts?wallet=${walletAddress}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao buscar NFTs");
    }

    return response.json();
  },
};
