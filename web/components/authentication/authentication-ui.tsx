import { checkIfMetadataExist } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  IconLogout,
  IconSquarePlus,
  IconStar,
  IconUser,
  IconUserCircle,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, ReactNode } from 'react';
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
            <div className="btn btn-sm btn-outline bg-base-100 rounded-none">
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
  const { publicKey, disconnect } = useWallet();

  return (
    <div className="dropdown dropdown-end dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        id="user-menu-button"
        className="relative w-8 h-8 justify-center items-center flex"
      >
        {metaDataQuery && metaDataQuery.content?.links?.image ? (
          <Image
            src={metaDataQuery?.content?.links?.image}
            priority={true}
            className={`object-cover rounded-full`}
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
        className="dropdown-content menu border border-base-300 bg-base-100 rounded-box z-[1] shadow w-56"
      >
        <li className="text-left">
          <span className="block text-sm truncate w-48 ">
            {publicKey ? publicKey.toString() : ''}
          </span>
          <span className="block text-sm truncate ">{'mainnet-beta'}</span>
        </li>
        <li className="w-full">
          <Link href={`/post/create`}>
            <IconSquarePlus />
            Create Post
          </Link>
        </li>
        {publicKey && (
          <li className="w-full">
            <Link
              href={`/profile?mintId=${getDerivedMint(publicKey).toBase58()}`}
            >
              <IconUser />
              Profile
            </Link>
          </li>
        )}
        {checkIfMetadataExist(metaDataQuery) && (
          <li className="w-full">
            <Link href={`/mint/create`}>
              <IconStar />
              Become a Creator
            </Link>
          </li>
        )}
        <li className="w-full">
          <ThemeComponent />
        </li>
        <li className="w-full">
          <div
            onClick={async () => {
              await disconnect();
            }}
          >
            <IconLogout />
            Log Out
          </div>
        </li>
      </ul>
    </div>
  );
};
