export interface Transaction {
  id: number;
  amount: number;
  event: number;
  mint: string;
  to: string;
  createdAt: number;
  updatedAt: number;
  tx?: string;
  received?: number;
  pending?: number;
  postMint?: string;
  postId?: string;
  commentId?: string;
}
