import { TokenMetadata } from '@solana/spl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, uploadString } from 'firebase/storage';
import { functions, storage } from './firebase';

export async function createOrEditPost(mint: string, post: any) {
  const createOrEditPost = httpsCallable(functions, 'createOrEditPost');
  await createOrEditPost({ mint, post });
}

export async function deletePost(mint: string, postId: string) {
  const deletePost = httpsCallable(functions, 'deletePost');
  await deletePost({ mint, postId });
}

export async function createOrEditComment(
  mint: string,
  postId: string,
  commentId: string,
  text: string,
  mentions: string[]
) {
  const createOrEditComment = httpsCallable(functions, 'createOrEditComment');
  await createOrEditComment({ mint, postId, commentId, text, mentions });
}

export async function createOrUpdateAdminForExternalMint(mint: string) {
  const createOrUpdateAdminForExternalMint = httpsCallable(
    functions,
    'createOrUpdateAdminForExternalMint'
  );
  await createOrUpdateAdminForExternalMint({ mint });
}

export async function getDistributor() {
  const getDistributor = httpsCallable(functions, 'getDistributor');
  const result = await getDistributor();
  return result.data as string;
}

export async function getSponsoredDistributor(metadata: TokenMetadata) {
  const getSponsoredDistributor = httpsCallable(
    functions,
    'getSponsoredDistributor'
  );

  const result = await getSponsoredDistributor({
    metadata: {
      ...metadata,
      mint: metadata.mint.toBase58(),
      updateAuthority: metadata.updateAuthority?.toBase58(),
    },
  });
  return result.data as { partialTx?: string; distributor: string };
}

export async function getSponsoredUpdateMetadata(
  mint: string,
  fieldsToUpdate: [string, string][]
) {
  const getSponsoredUpdateMetadata = httpsCallable(
    functions,
    'getSponsoredUpdateMetadata'
  );
  const result = await getSponsoredUpdateMetadata({ mint, fieldsToUpdate });
  return result.data as string;
}

export async function getDailyClaim(mint: string) {
  const getDailyClaim = httpsCallable(functions, 'getDailyClaim');
  const result = await getDailyClaim({
    mint,
  });
  return result.data as string;
}

export async function sendLike(
  postMint: string,
  postId: string,
  amount: number,
  commentId?: string
) {
  const sendLike = httpsCallable(functions, 'sendLike');
  await sendLike({
    postMint,
    postId,
    commentId,
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
      signature: Buffer.from(output).toString('base64'),
      publicKey: publicKey.toBase58(),
    })
  ).data as string;
}

export function createLoginMessage(sessionKey: string) {
  return `Sign Message to Log In! \n\nSession Key: ${sessionKey}}`;
}

export async function uploadMetadata(payload: string, mint: PublicKey) {
  const path = `${mint.toBase58()}/${crypto.randomUUID()}/metadata.json`;
  const payloadRef = ref(storage, path);
  await uploadString(payloadRef, payload);
  return 'https://' + payloadRef.bucket + '/' + path;
}

export async function uploadMedia(picture: File, mint: PublicKey) {
  const path = `${mint.toBase58()}/media/${crypto.randomUUID()}`;
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, picture);
  return 'https://' + imageRef.bucket + '/' + path;
}
