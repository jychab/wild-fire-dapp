'use client';

import { FC } from 'react';
import { DashBoard } from './dashboard-ui';
interface DashboardFeatureProps {
  mintId: string | null;
}
export const DashboardFeature: FC<DashboardFeatureProps> = ({ mintId }) => {
  return mintId && <DashBoard mintId={mintId} />;
};
