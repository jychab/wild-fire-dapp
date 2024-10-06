import { BN, Program } from '@coral-xyz/anchor';
import {
  Connection,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import { getDerivedMemberMint } from '../helper/mint';
import Idl from './idl/blinksfeed.json';
import { Blinksfeed } from './types/blinksfeed';

export const program = new Program<Blinksfeed>(Idl as unknown as Blinksfeed, {
  connection: new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT as string),
});
export async function collectFees(
  payer: PublicKey,
  admin: PublicKey,
  mint: PublicKey
) {
  const ix = await program.methods
    .collectFees()
    .accounts({
      creator: admin,
      payer: payer,
    })
    .instruction();
  return ix;
}

export async function unverifyMemberMint(
  mint: PublicKey,
  admin: PublicKey,
  memberMint: PublicKey,
  index?: number
) {
  const x = index ? getDerivedMemberMint(mint, index) : memberMint;
  return await program.methods
    .unverifyMemberMint(index ? new BN(index) : null)
    .accounts({
      admin: admin,
      memberMint: x,
      sysvarInstruction: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .instruction();
}

export async function mintMemberMint(
  payer: PublicKey,
  creator: PublicKey,
  mint: PublicKey,
  to: PublicKey,
  index: number,
  amount: number
) {
  const memberMint = getDerivedMemberMint(mint, index);
  return await program.methods
    .mintMemberMint(new BN(index), new BN(amount))
    .accountsPartial({
      memberMint: memberMint,
      collectionMint: mint,
      payer: payer,
      creator: creator,
      destinationWallet: to,
    })
    .instruction();
}

export async function buy(amount: number, mint: PublicKey, payer: PublicKey) {
  return await program.methods
    .buy(new BN(amount))
    .accounts({
      memberMint: mint,
      user: payer,
    })
    .instruction();
}

export async function sell(amount: number, mint: PublicKey, payer: PublicKey) {
  return await program.methods
    .sell(new BN(amount))
    .accounts({
      memberMint: mint,
      user: payer,
    })
    .instruction();
}
