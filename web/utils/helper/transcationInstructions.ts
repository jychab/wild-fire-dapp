import { BN, Program } from '@coral-xyz/anchor';
import {
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  TokenAccountNotFoundError,
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getExtensionData,
  getNewAccountLenForExtensionLen,
  unpackMint,
  updateTokenMetadata,
} from '@solana/spl-token';
import { TokenMetadata, pack, unpack } from '@solana/spl-token-metadata';
import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG, DEFAULT_MINT_DECIMALS } from '../consts';
import swapIdl from '../program/idl/raydium_cp_swap.json';
import Idl from '../program/idl/wild_fire.json';
import { RaydiumCpSwap } from '../program/types/raydium_cp_swap';
import { WildFire } from '../program/types/wild_fire';

export const program = new Program<WildFire>(Idl as unknown as WildFire, {
  connection: new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!),
});

export const swapProgram = new Program<RaydiumCpSwap>(
  swapIdl as unknown as RaydiumCpSwap,
  {
    connection: new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!),
  }
);

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

export async function changeTransferFee(
  payer: PublicKey,
  mint: PublicKey,
  feeBasisPts: number,
  maxFee: number
) {
  const ix = await program.methods
    .changeTransferFee(feeBasisPts, new BN(maxFee))
    .accounts({
      payer: payer,
      mint: mint,
    })
    .instruction();

  return ix;
}

export async function changeAdmin(
  payer: PublicKey,
  mint: PublicKey,
  newAdmin: PublicKey
) {
  const ix = await program.methods
    .changeAdmin(newAdmin)
    .accounts({
      payer: payer,
      program: program.programId,
      mint: mint,
    })
    .instruction();

  return ix;
}

export async function setToImmutable(payer: PublicKey, mint: PublicKey) {
  const ix = await program.methods
    .setToImmutable()
    .accounts({
      payer: payer,
      mint: mint,
    })
    .instruction();

  return ix;
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

export async function removeFieldFromMetadata(
  payer: PublicKey,
  mint: PublicKey,
  field: string
) {
  return await program.methods
    .removeKeyFromMetadata(field)
    .accounts({
      mint: mint,
      payer: payer,
    })
    .instruction();
}

export async function updateMetadata(
  payer: PublicKey,
  mint: PublicKey,
  field: string,
  value: string
) {
  return await program.methods
    .updateMintMetadata(field, value)
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

export async function swapBaseInput(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  amount_in: number,
  inputToken: PublicKey,
  inputTokenProgram: PublicKey,
  outputToken: PublicKey,
  outputTokenProgram: PublicKey
) {
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    swapProgram.programId
  );

  const [inputVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), inputToken.toBuffer()],
    swapProgram.programId
  );

  const [outputVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), outputToken.toBuffer()],
    swapProgram.programId
  );

  const ixs = [];
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

  ixs.push(
    await swapProgram.methods
      .swapBaseInput(new BN(amount_in), new BN(0))
      .accounts({
        payer: payer,
        ammConfig: CONFIG,
        poolState: poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
        inputTokenProgram: inputTokenProgram,
        outputTokenProgram: outputTokenProgram,
        inputTokenMint: inputToken,
        outputTokenMint: outputToken,
        program: swapProgram.programId,
      })
      .instruction()
  );

  return ixs;
}

export async function swapBaseOutput(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  amount_out: number,
  inputToken: PublicKey,
  inputTokenProgram: PublicKey,
  outputToken: PublicKey,
  outputTokenProgram: PublicKey
) {
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    swapProgram.programId
  );

  const [inputVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), inputToken.toBuffer()],
    swapProgram.programId
  );

  const [outputVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), outputToken.toBuffer()],
    swapProgram.programId
  );

  const ixs = [];
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

  ixs.push(
    await swapProgram.methods
      .swapBaseOutput(new BN(Number.MAX_SAFE_INTEGER), new BN(amount_out))
      .accounts({
        payer: payer,
        ammConfig: CONFIG,
        poolState: poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
        inputTokenProgram: inputTokenProgram,
        outputTokenProgram: outputTokenProgram,
        inputTokenMint: inputToken,
        outputTokenMint: outputToken,
        program: swapProgram.programId,
      })
      .instruction()
  );

  return ixs;
}

// export async function initializePool(
//   connection: Connection,
//   mint: PublicKey,
//   payer: PublicKey,
//   creator: PublicKey,
//   amount: number,
//   offSet: number
// ) {
//   const ixs = [];
//   const creatorTokenMint = getAssociatedTokenAddressSync(
//     mint,
//     creator,
//     false,
//     TOKEN_2022_PROGRAM_ID
//   );
//   const creatorTokenUsdc = getAssociatedTokenAddressSync(
//     USDC,
//     creator,
//     false,
//     TOKEN_PROGRAM_ID
//   );
//   try {
//     await getAccount(connection, creatorTokenUsdc);
//   } catch (e) {
//     ixs.push(
//       createAssociatedTokenAccountIdempotentInstruction(
//         payer,
//         creatorTokenUsdc,
//         creator,
//         USDC,
//         TOKEN_PROGRAM_ID
//       )
//     );
//   }

//   ixs.push(
//     await swapProgram.methods
//       .initialize(new BN(amount), new BN(offSet), new BN(Date.now() / 1000))
//       .accounts({
//         payer: payer,
//         ammConfig: CONFIG,
//         program: swapProgram.programId,
//         mint: mint,
//         creator: payer,
//         creatorTokenMint: creatorTokenMint,
//         creatorTokenUsdc: creatorTokenUsdc,
//         mintTokenProgram: TOKEN_2022_PROGRAM_ID,
//       })
//       .instruction()
//   );
//   return ixs;
// }

export async function createConfig(payer: PublicKey) {
  const ix = await swapProgram.methods
    .createAmmConfig(
      0,
      new BN(10_000),
      new BN(100_000),
      new PublicKey('Hc1vbMTbjDmj5QMazL5PUDZWRdpFakBedZvKJfzEp8B7')
    )
    .accounts({ owner: payer })
    .instruction();
  return ix;
}

// export async function changeOffSet(payer: PublicKey, mint: PublicKey) {
//   const [poolAddress] = PublicKey.findProgramAddressSync(
//     [Buffer.from('pool'), mint.toBuffer()],
//     swapProgram.programId
//   );
//   return await swapProgram.methods
//     .updatePoolOffset(new BN(OFF_SET))
//     .accountsPartial({
//       authority: payer,
//       poolState: poolAddress,
//     })
//     .instruction();
// }
