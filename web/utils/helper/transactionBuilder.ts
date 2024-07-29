import {
  AddressLookupTableAccount,
  Commitment,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { ADDRESS_LOOKUP_TABLE } from '../consts';

async function getPriorityFeeEstimate(
  testInstructions: TransactionInstruction[],
  payer: PublicKey,
  connection: Connection,
  lookupTables: AddressLookupTableAccount[]
) {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'getPriorityFeeEstimate',
      params: [
        {
          transaction: Buffer.from(testVersionedTxn.serialize()).toString(
            'base64'
          ), // Pass the serialized transaction in Base58
          options: { recommended: true, transactionEncoding: 'base64' },
        },
      ],
    }),
  });
  const data = await response.json();
  console.log('Recommended Fee: ', data.result.priorityFeeEstimate);
  return data.result.priorityFeeEstimate;
}

export async function getSimulationUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[]
): Promise<number | undefined> {
  const testInstructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }),
    ...instructions,
  ];

  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );
  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });
  if (simulation.value.err) {
    return undefined;
  }
  return simulation.value.unitsConsumed;
}
export async function buildAndSendTransaction({
  connection,
  publicKey,
  signTransaction,
  ixs,
  partialSignedTx,
  commitment = 'confirmed',
  signers,
}: {
  connection: Connection;
  publicKey: PublicKey;
  signTransaction: <T extends VersionedTransaction | Transaction>(
    transaction: T
  ) => Promise<T>;
  ixs?: TransactionInstruction[];
  partialSignedTx?: VersionedTransaction | Transaction;
  commitment?: Commitment;
  signers?: Signer[];
}): Promise<string> {
  let tx = partialSignedTx;
  const recentBlockhash = await connection.getLatestBlockhash({
    commitment: 'confirmed',
  });
  if (ixs && ixs.length > 0) {
    const lookupTables = (
      await connection.getAddressLookupTable(ADDRESS_LOOKUP_TABLE)
    ).value;
    const lookUpTable = lookupTables ? [lookupTables] : [];
    const [microLamports, units] = await Promise.all([
      getPriorityFeeEstimate(ixs, publicKey, connection, lookUpTable),
      getSimulationUnits(connection, ixs, publicKey, lookUpTable),
    ]);
    ixs.unshift(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.round(microLamports * 1.1),
      })
    );
    if (units) {
      // probably should add some margin of error to units
      ixs.unshift(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: Math.max(Math.round(units * 1.1), 5000),
        })
      );
      console.log(`Compute Units: ${Math.max(Math.round(units * 1.1), 5000)}`);
    }
    console.log(`Blockhash: ${recentBlockhash.blockhash}`);
    tx = new VersionedTransaction(
      new TransactionMessage({
        instructions: ixs,
        recentBlockhash: recentBlockhash.blockhash,
        payerKey: publicKey,
      }).compileToV0Message(lookUpTable)
    );
    if (signers) {
      tx.sign(signers);
    }
  }
  if (!tx) {
    throw new Error('Undefined Transaction');
  }
  const signedTx = await signTransaction(tx);
  const txId = await sendAndConfirmTransaction(
    connection,
    signedTx,
    recentBlockhash.blockhash,
    recentBlockhash.lastValidBlockHeight,
    commitment
  );
  return txId;
}
export async function sendAndConfirmTransaction(
  connection: Connection,
  signedTx: Transaction | VersionedTransaction,
  blockhash: string,
  lastValidBlockHeight: number,
  commitment: Commitment | undefined
) {
  const txId = await connection.sendTransaction(
    signedTx as VersionedTransaction,
    {
      maxRetries: 0,
      skipPreflight: true,
    }
  );
  const result = await connection.confirmTransaction(
    {
      signature: txId,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    },
    commitment
  );
  if (result.value.err) {
    throw new Error(JSON.stringify(result.value.err));
  }
  return txId;
}
