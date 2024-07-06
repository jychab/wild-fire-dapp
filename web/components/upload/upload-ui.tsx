import { IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC, useMemo, useState } from 'react';
import { Blinks } from '../blinks/blinks-ui';

export const UploadBtn: FC = () => {
  const router = useRouter();
  return (
    <button onClick={() => router.push('/upload')} className="btn btn-outline ">
      <IconPlus />
      Upload
    </button>
  );
};

enum UploadTypes {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  BLINKS = 'BLINKS',
}

export const Upload: FC = () => {
  const [url, setUrl] = useState<string>('');
  const [uploadType, setUploadType] = useState(UploadTypes.BLINKS);

  const validUrl = useMemo(() => {
    try {
      return new URL(url);
    } catch (e) {
      return null;
    }
  }, [url]);

  return (
    <div className="flex flex-col gap-8 my-4 items-center max-w-2xl w-full p-4">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        Upload Blinks
      </span>
      <div className="flex flex-col gap-4 items-start w-full">
        <input
          type="url"
          placeholder="Add Blink URL"
          className="input input-bordered w-full"
          value={url?.toString()}
          onChange={(e) => setUrl(e.target.value)}
        />
        {validUrl && <Blinks actionUrl={validUrl} />}
      </div>
    </div>
  );
};
