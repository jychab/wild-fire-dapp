'use client';

import { FC } from 'react';
import { ProfilePage } from './profile-ui';

export const ProfileFeature: FC<{
  mintId: string | null;
  tab: string | null;
}> = ({ mintId, tab }) => {
  return mintId && <ProfilePage mintId={mintId} tab={tab} />;
};
