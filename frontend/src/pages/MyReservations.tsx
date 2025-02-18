import { useState, useEffect } from "react";
import { Reservation, ReservationStatus } from "../types/reservation";
import { nftService } from "../services/nft";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getSatelliteImage } from "../services/satellite";

function MyReservations() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [transferWallet, setTransferWallet] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  const [formData, setFormData] = useState({
    vegetationCoverage: "",
    hectaresNumber: "",
    specificAttributes: "",
    waterBodiesCount: "",
    springsCount: "",
    ongoingProjects: "",
    carRegistry: "",
    longitude: "",
    latitude: "",
    bufferKm: "",
  });

  const fetchNFTs = async (walletAddress: string) => {
    setLoading(true);
    try {
      const nfts = await nftService.getNFTs(walletAddress);
      if (nfts.length === 0) {
        // Se não houver NFTs, criar uma reserva com status empty
        setReservations([
          {
            id: "empty",
            status: "empty" as ReservationStatus,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
      } else {
        // Transformar NFTs existentes em reservas
        const nftReservations: Reservation[] = nfts.map((nft) => ({
          id: nft.address,
          status: "approved" as ReservationStatus,
          createdAt: new Date().toISOString().split("T")[0],
          nftData: {
            imageUrl: nft.uri,
            title: `Carbon Credit Certificate #${nft.address.slice(-4)}`,
            description:
              "This NFT certifies the registration of carbon credits for sustainable forest management and conservation practices.",
            issueDate: new Date().toISOString().split("T")[0],
          },
        }));
        setReservations(nftReservations);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      // Em caso de erro, também definimos como empty para mostrar o formulário
      setReservations([
        {
          id: "empty",
          status: "empty" as ReservationStatus,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchNFTs(publicKey.toString());
    }
  }, [connected, publicKey]);

  const getStatusBadgeClass = (status: ReservationStatus) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    switch (status) {
      case "approved":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return baseClasses;
    }
  };

  const getStatusText = (status: ReservationStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Função auxiliar para converter URL em File
  const urlToFile = async (url: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], "satellite-image.jpg", { type: "image/jpeg" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const coordinates = [
      [Number(formData.longitude), Number(formData.latitude)],
    ];
    const bufferKm = Number(formData.bufferKm);

    setIsLoading(true);
    try {
      // 1. Obter imagem de satélite
      const satelliteImageUrl = await getSatelliteImage(coordinates, bufferKm);

      // 2. Converter URL em File
      //const imageFile = await urlToFile(satelliteImageUrl);
      const imageFile = await urlToFile(
        "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/thumbnails/b7e3ce4db08b4aba4b3c6fb9134d2a49-6e67f066352f0838e7ae9bd71285f91f:getPixels"
      );

      // 3. Upload da imagem do satélite como NFT
      const imageUrl = await nftService.uploadImage(imageFile);

      // 4. Mint do NFT com a imagem e metadados
      const result = await nftService.mintCertificationNFT(imageUrl, {
        vegetationCoverage: formData.vegetationCoverage,
        hectaresNumber: formData.hectaresNumber,
        specificAttributes: formData.specificAttributes,
        waterBodiesCount: formData.waterBodiesCount,
        springsCount: formData.springsCount,
        ongoingProjects: formData.ongoingProjects,
        carRegistry: formData.carRegistry,
      });

      // 5. Atualizar o status da reserva para approved e adicionar dados do NFT
      setReservations((prevReservations) =>
        prevReservations.map((reservation) =>
          reservation.status === "empty"
            ? {
                ...reservation,
                status: "approved" as ReservationStatus,
                nftData: {
                  imageUrl,
                  title: `Carbon Credit Certificate #${result.mintAddress.slice(
                    -4
                  )}`,
                  description: "Certificado de Preservação Ambiental",
                  issueDate: new Date().toISOString().split("T")[0],
                },
              }
            : reservation
        )
      );

      setShowForm(false);
      alert(`NFT mintado com sucesso! Endereço: ${result.mintAddress}`);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao criar NFT: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferWallet) {
      alert("Por favor, insira o endereço da carteira");
      return;
    }

    setIsTransferring(true);
    try {
      const result = await nftService.transferNFT(transferWallet);
      alert(`NFT transferido com sucesso! Assinatura: ${result.signature}`);
      setTransferWallet("");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao transferir NFT: " + (error as Error).message);
    } finally {
      setIsTransferring(false);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Please connect your wallet to view your reservations.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="bg-[#45803B] text-white px-6 py-2 rounded-md hover:bg-[#386832] transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return <div>Loading reservations...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#45803B]">My Reservations</h1>

      <div className="grid gap-6">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm">
                  Reservation ID: {reservation.id}
                </p>
                <p className="text-gray-600 text-sm">
                  Created: {reservation.createdAt}
                </p>
              </div>
              <span className={getStatusBadgeClass(reservation.status)}>
                {getStatusText(reservation.status)}
              </span>
            </div>

            {reservation.status === "empty" && !showForm && (
              <div className="mt-4 text-center">
                <p className="text-gray-600 mb-4">
                  Address: {publicKey?.toString()}
                </p>

                <p className="text-gray-600 mb-4">
                  You haven't created a reservation request yet.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-[#45803B] text-white px-6 py-2 rounded-md hover:bg-[#386832] transition-colors"
                >
                  Create New Reservation
                </button>
              </div>
            )}

            {showForm && (
              <div className="mt-4 border-t pt-4 max-w-4xl mx-auto">
                <h3 className="text-2xl font-semibold text-[#45803B] mb-6">
                  New Reservation Request
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Vegetation Coverage (%)
                    </label>
                    <input
                      type="number"
                      name="vegetationCoverage"
                      value={formData.vegetationCoverage}
                      onChange={handleInputChange}
                      className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Number of Hectares
                    </label>
                    <input
                      type="number"
                      name="hectaresNumber"
                      value={formData.hectaresNumber}
                      onChange={handleInputChange}
                      className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Specific Attributes
                    </label>
                    <textarea
                      name="specificAttributes"
                      value={formData.specificAttributes}
                      onChange={handleInputChange}
                      placeholder="E.g.: Presence of centenary trees, refuge area for endangered species"
                      rows={4}
                      className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Number of Water Bodies
                    </label>
                    <input
                      type="number"
                      name="waterBodiesCount"
                      value={formData.waterBodiesCount}
                      onChange={handleInputChange}
                      className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Number of Springs
                    </label>
                    <input
                      type="number"
                      name="springsCount"
                      value={formData.springsCount}
                      onChange={handleInputChange}
                      className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Ongoing Projects
                    </label>
                    <textarea
                      name="ongoingProjects"
                      value={formData.ongoingProjects}
                      onChange={handleInputChange}
                      placeholder="E.g.: Recovery of degraded areas, sustainable management of açaí palms"
                      rows={4}
                      className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      CAR Registry
                    </label>
                    <input
                      type="text"
                      name="carRegistry"
                      value={formData.carRegistry}
                      onChange={handleInputChange}
                      placeholder="CAR-123456789-XX"
                      className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Coordinates
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleInputChange}
                          placeholder="Longitude (e.g. -57.000)"
                          step="0.001"
                          className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          placeholder="Latitude (e.g. -16.500)"
                          step="0.001"
                          className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Buffer Zone (km)
                    </label>
                    <input
                      type="number"
                      name="bufferKm"
                      value={formData.bufferKm}
                      onChange={handleInputChange}
                      placeholder="Buffer in kilometers"
                      min="0"
                      step="0.1"
                      className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-[#45803B] focus:ring-[#45803B] text-base"
                      required
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="bg-[#45803B] text-white px-8 py-3 rounded-md hover:bg-[#386832] transition-colors text-base font-medium"
                    >
                      Submit Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-200 text-gray-800 px-8 py-3 rounded-md hover:bg-gray-300 transition-colors text-base font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {reservation.status === "approved" && reservation.nftData && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-xl font-semibold text-[#45803B] mb-3">
                  NFT Certificate
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <img
                      src={reservation.nftData.imageUrl}
                      alt="NFT Certificate"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">
                      {reservation.nftData.title}
                    </h4>
                    <p className="text-gray-600">
                      {reservation.nftData.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Issue Date: {reservation.nftData.issueDate}
                    </p>

                    {/* Detalhes do NFT */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Detalhes do Certificado
                      </h5>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">
                            Cobertura Vegetal:
                          </span>{" "}
                          {formData.vegetationCoverage}%
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Hectares:</span>{" "}
                          {formData.hectaresNumber}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Corpos d'água:</span>{" "}
                          {formData.waterBodiesCount}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Nascentes:</span>{" "}
                          {formData.springsCount}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Registro CAR:</span>{" "}
                          {formData.carRegistry}
                        </p>
                      </div>
                    </div>

                    {/* Status da NFT */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Status:</span> NFT gerado
                        e pronto para transferência
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Insira o endereço da sua carteira abaixo para receber o
                        certificado
                      </p>
                    </div>

                    {/* Formulário de transferência */}
                    <form onSubmit={handleTransfer} className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Endereço da Carteira para Transferência
                        </label>
                        <input
                          type="text"
                          value={transferWallet}
                          onChange={(e) => setTransferWallet(e.target.value)}
                          placeholder="Insira o endereço da sua carteira Solana"
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#45803B] focus:border-[#45803B]"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isTransferring}
                        className="w-full bg-[#45803B] text-white px-4 py-2 rounded-md hover:bg-[#386832] transition-colors disabled:opacity-50"
                      >
                        {isTransferring ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Transferindo...
                          </span>
                        ) : (
                          "Transferir NFT para Minha Carteira"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {reservation.status === "pending" && (
              <div className="mt-4 border-t pt-4">
                <p className="text-gray-600">
                  Your NFT certificate is being processed. Please check back
                  later.
                </p>
              </div>
            )}

            {reservation.status === "rejected" && (
              <div className="mt-4 border-t pt-4">
                <p className="text-red-600">
                  Your reservation was not approved. Please contact support for
                  more information.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyReservations;
