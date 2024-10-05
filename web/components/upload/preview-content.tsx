'use client';

import { ActionTypeEnum } from '@/utils/enums/post';
import { unfurlUrlToActionApiUrl } from '@/utils/helper/blinks';
import { generatePostEndPoint, proxify } from '@/utils/helper/endpoints';
import { getAsset, getDerivedMint } from '@/utils/helper/mint';
import {
  SOFT_LIMIT_BUTTONS,
  SOFT_LIMIT_FORM_INPUTS,
  SOFT_LIMIT_INPUTS,
} from '@/utils/types/blinks';
import { DAS } from '@/utils/types/das';
import { PostContent } from '@/utils/types/post';
import { ActionGetResponse } from '@solana/actions-spec';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconX } from '@tabler/icons-react';
import Image from 'next/image';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AbstractActionComponent } from '../actions/abstract-action-component';
import { componentFactory } from '../actions/action';
import { ButtonActionComponent } from '../actions/button-action-component';
import { FormActionComponent } from '../actions/form-action-component';
import { isParameterSelectable, isPatternAllowed } from '../actions/guards';
import { MultiValueActionComponent } from '../actions/multivalue-action-coponent';
import { SingleValueActionComponent } from '../actions/single-action-value-component';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { ActionLayout } from '../blinks/blinks-layout';
import { BaseButtonProps } from '../blinks/ui/action-button';
import { CreateAccountBtn } from '../create/create-ui';
import { SearchBar } from '../search/search-ui';
import {
  useGetMintSummaryDetails,
  useGetTokenDetails,
} from '../token/token-data-access';
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
        const apiUrl = await unfurlUrlToActionApiUrl(mediaUrl);
        if (!apiUrl) {
          toast.error('Unable to unfurl to action api url');
          return;
        }
        const response = (await (
          await fetch(proxify(apiUrl))
        ).json()) as ActionGetResponse;
        postContent = {
          ...response,
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
            icon: iconUrl,
            title,
            description,
            label: 'Subscribe', // default
            url: generatePostEndPoint(mint.toBase58(), postId),
            mint: mint.toBase58(),
            id: postId,
            carousel,
            links: tempCampaign.links?.actions.filter((x) => x.type == action)
              ? {
                  actions: tempCampaign.links?.actions.filter(
                    (x) => x.type == action
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
  const [collection, setCollection] = useState<string>();
  const [recommendations, setRecommendations] = useState<
    DAS.GetAssetResponse[]
  >([]);
  const { publicKey } = useWallet();
  const { data: metadata } = useGetTokenDetails({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  useEffect(() => {
    if (metadata) {
      setRecommendations((prev) => [...prev, metadata]);
    }
  }, [metadata]);

  const reset = () => {
    setCollection(undefined);
    setRecommendations([]);
  };

  return (
    <dialog id="preview_modal" className="modal ">
      <div className="modal-box flex flex-col gap-4 border p-4">
        <div className="flex items-center justify-between">
          <span className="font-bold sm:text-lg">
            {collection != undefined
              ? 'Select a token to associate with your post'
              : 'Preview'}
          </span>
          <form method="dialog">
            <button
              className="flex items-center justify-center"
              onClick={() => reset()}
            >
              <IconX />
            </button>
          </form>
        </div>
        {collection == undefined ? (
          <PreviewContent
            post={post}
            isLoading={isLoading}
            useExistingBlink={useExistingBlink}
          />
        ) : (
          <div className="flex flex-col gap-4 p-2">
            <SearchBar
              creatorsOnly={true}
              onClick={async (x) => {
                if (!recommendations.find((x) => x.id === x.id)) {
                  const selectedMetadata = await getAsset(new PublicKey(x.id));
                  setRecommendations((previous) => [
                    ...previous,
                    selectedMetadata,
                  ]);
                  setCollection(x.id);
                }
              }}
            />
            <span className="stat-desc px-2">Recommended</span>
            {recommendations.map((x) => (
              <TokenButton key={x.id} x={x} collection={collection} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 justify-end">
          <form method="dialog">
            <button
              onClick={() => reset()}
              className="btn btn-outline btn-primary"
            >
              Close
            </button>
          </form>
          {collection == undefined ? (
            <button
              onClick={() => setCollection(metadata?.id || '')}
              className="btn btn-primary"
            >
              Next
            </button>
          ) : (
            <UploadContentBtn
              tags={tags}
              tempCampaign={tempCampaign}
              useExistingBlink={useExistingBlink}
              mint={collection ? new PublicKey(collection) : null}
              files={files}
              title={title}
              description={description}
              action={action}
              id={id}
            />
          )}
        </div>
      </div>
    </dialog>
  );
};

const TokenButton: FC<{ x: DAS.GetAssetResponse; collection: string }> = ({
  x,
  collection,
}) => {
  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: new PublicKey(x.id),
  });
  return (
    <button
      className={`flex gap-4 w-full items-center border p-2 rounded-box border-base-300 ${
        collection == x.id ? 'border-base-content' : ''
      }`}
    >
      <div className="w-8 h-8 relative mask mask-circle">
        {x.content?.links?.image && (
          <Image
            className={`object-cover`}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt=""
            src={proxify(x.content?.links?.image, true)}
          />
        )}
      </div>
      <div className="flex flex-col gap-1 items-start">
        <span className="text-sm font-bold">{x?.content?.metadata.name}</span>
        <span className="stat-desc">
          {`${mintSummaryDetails?.currentHoldersCount} Subscribers`}
        </span>
      </div>
    </button>
  );
};

const PreviewContent: FC<{
  post: Partial<PostContent> | undefined;
  isLoading: boolean;
  useExistingBlink: boolean;
}> = ({ post, isLoading, useExistingBlink }) => {
  const [buttons, inputs, form] = useMemo(() => {
    const actionComponent = post?.links?.actions?.map((x) =>
      componentFactory(null, x.label, x.href, x.parameters)
    );
    const buttons = actionComponent
      ?.filter((it) => it instanceof ButtonActionComponent)
      .slice(0, SOFT_LIMIT_BUTTONS);

    const inputs = actionComponent
      ?.filter(
        (it) =>
          it instanceof SingleValueActionComponent ||
          it instanceof MultiValueActionComponent
      )
      .slice(0, SOFT_LIMIT_INPUTS);

    const [formComponent] =
      actionComponent?.filter((it) => it instanceof FormActionComponent) ?? [];

    return [buttons, inputs, formComponent];
  }, [post?.links?.actions]);

  const asButtonProps = (component: AbstractActionComponent) => {
    const it = component as ButtonActionComponent;
    return {
      text: it.label,
      loading: false,
      disabled: false,
      variant: 'default',
      onClick: (params?: Record<string, string | string[]>) => {},
    } as BaseButtonProps;
  };

  const asInputProps = (
    component: AbstractActionComponent,
    { placement }: { placement: 'form' | 'standalone' } = {
      placement: 'standalone',
    }
  ) => {
    const it = component as
      | SingleValueActionComponent
      | MultiValueActionComponent;
    return {
      type: it.parameter.type ?? 'text',
      placeholder: it.parameter.label,
      disabled: false,
      name: it.parameter.name,
      required: it.parameter.required,
      min: it.parameter.min,
      max: it.parameter.max,
      pattern:
        it instanceof SingleValueActionComponent &&
        isPatternAllowed(it.parameter)
          ? it.parameter.pattern
          : undefined,
      options: isParameterSelectable(it.parameter)
        ? it.parameter.options
        : undefined,
      description: it.parameter.patternDescription,
      button:
        placement === 'standalone'
          ? asButtonProps(it.toButtonActionComponent())
          : undefined,
    };
  };

  const asFormProps = (component: AbstractActionComponent) => {
    const it = component as FormActionComponent;
    return {
      button: asButtonProps(it.toButtonActionComponent()),
      inputs: it.parameters.slice(0, SOFT_LIMIT_FORM_INPUTS).map((parameter) =>
        asInputProps(it.toInputActionComponent(parameter.name), {
          placement: 'form',
        })
      ),
    };
  };

  return (
    <div className="overflow-y-scroll scrollbar-none ">
      {post ? (
        <ActionLayout
          blinksImageUrl={useExistingBlink ? post?.icon : undefined}
          websiteText={post.url ? new URL(post.url).hostname : ''}
          websiteUrl={post?.url}
          blinksDetail={{
            ...post,
            url: post.url!,
            mint: post.mint!,
            id: post.id!,
            createdAt: Date.now() / 1000,
            updatedAt: Date.now() / 1000,
          }}
          hideBorder={false}
          post={post}
          hideCarousel={false}
          hideCaption={false}
          hideUserPanel={false}
          hideComment={true}
          expandAll={true}
          multiGrid={false}
          editable={false}
          showMintDetails={true}
          type={'trusted'}
          title={post.title || ''}
          description={post.description || ''}
          supportability={{
            isSupported: true,
          }}
          buttons={buttons?.map(asButtonProps)}
          inputs={inputs?.map((input) => asInputProps(input))}
          form={form ? asFormProps(form) : undefined}
        />
      ) : (
        isLoading && (
          <div className="flex items-center justify-center">
            <div className="loading loading-dots" />
          </div>
        )
      )}
    </div>
  );
};
