import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import { TokenMetadata } from '@solana/spl-token-metadata';
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
import {
  useGetMintMetadata,
  useGetToken,
} from '../dashboard/dashboard-data-access';
import { ThemeComponent } from '../ui/ui-component';

export const SignInBtn: FC = () => {
  const { publicKey } = useWallet();
  const { data } = useGetToken({ address: publicKey });
  const { data: metaDataQuery } = useGetMintMetadata({
    mint: data ? data[0]?.mint : undefined,
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
  metaDataQuery:
    | {
        metaData: TokenMetadata;
        image: any;
        description: any;
      }
    | null
    | undefined;
}

const ProfileButton: FC<ProfileButtonProps> = ({ metaDataQuery }) => {
  const { publicKey, disconnect } = useWallet();
  return (
    <button
      type="button"
      className="dropdown dropdown-end dropdown-bottom relative w-10 h-10"
      id="user-menu-button"
    >
      {metaDataQuery ? (
        <Image
          src={metaDataQuery.image}
          priority={true}
          className={`object-cover rounded-full`}
          fill={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt={'profile pic'}
        />
      ) : (
        <IconUserCircle size={32} />
      )}
      <div className="dropdown-content menu bg-base-300 rounded-box z-[1] shadow">
        <div tabIndex={0} className="p-4 text-left">
          <span className="block text-sm truncate w-40 cursor-default">
            {publicKey ? publicKey.toString() : ''}
          </span>
          <span className="block text-sm truncate cursor-default">
            {'mainnet-beta'}
          </span>
        </div>
        <ul tabIndex={0} className="flex flex-col">
          {metaDataQuery && (
            <li className="w-full">
              <Link
                href={`/dashboard?mintId=${metaDataQuery.metaData.mint.toBase58()}`}
              >
                <IconUser />
                Profile
              </Link>
            </li>
          )}
          <li className="w-full">
            <Link href={`/mint/create`}>
              <IconUserPlus />
              Create New Account
            </Link>
          </li>
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
    </button>
  );
};
