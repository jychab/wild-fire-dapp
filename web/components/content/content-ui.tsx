import { createOrEditComment, sendLike } from '@/utils/firebase/functions';
import { convertUTCTimeToDayMonth } from '@/utils/helper/format';
import { NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  IconDiscountCheckFilled,
  IconDotsVertical,
  IconEdit,
  IconHeart,
  IconHeartFilled,
  IconSend,
  IconTrash,
} from '@tabler/icons-react';
import { default as Image } from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';
import toast from 'react-hot-toast';
import { Blinks } from '../blinks/blinks-ui';
import {
  useGetToken,
  useGetTokenDetails,
} from '../profile/profile-data-access';
import { ContentType } from '../upload/upload-ui';
import { BlinkContent, PostContent } from '../upload/upload.data-access';
import { useRemoveContentMutation } from './content-data-access';

interface ContentGridProps {
  content: ContentWithMetadata[] | undefined;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
}
export interface AdditionalMetadata {
  id: string;
  name: string;
  symbol: string;
  image: string;
  mint: string;
  likesCount?: number;
  likesUser?: string[];
  commentsCount?: number;
  updatedAt?: number;
  price?: number;
  quantity?: number;
  last24hrPercentChange?: number;
  verified?: boolean;
}

export type ContentWithMetadata =
  | BlinkContentWithMetadata
  | PostContentWithMetadata;

interface BlinkContentWithMetadata extends AdditionalMetadata, BlinkContent {}

interface PostContentWithMetadata extends AdditionalMetadata, PostContent {}

export const ContentGrid: FC<ContentGridProps> = ({
  content,
  showMintDetails = true,
  editable = false,
  multiGrid = false,
}) => {
  return content ? (
    <div
      className={`grid grid-cols-1 sm:gap-2 ${
        multiGrid ? 'sm:grid-cols-3 lg:grid-cols-5' : ''
      }`}
    >
      {content.map((x) => (
        <DisplayContent
          key={x.id}
          content={x}
          showMintDetails={showMintDetails}
          editable={editable}
          multiGrid={multiGrid}
        />
      ))}
    </div>
  ) : (
    <div className=" w-full flex justify-center items-center h-64">
      <div className="loading loading-dots loading-md" />
    </div>
  );
};

export const PostCard = ({
  content,
  showMintDetails = true,
  editable = false,
  multiGrid = false,
}: {
  content: PostContentWithMetadata;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
}) => {
  const { publicKey } = useWallet();
  const { data } = useGetToken({ address: publicKey });
  const [showMore, setShowMore] = useState(false);
  const removeContentMutation = useRemoveContentMutation({
    mint: editable ? new PublicKey(content.mint) : null,
  });
  const [comment, setComment] = useState('');
  const router = useRouter();
  return (
    <div className="flex flex-col sm:border bg-base-100 rounded w-full">
      {showMintDetails && <UserProfile content={content} />}
      <div className="flex flex-col w-full h-full cursor-default overflow-hidden shadow-action">
        <div className="carousel w-full aspect-square h-auto bg-base-content">
          {content.carousel.map((file) => (
            <div
              id={file.uri}
              key={file.uri}
              className="carousel-item relative items-center h-auto flex aspect-square w-full"
            >
              {file.fileType.startsWith('image/') && (
                <Image
                  className={`rounded object-contain`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={file.uri}
                  alt={''}
                />
              )}
              {file.fileType.startsWith('video/') && (
                <video
                  width="300"
                  height="300"
                  className="w-full h-full rounded"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                >
                  <source src={file.uri} type={file.fileType} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ))}
        </div>
        <div
          className={`px-4 pb-4 pt-2 flex flex-col flex-1 w-full justify-between`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 text-sm items-end">
                <Link
                  href={`/profile?mintId=${content.mint}&tab=trade`}
                  className="link link-hover font-semibold"
                >
                  {content.name}
                </Link>
                {!multiGrid && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => {
                        if (!data) {
                          toast.error('You need to create an account first!');
                        }
                        if (data) {
                          try {
                            await sendLike(
                              data[0].mint.toBase58(),
                              content.mint,
                              content.id,
                              10
                            );
                          } catch (e) {
                            console.log(e);
                          }
                        }
                      }}
                    >
                      {content.likesUser &&
                      publicKey &&
                      content.likesUser.includes(publicKey.toBase58()) ? (
                        <IconHeartFilled size={20} className="fill-primary" />
                      ) : (
                        <IconHeart size={20} />
                      )}
                    </button>
                    {content.likesCount && (
                      <span className="text-xs stat-desc link link-hover">{`Liked by ${
                        publicKey &&
                        content?.likesUser?.includes(publicKey.toBase58())
                          ? `you${
                              content.likesCount > 1
                                ? ' and ' + content.likesCount + ' users'
                                : ''
                            }`
                          : content.likesCount + ' users'
                      } `}</span>
                    )}
                  </div>
                )}
              </div>
              {editable && (
                <div className="dropdown dropdown-left ">
                  <div tabIndex={0} role="button">
                    {removeContentMutation.isPending ? (
                      <div className="loading loading-spinner loading-sm" />
                    ) : (
                      <IconDotsVertical size={18} />
                    )}
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 border border-base-300 rounded z-[1] p-0 text-sm w-36"
                  >
                    <li>
                      <Link
                        className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                        href={`/content/edit?mintId=${content.mint}&id=${content.id}`}
                      >
                        <IconEdit size={18} />
                        Edit Post
                      </Link>
                    </li>
                    <li>
                      <button
                        disabled={removeContentMutation.isPending}
                        onClick={() =>
                          removeContentMutation.mutateAsync(content.id)
                        }
                        className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                      >
                        {removeContentMutation.isPending ? (
                          <div className="loading loading-spinner loading-sm" />
                        ) : (
                          <IconTrash size={18} />
                        )}
                        Delete Post
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <p
                className={`text-xs ${
                  showMore ? 'whitespace-pre-wrap' : 'truncate'
                }`}
              >
                {content.caption}
              </p>
              {content.caption != '' &&
                (content.caption.length > 10 ||
                  content.caption.includes('\n')) && (
                  <button
                    onClick={() => {
                      if (!multiGrid) {
                        setShowMore(true);
                      } else {
                        router.push(
                          `/content?mintId=${content.mint}&id=${content.id}`
                        );
                      }
                    }}
                    className="text-xs stat-desc link link-hover w-fit"
                  >
                    {!showMore && 'Show More'}
                  </button>
                )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 pt-2">
            {content.commentsCount && (
              <button
                onClick={() => {
                  if (multiGrid) {
                    router.push(
                      `/content?mintId=${content.mint}&id=${content.id}`
                    );
                  }
                }}
                className="stat-desc link link-hover"
              >{`View ${content.commentsCount} comments`}</button>
            )}
            {!multiGrid && (
              <label className="input rounded-full flex w-full input-xs items-center group p-0 focus-within:p-4">
                <input
                  placeholder="Add a comment"
                  type="text"
                  className="w-full text-xs"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  onClick={async () => {
                    if (content) {
                      await createOrEditComment(
                        content?.mint,
                        content?.id,
                        crypto.randomUUID(),
                        comment,
                        []
                      );
                    }
                    setComment('');
                  }}
                  className="hidden group-focus-within:inline-flex btn btn-xs btn-ghost "
                >
                  <IconSend />
                </button>
              </label>
            )}

            <span className="text-xs stat-desc">
              {convertUTCTimeToDayMonth(content.updatedAt || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BlinksCard: FC<{
  content: BlinkContentWithMetadata;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
}> = ({ multiGrid, content, showMintDetails = true, editable = false }) => {
  try {
    const url = new URL(content.uri as string);
    return (
      <div className="flex flex-col sm:border rounded w-full">
        {showMintDetails && <UserProfile content={content} />}
        <Blinks
          multiGrid={multiGrid}
          actionUrl={url}
          additionalMetadata={content}
          editable={editable}
        />
      </div>
    );
  } catch (e) {
    console.error(e);
    return;
  }
};

interface DisplayContentProps {
  content: ContentWithMetadata;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
}

export const DisplayContent: FC<DisplayContentProps> = ({
  content,
  showMintDetails,
  editable,
  multiGrid,
}) => {
  return (
    <>
      {content.type == ContentType.BLINKS && (
        <BlinksCard
          key={content.id}
          content={content as BlinkContentWithMetadata}
          showMintDetails={showMintDetails}
          editable={editable}
          multiGrid={multiGrid}
        />
      )}
      {content.type == ContentType.POST && (
        <PostCard
          key={content.id}
          content={content as PostContentWithMetadata}
          showMintDetails={showMintDetails}
          editable={editable}
          multiGrid={multiGrid}
        />
      )}
    </>
  );
};

export const UserProfile: FC<{
  content: PostContentWithMetadata | BlinkContentWithMetadata;
}> = ({ content }) => {
  const { data: solDetails } = useGetTokenDetails({
    mint: NATIVE_MINT,
    withContent: false,
  });
  return (
    <div className="flex w-full items-center justify-between px-4 py-2 ">
      <Link
        href={`/profile?mintId=${content.mint}`}
        className="link link-hover flex items-center gap-2 "
      >
        <div className="relative w-8 h-8 rounded-full">
          <Image
            src={content.image}
            priority={true}
            className={`object-cover rounded-full`}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={'mint'}
          />
        </div>
        <div className="flex flex-col">
          <div className="text-sm flex gap-1 items-center">
            {content.name}
            <IconDiscountCheckFilled size={18} className="fill-secondary" />
          </div>
          <div className="text-xs">{content.symbol}</div>
        </div>
      </Link>
      {content.price && solDetails?.token_info?.price_info?.price_per_token && (
        <Link
          className="flex flex-col gap-1 items-end"
          href={`/profile?mintId=${content.mint}&tab=trade`}
        >
          <span className="text-sm">
            $
            {(
              (content.price *
                solDetails?.token_info?.price_info?.price_per_token) /
              LAMPORTS_PER_SOL
            ).toPrecision(3)}
          </span>
          <span className="text-xs text-success">
            {content.last24hrPercentChange && content.last24hrPercentChange < 0
              ? `-${content.last24hrPercentChange}%`
              : `+${content.last24hrPercentChange}%`}
          </span>
        </Link>
      )}
    </div>
  );
};
