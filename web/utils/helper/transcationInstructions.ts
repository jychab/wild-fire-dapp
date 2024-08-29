import { Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import Idl from '../program/idl/wild_fire.json';
import { WildFire } from '../program/types/wild_fire';

export const program = new Program<WildFire>(Idl as unknown as WildFire, {
  connection: new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!),
});

export async function closeAuthorityAccount(payer: PublicKey, mint: PublicKey) {
  const ix = await program.methods
    .closeAccount()
    .accounts({
      payer: payer,
      mint: mint,
    })
    .instruction();

  return ix;
}
