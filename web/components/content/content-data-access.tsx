import { HASHFEED_MINT } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { deletePost } from '@/utils/firebase/functions';
import { DAS } from '@/utils/types/das';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
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
      const summary = (await getDoc(doc(db, `Summary/mints`))).data() as {
        verifiedMints: string[];
      };
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

      return await Promise.all(
        allTokenAccounts.map(async (x) => {
          try {
            const account = await getAccount(
              connection,
              getAssociatedTokenAddressSync(
                new PublicKey(x.id),
                address,
                false,
                new PublicKey(x.token_info!.token_program!)
              ),
              undefined,
              new PublicKey(x.token_info!.token_program!)
            );
            return {
              ...x,
              verified: summary.verifiedMints.includes(x.id),
              price: x.token_info?.price_info?.price_per_token,
              quantity: Number(account.amount),
            };
          } catch (e) {
            return {
              ...x,
              verified: summary.verifiedMints.includes(x.id),
              price: x.token_info?.price_info?.price_per_token,
              quantity: 0,
            };
          }
        })
      );
    },
    enabled: !!address,
    staleTime: 15 * 1000 * 60,
  });
};
