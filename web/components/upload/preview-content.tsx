'use client';

import { ActionTypeEnum } from '@/utils/enums/post';
import { generatePostEndPoint, proxify } from '@/utils/helper/endpoints';
import { PostBlinksDetail, PostContent } from '@/utils/types/post';
import { unfurlUrlToActionApiUrl } from '@dialectlabs/blinks';
import { ActionGetResponse } from '@solana/actions-spec';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconX } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { BaseBlinkLayout } from '../blinks/base-blink-layout';
import { useLayoutPropNormalizer } from '../blinks/normalizeProps';
import { UserProfile } from '../content/content-ui';
import { CreateAccountBtn } from '../create/create-ui';
import { UploadContentBtn } from './upload-content';
import { showModalById, TempPostCampaign, UploadFileTypes } from './upload-ui';
import { useUploadMutation } from './upload.data-access';

export const PreviewContentBtn: FC<{
  tempCampaign: Partial<TempPostCampaign> | undefined;
  useExistingBlink: boolean;
  id?: string;
  mint: PublicKey | null;
  files: UploadFileTypes[];
  title: string;
  description: string;
  action: ActionTypeEnum;
  tags: string;
}> = ({
  mint,
  files,
  id,
  title,
  description,
  tempCampaign,
  action,
  useExistingBlink,
  tags,
}) => {
  const { publicKey } = useWallet();
  const uploadMutation = useUploadMutation({ mint });
  const [postContent, setPostContent] = useState<Partial<PostContent>>();
  const [loading, setLoading] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePreview = useCallback(async () => {
    if (!files || !mint || !tempCampaign?.postId) return;
    try {
      setLoading(true);
      const postId = tempCampaign.postId;
      let postContent;
      if (useExistingBlink) {
        let mediaUrl = files.find((x) => x.id == 'blinks')?.uri;
        if (!mediaUrl) {
          toast.error('No Blinks Url Found');
          return;
        }
        let apiUrl = await unfurlUrlToActionApiUrl(mediaUrl);

        if (!apiUrl) {
          apiUrl = mediaUrl;
        }

        const response = (await (
          await fetch(proxify(apiUrl))
        ).json()) as ActionGetResponse;
        postContent = {
          ...response,
          creator: publicKey?.toBase58(),
          url: generatePostEndPoint(mint.toBase58(), postId, apiUrl),
          mint: mint.toBase58(),
          id: postId,
        };
      } else if (publicKey) {
        if (action == ActionTypeEnum.REWARD) {
          if (!tempCampaign || !tempCampaign.budget) {
            toast.error('No Budget Found');
            return;
          }
        }
        const carousel = files
          .filter(
            (x) =>
              x.id !== 'blinks' &&
              (x.fileType.startsWith('image/') ||
                x.fileType.startsWith('video/'))
          )
          .map((x) => {
            if (x.fileType.startsWith('image/')) {
              return { uri: x.uri, fileType: x.fileType };
            } else {
              return {
                uri: x.uri,
                fileType: x.fileType,
                duration: x.duration,
              };
            }
          });
        if (carousel.length > 0) {
          const iconUrl = carousel[0]!.fileType.startsWith('video/')
            ? files.find((x) => x.fileType === carousel[0]!.fileType)
                ?.thumbnail!
            : carousel[0]!.uri;
          postContent = {
            creator: publicKey?.toBase58(),
            icon: iconUrl,
            title,
            description,
            label: '', // default
            url: generatePostEndPoint(mint.toBase58(), postId),
            mint: mint.toBase58(),
            id: postId,
            carousel,
            links: tempCampaign.links?.actions.filter(
              (x) => x.actionTypeEnum == action
            )
              ? {
                  actions: tempCampaign.links?.actions.filter(
                    (x) => x.actionTypeEnum == action
                  ),
                }
              : undefined,
          };
        }
      }
      return postContent;
    } catch (error) {
      console.error('Error previewing post:', error);
    } finally {
      setLoading(false);
    }
  }, [files, mint, id, title, description, uploadMutation]);

  if (!mounted) {
    return null; // Or a loading skeleton
  }

  if (!publicKey) {
    return (
      <div className="w-full">
        <AuthenticationBtn>
          <div className="btn w-full btn-primary rounded">Connect Wallet</div>
        </AuthenticationBtn>
      </div>
    );
  }

  if (!mint) {
    return <CreateAccountBtn />;
  }

  return (
    <>
      <button
        disabled={!files.length || !files[0].uri.length || loading}
        onClick={async () => {
          const postContent = await handlePreview();
          if (postContent) {
            setPostContent(postContent);
            showModalById('preview_modal');
          }
        }}
        className="btn btn-primary w-full"
      >
        {loading ? (
          <div className="loading loading-spinner loading-sm" />
        ) : (
          'Preview'
        )}
      </button>
      <PreviewBlinksActionButton
        tags={tags}
        post={postContent}
        useExistingBlink={useExistingBlink}
        tempCampaign={tempCampaign}
        mint={mint}
        files={files}
        title={title}
        description={description}
        action={action}
        isLoading={loading}
      />
    </>
  );
};

export const PreviewBlinksActionButton: FC<{
  post: Partial<PostContent> | undefined;
  isLoading: boolean;
  useExistingBlink: boolean;
  tempCampaign: Partial<TempPostCampaign> | undefined;
  id?: string;
  mint: PublicKey | null;
  files: UploadFileTypes[];
  title: string;
  description: string;
  tags: string;
  action: ActionTypeEnum;
}> = ({
  post,
  tempCampaign,
  useExistingBlink,
  id,
  mint,
  files,
  title,
  description,
  action,
  isLoading,
  tags,
}) => {
  return (
    <dialog id="preview_modal" className="modal ">
      <div className="modal-box flex flex-col gap-4 p-4 scrollbar-none">
        <div className="flex items-center justify-between">
          <span className="font-bold sm:text-lg">Preview</span>
          <form method="dialog">
            <button className="flex items-center justify-center">
              <IconX />
            </button>
          </form>
        </div>
        <div className="grow h-full">
          <PreviewContent post={post} />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <form method="dialog">
            <button className="btn btn-outline btn-primary">Close</button>
          </form>
          <UploadContentBtn
            tags={tags}
            tempCampaign={tempCampaign}
            useExistingBlink={useExistingBlink}
            mint={mint}
            files={files}
            title={title}
            description={description}
            action={action}
            id={id}
          />
        </div>
      </div>
    </dialog>
  );
};

const PreviewContent: FC<{
  post: Partial<PostContent> | undefined;
}> = ({ post }) => {
  const normalizedProps = useLayoutPropNormalizer({ post });
  return (
    !!post && (
      <div
        className={`"flex flex-col w-full animate-fade-up animate-once animate-duration-300 border bg-base-100 border-2 border-base-300 shadow-md rounded-2xl`}
      >
        <UserProfile
          blinksDetail={post as PostBlinksDetail}
          trade={false}
          setTrade={() => {}}
        />
        <BaseBlinkLayout stylePreset="custom" {...normalizedProps} />
      </div>
    )
  );
};
