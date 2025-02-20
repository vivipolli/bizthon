import { useState, useEffect } from "react";
import { Reservation, ReservationStatus } from "../types/reservation";
import { nftService } from "../services/nft";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getSatelliteImage } from "../services/satellite";
import { ReservationForm } from "../components/ReservationForm";

function MyReservations() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
        // If no NFTs exist, create a reservation with empty status
        setReservations([
          {
            id: "empty",
            status: "empty" as ReservationStatus,
            createdAt: new Date().toISOString().split("T")[0],
          },
        ]);
      } else {
        // Transform existing NFTs into reservations
        const nftReservations: Reservation[] = nfts.map((nft) => ({
          id: nft.address,
          status: "approved" as ReservationStatus,
          createdAt: new Date().toISOString().split("T")[0],
          nftData: {
            imageUrl: nft.image,
            title: nft.name,
            description: nft.description,
            attributes: nft.attributes,
            issueDate: new Date().toISOString().split("T")[0],
          },
        }));
        setReservations(nftReservations);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      // On error, set to empty to show the form
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
      // 1. Get satellite image
      const satelliteImageUrl = await getSatelliteImage(coordinates, bufferKm);

      // 2. Convert URL to File
      const imageFile = await urlToFile(satelliteImageUrl);

      // 3. Upload satellite image as NFT
      const imageUrl = await nftService.uploadImage(imageFile);

      // 4. Mint NFT with image and metadata
      console.log("Starting NFT mint...");
      const result = await nftService.mintCertificationNFT(
        imageUrl,
        {
          vegetationCoverage: formData.vegetationCoverage,
          hectaresNumber: formData.hectaresNumber,
          specificAttributes: formData.specificAttributes,
          waterBodiesCount: formData.waterBodiesCount,
          springsCount: formData.springsCount,
          ongoingProjects: formData.ongoingProjects,
          carRegistry: formData.carRegistry,
        },
        publicKey!.toString()
      );

      // 5. Update reservation status to approved and add NFT data
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
                  description: "Environmental Preservation Certificate",
                  issueDate: new Date().toISOString().split("T")[0],
                },
              }
            : reservation
        )
      );

      // After successful mint, fetch updated NFTs
      if (publicKey) {
        await fetchNFTs(publicKey.toString());
      }

      setShowForm(false);
      alert(`NFT minted successfully! Address: ${result.mintAddress}`);
    } catch (error) {
      console.error("Detailed error:", error);
      alert("Error creating NFT: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <div className="bg-gray-50 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Wallet Connection Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your reservations.
          </p>
          <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-md mb-6">
            <span className="font-bold">Important!</span> The connected wallet
            address will be used to receive your NFT. Please make sure to
            connect the correct wallet.
          </div>
          <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-md mb-6">
            <span className="font-bold">Testing the application?</span> Your
            wallet needs SOL tokens on the Solana testnet to perform
            transactions. You can request test SOL from the{" "}
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-blue-800"
            >
              Solana Faucet
            </a>{" "}
            (up to 2 requests every 8 hours).
          </div>
          <button
            onClick={() => setVisible(true)}
            className="bg-[#45803B] text-white px-8 py-3 rounded-md hover:bg-[#386832] transition-colors font-medium"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#45803B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#45803B]">My Reservations</h1>
        <button
          onClick={disconnect}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors font-medium"
        >
          Disconnect Wallet
        </button>
      </div>

      <div className="grid gap-6">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            {/* Só mostra o cabeçalho com ID, data e status se não for empty */}
            {reservation.status !== "empty" && (
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
            )}

            {reservation.status === "empty" && !showForm && (
              <div className="mt-6 text-center space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 font-medium mb-2">
                    Wallet Address
                  </p>
                  <p className="font-mono text-sm text-gray-600">
                    {publicKey?.toString().slice(0, 4)}...
                    {publicKey?.toString().slice(-4)}
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    This address will receive your NFT certificate
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 mb-4">
                    You haven't created a reservation request yet.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-[#45803B] text-white px-8 py-3 rounded-lg hover:bg-[#386832] transition-colors font-medium shadow-sm hover:shadow-md"
                  >
                    Create New Reservation
                  </button>
                </div>
              </div>
            )}

            {showForm && (
              <div className=" max-w-4xl mx-auto">
                <ReservationForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  setShowForm={setShowForm}
                  isLoading={isLoading}
                />
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

                    {/* Detalhes do NFT usando os atributos retornados pela API */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Certificate Details
                      </h5>
                      <div className="space-y-2">
                        {reservation.nftData.attributes?.map((attr, index) => (
                          <p key={index} className="text-sm">
                            <span className="font-medium">
                              {attr.trait_type}:
                            </span>{" "}
                            {attr.value}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Status da NFT */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Status:</span> NFT
                        generated and transferred to your wallet
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        The certificate is now available in your wallet
                      </p>
                    </div>
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
