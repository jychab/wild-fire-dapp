'use client';

import { proxify } from '@/utils/helper/endpoints';
import { checkIfMetadataIsTemporary } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  IconLogout,
  IconRocket,
  IconSquarePlus,
  IconStar,
  IconUser,
  IconUserCircle,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, ReactNode, useEffect, useState } from 'react';
import { UnifiedWalletButton } from 'unified-wallet-adapter-with-telegram';
import { DAS } from '../../utils/types/das';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { ThemeComponent } from '../ui/ui-component';

export const SignInBtn: FC = () => {
  const { publicKey } = useWallet();
  const { data: metaDataQuery } = useGetTokenDetails({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  return (
    <>
      {publicKey ? (
        <ProfileButton metaDataQuery={metaDataQuery} />
      ) : (
        <AuthenticationBtn
          children={
            <div className="btn btn-sm btn-outline bg-base-100">
              Connect Wallet
            </div>
          }
        />
      )}
    </>
  );
};

interface AuthenticationBtnProps {
  children?: ReactNode;
}

export const AuthenticationBtn: FC<AuthenticationBtnProps> = ({
  children: children,
}) => {
  return children ? (
    <UnifiedWalletButton overrideContent={children} />
  ) : (
    <UnifiedWalletButton />
  );
};

interface ProfileButtonProps {
  metaDataQuery: DAS.GetAssetResponse | null | undefined;
}

const ProfileButton: FC<ProfileButtonProps> = ({ metaDataQuery }) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  return (
    <>
      <button
        onClick={() => router.push(`/profile?address=${publicKey?.toBase58()}`)}
        className="flex sm:hidden relative w-10 h-10 mask mask-circle items-center justify-center"
      >
        {metaDataQuery && metaDataQuery.content?.links?.image ? (
          <Image
            src={proxify(metaDataQuery?.content?.links?.image, true)}
            className={`object-cover`}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={'profile pic'}
          />
        ) : (
          <IconUserCircle size={32} />
        )}
      </button>
      <div className="hidden sm:block dropdown dropdown-end dropdown-bottom">
        <div
          tabIndex={0}
          role="button"
          id="user-menu-button"
          className="relative w-10 h-10 mask mask-circle items-center justify-center flex"
        >
          {metaDataQuery && metaDataQuery.content?.links?.image ? (
            <Image
              src={proxify(metaDataQuery?.content?.links?.image, true)}
              className={`object-cover`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt={'profile pic'}
            />
          ) : (
            <IconUserCircle size={32} />
          )}
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu border border-base-300 bg-base-100 rounded-box z-[1] shadow w-48 md:w-60"
        >
          <AuthenticationDropdownMenu />
        </ul>
      </div>
    </>
  );
};
export const AuthenticationDropdownMenu: FC = () => {
  const { publicKey, disconnect } = useWallet();

  const [mounted, setMounted] = useState(false);
  const { data: metaDataQuery } = useGetTokenDetails({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return null; // Or a loading skeleton
  }
  return (
    <>
      {publicKey ? (
        <li className="text-left">
          <span className="block text-sm truncate max-w-[170px] md:max-w-[220px] ">
            {publicKey.toString()}
          </span>
        </li>
      ) : (
        <li className="w-full px-2">
          <AuthenticationBtn>
            <span className="text-base">Connect Wallet</span>
          </AuthenticationBtn>
        </li>
      )}
      <li className="w-full">
        <Link href={`/post/create`}>
          <IconSquarePlus />
          Create Post
        </Link>
      </li>
      {publicKey && (
        <li className="w-full">
          <Link href={`/profile?address=${publicKey.toBase58()}`}>
            <IconUser />
            Profile
          </Link>
        </li>
      )}
      {checkIfMetadataIsTemporary(metaDataQuery) ? (
        <li className="w-full">
          <Link href={`/mint/create`}>
            <IconStar />
            Launch Your Own Token
          </Link>
        </li>
      ) : (
        <>
          <li className="w-full">
            <Link
              href={`https://airship.blinksfeed.com`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconRocket />
              Airdrop Campaign
            </Link>
          </li>
        </>
      )}

      <li className="hidden w-full">
        <ThemeComponent />
      </li>

      {publicKey && (
        <li className="w-full">
          <div
            onClick={async () => {
              await disconnect();
            }}
          >
            <IconLogout />
            Disconnect
          </div>
        </li>
      )}
    </>
  );
};
