import { AbstractActionComponent } from '@/components/actions/abstract-action-component';
import { Action } from '@/components/actions/action';
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { DEFAULT_SUPPORTED_BLOCKCHAIN_IDS } from './actions-supportability';
import { BlockchainIds } from './caip-2';

export interface ActionContext {
  originalUrl: string;
  action: Action;
  actionType: 'trusted' | 'malicious' | 'unknown';
  triggeredLinkedAction: AbstractActionComponent;
}

export interface IncomingActionConfig {
  rpcUrl: string;
  adapter: Pick<ActionAdapter, 'connect' | 'signTransaction'> &
    Partial<Pick<ActionAdapter, 'metadata'>>;
}

/**
 * Metadata for an action adapter.
 *
 * @property supportedBlockchainIds List of CAIP-2 blockchain IDs the adapter supports.
 *
 * @see {BlockchainIds}
 */
export interface ActionAdapterMetadata {
  /**
   * List of CAIP-2 blockchain IDs the adapter supports.
   */
  supportedBlockchainIds: string[];
}

export interface ActionAdapter {
  metadata: ActionAdapterMetadata;
  connect: (context: ActionContext) => Promise<string | null>;
  signTransaction: (
    tx: string,
    context: ActionContext
  ) => Promise<{ signature: string } | { error: string }>;
  confirmTransaction: (
    signature: string,
    context: ActionContext
  ) => Promise<void>;
}

export class ActionConfig implements ActionAdapter {
  private static readonly CONFIRM_TIMEOUT_MS = 60000 * 1.2; // 20% extra time
  private static readonly DEFAULT_METADATA: ActionAdapterMetadata = {
    supportedBlockchainIds: DEFAULT_SUPPORTED_BLOCKCHAIN_IDS,
  };
  private connection: Connection;

  constructor(
    rpcUrlOrConnection: string | Connection,
    private adapter: IncomingActionConfig['adapter']
  ) {
    if (!rpcUrlOrConnection) {
      throw new Error('rpcUrl or connection is required');
    }

    this.connection =
      typeof rpcUrlOrConnection === 'string'
        ? new Connection(rpcUrlOrConnection, 'confirmed')
        : rpcUrlOrConnection;
  }

  get metadata() {
    return this.adapter.metadata ?? ActionConfig.DEFAULT_METADATA;
  }

  signTransaction(tx: string, context: ActionContext) {
    return this.adapter.signTransaction(tx, context);
  }

  confirmTransaction(signature: string): Promise<void> {
    return new Promise<void>((res, rej) => {
      const start = Date.now();

      const confirm = async () => {
        if (Date.now() - start >= ActionConfig.CONFIRM_TIMEOUT_MS) {
          rej(new Error('Unable to confirm transaction: timeout reached'));
          return;
        }

        try {
          const status = await this.connection.getSignatureStatus(signature);

          // if error present, transaction failed
          if (status.value?.err) {
            rej(
              new Error(
                `Transaction execution failed, check wallet for details`
              )
            );
            return;
          }

          // if has confirmations, transaction is successful
          if (status.value && status.value.confirmations !== null) {
            res();
            return;
          }
        } catch (e) {
          console.error(
            '[@dialectlabs/blinks] Error confirming transaction',
            e
          );
        }

        setTimeout(confirm, 3000);
      };

      confirm();
    });
  }

  async connect(context: ActionContext) {
    try {
      return await this.adapter.connect(context);
    } catch {
      return null;
    }
  }
}

export function useCreateActionConfig({
  connection,
  publicKey,
  walletSignTransaction,
}: {
  connection: Connection;
  publicKey: PublicKey | null;
  walletSignTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T
      ) => Promise<T>)
    | undefined;
}) {
  return new ActionConfig(connection, {
    metadata: {
      supportedBlockchainIds: [BlockchainIds.SOLANA_MAINNET],
    },
    connect: async (context: ActionContext) => {
      return publicKey?.toBase58() || '';
    },
    signTransaction: async (tx: string, context: ActionContext) => {
      if (!walletSignTransaction) return { error: 'Wallet not connected!' };
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(tx, 'base64')
      );
      const signedTx = await walletSignTransaction(transaction);
      const txId = await connection.sendTransaction(signedTx, {
        skipPreflight: true,
        maxRetries: 0,
      });
      return { signature: txId };
    },
  });
}
