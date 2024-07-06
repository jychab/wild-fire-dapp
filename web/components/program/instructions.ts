import { BN, Program } from '@coral-xyz/anchor';
import {
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  TokenAccountNotFoundError,
  getAssociatedTokenAddressSync,
  getExtensionData,
  getNewAccountLenForExtensionLen,
  unpackMint,
  updateTokenMetadata,
} from '@solana/spl-token';
import { TokenMetadata, pack, unpack } from '@solana/spl-token-metadata';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import Idl from './idl/wild_fire.json';
import { WildFire } from './types/wild_fire';

export const program = (connection: Connection) =>
  new Program<WildFire>(Idl as unknown as WildFire, {
    connection,
  });

// export interface WhirlPoolWallet<T extends Transaction | VersionedTransaction> {
//   publicKey: PublicKey;
//   signAllTransactions: (transactions: T[]) => Promise<T[]>;
//   signTransaction: (transaction: T) => Promise<T>;
// }

// export const whirlPoolCtx = (
//   connection: Connection,
//   wallet: WhirlPoolWallet<any>
// ) =>
//   WhirlpoolContext.from(
//     connection,
//     wallet,
//     new PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc')
//   );

export async function createMint(
  connection: Connection,
  mintKeypair: Keypair,
  mint: PublicKey,
  mintLen: number,
  distributor: PublicKey,
  fees: number,
  maxFee: number | undefined,
  admin: PublicKey,
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
      decimal: 0,
      admin: admin,
      distributor: distributor,
      transferFeeArgs: {
        feeBasisPts: fees,
        maxFee: maxFee ? new BN(maxFee) : new BN(Number.MAX_SAFE_INTEGER),
      },
    })
    .accounts({
      mint: mint,
      payer: payer,
      program: program(connection).programId,
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
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), metaData.mint.toBuffer()],
    program(connection).programId
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
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), mint.toBuffer()],
    program(connection).programId
  );

  return await program(connection)
    .methods.issueMint(new BN(amount))
    .accounts({
      mint: mint,
      payer: payer,
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

export async function changeDistributor(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  newDistributor: PublicKey
) {
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), mint.toBuffer()],
    program(connection).programId
  );
  const ix = await program(connection)
    .methods.changeDistributor(newDistributor)
    .accounts({
      payer: payer,
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
    })
    .instruction();
}

export async function getAdditionalRentForUpdatedMetadata(
  connection: Connection,
  address: PublicKey,
  fieldsToUpdate: Map<string, string>,
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

// export async function initializeWhirlPoolConfig(
//   connection: Connection,
//   wallet: WhirlPoolWallet<any>
// ) {
//   let whirlPoolContext = whirlPoolCtx(connection, wallet);
//   let configKeypair = Keypair.generate();
//   let config = configKeypair.publicKey;
//   console.log(config.toBase58());
//   let ix = initializeConfigIx(whirlPoolContext.program, {
//     whirlpoolsConfigKeypair: configKeypair,
//     feeAuthority: wallet.publicKey,
//     collectProtocolFeesAuthority: wallet.publicKey,
//     rewardEmissionsSuperAuthority: wallet.publicKey,
//     defaultProtocolFeeRate: 2500,
//     funder: wallet.publicKey,
//   });
//   await buildAndSendTransaction(
//     connection,
//     ix.instructions,
//     wallet.publicKey,
//     wallet.signTransaction
//   );

//   ix = initializeConfigExtensionIx(whirlPoolContext.program, {
//     whirlpoolsConfig: config,
//     whirlpoolsConfigExtensionPda: PDAUtil.getConfigExtension(
//       whirlPoolContext.program.programId,
//       config
//     ),
//     funder: wallet.publicKey,
//     feeAuthority: wallet.publicKey,
//   });
//   await buildAndSendTransaction(
//     connection,
//     ix.instructions,
//     wallet.publicKey,
//     wallet.signTransaction
//   );
//   ix = initializeTokenBadgeIx(whirlPoolContext.program, {
//     whirlpoolsConfig: config,
//     whirlpoolsConfigExtension: PDAUtil.getConfigExtension(
//       whirlPoolContext.program.programId,
//       config
//     ).publicKey,
//     tokenBadgeAuthority: wallet.publicKey,
//     tokenMint: NATIVE_MINT,
//     tokenBadgePda: PDAUtil.getTokenBadge(
//       whirlPoolContext.program.programId,
//       config,
//       NATIVE_MINT
//     ),
//     funder: wallet.publicKey,
//   });
//   await buildAndSendTransaction(
//     connection,
//     ix.instructions,
//     wallet.publicKey,
//     wallet.signTransaction
//   );

//   return ix;
// }
