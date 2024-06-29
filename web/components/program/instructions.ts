import { BN, Program } from '@coral-xyz/anchor';
import {
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { TokenMetadata, pack } from '@solana/spl-token-metadata';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import Idl from './idl/wild_fire.json';
import { WildFire } from './types/wild_fire';

export const program = (connection: Connection) =>
  new Program<WildFire>(Idl as WildFire, { connection });

export async function createMint(
  connection: Connection,
  mintKeypair: Keypair,
  mint: PublicKey,
  mintLen: number,
  distributor: PublicKey,
  fees: number,
  maxFee: number | undefined,
  authority: PublicKey,
  payer: PublicKey
) {
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);
  const ix1 = SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: mint,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  });
  const ix2 = await program(connection)
    .methods.createMint({
      admin: authority,
      distributor: distributor,
      transferFeeArgs: {
        feeBasisPts: fees,
        maxFee: maxFee
          ? new BN(maxFee * 10 ** 6)
          : new BN(Number.MAX_SAFE_INTEGER),
      },
    })
    .accounts({
      distributor: distributor,
      mint: mint,
      payer: payer,
    })
    .signers([mintKeypair])
    .instruction();
  return [ix1, ix2];
}

export async function createMintMetadata(
  connection: Connection,
  metaData: TokenMetadata,
  payer: PublicKey
) {
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  // Size of metadata
  const metadataLen = pack(metaData).length;
  const additional_lamport = await connection.getMinimumBalanceForRentExemption(
    metadataExtension + metadataLen
  );
  const ix = await program(connection)
    .methods.createMintMetadata(
      new BN(additional_lamport),
      metaData.name,
      metaData.symbol,
      metaData.uri
    )
    .accounts({
      mint: metaData.mint,
      payer: payer,
    })
    .instruction();
  return ix;
}

export async function issueMint(
  connection: Connection,
  amount: number,
  mint: PublicKey,
  payer: PublicKey
) {
  const payerMintTokenAccount = getAssociatedTokenAddressSync(
    mint,
    payer,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  return await program(connection)
    .methods.issueMint(new BN(amount * 10 ** 6))
    .accounts({
      mint: mint,
      payer: payer,
      payerMintTokenAccount: payerMintTokenAccount,
    })
    .instruction();
}

export async function withdrawFees(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey
) {
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), mint.toBuffer()],
    program(connection).programId
  );

  const authorityMintTokenAccount = getAssociatedTokenAddressSync(
    mint,
    authority,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  const ix = await program(connection)
    .methods.withdrawFees()
    .accounts({
      payer: payer,
      mint: mint,
      authorityMintTokenAccount: authorityMintTokenAccount,
    })
    .instruction();
  return ix;
}

export async function changeTransferFee(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  feeBasisPts: number,
  maxFee: number
) {
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), mint.toBuffer()],
    program(connection).programId
  );
  const ix = await program(connection)
    .methods.changeTransferFee(feeBasisPts, new BN(maxFee))
    .accounts({
      payer: payer,
      mint: mint,
      authority: authority,
    })
    .instruction();

  return ix;
}

export async function changeAdmin(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  newAdmin: PublicKey
) {
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), mint.toBuffer()],
    program(connection).programId
  );
  const ix = await program(connection)
    .methods.changeAdmin(newAdmin)
    .accounts({
      payer: payer,
      authority: authority,
    })
    .instruction();

  return ix;
}

export async function setToImmutable(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey
) {
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), mint.toBuffer()],
    program(connection).programId
  );
  const ix = await program(connection)
    .methods.setToImmutable()
    .accounts({
      payer: payer,
      authority: authority,
      mint: mint,
    })
    .instruction();

  return ix;
}

export async function closeFeeAccount(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey
) {
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), mint.toBuffer()],
    program(connection).programId
  );

  const ix = await program(connection)
    .methods.closeAccount()
    .accounts({
      payer: payer,
      authority: authority,
      mint: mint,
    })
    .instruction();

  return ix;
}

export async function updateMetadata(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  field: string,
  value: string
) {
  return await program(connection)
    .methods.updateMintMetadata(field, value)
    .accounts({
      mint: mint,
      payer: payer,
    })
    .instruction();
}
