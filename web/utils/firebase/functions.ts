import { TokenMetadata } from '@solana/spl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, uploadString } from 'firebase/storage';
import { generateRandomU64Number } from '../helper/post';
import { Campaign, PostCampaign } from '../types/campaigns';
import { PostContent } from '../types/post';
import { functions, storage } from './firebase';

export async function createOrEditCampaign(
  data: Partial<PostCampaign | Campaign>
) {
  const createOrEditCampaign = httpsCallable(functions, 'createOrEditCampaign');
  await createOrEditCampaign(data);
}

export async function deleteCampaign(id?: number, postId?: string) {
  const deleteCampaign = httpsCallable(functions, 'deleteCampaign');
  await deleteCampaign({ id, postId });
}

export async function getAvailableAmountInEscrow(
  mint: string,
  tokenProgram: string
) {
  const getAvailableAmountInEscrow = httpsCallable(
    functions,
    'getAvailableAmountInEscrow'
  );
  const result = await getAvailableAmountInEscrow({ mint, tokenProgram });
  return result.data as number;
}

export async function withdrawFromCampaign(
  id: number,
  amount: number,
  postId?: string
) {
  const withdrawFromCampaign = httpsCallable(functions, 'withdrawFromCampaign');
  const result = await withdrawFromCampaign({ id, amount, postId });
  return result.data as { partialTx: string };
}

export async function createOrEditPost(
  mint: string,
  post: Partial<PostContent>
) {
  const createOrEditPost = httpsCallable(functions, 'createOrEditPost');
  await createOrEditPost({ mint, post });
}

export async function validatePost(
  memberMint: string,
  mint: string,
  postId: string,
  type: string
) {
  const validatePost = httpsCallable(functions, 'validatePost');
  await validatePost({ memberMint, mint, postId, type });
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

export async function setTemporaryProfile(
  displayName: string,
  description: string,
  imageUrl?: string
) {
  const setTemporaryProfile = httpsCallable(functions, 'setTemporaryProfile');
  await setTemporaryProfile({
    displayName,
    description,
    imageUrl,
  });
}

export async function createMintInstruction(metadata: TokenMetadata) {
  const createMintInstruction = httpsCallable(
    functions,
    'createMintInstruction'
  );

  const result = await createMintInstruction({
    metadata: {
      ...metadata,
      mint: metadata.mint.toBase58(),
      updateAuthority: metadata.updateAuthority?.toBase58(),
    },
  });
  return result.data as string;
}

export async function retrievePayer() {
  const retrievePayer = httpsCallable(functions, 'retrievePayer');

  const result = await retrievePayer();
  return result.data as string;
}

export async function sendTokensToPayer(amount: number) {
  const sendTokensToPayer = httpsCallable(functions, 'sendTokensToPayer');

  const result = await sendTokensToPayer({ amount });
  return result.data as string;
}

export async function updateMetadataInstruction(
  mint: string,
  name: string,
  symbol: string,
  uri: string
) {
  const updateMetadataInstruction = httpsCallable(
    functions,
    'updateMetadataInstruction'
  );
  const result = await updateMetadataInstruction({ mint, name, symbol, uri });
  return result.data as string;
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

export async function uploadMetadata(payload: string, address: PublicKey) {
  const path = `${address.toBase58()}/metadata/${generateRandomU64Number()}.json`;
  const payloadRef = ref(storage, path);
  await uploadString(payloadRef, payload);
  return 'https://' + payloadRef.bucket + '/' + path;
}

export async function uploadMedia(picture: File, address: PublicKey) {
  const path = `${address.toBase58()}/media/${generateRandomU64Number()}`;
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, picture);
  return 'https://' + imageRef.bucket + '/' + path;
}
