import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export async function getDistributor(mint: string) {
  const getDistributor = httpsCallable(functions, 'getDistributor');
  const result = await getDistributor({ mint });
  return result.data as string;
}

export async function withdrawFundsFromDistributor(
  mint: string,
  amount: number
) {
  const withdrawFundsFromDistributor = httpsCallable(
    functions,
    'withdrawFundsFromDistributor'
  );
  const result = await withdrawFundsFromDistributor({
    mint: mint,
    amount,
  });
}

export async function verifyAndGetToken(
  publicKey: PublicKey,
  output: Uint8Array
) {
  const verifyResponse = httpsCallable(functions, 'verifySignIn');
  return (
    await verifyResponse({
      signature: bs58.encode(output),
      publicKey: publicKey.toBase58(),
    })
  ).data as string;
}

export function createLoginMessage(sessionKey: string) {
  return `Sign Message to Log In! \n\nSession Key: ${sessionKey}}`;
}
