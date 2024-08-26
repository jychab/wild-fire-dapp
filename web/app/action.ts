'use server';

import { revalidateTag } from 'next/cache';

export default async function revalidateTags(tag: string) {
  revalidateTag(tag);
}
