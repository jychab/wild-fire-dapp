'use client';

import { proxify } from '@/utils/helper/endpoints';
import { formatLargeNumber } from '@/utils/helper/format';
import { getDerivedMint, isAuthorized } from '@/utils/helper/mint';
import { placeholderImage } from '@/utils/helper/placeholder';
import { PostBlinksDetail } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconDotsVertical,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { default as Image } from 'next/image';
import Link from 'next/link';
import { Dispatch, FC, SetStateAction } from 'react';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetMintSummaryDetails,
  useGetTokenDetails,
} from '../profile/profile-data-access';
import { useGetPostCampaign } from '../upload/upload.data-access';
import { useRemoveContentMutation } from './content-data-access';

export const UserProfile: FC<{
  blinksDetail: PostBlinksDetail;
  trade: boolean;
  setTrade: Dispatch<SetStateAction<boolean>>;
  editable?: boolean;
}> = ({ blinksDetail, trade, setTrade, editable = false }) => {
  const { publicKey } = useWallet();
  const { data: metadata } = useGetTokenDetails({
    mint: blinksDetail.creator
      ? getDerivedMint(new PublicKey(blinksDetail.creator))
      : null,
  });
  const removeContentMutation = useRemoveContentMutation({
    mint:
      editable && blinksDetail?.mint ? new PublicKey(blinksDetail.mint) : null,
    postId: blinksDetail?.id || null,
  });
  const { data: tokenState } = useGetMintToken({
    mint: blinksDetail ? new PublicKey(blinksDetail.mint) : null,
  });
  const { data: postCampaign } = useGetPostCampaign({
    address: publicKey,
    postId: blinksDetail?.id || null,
  });
  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: blinksDetail.creator
      ? getDerivedMint(new PublicKey(blinksDetail.creator))
      : null,
  });
  return (
    <div className="flex w-full items-center justify-between px-5 pt-5">
      <Link
        href={`/profile?address=${blinksDetail.creator}`}
        className="link link-hover flex items-center gap-2 "
      >
        <div className="relative w-8 h-8 mask mask-circle">
          <Image
            src={proxify(
              metadata?.content?.links?.image || placeholderImage,
              true
            )}
            className={`object-cover`}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={'mint'}
          />
        </div>
        <div className="flex flex-col">
          <span className="truncate text-sm w-full max-w-[150px]">
            {metadata?.content?.metadata.name || blinksDetail.creator}
          </span>
          {mintSummaryDetails?.currentHoldersCount && (
            <span className="stat-desc">
              {`${formatLargeNumber(
                mintSummaryDetails?.currentHoldersCount
              )} Subscribers`}
            </span>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setTrade((prev) => !prev);
          }}
          className="btn text-success gap-0 btn-sm px-2"
        >
          <span className="text-xs">{!trade ? 'Live Trade' : 'Back'}</span>
          {!trade ? <IconArrowUpRight /> : <IconArrowDownLeft />}
        </button>
        {editable &&
          publicKey &&
          (blinksDetail.creator == publicKey?.toBase58() ||
            isAuthorized(tokenState, publicKey, metadata)) && (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="">
                {removeContentMutation.isPending ? (
                  <div className="loading loading-spinner" />
                ) : (
                  <IconDotsVertical />
                )}
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1]  p-2 shadow"
              >
                <li>
                  <Link
                    href={`/post/edit?mint=${blinksDetail.mint}&id=${blinksDetail.id}`}
                  >
                    <IconEdit />
                    Edit
                  </Link>
                </li>
                <li>
                  <button
                    disabled={removeContentMutation.isPending}
                    onClick={() =>
                      removeContentMutation.mutateAsync(postCampaign)
                    }
                  >
                    {removeContentMutation.isPending ? (
                      <div className="loading loading-spinner" />
                    ) : (
                      <>
                        <IconTrash />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </li>
              </ul>
            </div>
          )}
      </div>
    </div>
  );
};
