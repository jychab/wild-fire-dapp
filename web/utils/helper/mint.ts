import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { doc, getDoc } from 'firebase/firestore';
import { PROGRAM_ID } from '../consts';
import { Scope } from '../enums/das';
import { db } from '../firebase/firebase';
import { DAS } from '../types/das';
import { TokenState } from '../types/program';

export function getDerivedMint(address: PublicKey) {
  const [derivedMint] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint'), address.toBuffer()],
    PROGRAM_ID
  );
  return derivedMint;
}

export function getDerivedMemberMint(mint: PublicKey, index: number) {
  const [memberMint] = PublicKey.findProgramAddressSync(
    [mint.toBuffer(), new BN(index).toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
  return memberMint;
}
export function isAuthorized(
  tokenStateData: TokenState | null | undefined,
  publicKey: PublicKey | null,
  metadata: DAS.GetAssetResponse | null | undefined
) {
  if (!tokenStateData || !publicKey || !metadata) {
    return false;
  }
  return (
    publicKey.toBase58() == tokenStateData.admin ||
    metadata?.authorities?.find(
      (x) => x.scopes.includes(Scope.METADATA) || x.scopes.includes(Scope.FULL)
    )?.address == publicKey.toBase58()
  );
}
export function getAssociatedEscrowAccount(creator: PublicKey) {
  const [tokenState] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), creator.toBuffer()],
    PROGRAM_ID
  );

  return tokenState;
}
export function getAssociatedPoolAccount(mint: PublicKey) {
  const [tokenState] = PublicKey.findProgramAddressSync(
    [Buffer.from('liquidity_pool'), mint.toBuffer()],
    PROGRAM_ID
  );

  return tokenState;
}

export async function getAsset(mint: PublicKey) {
  const response = await fetch(process.env.NEXT_PUBLIC_RPC_ENDPOINT as string, {
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

export async function getHolders(mint: string) {
  const result = await getDoc(doc(db, `Mint/${mint}/TokenInfo/Summary`));
  if (result.exists()) {
    return result.data() as {
      currentHoldersCount?: number;
      holdersChange24hPercent?: number;
      currentPrice?: number;
      priceChange24hPercent?: number;
    };
  } else {
    return null;
  }
}

export async function getAllTokenAccountsForMint(mint: PublicKey) {
  let allTokenAccounts = new Set<{
    address: string;
    mint: string;
    owner: string;
    amount: number;
    frozen: boolean;
  }>();
  let cursor;

  while (true) {
    let params: {
      limit: number;
      mint: string;
      cursor?: any;
      options: any;
    } = {
      limit: 1000,
      mint: mint.toBase58(),
      options: {
        showZeroBalance: true,
      },
    };

    if (cursor != undefined) {
      params.cursor = cursor;
    }

    const response = await fetch(
      process.env.NEXT_PUBLIC_RPC_ENDPOINT as string,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '',
          method: 'getTokenAccounts',
          params: params,
        }),
      }
    );
    const data = await response.json();

    if (!data.result || data.result.token_accounts.length === 0) {
      break;
    }

    data.result.token_accounts.forEach((account: any) => {
      allTokenAccounts.add(account);
    });
    cursor = data.result.cursor;
  }
  return Array.from(allTokenAccounts);
}
