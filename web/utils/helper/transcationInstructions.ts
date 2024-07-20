import { BN, Program } from '@coral-xyz/anchor';
import {
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  TokenAccountNotFoundError,
  getExtensionData,
  getNewAccountLenForExtensionLen,
  unpackMint,
  updateTokenMetadata,
} from '@solana/spl-token';
import { TokenMetadata, pack, unpack } from '@solana/spl-token-metadata';
import { Connection, PublicKey } from '@solana/web3.js';
import Idl from '../program/idl/wild_fire.json';
import { WildFire } from '../program/types/wild_fire';

export const program = (connection: Connection) =>
  new Program<WildFire>(Idl as unknown as WildFire, {
    connection,
  });

export async function createMint(
  connection: Connection,
  distributor: PublicKey,
  fees: number,
  maxFee: number | undefined,
  payer: PublicKey
) {
  const ix = await program(connection)
    .methods.createMint({
      decimal: 0,
      distributor: distributor,
      transferFeeArgs: {
        feeBasisPts: fees,
        maxFee: maxFee ? new BN(maxFee) : new BN(Number.MAX_SAFE_INTEGER),
      },
    })
    .accounts({
      admin: payer,
      payer: payer,
      program: program(connection).programId,
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
  const ix = await program(connection)
    .methods.createMintMetadata(
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
  connection: Connection,
  amount: number,
  mint: PublicKey,
  payer: PublicKey
) {
  return await program(connection)
    .methods.initializeMint(new BN(amount))
    .accounts({
      mint: mint,
      payer: payer,
      admin: payer,
      program: program(connection).programId,
    })
    .instruction();
}

export async function changeTransferFee(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  feeBasisPts: number,
  maxFee: number
) {
  const ix = await program(connection)
    .methods.changeTransferFee(feeBasisPts, new BN(maxFee))
    .accounts({
      payer: payer,
      mint: mint,
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
  const ix = await program(connection)
    .methods.changeAdmin(newAdmin)
    .accounts({
      payer: payer,
      program: program(connection).programId,
      mint: mint,
    })
    .instruction();

  return ix;
}

export async function setToImmutable(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey
) {
  const ix = await program(connection)
    .methods.setToImmutable()
    .accounts({
      payer: payer,
      mint: mint,
    })
    .instruction();

  return ix;
}

export async function closeAuthorityAccount(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey
) {
  const ix = await program(connection)
    .methods.closeAccount()
    .accounts({
      payer: payer,
      mint: mint,
    })
    .instruction();

  return ix;
}

export async function removeFieldFromMetadata(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  field: string
) {
  return await program(connection)
    .methods.removeKeyFromMetadata(field)
    .accounts({
      mint: mint,
      payer: payer,
    })
    .instruction();
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
      admin: payer,
    })
    .instruction();
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
