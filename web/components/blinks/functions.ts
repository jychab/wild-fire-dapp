import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { ActionComponent } from './actions';
import { ActionStateWithOrigin } from './blinks-ui';
import {
  ExecutionState,
  ExecutionType,
  NormalizedSecurityLevel,
  checkSecurityFromActionState,
  executionReducer,
  isPostRequestError,
  isSignTransactionError,
} from './utils';

export const execute = async (
  connection: Connection,
  executionState: ExecutionState,
  overallActionState: ActionStateWithOrigin,
  payer: PublicKey | null,
  signTransaction:
    | (<T extends VersionedTransaction | Transaction>(
        transaction: T
      ) => Promise<T>)
    | undefined,
  component: ActionComponent,
  params?: Record<string, string>
) => {
  if (component.parameters && params) {
    Object.entries(params).forEach(([name, value]) =>
      component.setValue(value, name)
    );
  }
  const normalizedSecurityLevel: NormalizedSecurityLevel = {
    websites: 'all',
    interstitials: 'all',
    actions: 'all',
  };

  const newIsPassingSecurityCheck =
    overallActionState &&
    checkSecurityFromActionState(overallActionState, normalizedSecurityLevel);

  // if action state has changed or origin's state has changed, and it doesn't pass the security check or became malicious, block the action
  if (!newIsPassingSecurityCheck) {
    executionState = executionReducer(executionState, {
      type: ExecutionType.BLOCK,
    });
    return;
  }

  executionState = executionReducer(executionState, {
    type: ExecutionType.INITIATE,
    executingAction: component,
  });

  try {
    if (!payer || !signTransaction) {
      executionState = executionReducer(executionState, {
        type: ExecutionType.RESET,
      });
      return;
    }

    const tx = await component
      .post(payer.toBase58())
      .catch((e: Error) => ({ error: e.message }));

    if (isPostRequestError(tx)) {
      executionState = executionReducer(executionState, {
        type: ExecutionType.SOFT_RESET,
        errorMessage: tx.error,
      });
      return;
    }
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(tx.transaction, 'base64')
    );
    const signedTx = await signTransaction(transaction);

    console.log(signedTx);

    const txId = await connection.sendTransaction(signedTx, {
      skipPreflight: true,
      maxRetries: 0,
    });

    if (!txId || isSignTransactionError({ signature: txId })) {
      executionState = executionReducer(executionState, {
        type: ExecutionType.RESET,
      });
    } else {
      const blockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txId,
          blockhash: blockHash.blockhash,
          lastValidBlockHeight: blockHash.lastValidBlockHeight,
        },
        'confirmed'
      );
      executionState = executionReducer(executionState, {
        type: ExecutionType.FINISH,
        successMessage: tx.message,
      });
    }
  } catch (e) {
    executionState = executionReducer(executionState, {
      type: ExecutionType.FAIL,
      errorMessage: (e as Error).message ?? 'Unknown error',
    });
  }
};
