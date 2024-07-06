import { useWallet } from '@solana/wallet-adapter-react';
import { IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC, useMemo, useState } from 'react';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { Blinks } from '../blinks/blinks-ui';
import { CreateAccountBtn } from '../create/create-ui';
import { useGetToken } from '../dashboard/dashboard-data-access';
import { useUploadMutation } from './upload.data-access';

export const UploadBtn: FC = () => {
  const router = useRouter();
  return (
    <button onClick={() => router.push('/upload')} className="btn btn-outline ">
      <IconPlus />
      Upload
    </button>
  );
};

export enum ContentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  BLINKS = 'blinks',
}

export const Upload: FC = () => {
  const { publicKey } = useWallet();
  const { data } = useGetToken({ address: publicKey });
  const [url, setUrl] = useState<string>('');
  const [uploadType, setUploadType] = useState(ContentType.BLINKS);
  const uploadMutation = useUploadMutation({
    mint: data ? data[0].mint : null,
  });

  const validUrl = useMemo(() => {
    try {
      return new URL(url);
    } catch (e) {
      return null;
    }
  }, [url]);

  return (
    <div className="flex flex-col gap-8 my-4 items-center w-full p-4">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        Upload Content
      </span>
      <div className="flex flex-col gap-4 items-center max-w-md w-full">
        <input
          type="url"
          placeholder="Add Blink Url here to preview"
          className="input input-bordered w-full"
          value={url?.toString()}
          onChange={(e) => setUrl(e.target.value)}
        />
        {validUrl && <Blinks actionUrl={validUrl} />}
        {publicKey && data && (
          <button
            disabled={!validUrl || uploadMutation.isPending}
            onClick={() => {
              if (!validUrl) return;
              uploadMutation.mutateAsync({
                content: [
                  {
                    type: ContentType.BLINKS,
                    uri: validUrl.toString(),
                    date: Math.round(Date.now() / 1000),
                  },
                ],
              });
            }}
            className="btn btn-primary w-full"
          >
            {uploadMutation.isPending ? (
              <div className="loading loading-spinner loading-sm" />
            ) : (
              'Upload'
            )}
          </button>
        )}
        {publicKey && !data && <CreateAccountBtn />}
        {!publicKey && <AuthenticationBtn />}
      </div>
    </div>
  );
};
