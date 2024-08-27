import { BN, Program } from '@coral-xyz/anchor';
import {
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  TokenAccountNotFoundError,
  createUpdateFieldInstruction,
  getExtensionData,
  getNewAccountLenForExtensionLen,
  unpackMint,
  updateTokenMetadata,
} from '@solana/spl-token';
import { TokenMetadata, pack, unpack } from '@solana/spl-token-metadata';
import { Connection, PublicKey } from '@solana/web3.js';
import { DEFAULT_MINT_DECIMALS } from '../consts';
import Idl from '../program/idl/wild_fire.json';
import { WildFire } from '../program/types/wild_fire';

export const program = new Program<WildFire>(Idl as unknown as WildFire, {
  connection: new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!),
});

export async function createMint(
  distributor: PublicKey,
  fees: number,
  maxFee: number | undefined,
  payer: PublicKey
) {
  const ix = await program.methods
    .createMint({
      decimal: DEFAULT_MINT_DECIMALS,
      distributor: distributor,
      transferFeeArgs: {
        feeBasisPts: fees,
        maxFee: maxFee ? new BN(maxFee) : new BN(Number.MAX_SAFE_INTEGER),
      },
    })
    .accounts({
      admin: payer,
      payer: payer,
      program: program.programId,
    })
    .instruction();
  return ix;
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
  const ix = await program.methods
    .createMintMetadata(
      new BN(additional_lamport),
      metaData.name,
      metaData.symbol,
      metaData.uri,
      metaData.additionalMetadata[0][0],
      metaData.additionalMetadata[0][1]
    )
    .accounts({
      mint: metaData.mint,
      payer: payer,
      admin: payer,
    })
    .instruction();
  return ix;
}

export async function initializeMint(
  amountReserve: number,
  amountCreator: number,
  mint: PublicKey,
  payer: PublicKey
) {
  return await program.methods
    .initializeMint(new BN(amountReserve), new BN(amountCreator))
    .accounts({
      mint: mint,
      payer: payer,
      admin: payer,
      program: program.programId,
    })
    .instruction();
}

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

export async function updateMetadata(
  payer: PublicKey,
  mint: PublicKey,
  field: string,
  value: string
) {
  return createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint,
    updateAuthority: payer,
    field: field,
    value: value,
  });
}

export async function getAdditionalRentForUpdatedMetadata(
  connection: Connection,
  address: PublicKey,
  fieldsToUpdate: [string, string][],
  programId = TOKEN_2022_PROGRAM_ID
): Promise<number> {
  const info = await connection.getAccountInfo(address);
  if (!info) {
    throw new TokenAccountNotFoundError();
  }

  const mint = unpackMint(address, info, programId);
  const extensionData = getExtensionData(
    ExtensionType.TokenMetadata,
    mint.tlvData
  );
  if (extensionData === null) {
    throw new Error('TokenMetadata extension not initialized');
  }

  let updatedTokenMetadata = unpack(extensionData);
  for (let x of fieldsToUpdate) {
    updatedTokenMetadata = updateTokenMetadata(
      unpack(extensionData),
      x[0],
      x[1]
    );
  }

  const extensionLen = pack(updatedTokenMetadata).length;

  const newAccountLen = getNewAccountLenForExtensionLen(
    info,
    address,
    ExtensionType.TokenMetadata,
    extensionLen,
    programId
  );

  if (newAccountLen <= info.data.length) {
    return 0;
  }

  const newRentExemptMinimum =
    await connection.getMinimumBalanceForRentExemption(newAccountLen);

  return newRentExemptMinimum - info.lamports;
}
