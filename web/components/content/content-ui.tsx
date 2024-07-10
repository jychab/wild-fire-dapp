import { convertUTCTimeToDayMonth } from '@/utils/helper/format';
import { PublicKey } from '@solana/web3.js';
import {
  IconDotsVertical,
  IconEdit,
  IconShieldCheckFilled,
  IconTrash,
} from '@tabler/icons-react';
import { default as Image } from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';
import { Blinks } from '../blinks/blinks-ui';
import { ContentType } from '../upload/upload-ui';
import { BlinkContent, PostContent } from '../upload/upload.data-access';
import { useRemoveContentMutation } from './content-data-access';

interface ContentGridProps {
  content: ContentWithMetada[] | undefined;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
}
export interface AdditionalMetadata {
  id: string;
  name: string;
  symbol: string;
  image: string;
  mint: PublicKey;
  updatedAt: number;
}

export type ContentWithMetada =
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
  return (
    <div
      className={`grid bg-base-300 sm:bg-transparent gap-4 grid-cols-1 ${
        multiGrid ? 'sm:grid-cols-3 lg:grid-cols-5' : ''
      }`}
    >
      {content &&
        content.map((x) => (
          <DisplayContent
            key={x.id}
            content={x}
            showMintDetails={showMintDetails}
            editable={editable}
            multiGrid={multiGrid}
          />
        ))}
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
  const [showMore, setShowMore] = useState(false);
  const removeContentMutation = useRemoveContentMutation({
    mint: editable ? content.mint : null,
  });
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2 bg-base-300 rounded w-full">
      {showMintDetails && (
        <div className="flex gap-2 px-4 pt-2 items-center w-full">
          <Link
            className="relative w-8 h-8 rounded-full"
            href={`/dashboard?mintId=${content.mint.toBase58()}`}
          >
            <Image
              src={content.image}
              priority={true}
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt={'mint'}
            />
          </Link>
          <div className="flex flex-col">
            <Link
              className="text-sm link link-hover"
              href={`/dashboard?mintId=${content.mint.toBase58()}`}
            >
              {content.name}
            </Link>
            <Link
              className="text-xs link link-hover"
              href={`/dashboard?mintId=${content.mint.toBase58()}`}
            >
              {content.symbol}
            </Link>
          </div>
        </div>
      )}
      <div className="flex flex-col w-full h-full cursor-default overflow-hidden shadow-action">
        <div className="carousel w-full bg-base-content">
          {content.carousel.map((file) => (
            <div
              id={file.uri}
              key={file.uri}
              className="carousel-item relative items-center flex aspect-square w-full"
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
        <div className={`px-4 pb-4 pt-2 flex flex-col w-full justify-between`}>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <div className="flex gap-2 text-sm items-end">
                <Link
                  href={`/dashboard?mintId=${content.mint.toBase58()}`}
                  className="link"
                >
                  {content.name}
                </Link>
                <IconShieldCheckFilled />
              </div>
              {editable && (
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button">
                    <IconDotsVertical size={18} />
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-300 rounded-box z-[1] p-0 text-sm w-32"
                  >
                    <li>
                      <Link
                        className="btn btn-sm btn-outline border-none gap-2 items-center justify-start"
                        href={`/content/edit?mintId=${content.mint.toBase58()}&id=${
                          content.id
                        }`}
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
                        className="btn btn-sm btn-outline border-none gap-2 items-center justify-start"
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
            <p
              className={`text-xs ${
                showMore ? 'whitespace-pre-wrap' : 'truncate'
              }`}
            >
              {content.caption}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {content.caption != '' && content.caption.length > 200 && (
              <span
                onClick={() => {
                  if (!multiGrid) {
                    setShowMore(!showMore);
                  } else {
                    router.push(
                      `/content?mintId=${content.mint.toBase58()}&id=${
                        content.id
                      }`
                    );
                  }
                }}
                className="text-xs stat-desc link link-hover"
              >
                {showMore ? 'Hide' : 'Show More'}
              </span>
            )}
            <span className="text-xs stat-desc">
              {convertUTCTimeToDayMonth(content.updatedAt)}
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
      <div className="flex flex-col gap-2 bg-base-300 rounded w-full">
        {showMintDetails && (
          <div className="flex gap-2 px-4 pt-2 items-center w-full">
            <Link
              className="relative w-8 h-8 rounded-full"
              href={`/dashboard?mintId=${content.mint.toBase58()}`}
            >
              <Image
                src={content.image}
                priority={true}
                className={`object-cover rounded-full`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={'mint'}
              />
            </Link>
            <div className="flex flex-col">
              <Link
                className="text-sm link link-hover"
                href={`/dashboard?mintId=${content.mint.toBase58()}`}
              >
                {content.name}
              </Link>
              <Link
                className="text-xs link link-hover"
                href={`/dashboard?mintId=${content.mint.toBase58()}`}
              >
                {content.symbol}
              </Link>
            </div>
          </div>
        )}
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
  content: ContentWithMetada;
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
