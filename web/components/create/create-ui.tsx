import { useWallet } from '@solana/wallet-adapter-react';
import { IconPhotoPlus } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { useCreateMint } from './create-data-access';

export const CreateAccountBtn: FC = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/mint/create')}
      className="btn btn-primary rounded btn w-full"
    >
      Create Account
    </button>
  );
};

export const CreatePanel: FC = () => {
  const [picture, setPicture] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');

  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const handlePictureChange = (e: any) => {
    const selectedFile = e.target.files[0];
    if (selectedFile !== undefined) {
      setPicture(selectedFile);
      setTempImageUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };

  const handleHandleChange = (e: any) => {
    setHandle(e.target.value);
  };

  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };

  const { publicKey } = useWallet();
  const createMutation = useCreateMint({
    address: publicKey ? publicKey.toBase58() : null,
  });
  const [valid, setValid] = useState(false);
  useEffect(() => {
    setValid(!(!picture || !name || !handle));
  }, [picture, publicKey, name, handle]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      style={{ height: `${viewportHeight}px` }}
      className="flex flex-col gap-4 items-center justify-center"
    >
      <span className="text-3xl md:text-4xl text-center">
        Create an account to claim your first airdrop!
      </span>
      <span className="text-md md:text-base text-center px-4">
        Add a profile picture, display name and username. You can always edit it
        later.
      </span>
      <div className="px-4 pb-4 flex flex-col gap-4 items-start w-full md:border md:border-base-content rounded">
        <span className="hidden md:block pt-4">Create your account</span>
        <div className="flex flex-col md:flex-row w-full gap-4 items-center md:border-t md:border-base-content md:pt-4">
          <div className="flex w-40 h-40 items-center justify-center">
            <label
              htmlFor="dropzone-file"
              className={`cursor-pointer relative flex flex-col w-40 h-40 justify-center items-center`}
            >
              {tempImageUrl ? (
                <Image
                  className={`rounded-full object-cover cursor-pointer`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={tempImageUrl}
                  alt={''}
                />
              ) : (
                <div className="flex flex-col gap-2 w-full h-full border rounded-full items-center justify-center bg-base-100">
                  <IconPhotoPlus size={32} />
                  <span className="text-xs lg:text-base">Click to Upload</span>
                </div>
              )}
              <input
                id="dropzone-file"
                type="file"
                accept="image/*"
                className="hidden text-base"
                name="dropzone-file"
                onChange={handlePictureChange}
              />
            </label>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <input
              type="text"
              placeholder="Display Name"
              value={name}
              maxLength={20}
              className="input input-bordered w-full text-base rounded"
              onChange={handleNameChange}
            />
            <input
              type="text"
              placeholder="Username"
              maxLength={20}
              className="input input-bordered w-full text-base rounded"
              value={handle}
              onChange={handleHandleChange}
            />
          </div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <div className="label">
            <span className="label-text">Bio (Optional)</span>
          </div>
          <textarea
            maxLength={200}
            placeholder="Write a short introduction..."
            className="textarea textarea-bordered textarea-base text-base leading-normal h-24 w-full overflow-hidden"
            value={description}
            onChange={handleDescriptionChange}
          ></textarea>
        </div>
        {publicKey ? (
          <button
            disabled={!valid || createMutation.isPending}
            onClick={async () => {
              await createMutation.mutateAsync({
                name: name,
                symbol: handle,
                picture: picture!,
                description: description,
              });
            }}
            className="btn btn-primary w-full rounded"
          >
            {valid ? (
              createMutation.isPending ? (
                <div className="loading loading-spinner loading-sm" />
              ) : (
                'Create'
              )
            ) : picture ? (
              'Missing Fields!'
            ) : (
              'Missing Profile Picture!'
            )}
          </button>
        ) : (
          <div className="w-full">
            <AuthenticationBtn
              children={
                <div className="w-full rounded btn-primary btn">
                  Connect Wallet
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
