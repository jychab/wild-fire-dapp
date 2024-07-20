import { getAccount, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';

export function useGetTokenAccountInfo({
  address,
  tokenProgram = TOKEN_2022_PROGRAM_ID,
}: {
  address: PublicKey | null;
  tokenProgram?: PublicKey;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-address-token-account-info',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;
      return getAccount(connection, address, undefined, tokenProgram);
    },
    enabled: !!address,
  });
}

export function useGetAddressInfo({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-address-account-info',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;
      return connection.getAccountInfo(address);
    },
    enabled: !!address,
  });
}

export function useIsLiquidityPoolFound({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'check-liquidity-pool-status',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      if (!mint) return null;
      const result = await (
        await fetch(`https://price.jup.ag/v6/price?ids=${mint.toBase58()}`)
      ).json();
      return result.data?.price != undefined;
    },
    enabled: !!mint,
  });
}
