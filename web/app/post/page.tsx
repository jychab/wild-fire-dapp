'use client';

import { ContentCardFeature } from '@/components/content/content-feature';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const mint = searchParams.get('mint');
  const id = searchParams.get('id');
  return mint && id && <ContentCardFeature mintId={mint} id={id} />;
}
