import { BN, Program } from '@coral-xyz/anchor';
import {
  ExtensionType,
  LENGTH_SIZE,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TYPE_SIZE,
  TokenAccountNotFoundError,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getExtensionData,
  getNewAccountLenForExtensionLen,
  unpackMint,
  updateTokenMetadata,
} from '@solana/spl-token';
import { TokenMetadata, pack, unpack } from '@solana/spl-token-metadata';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { CONFIG, OFF_SET } from '../consts';
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
  initialPurchase: number,
  mint: PublicKey,
  payer: PublicKey
) {
  return await program(connection)
    .methods.initializeMint(
      new BN(amount),
      new BN(initialPurchase),
      new BN(OFF_SET)
    )
    .accounts({
      mint: mint,
      payer: payer,
      admin: payer,
      program: program(connection).programId,
      ammConfig: CONFIG,
      adminMintTokenAccount: getAssociatedTokenAddressSync(
        mint,
        payer,
        false,
        TOKEN_2022_PROGRAM_ID
      ),
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
  const [poolState] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    program(connection).programId
  );
  const ix = await program(connection)
    .methods.changeTransferFee(feeBasisPts, new BN(maxFee))
    .accounts({
      payer: payer,
      mint: mint,
      poolState,
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
  const [poolState] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    program(connection).programId
  );
  const ix = await program(connection)
    .methods.changeAdmin(newAdmin)
    .accounts({
      payer: payer,
      poolState,
      program: program(connection).programId,
    })
    .instruction();

  return ix;
}

export async function setToImmutable(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey
) {
  const [poolState] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    program(connection).programId
  );
  const ix = await program(connection)
    .methods.setToImmutable()
    .accounts({
      payer: payer,
      poolState,
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
  const [poolState] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    program(connection).programId
  );

  const ix = await program(connection)
    .methods.closeAccount()
    .accounts({
      payer: payer,
      poolState,
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

export function u16ToBytes(num: number) {
  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setUint16(0, num, false);
  return new Uint8Array(arr);
}

export async function createConfig(connection: Connection, owner: PublicKey) {
  return await program(connection)
    .methods.createAmmConfig(0, new BN(20_000), new BN(250_000))
    .accounts({
      owner: owner,
    })
    .instruction();
}

export async function swapBaseOutput(
  connection: Connection,
  mint: PublicKey,
  payer: PublicKey,
  max_amount_in: number,
  amount_out_less_fee: number,
  inputToken: PublicKey,
  inputTokenProgram: PublicKey,
  outputToken: PublicKey,
  outputTokenProgram: PublicKey
) {
  const ixs = [];
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    program(connection).programId
  );
  const [observationAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('observation'), poolAddress.toBuffer()],
    program(connection).programId
  );

  const [observationState, poolAccount] = await Promise.all([
    program(connection).account.observationState.fetchNullable(
      observationAddress
    ),
    program(connection).account.poolState.fetchNullable(poolAddress),
  ]);
  if (observationState == null || poolAccount == null) {
    ixs.push(
      await program(connection)
        .methods.createOracle()
        .accounts({
          poolState: poolAddress,
        })
        .instruction()
    );
  }

  const inputTokenAccount = getAssociatedTokenAddressSync(
    inputToken,
    payer,
    false,
    inputTokenProgram
  );
  try {
    await getAccount(connection, inputTokenAccount);
  } catch (e) {
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        payer,
        inputTokenAccount,
        payer,
        inputToken,
        inputTokenProgram
      )
    );
  }
  const outputTokenAccount = getAssociatedTokenAddressSync(
    outputToken,
    payer,
    false,
    outputTokenProgram
  );
  try {
    await getAccount(connection, outputTokenAccount);
  } catch (e) {
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        payer,
        outputTokenAccount,
        payer,
        outputToken,
        outputTokenProgram
      )
    );
  }
  if (inputToken == NATIVE_MINT) {
    ixs.push(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: inputTokenAccount,
        lamports: max_amount_in,
      })
    );
    ixs.push(createSyncNativeInstruction(inputTokenAccount));
  }

  ixs.push(
    await program(connection)
      .methods.swapBaseInput(new BN(max_amount_in), new BN(amount_out_less_fee))
      .accounts({
        payer: payer,
        ammConfig: CONFIG,
        poolState: poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault: getAssociatedTokenAddressSync(
          inputToken,
          poolAddress,
          true,
          inputTokenProgram
        ),
        outputVault: getAssociatedTokenAddressSync(
          outputToken,
          poolAddress,
          true,
          outputTokenProgram
        ),
        inputTokenProgram: inputTokenProgram,
        outputTokenProgram: outputTokenProgram,
        inputTokenMint: inputToken,
        outputTokenMint: outputToken,
        observationState: observationAddress,
      })
      .instruction()
  );

  ixs.push(
    createCloseAccountInstruction(
      getAssociatedTokenAddressSync(NATIVE_MINT, payer),
      payer,
      payer
    )
  );

  return ixs;
}

export async function fetchSwapPoolDetails(
  connection: Connection,
  mint: PublicKey
) {
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    program(connection).programId
  );

  return await program(connection).account.poolState.fetch(poolAddress);
}

export async function fetchSwapVaultAmount(
  connection: Connection,
  mint: PublicKey
) {
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    program(connection).programId
  );
  const mintVault = getAssociatedTokenAddressSync(
    mint,
    poolAddress,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  const solVault = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    poolAddress,
    true
  );

  let mintAmount = (
    await getAccount(connection, mintVault, undefined, TOKEN_2022_PROGRAM_ID)
  ).amount;

  let solAmount = BigInt(0);
  try {
    solAmount = (
      await getAccount(connection, solVault, undefined, TOKEN_PROGRAM_ID)
    ).amount;
  } catch (e) {}

  return { mintAmount, solAmount };
}

export async function fetchSwapPoolOracle(
  connection: Connection,
  mint: PublicKey
) {
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    program(connection).programId
  );

  const [observationAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('observation'), poolAddress.toBuffer()],
    program(connection).programId
  );

  return await program(connection).account.observationState.fetch(
    observationAddress
  );
}

export async function swapBaseInput(
  connection: Connection,
  mint: PublicKey,
  payer: PublicKey,
  amount_in: number,
  min_amount_out: number,
  inputToken: PublicKey,
  inputTokenProgram: PublicKey,
  outputToken: PublicKey,
  outputTokenProgram: PublicKey
) {
  const ixs = [];
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    program(connection).programId
  );
  const [observationAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('observation'), poolAddress.toBuffer()],
    program(connection).programId
  );

  const [observationState, poolAccount] = await Promise.all([
    program(connection).account.observationState.fetchNullable(
      observationAddress
    ),
    program(connection).account.poolState.fetchNullable(poolAddress),
  ]);
  if (observationState == null || poolAccount == null) {
    ixs.push(
      await program(connection)
        .methods.createOracle()
        .accounts({
          payer: payer,
          poolState: poolAddress,
        })
        .instruction()
    );
  }

  const inputTokenAccount = getAssociatedTokenAddressSync(
    inputToken,
    payer,
    false,
    inputTokenProgram
  );
  try {
    await getAccount(connection, inputTokenAccount);
  } catch (e) {
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        payer,
        inputTokenAccount,
        payer,
        inputToken,
        inputTokenProgram
      )
    );
  }
  const outputTokenAccount = getAssociatedTokenAddressSync(
    outputToken,
    payer,
    false,
    outputTokenProgram
  );
  try {
    await getAccount(connection, outputTokenAccount);
  } catch (e) {
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        payer,
        outputTokenAccount,
        payer,
        outputToken,
        outputTokenProgram
      )
    );
  }
  if (inputToken == NATIVE_MINT) {
    ixs.push(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: inputTokenAccount,
        lamports: amount_in,
      })
    );
    ixs.push(createSyncNativeInstruction(inputTokenAccount));
  }

  ixs.push(
    await program(connection)
      .methods.swapBaseInput(new BN(amount_in), new BN(min_amount_out))
      .accounts({
        payer: payer,
        ammConfig: CONFIG,
        poolState: poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault: getAssociatedTokenAddressSync(
          inputToken,
          poolAddress,
          true,
          inputTokenProgram
        ),
        outputVault: getAssociatedTokenAddressSync(
          outputToken,
          poolAddress,
          true,
          outputTokenProgram
        ),
        inputTokenProgram: inputTokenProgram,
        outputTokenProgram: outputTokenProgram,
        inputTokenMint: inputToken,
        outputTokenMint: outputToken,
        observationState: observationAddress,
      })
      .instruction()
  );

  ixs.push(
    createCloseAccountInstruction(
      getAssociatedTokenAddressSync(NATIVE_MINT, payer),
      payer,
      payer
    )
  );
  return ixs;
}
