import { TokenMetadata } from '@solana/spl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, uploadString } from 'firebase/storage';
import { functions, storage } from './firebase';

export async function getDistributor(mint: string) {
  const getDistributor = httpsCallable(functions, 'getDistributor');
  const result = await getDistributor({ mint });
  return result.data as string;
}

export async function getDistributorSponsored(metadata: TokenMetadata) {
  const getDistributorSponsored = httpsCallable(
    functions,
    'getDistributorSponsored'
  );

  const result = await getDistributorSponsored({
    metadata: {
      ...metadata,
      mint: metadata.mint.toBase58(),
      updateAuthority: metadata.updateAuthority?.toBase58(),
    },
  });
  return result.data as { partialTx?: string; distributor: string };
}

export async function sendGift(
  mint: PublicKey,
  destination: PublicKey,
  amount: number
) {
  const sendGift = httpsCallable(functions, 'sendGift');
  await sendGift({
    mint: mint.toBase58(),
    destination: destination.toBase58(),
    amount,
  });
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

export async function uploadMetadata(
  payload: string,
  mint: PublicKey,
  id: string
) {
  const path = `${mint.toBase58()}/${id}.json`; //important to include file extension so cloudflare won't cache this
  const payloadRef = ref(storage, path);
  await uploadString(payloadRef, payload, undefined, {
    contentType: 'text/plain',
    cacheControl: 'no-cache',
  });
  return 'https://' + payloadRef.bucket + '/' + path;
}

export async function uploadMedia(picture: File, mint: PublicKey) {
  const path = `${mint.toBase58()}/media/${crypto.randomUUID()}`;
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, picture);
  return 'https://' + imageRef.bucket + '/' + path;
}
