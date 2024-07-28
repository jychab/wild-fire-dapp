'use client';
import UploadFeature from '@/components/upload/upload-feature';
import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const mintId = searchParams.get('mintId');
  return <UploadFeature mintId={mintId ? mintId : undefined} />;
}
