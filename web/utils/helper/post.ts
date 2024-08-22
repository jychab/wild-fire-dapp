import { PostContent } from '../types/post';
import { generatePostApiEndPoint } from './endpoints';

export async function fetchPost(mint: string | null, postId: string | null) {
  if (!mint || !postId) return null;
  const response = await (
    await fetch(generatePostApiEndPoint(mint, postId))
  ).json();
  let post = response as PostContent | undefined;
  return post;
}
