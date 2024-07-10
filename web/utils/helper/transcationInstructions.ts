import { CONFIG } from '@/components/const';
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
import Idl2 from '../program/idl/raydium_cp_swap.json';
import Idl from '../program/idl/wild_fire.json';
import { RaydiumCpSwap } from '../program/types/raydium_cp_swap';
import { WildFire } from '../program/types/wild_fire';

export const program = (connection: Connection) =>
  new Program<WildFire>(Idl as unknown as WildFire, {
    connection,
  });

export const raydiumProgram = (connection: Connection) =>
  new Program<RaydiumCpSwap>(Idl2 as unknown as RaydiumCpSwap, { connection });

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
  return [ix];
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
      admin: payer,
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
  return await program(connection)
    .methods.issueMint(new BN(amount))
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

export function u16ToBytes(num: number) {
  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setUint16(0, num, false);
  return new Uint8Array(arr);
}

export async function createConfig(connection: Connection, owner: PublicKey) {
  return await raydiumProgram(connection)
    .methods.createAmmConfig(0, new BN(10000), new BN(100000), new BN(50000))
    .accounts({
      owner: owner,
    })
    .instruction();
}

export async function initializePool(
  connection: Connection,
  mint: PublicKey,
  payer: PublicKey,
  mintAmount: number,
  solAmount: number
) {
  const [tokenMint0, tokenMint1] =
    Buffer.compare(mint.toBuffer(), NATIVE_MINT.toBuffer()) < 0
      ? [mint, NATIVE_MINT]
      : [NATIVE_MINT, mint];
  const [token0Amount, token1Amount] =
    NATIVE_MINT.toBase58() == tokenMint0.toBase58()
      ? [solAmount, mintAmount]
      : [mintAmount, solAmount];
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('pool'),
      CONFIG.toBuffer(),
      tokenMint0.toBuffer(),
      tokenMint1.toBuffer(),
    ],
    raydiumProgram(connection).programId
  );
  const [lpMintAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_lp_mint'), poolAddress.toBuffer()],
    raydiumProgram(connection).programId
  );
  const creatorLpToken = getAssociatedTokenAddressSync(lpMintAddress, payer);

  const [token0Program, token1Program] =
    NATIVE_MINT.toBase58() == tokenMint0.toBase58()
      ? [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]
      : [TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID];

  const ix = [];

  const creatorToken0 = getAssociatedTokenAddressSync(
    tokenMint0,
    payer,
    false,
    token0Program
  );

  const creatorToken1 = getAssociatedTokenAddressSync(
    tokenMint1,
    payer,
    false,
    token1Program
  );
  const creatorNativeMintTokenAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    payer
  );
  try {
    await getAccount(connection, creatorNativeMintTokenAccount);
  } catch (e) {
    ix.push(
      createAssociatedTokenAccountIdempotentInstruction(
        payer,
        creatorNativeMintTokenAccount,
        payer,
        NATIVE_MINT
      )
    );
  }

  ix.push(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: creatorNativeMintTokenAccount,
      lamports: solAmount,
    })
  );

  ix.push(createSyncNativeInstruction(creatorNativeMintTokenAccount));

  ix.push(
    await raydiumProgram(connection)
      .methods.initialize(new BN(token0Amount), new BN(token1Amount), new BN(0))
      .accounts({
        creatorLpToken: creatorLpToken,
        creator: payer,
        ammConfig: CONFIG,
        token0Mint: tokenMint0,
        token1Mint: tokenMint1,
        creatorToken0: creatorToken0,
        creatorToken1: creatorToken1,
        token0Program: token0Program,
        token1Program: token1Program,
      })
      .instruction()
  );
  return ix;
}

export async function swapBaseOutput(
  connection: Connection,
  payer: PublicKey,
  amount_out_less_fee: number,
  inputToken: PublicKey,
  inputTokenProgram: PublicKey,
  outputToken: PublicKey,
  outputTokenProgram: PublicKey,
  outputTokenDecimal: number
) {
  const [tokenMint0, tokenMint1] =
    Buffer.compare(inputToken.toBuffer(), outputToken.toBuffer()) < 0
      ? [inputToken, outputToken]
      : [outputToken, inputToken];

  const [poolAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('pool'),
      CONFIG.toBuffer(),
      tokenMint0.toBuffer(),
      tokenMint1.toBuffer(),
    ],
    raydiumProgram(connection).programId
  );

  const [inputVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), inputToken.toBuffer()],
    raydiumProgram(connection).programId
  );

  const [outputVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), outputToken.toBuffer()],
    raydiumProgram(connection).programId
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
  if (inputToken == NATIVE_MINT) {
    const payerAccount = await connection.getAccountInfo(payer);
    ixs.push(
      SystemProgram.transfer({
        toPubkey: inputTokenAccount,
        fromPubkey: payer,
        lamports: payerAccount!.lamports * 0.5,
      })
    );
    ixs.push(createSyncNativeInstruction(inputTokenAccount));
  }
  const [observationAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('observation'), poolAddress.toBuffer()],
    raydiumProgram(connection).programId
  );

  ixs.push(
    await raydiumProgram(connection)
      .methods.swapBaseOutput(
        new BN(Number.MAX_SAFE_INTEGER),
        new BN(amount_out_less_fee * 10 ** outputTokenDecimal)
      )
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
  const [tokenMint0, tokenMint1] =
    Buffer.compare(mint.toBuffer(), NATIVE_MINT.toBuffer()) < 0
      ? [mint, NATIVE_MINT]
      : [NATIVE_MINT, mint];

  const [poolAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('pool'),
      CONFIG.toBuffer(),
      tokenMint0.toBuffer(),
      tokenMint1.toBuffer(),
    ],
    raydiumProgram(connection).programId
  );

  return await raydiumProgram(connection).account.poolState.fetch(poolAddress);
}

export async function swapBaseInput(
  connection: Connection,
  payer: PublicKey,
  amount_in: number,
  inputToken: PublicKey,
  inputTokenProgram: PublicKey,
  inputTokenDecimal: number,
  outputToken: PublicKey,
  outputTokenProgram: PublicKey
) {
  const [tokenMint0, tokenMint1] =
    Buffer.compare(inputToken.toBuffer(), outputToken.toBuffer()) < 0
      ? [inputToken, outputToken]
      : [outputToken, inputToken];

  const [poolAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('pool'),
      CONFIG.toBuffer(),
      tokenMint0.toBuffer(),
      tokenMint1.toBuffer(),
    ],
    raydiumProgram(connection).programId
  );

  const [inputVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), inputToken.toBuffer()],
    raydiumProgram(connection).programId
  );

  const [outputVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), outputToken.toBuffer()],
    raydiumProgram(connection).programId
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
  if (inputToken == NATIVE_MINT) {
    ixs.push(
      SystemProgram.transfer({
        toPubkey: inputTokenAccount,
        fromPubkey: payer,
        lamports: amount_in * 10 ** inputTokenDecimal,
      })
    );
    ixs.push(createSyncNativeInstruction(inputTokenAccount));
  }
  const [observationAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('observation'), poolAddress.toBuffer()],
    raydiumProgram(connection).programId
  );

  ixs.push(
    await raydiumProgram(connection)
      .methods.swapBaseInput(
        new BN(amount_in * 10 ** inputTokenDecimal),
        new BN(0)
      )
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
