export type ReservationStatus = "empty" | "pending" | "approved" | "rejected";

export interface NFTData {
  imageUrl: string;
  title: string;
  description: string;
  issueDate: string;
}

export interface Reservation {
  id: string;
  status: ReservationStatus;
  createdAt: string;
  nftData?: NFTData;
}
