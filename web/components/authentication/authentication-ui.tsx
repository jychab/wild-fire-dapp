import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconGift,
  IconLogout,
  IconSquarePlus,
  IconUser,
  IconUserCircle,
  IconUserPlus,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, ReactNode } from 'react';
import { DAS } from '../../utils/types/das';
import { useGetDailyClaimAvailable } from '../notification/notification-data-access';
import {
  useGetToken,
  useGetTokenDetails,
} from '../profile/profile-data-access';
import { ThemeComponent } from '../ui/ui-component';

export const SignInBtn: FC = () => {
  const { publicKey } = useWallet();
  const { data } = useGetToken({ address: publicKey });
  const { data: metaDataQuery } = useGetTokenDetails({
    mint: data ? new PublicKey(data?.mint) : null,
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
  const { data: isClaimAvailable } = useGetDailyClaimAvailable({
    mint: metaDataQuery ? new PublicKey(metaDataQuery.id) : null,
  });

  return (
    <div className="dropdown dropdown-end dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        id="user-menu-button"
        className="relative w-8 h-8 justify-center items-center flex indicator"
      >
        {metaDataQuery && metaDataQuery.content?.links?.image ? (
          <Image
            src={metaDataQuery?.content?.links?.image!}
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
        className="dropdown-content menu border border-base-300 bg-base-100 rounded-box z-[1] shadow"
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
        {metaDataQuery && (
          <li className="w-full">
            <Link href={`/profile?mintId=${metaDataQuery.id}`}>
              <IconUser />
              Profile
            </Link>
          </li>
        )}
        {!metaDataQuery && (
          <li className="w-full">
            <Link href={`/mint/create`}>
              <IconUserPlus />
              Create New Account
            </Link>
          </li>
        )}
        <li className="w-full ">
          <button
            onClick={() =>
              (
                document.getElementById('notification') as HTMLDialogElement
              ).showModal()
            }
          >
            <div className="indicator">
              {isClaimAvailable?.availability && (
                <span className="indicator-item indicator-start badge w-2 h-2 px-0 bg-red-400 border-none"></span>
              )}
              <IconGift />
            </div>
            Claim Daily Bonus
          </button>
        </li>

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
