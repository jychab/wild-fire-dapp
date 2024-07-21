import { useWallet } from '@solana/wallet-adapter-react';
import { IconGift } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGetToken } from '../profile/profile-data-access';
import {
  useClaimDailyMutation,
  useGetDailyClaimAvailable,
} from './notification-data-access';

const NotificationFeature = () => {
  const { publicKey } = useWallet();
  const { data: tokenData } = useGetToken({ address: publicKey });
  const router = useRouter();
  const dailyClaimMutation = useClaimDailyMutation({
    mint: tokenData ? tokenData[0].mint : null,
  });
  const { data: claimData, isFetching } = useGetDailyClaimAvailable({
    mint: tokenData ? tokenData[0].mint : null,
  });

  const [timeLeft, setTimeLeft] = useState(
    claimData && claimData.lastClaimTimestamp
      ? calculateTimeLeft(
          Date.now() / 1000,
          claimData.lastClaimTimestamp + 24 * 60 * 60
        )
      : null
  );

  useEffect(() => {
    if (claimData && claimData.lastClaimTimestamp) {
      const interval = setInterval(() => {
        setTimeLeft(
          calculateTimeLeft(
            Date.now() / 1000,
            claimData.lastClaimTimestamp + 24 * 60 * 60
          )
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [claimData?.lastClaimTimestamp, isFetching]);

  function calculateTimeLeft(start: number, end: number) {
    const totalSeconds = Math.max(end - start, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return { hours, minutes, seconds, totalSeconds: end - start };
  }

  const isClaimAvailable =
    tokenData &&
    claimData?.availability &&
    timeLeft &&
    timeLeft.totalSeconds <= 0;

  return (
    <>
      <dialog id="notification" className="modal">
        <div className="modal-box max-w-md">
          <h3 className="font-semibold text-center text-lg">
            {!tokenData
              ? 'Create an account to claim your first airdrop!'
              : isClaimAvailable
              ? 'Claim your daily airdrop!'
              : 'Next claim available in:'}
          </h3>
          <div className="flex flex-col gap-1 p-4 w-full justify-center items-center">
            <IconGift size={80} />
            {timeLeft && timeLeft.totalSeconds > 0 && (
              <>
                <span className="countdown font-mono text-base">
                  <span style={{ '--value': timeLeft.hours } as any} />
                  h:
                  <span style={{ '--value': timeLeft.minutes } as any} />
                  m:
                  <span style={{ '--value': timeLeft.seconds } as any} />s
                </span>
              </>
            )}
          </div>
          <div className="modal-action">
            {!tokenData ? (
              <button
                disabled={dailyClaimMutation.isPending}
                onClick={() => {
                  router.push('/mint/create');
                  (
                    document.getElementById('notification') as HTMLDialogElement
                  ).close();
                }}
                className="btn btn-primary btn-outline btn-sm"
              >
                Create Account
              </button>
            ) : (
              timeLeft &&
              timeLeft.totalSeconds <= 0 && (
                <button
                  disabled={dailyClaimMutation.isPending}
                  onClick={() => dailyClaimMutation.mutateAsync()}
                  className="btn btn-primary btn-outline btn-sm"
                >
                  {dailyClaimMutation.isPending ? (
                    <div className="loading loading-spinner" />
                  ) : (
                    'Claim Airdrop'
                  )}
                </button>
              )
            )}
            <form method="dialog">
              <button
                disabled={dailyClaimMutation.isPending}
                onClick={() =>
                  (
                    document.getElementById('notification') as HTMLDialogElement
                  ).close()
                }
                className="btn btn-sm btn-outline"
              >
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default NotificationFeature;
