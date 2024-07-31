'use client';

import { FC } from 'react';
import { EditToken } from './edit-ui';

interface EditFeatureProps {
  mintId: string | null;
}
export const EditFeature: FC<EditFeatureProps> = ({ mintId }) => {
  return (
    <div className="flex flex-col pb-[32px] w-full items-center">
      {mintId ? <EditToken mintId={mintId} /> : 'Invalid mint id'}
    </div>
  );
};
