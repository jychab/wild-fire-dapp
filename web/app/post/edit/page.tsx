'use client';

import UploadFeature from '@/components/upload/upload-feature';
import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const mintId = searchParams.get('mintId');
  const id = searchParams.get('id');
  return mintId && id && <UploadFeature mintId={mintId} id={id} />;
}
