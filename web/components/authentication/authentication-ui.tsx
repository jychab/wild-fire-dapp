import { TokenMetadata } from '@solana/spl-token-metadata';
import { Wallet, useWallet } from '@solana/wallet-adapter-react';
import {
  IconArrowLeft,
  IconCurrencySolana,
  IconLogout,
  IconUpload,
  IconUser,
  IconUserCircle,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
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
        <div className="w-24">
          <AuthenticationBtn />
        </div>
      )}
    </>
  );
};

export const AuthenticationBtn: FC = () => {
  return (
    <>
      <button
        className="btn btn-accent w-full"
        onClick={() =>
          (
            document.getElementById('authentication_modal') as HTMLDialogElement
          ).showModal()
        }
      >
        Log In
      </button>
      <AuthenticationDialog />
    </>
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
            <Link href={`/create`}>
              <IconUserPlus />
              Create New Account
            </Link>
          </li>
          <li className="w-full">
            <Link href={`/upload`}>
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

const AuthenticationDialog: FC = ({}) => {
  const { select, wallets, connected, connecting } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<Wallet>();
  const [connectionStatus, setConectionStatus] = useState<string>();
  const [authenticateViaTipLink, setAuthenticateViaTipLink] = useState<
    boolean | undefined
  >();
  useEffect(() => {
    if (connecting) {
      setConectionStatus('Connecting');
    } else if (connected) {
      setConectionStatus('Connected');
      (
        document.getElementById('authentication_modal') as HTMLDialogElement
      ).close();
    } else {
      setConectionStatus(selectedWallet?.adapter.name);
    }
  }, [connecting, connected]);
  return (
    <dialog id="authentication_modal" className="modal">
      <div className="modal-box p-0 w-full max-w-md">
        <div className="flex flex-col gap-6 rounded-box bg-base-200 p-6 w-full">
          <div className="justify-between flex w-full">
            {authenticateViaTipLink != undefined ? (
              <button
                onClick={() => {
                  setAuthenticateViaTipLink(undefined);
                }}
              >
                <IconArrowLeft />
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={() => {
                (
                  document.getElementById(
                    'authentication_modal'
                  ) as HTMLDialogElement
                ).close();
              }}
            >
              <IconX />
            </button>
          </div>
          {authenticateViaTipLink == undefined && (
            <>
              <h1 className="text-3xl font-bold self-center">Log in</h1>
              <button
                type="button"
                onClick={() => setAuthenticateViaTipLink(false)}
                className="btn btn-primary transition-duration-150"
              >
                <div className="flex gap-2 items-center">
                  <IconCurrencySolana />
                  Connect With Wallet
                </div>
              </button>
              <div className="divider">OR</div>
              <button disabled={true} className="btn btn-primary">
                Sign In Google via TipLink
              </button>
            </>
          )}
          {authenticateViaTipLink == false && (
            <>
              <h1 className="text-3xl font-bold self-center">
                Select a Wallet
              </h1>
              <div className="flex flex-col gap-4">
                {wallets.filter((wallet) => wallet.readyState === 'Installed')
                  .length > 0 ? (
                  wallets
                    .filter((wallet) => wallet.readyState === 'Installed')
                    .map((wallet) => (
                      <button
                        className="btn btn-primary"
                        key={wallet.adapter.name}
                        onClick={() => {
                          setSelectedWallet(wallet);
                          select(wallet.adapter.name);
                        }}
                      >
                        <Image
                          width={30}
                          height={30}
                          src={wallet.adapter.icon}
                          alt={wallet.adapter.name}
                        />
                        {selectedWallet && wallet === selectedWallet
                          ? connectionStatus
                          : wallet.adapter.name}
                      </button>
                    ))
                ) : (
                  <p className="text-center flex flex-col gap-2">
                    <span>No wallet found.</span>
                    <span>Please download a supported Solana wallet</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
};
