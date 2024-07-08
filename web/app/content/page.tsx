'use client';

import { ContentFeature } from '@/components/content/content-feature';
import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const mintId = searchParams.get('mintId');
  const id = searchParams.get('id');
  return mintId && id && <ContentFeature mintId={mintId} id={id} />;
}
