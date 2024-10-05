'use client';
import { TokenFeature } from '@/components/token/token-feature';
import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const mintId = searchParams.get('mintId');
  const tab = searchParams.get('tab');
  return <TokenFeature mintId={mintId} tab={tab} />;
}
