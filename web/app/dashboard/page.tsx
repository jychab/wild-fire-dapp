'use client';
import { DashboardFeature } from '@/components/dashboard/dashboard-feature';
import { useSearchParams } from 'next/navigation';

export default function page() {
  const searchParams = useSearchParams();
  const mintId = searchParams.get('mintId');
  return <DashboardFeature mintId={mintId} />;
  // return <div></div>;
}
