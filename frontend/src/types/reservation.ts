export type ReservationStatus = "approved" | "pending" | "rejected" | "empty";

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFTData {
  imageUrl: string;
  title: string;
  description: string;
  attributes?: NFTAttribute[];
  issueDate: string;
}

export interface Reservation {
  id: string;
  status: ReservationStatus;
  createdAt: string;
  nftData?: NFTData;
}
