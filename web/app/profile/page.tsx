'use client';
import { ProfileFeature } from '@/components/profile/profile-feature';
import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address');
  const mint = searchParams.get('mint');
  return <ProfileFeature address={address} mint={mint} />;
}
