import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconGift,
  IconLogout,
  IconUpload,
  IconUser,
  IconUserCircle,
  IconUserPlus,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const { data, isLoading } = useGetToken({ address: publicKey });
  const { data: metaDataQuery } = useGetTokenDetails({
    mint: data ? data[0]?.mint : null,
  });
  const router = useRouter();
  return (
    <>
      {publicKey ? (
        !(data || isLoading) ? (
          <div
            onClick={() => router.push('/mint/create')}
            className="btn btn-sm btn-outline btn-primary"
          >
            Create Account
          </div>
        ) : (
          <ProfileButton metaDataQuery={metaDataQuery} />
        )
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
        className="relative w-10 h-10 justify-center items-center flex indicator"
      >
        {isClaimAvailable?.availability && (
          <span className="indicator-item indicator-start badge w-2 h-2 px-0 bg-red-600 border-none ml-2 mt-2"></span>
        )}
        {metaDataQuery && metaDataQuery.content?.links?.image ? (
          <Image
            src={metaDataQuery.content.links.image}
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
        {metaDataQuery && (
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
                  <span className="indicator-item indicator-start badge w-2 h-2 px-0 bg-red-600 border-none"></span>
                )}
                <IconGift />
              </div>
              Claim Daily Bonus
            </button>
          </li>
        )}
        <li className="w-full">
          <Link href={`/content/create`}>
            <IconUpload />
            Upload
          </Link>
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
