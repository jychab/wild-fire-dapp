import {
  calculateEpochFee,
  getMint,
  getTransferFeeConfig,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
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
export function getAssociatedTokenStateAccount(mint: PublicKey) {
  const [tokenState] = PublicKey.findProgramAddressSync(
    [Buffer.from('token'), mint.toBuffer()],
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

export async function getAmountAfterTransferFee(
  amount: number,
  mint: PublicKey,
  connection: Connection,
  tokenProgram = TOKEN_2022_PROGRAM_ID
) {
  const mintInfo = await getMint(connection, mint, undefined, tokenProgram);

  const transferFeeConfig = getTransferFeeConfig(mintInfo);
  if (!transferFeeConfig) {
    return amount;
  }
  const transferFee = calculateEpochFee(
    transferFeeConfig,
    BigInt((await connection.getEpochInfo()).epoch),
    BigInt(amount)
  );
  return amount - Number(transferFee);
}

export async function getHolders(mint: string) {
  const result = await getDoc(doc(db, `Mint/${mint}/TokenInfo/Summary`));
  if (result.exists()) {
    return result.data() as {
      currentHoldersCount: number;
      holdersChange24hPercent: number;
    };
  } else {
    return null;
  }
}
