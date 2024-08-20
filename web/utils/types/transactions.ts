export interface Transaction {
  id: string;
  amount: number;
  event: string;
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
