import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  IconLogout,
  IconUpload,
  IconUser,
  IconUserCircle,
  IconUserPlus,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, ReactNode } from 'react';
import { DAS } from '../../utils/types/das';
import {
  useGetToken,
  useGetTokenDetails,
} from '../dashboard/dashboard-data-access';
import { ThemeComponent } from '../ui/ui-component';

export const SignInBtn: FC = () => {
  const { publicKey } = useWallet();
  const { data } = useGetToken({ address: publicKey });
  const { data: metaDataQuery } = useGetTokenDetails({
    mint: data ? data[0]?.mint : null,
  });

  return (
    <>
      {publicKey ? (
        <ProfileButton metaDataQuery={metaDataQuery} />
      ) : (
        <AuthenticationBtn />
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
        className="relative w-10 h-10 justify-center items-center flex"
      >
        {metaDataQuery && metaDataQuery.additionalInfoData ? (
          <Image
            src={metaDataQuery.additionalInfoData?.imageUrl}
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
        className="dropdown-content menu bg-base-300 rounded-box z-[1] shadow"
      >
        <li className="text-left">
          <span className="block text-sm truncate w-44 ">
            {publicKey ? publicKey.toString() : ''}
          </span>
          <span className="block text-sm truncate ">{'mainnet-beta'}</span>
        </li>
        {metaDataQuery && (
          <li className="w-full">
            <Link href={`/dashboard?mintId=${metaDataQuery.id}`}>
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
