import { BN } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { PROGRAM_ID } from '../consts';
import { Scope } from '../enums/das';
import { db } from '../firebase/firebase';
import { DAS } from '../types/das';
import { TokenState } from '../types/token';

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
export async function getAssetBatch(connection: Connection, mints: string[]) {
  if (mints.length == 0) return [];
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
        ids: mints,
      },
    }),
  });
  const result = (await response.json()).result as DAS.GetAssetResponse[];
  return result;
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
export async function fetchTokenDetails(
  mint?: PublicKey,
  memberMint?: PublicKey
) {
  const docData = memberMint
    ? (
        await getDocs(
          query(
            collection(db, `Mint`),
            where('memberMint', '==', memberMint?.toBase58()),
            limit(1)
          )
        )
      ).docs[0]
    : await getDoc(doc(db, `Mint/${mint?.toBase58()}`));
  if (docData.exists()) {
    const parsedData = JSON.parse(docData.data().das) as DAS.GetAssetResponse;
    if (
      parsedData.content?.links &&
      !parsedData.content.links.image &&
      parsedData.content?.json_uri
    ) {
      parsedData.content.links.image = (
        await (await fetch(parsedData.content?.json_uri)).json()
      ).image as string;
    }
    return {
      ...parsedData,
      collectionMint: docData.id,
    } as DAS.GetAssetResponse;
  } else {
    const docData = await getDoc(
      doc(db, `Mint/${mint?.toBase58()}/Temporary/Profile`)
    );
    if (docData.exists()) {
      return { ...docData.data(), temporary: true } as DAS.GetAssetResponse;
    }
  }
  return null;
}
