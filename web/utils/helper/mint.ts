import {
  calculateEpochFee,
  getMint,
  getTransferFeeConfig,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { doc, getDoc } from 'firebase/firestore';
import { Scope } from '../enums/das';
import { db } from '../firebase/firebase';
import { DAS } from '../types/das';
import { TokenState } from '../types/program';
import { program } from './transcationInstructions';

export function getDerivedMint(address: PublicKey) {
  const [derivedMint] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint'), address.toBuffer()],
    program.programId
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
    program.programId
  );

  return tokenState;
}

export async function getAsset(mint: PublicKey) {
  const response = await fetch(program.provider.connection.rpcEndpoint, {
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
  tokenProgram = TOKEN_2022_PROGRAM_ID
) {
  const mintInfo = await getMint(
    program.provider.connection,
    mint,
    undefined,
    tokenProgram
  );

  const transferFeeConfig = getTransferFeeConfig(mintInfo);
  if (!transferFeeConfig) {
    return amount;
  }
  const transferFee = calculateEpochFee(
    transferFeeConfig,
    BigInt((await program.provider.connection.getEpochInfo()).epoch),
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
