'use client';

import { EditFeature } from '@/components/edit/edit-feature';
import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const mintId = searchParams.get('mintId');
  return (
    <div className="flex flex-col h-full w-full items-center">
      <div className="w-full max-w-2xl h-full">
        <EditFeature mintId={mintId} />
      </div>
    </div>
  );
  // return <div></div>;
}
