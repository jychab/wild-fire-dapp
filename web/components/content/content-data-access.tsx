import { HASHFEED_MINT } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { deletePost } from '@/utils/firebase/functions';
import { DAS } from '@/utils/types/das';
import { useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { useTransactionToast } from '../ui/ui-layout';

export async function getAssetBatch({
  ids,
  connection,
}: {
  ids: string[];
  connection: Connection;
}) {
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '',
      method: 'getAssetBatch',
      params: {
        ids: ids,
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetResponse[];
  return data;
}

export async function getAsset({
  mint,
  connection,
}: {
  mint: PublicKey;
  connection: Connection;
}) {
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '',
      method: 'getAsset',
      params: {
        id: mint.toBase58(),
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetResponse;
  return data;
}

export async function getTokenBalancesFromOwner({
  address,
  connection,
}: {
  address: PublicKey;
  connection: Connection;
}) {
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getTokenAccounts',
      id: '',
      params: {
        page: 1,
        limit: 100,
        displayOptions: {
          showZeroBalance: false,
        },
        owner: address.toBase58(),
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetTokenAccountsResponse;

  return data;
}

export function useRemoveContentMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'remove-mint-content',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (id: string) => {
      if (!mint || !id) return;
      await deletePost(mint.toBase58(), id);
      return 'Success';
    },

    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-token-details',
              { endpoint: connection.rpcEndpoint, mint },
            ],
          }),
          client.refetchQueries({
            queryKey: [
              'get-token-details',
              { endpoint: connection.rpcEndpoint, mint },
            ],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}

export const fetchOwnerTokenDetails = ({
  address,
}: {
  address: PublicKey | null;
}) => {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-fetch-owner-token-details',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;

      // Fetch verified mints summary in parallel
      const summaryPromise = getDoc(doc(db, 'Summary/mints')).then(
        (doc) => doc.data() as { verifiedMints: string[] }
      );

      // Fetch owner token accounts
      const ownerTokenAccounts = await getTokenBalancesFromOwner({
        address,
        connection,
      });

      if (!ownerTokenAccounts?.token_accounts) return [];

      // Prepare token account IDs with amounts
      const tokenAccountsWithHashfeed = ownerTokenAccounts.token_accounts.map(
        (x) => ({
          mint: x.mint,
          amount: x.amount,
        })
      );

      if (
        !tokenAccountsWithHashfeed.some(
          (x) => x.mint === HASHFEED_MINT.toBase58()
        )
      ) {
        tokenAccountsWithHashfeed.push({
          mint: HASHFEED_MINT.toBase58(),
          amount: 0,
        });
      }

      const allTokenAccountIds = tokenAccountsWithHashfeed.map((x) => x.mint!);

      // Fetch metadata and summary in parallel
      const [allTokenAccountsWithMetadata, summary] = await Promise.all([
        getAssetBatch({ ids: allTokenAccountIds, connection }),
        summaryPromise,
      ]);

      // Combine metadata with token accounts
      return allTokenAccountsWithMetadata?.map((metadata) => {
        const tokenAccount = tokenAccountsWithHashfeed.find(
          (x) => x.mint === metadata.id
        );
        return {
          ...metadata,
          verified: summary.verifiedMints.includes(metadata.id),
          price: metadata.token_info?.price_info?.price_per_token,
          quantity: Number(tokenAccount?.amount),
        };
      });
    },
    enabled: !!address,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
