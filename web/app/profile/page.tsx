'use client';
import { ProfileFeature } from '@/components/profile/profile-feature';
import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const mintId = searchParams.get('mintId');
  const tab = searchParams.get('tab');
  return <ProfileFeature mintId={mintId} tab={tab} />;
  // return <div></div>;
}
