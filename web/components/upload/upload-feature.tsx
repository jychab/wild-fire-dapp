import { FC } from 'react';
import { Upload } from './upload-ui';

interface UploadFeatureProps {
  mintId?: string;
  id?: string;
}

export const UploadFeature: FC<UploadFeatureProps> = ({ mintId, id }) => {
  return (
    <div className="flex flex-col pb-[32px] w-full items-center">
      <Upload mintId={mintId} id={id} />
    </div>
  );
};

export default UploadFeature;
