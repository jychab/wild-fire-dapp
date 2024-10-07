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
  TransactionSignature,
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
  addressLookupTableAccounts,
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
  addressLookupTableAccounts?: AddressLookupTableAccount[];
  commitment?: Commitment;
  signers?: Signer[];
}): Promise<string> {
  let tx = await buildTransaction({
    connection,
    publicKey,
    signers,
    partialSignedTx,
    ixs,
    addressLookupTableAccounts,
  });
  if (!tx) {
    throw new Error('Undefined Transaction');
  }
  const signedTx = await signTransaction(tx);
  const txId = await pollAndSendTransaction(
    connection,
    signedTx as VersionedTransaction
  );
  return txId;
}

export async function buildTransaction({
  connection,
  publicKey,
  signers,
  partialSignedTx,
  ixs,
  addressLookupTableAccounts,
}: {
  connection: Connection;
  publicKey: PublicKey;
  signers?: Signer[];
  partialSignedTx?: Transaction | VersionedTransaction;
  ixs?: TransactionInstruction[];
  addressLookupTableAccounts?: AddressLookupTableAccount[];
}) {
  let tx = partialSignedTx;
  if (ixs && ixs.length > 0) {
    const recentBlockhash = await connection.getLatestBlockhash({
      commitment: 'confirmed',
    });
    const lookupTableAccount = (
      await connection.getAddressLookupTable(ADDRESS_LOOKUP_TABLE)
    ).value;
    const lookupTables = (
      lookupTableAccount ? [lookupTableAccount] : []
    ).concat(addressLookupTableAccounts || []);
    const [microLamports, units] = await Promise.all([
      getPriorityFeeEstimate(ixs, publicKey, connection, lookupTables),
      getSimulationUnits(connection, ixs, publicKey, lookupTables),
    ]);
    ixs.unshift(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.round(microLamports),
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
      }).compileToV0Message(lookupTables)
    );
    if (signers) {
      tx.sign(signers);
    }
  }
  return tx;
}

async function pollTransactionConfirmation(
  connection: Connection,
  txtSig: TransactionSignature
): Promise<TransactionSignature> {
  // 15 second timeout
  const timeout = 15000;
  // 5 second retry interval
  const interval = 5000;
  let elapsed = 0;

  return new Promise<TransactionSignature>((resolve, reject) => {
    const intervalId = setInterval(async () => {
      elapsed += interval;

      if (elapsed >= timeout) {
        clearInterval(intervalId);
        reject(new Error(`Transaction ${txtSig}'s confirmation timed out`));
      }

      const status = await connection.getSignatureStatus(txtSig);

      if (status?.value?.confirmationStatus === 'confirmed') {
        clearInterval(intervalId);
        resolve(txtSig);
      }
    }, interval);
  });
}
export async function pollAndSendTransaction(
  connection: Connection,
  transaction: VersionedTransaction
): Promise<TransactionSignature> {
  try {
    const timeout = 60000;
    const startTime = Date.now();
    let txtSig = '';

    while (Date.now() - startTime < timeout) {
      try {
        txtSig = await connection.sendTransaction(transaction, {
          skipPreflight: true,
          maxRetries: 0,
        });

        return await pollTransactionConfirmation(connection, txtSig);
      } catch (error) {
        continue;
      }
    }
    console.log(txtSig);
    throw new Error(`Transaction ${txtSig}'s confirmation timed out`);
  } catch (error) {
    throw new Error(`Error sending smart transaction: ${error}`);
  }
}
