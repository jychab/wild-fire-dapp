import { HASHFEED_MINT } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { deletePost } from '@/utils/firebase/functions';
import { DAS } from '@/utils/types/das';
import { useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { useTransactionToast } from '../ui/ui-layout';

export async function getAllFungibleTokensFromOwner({
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
      id: '',
      method: 'searchAssets',
      params: {
        ownerAddress: address.toBase58(),
        tokenType: 'fungible',
        options: {
          showZeroBalance: false,
        },
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetResponseList;
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
      const ownerTokenAccounts = await getAllFungibleTokensFromOwner({
        address,
        connection,
      });
      const allTokenAccounts = ownerTokenAccounts?.items.find(
        (x) => x.id === HASHFEED_MINT.toBase58()
      )
        ? ownerTokenAccounts.items
        : ownerTokenAccounts?.items.concat(
            await getAsset({ mint: HASHFEED_MINT, connection })
          );
      const ownerTokenBalances = await getTokenBalancesFromOwner({
        address,
        connection,
      });

      const allTokenAccountsWithPriceAndQuantity = await Promise.all(
        allTokenAccounts.map(async (x) => {
          try {
            const tokenSummary = await getDoc(
              doc(db, `Mint/${x.id}/TokenInfo/Summary`)
            );
            return {
              ...x,
              quantity:
                ownerTokenBalances.token_accounts?.find((y) => y.mint == x.id)
                  ?.amount || 0,
              price: tokenSummary.exists()
                ? tokenSummary.data().currentPrice
                : 0,
              last24hrPercentChange: tokenSummary.exists()
                ? tokenSummary.data().priceChange24hPercent || 0
                : 0,
            };
          } catch (e) {
            return {
              ...x,
              quantity: 0,
              price: 0,
              last24hrPercentChange: 0,
            };
          }
        })
      );

      return allTokenAccountsWithPriceAndQuantity;
    },
    enabled: !!address,
    staleTime: 15 * 1000 * 60,
  });
};
