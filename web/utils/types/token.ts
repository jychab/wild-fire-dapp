export interface TokenState {
  mint: string;
  admin: string;
  memberMint: string;
}

export interface Summary {
  all: {
    collectionMint: string;
    memberMint: string;
  }[];
  allTokenPrices: {
    collectionMint: string;
    memberMint: string;
    price: number;
    supply: number;
    volume: number;
  }[];
  initializedMints: {
    collectionMint: string;
    memberMint: string;
  }[];
}
