'use client';

import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const mintId = searchParams.get('mintId');
  // return <EditFeature mintId={mintId} />;
  return <div></div>;
}
