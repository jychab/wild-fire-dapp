'use client';
import {
  ProfileFeature,
  ProfileTabsEnum,
} from '@/components/profile/profile-feature';
import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address');
  const mint = searchParams.get('mint');
  const tab = searchParams.get('tab');
  return (
    <ProfileFeature
      address={address}
      mint={mint}
      selectedTab={tab != null ? (tab as ProfileTabsEnum) : undefined}
    />
  );
}
