import { BN, Program } from '@coral-xyz/anchor';
import {
  CompressedTokenProgram,
  selectMinCompressedTokenAccountsForTransfer,
} from '@lightprotocol/compressed-token';
import {
  bn,
  buildTx,
  Rpc,
  sendAndConfirmTx,
} from '@lightprotocol/stateless.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { getDerivedMemberMint } from '../helper/mint';
import Idl from './idl/blinksfeed.json';
import { Blinksfeed } from './types/blinksfeed';

export const program = new Program<Blinksfeed>(Idl as unknown as Blinksfeed, {
  connection: new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT as string),
});
export async function collectFees(payer: PublicKey, admin: PublicKey) {
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

export async function decompressTokenIxs(
  connection: Rpc,
  publicKey: PublicKey,
  mint: PublicKey,
  amount: number
) {
  let ixs = [];
  const ata = getAssociatedTokenAddressSync(mint, publicKey);
  const ataInfo = await connection.getAccountInfo(ata);
  const ataExists = ataInfo !== null;
  if (!ataExists) {
    const createAtaInstruction =
      createAssociatedTokenAccountIdempotentInstruction(
        publicKey,
        ata,
        publicKey,
        mint
      );

    ixs.push(createAtaInstruction);
  }
  const compressedTokenAccounts =
    await connection.getCompressedTokenAccountsByOwner(publicKey, {
      mint,
    });
  const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(
    compressedTokenAccounts.items,
    amount
  );
  const proof = await connection.getValidityProof(
    inputAccounts.map((account) => bn(account.compressedAccount.hash))
  );
  const decompressInstruction = await CompressedTokenProgram.decompress({
    payer: publicKey,
    inputCompressedTokenAccounts: inputAccounts,
    toAddress: ata,
    amount,
    recentInputStateRootIndices: proof.rootIndices,
    recentValidityProof: proof.compressedProof,
  });
  ixs.push(decompressInstruction);
  return ixs;
}

export async function mergeTokenAccounts(
  rpc: Rpc,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  signAllTransactions: <T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ) => Promise<T[]>,
  merkleTree?: PublicKey
) {
  let compressedTokenAccounts = await rpc.getCompressedTokenAccountsByOwner(
    owner,
    { mint }
  );

  if (compressedTokenAccounts.items.length === 0) {
    return;
  }

  while (compressedTokenAccounts.items.length >= 3) {
    const transactions = [];

    for (let i = 0; i < compressedTokenAccounts.items.length; i += 6) {
      const batch = compressedTokenAccounts.items.slice(i, i + 6);

      const instructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
      ];

      for (let j = 0; j < batch.length; j += 3) {
        const subBatch = batch.slice(j, j + 3);

        if (subBatch.length > 1) {
          await delay(1000); // prevent being rate limited
          const proof = await rpc.getValidityProof(
            subBatch.map((account) => bn(account.compressedAccount.hash))
          );
          const batchInstructions =
            await CompressedTokenProgram.mergeTokenAccounts({
              payer: payer,
              owner: owner,
              mint,
              inputCompressedTokenAccounts: subBatch,
              outputStateTree: merkleTree!,
              recentValidityProof: proof.compressedProof,
              recentInputStateRootIndices: proof.rootIndices,
            });
          instructions.push(...batchInstructions);
        }
      }

      // Create the transaction
      const { blockhash } = await rpc.getLatestBlockhash();
      transactions.push(buildTx(instructions, payer, blockhash));
    }

    // Sign and send the transactions
    const signedTxs = await signAllTransactions(transactions);
    await Promise.all(
      signedTxs.map((signedTx) => sendAndConfirmTx(rpc, signedTx))
    );

    // Fetch the updated list of compressed token accounts
    compressedTokenAccounts = await rpc.getCompressedTokenAccountsByOwner(
      owner,
      { mint }
    );

    // Exit if there are 2 or fewer accounts left
    if (compressedTokenAccounts.items.length <= 2) {
      return;
    }
  }
  return;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
