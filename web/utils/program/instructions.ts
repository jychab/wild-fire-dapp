import { BN, Program } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
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
export async function updateMetadata(
  creator: PublicKey,
  mint: PublicKey,
  name: string,
  symbol: string,
  uri: string,
  index?: number
) {
  const metadataMint = index ? getDerivedMemberMint(mint, index) : mint;
  return await program.methods
    .updateMintMetadata(index ? new BN(index) : null, { name, symbol, uri })
    .accounts({ creator: creator, collectionMint: mint, metadataMint })
    .instruction();
}

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

export async function distributeTokens(
  payer: PublicKey,
  distributor: PublicKey,
  mintToSend: PublicKey,
  admin: PublicKey,
  to: PublicKey,
  amount: number,
  event: number,
  id: number,
  tokenProgram: PublicKey = TOKEN_PROGRAM_ID
) {
  const ix = await program.methods
    .distributeTokens(new BN(amount), event, new BN(id))
    .accounts({
      payer: payer,
      admin: admin,
      destinationWallet: to,
      distributor: distributor,
      tokenProgramMint: tokenProgram,
      mintToSend: mintToSend,
    })
    .instruction();
  return ix;
}

export async function verifyMemberMint(
  payer: PublicKey,
  mint: PublicKey,
  admin: PublicKey,
  memberMint: PublicKey,
  index?: number
) {
  const x = index ? getDerivedMemberMint(mint, index) : memberMint;
  return await program.methods
    .verifyMemberMint(index ? new BN(index) : null)
    .accounts({
      payer: payer,
      admin: admin,
      memberMint: x,
      sysvarInstruction: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .instruction();
}

export async function createMemberMintIx(
  mint: PublicKey,
  creator: PublicKey,
  distributor: PublicKey,
  payer: PublicKey,
  name: string,
  symbol: string,
  uri: string,
  decimal: number,
  index: number
) {
  const memberMint = getDerivedMemberMint(mint, index);
  const ix = await program.methods
    .createMemberMint(
      new BN(index),
      {
        name,
        symbol,
        uri,
      },
      decimal
    )
    .accountsPartial({
      memberMint: memberMint,
      payer: payer,
      collectionMint: mint,
      creator: creator,
      distributor: distributor,
    })
    .instruction();
  return ix;
}

export async function initializeMint(
  amountAirdrop: number,
  amountToBondingCurve: number,
  payer: PublicKey,
  admin: PublicKey
) {
  return await program.methods
    .initialize(new BN(amountAirdrop), new BN(amountToBondingCurve))
    .accounts({
      payer: payer,
      admin: admin,
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
