import { ActionsURLMapper } from '@/components/blinks/blink-data-access';
import { ActionsJsonConfig } from '../types/blinks';
import { PostContent } from '../types/post';
import { generatePostApiEndPoint, proxify } from './endpoints';

export async function fetchPost(mint: string | null, postId: string | null) {
  if (!mint || !postId) return null;
  const response = await (
    await fetch(generatePostApiEndPoint(mint, postId), {
      next: { revalidate: 15 * 60, tags: ['post'] },
    })
  ).json();
  let post = response as PostContent | undefined;
  return post;
}

export async function convertBlinksUrlToApiUrl(actionUrl: URL) {
  const origin = actionUrl?.origin;
  const actionsJsonUrl = origin + '/actions.json';
  const res = await fetch(proxify(actionsJsonUrl));
  const actionsJson = (await res.json()) as ActionsJsonConfig;
  const actionUrlMapper = new ActionsURLMapper(actionsJson);
  return actionUrlMapper.mapUrl(actionUrl!);
}
