export interface ProductOffchainData {
  id: string;
  creatorName: string;
  title: string;
  description: string;
  imageUrl: string;
  expectedApy: number;
  maturityDate: string;
}

export interface ProductOnchainData {
  targetAmount: number; // mUSD
  currentAmount: number; // mUSD
  status: 'funding' | 'active' | 'completed';
}

export type Product = ProductOffchainData & ProductOnchainData;
