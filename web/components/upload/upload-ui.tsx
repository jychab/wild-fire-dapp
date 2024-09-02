'use client';

import { Criteria, Duration, Eligibility } from '@/utils/enums/campaign';
import { ActionTypeEnum } from '@/utils/enums/post';
import { uploadMedia } from '@/utils/firebase/functions';
import { unfurlUrlToActionApiUrl } from '@/utils/helper/blinks';
import {
  generatePostEndPoint,
  generatePostSubscribeApiEndPoint,
  generatePostTransferApiEndPoint,
} from '@/utils/helper/endpoints';
import { formatLargeNumber, getDDMMYYYY } from '@/utils/helper/format';
import { getAsset } from '@/utils/helper/mint';
import { placeholderImage } from '@/utils/helper/placeholder';
import {
  SOFT_LIMIT_BUTTONS,
  SOFT_LIMIT_FORM_INPUTS,
  SOFT_LIMIT_INPUTS,
} from '@/utils/types/blinks';
import { PostCampaign } from '@/utils/types/campaigns';
import { DAS } from '@/utils/types/das';
import { PostContent } from '@/utils/types/post';
import { LinkedAction } from '@solana/actions';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconDiscountCheck,
  IconExclamationCircle,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconVideo,
  IconX,
} from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { AbstractActionComponent } from '../actions/abstract-action-component';
import { componentFactory } from '../actions/action';
import { ButtonActionComponent } from '../actions/button-action-component';
import { FormActionComponent } from '../actions/form-action-component';
import { isParameterSelectable, isPatternAllowed } from '../actions/guards';
import { MultiValueActionComponent } from '../actions/multivalue-action-coponent';
import { SingleValueActionComponent } from '../actions/single-action-value-component';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { Blinks } from '../blinks/blinks-feature';
import { ActionContent } from '../blinks/blinks-layout';
import { BaseButtonProps } from '../blinks/ui/action-button';
import { CreateAccountBtn } from '../create/create-ui';
import { SubscribeBtn } from '../profile/profile-ui';
import { checkUrlIsValid, useUploadMutation } from './upload.data-access';

export const UploadBtn: FC<{ mintId?: string }> = ({ mintId }) => {
  const router = useRouter();
  return (
    <button
      onClick={() =>
        router.push(`/post/create${mintId ? `?mint=${mintId}` : ''}`)
      }
      className="btn btn-sm btn-outline "
    >
      <IconPlus />
      Create Post
    </button>
  );
};

interface UploadFileTypes {
  file?: File;
  fileType: string;
  uri: string;
  id: string;
  duration?: number;
  thumbnail?: string;
  thumbnailFile?: File;
}
interface LinkedActionWithType extends LinkedAction {
  type: ActionTypeEnum;
}
export interface TempPostCampaign extends PostCampaign {
  initialTokensRemaining?: number;
  links?: {
    /** list of related Actions a user could perform */
    actions: LinkedActionWithType[];
  };
}
export const UploadPost: FC<{
  post: PostContent | undefined | null;
  postCampaign: PostCampaign | undefined | null;
  mint: PublicKey | null;
  id?: string;
}> = ({ post, mint, id, postCampaign }) => {
  const [tempCampaign, setTempCampaign] = useState<Partial<TempPostCampaign>>();
  const [files, setFiles] = useState<UploadFileTypes[]>([]);
  const previousFilesRef = useRef(files);
  const [useExistingBlink, setUseExistingBlink] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [uri, setUri] = useState('');
  const [action, setAction] = useState(ActionTypeEnum.SUBSCRIBE);

  const updateFiles = useCallback((newFiles: any) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        if (file.id == newFiles.id) {
          return {
            ...file,
            ...newFiles,
          };
        } else {
          return file;
        }
      })
    );
  }, []);

  useEffect(() => {
    if (postCampaign && !tempCampaign) {
      setTempCampaign((prev) => ({
        ...prev,
        ...postCampaign,
        initialTokensRemaining: postCampaign.tokensRemaining,
      }));
    } else if (mint) {
      setTempCampaign((prev) => ({
        ...prev,
        mint: mint.toBase58(),
        postId: id || crypto.randomUUID(),
      }));
    }
  }, [postCampaign, mint, id]);

  const [postLoaded, setPostLoaded] = useState(false);
  useEffect(() => {
    if (post && !postLoaded && files.length === 0) {
      if (post.carousel?.length) {
        const newFiles = post.carousel.map((x) =>
          x.fileType.startsWith('image/')
            ? { fileType: x.fileType, uri: x.uri, id: crypto.randomUUID() }
            : {
                ...x,
                fileType: x.fileType,
                uri: x.uri,
                id: crypto.randomUUID(),
              }
        );
        setFiles(newFiles);
        setDescription(post.description || '');
        setTitle(post.title || '');
        setUseExistingBlink(false);
      } else if (post.url) {
        setUri(post.url);
        setFiles([{ fileType: 'blinks', uri: post.url, id: 'blinks' }]);
        setUseExistingBlink(true);
      }
      setPostLoaded(true);
    }
  }, [post, postLoaded]);

  useEffect(() => {
    if (uri) {
      updateFiles({ id: 'blinks', uri });
    }
  }, [uri, updateFiles]);

  const handleInputChange = useCallback(
    (setter: (value: string) => void) => (e: any) => {
      setter(e.target.value);
    },
    []
  );

  const captureThumbnail = useCallback(
    (id: string) => {
      const video = videoRefs.current[id];
      if (video && video.readyState >= 2) {
        const canvasSize = Math.max(video.videoWidth, video.videoHeight);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = canvasSize;
          canvas.height = canvasSize;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const offsetX = (canvasSize - video.videoWidth) / 2;
          const offsetY = (canvasSize - video.videoHeight) / 2;
          ctx.drawImage(
            video,
            offsetX,
            offsetY,
            video.videoWidth,
            video.videoHeight
          );

          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnail = new File([blob], `${id}-thumbnail.png`, {
                type: 'image/png',
              });
              const dataUrl = URL.createObjectURL(thumbnail);

              updateFiles({
                id,
                thumbnail: dataUrl,
                duration: video.duration,
                thumbnailFile: thumbnail,
              });
            }
          }, 'image/png');
        }
      }
    },
    [updateFiles]
  );

  const handleLoadedMetadata = useCallback(
    (id: string) => {
      const video = videoRefs.current[id];

      if (video) {
        video.currentTime = 1; // Seek to 1 second to capture the thumbnail
        video.addEventListener('seeked', () => captureThumbnail(id), {
          once: true,
        });
      }
    },
    [captureThumbnail]
  );

  useEffect(() => {
    const previousFiles = previousFilesRef.current;
    if (files.length > previousFiles.length) {
      document.getElementById(files[files.length - 1].id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
    previousFilesRef.current = files;
  }, [files]);

  const handleFilesAdd = useCallback(
    (e: any) => {
      if (files.length >= 3) {
        toast.error('A maximum of 3 files can be added in a post');
        return;
      }
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        if (selectedFile.size > 1e8) {
          toast.error('File size exceeded maximum allowed 100MB');
          return;
        }
        const url = URL.createObjectURL(selectedFile);
        const id = crypto.randomUUID();
        setFiles((prevFiles) => [
          ...prevFiles,
          { fileType: selectedFile.type, file: selectedFile, uri: url, id },
        ]);
      }
    },
    [files]
  );

  const handleVideoRef = useCallback(
    (id: string) => (el: HTMLVideoElement | null) => {
      if (el) {
        el.setAttribute('crossorigin', 'anonymous');
        videoRefs.current[id] = el;
      }
    },
    []
  );

  return (
    <div className="flex flex-col w-full gap-4">
      {!id && (
        <label className="label flex justify-between w-full gap-4">
          <span className="label-text">
            Do you want to use an existing Blink?
          </span>
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={useExistingBlink}
            onChange={(e) => {
              if (e.target.checked) {
                if (!files.find((x) => x.fileType === 'blinks')) {
                  setFiles((prev) => [
                    ...prev,
                    { fileType: 'blinks', uri: '', id: 'blinks' },
                  ]);
                }
              } else {
                setFiles((prevFiles) =>
                  prevFiles.filter((x) => x.fileType !== 'blinks')
                );
              }
              setUseExistingBlink(e.target.checked);
            }}
          />
        </label>
      )}
      {useExistingBlink && (
        <input
          type="url"
          autoFocus={true}
          placeholder="Add a Blink Url"
          className="input input-bordered w-full text-base"
          value={uri}
          onChange={handleInputChange(setUri)}
        />
      )}
      <div className="flex flex-col gap-2">
        {files.length == 0 ? (
          <label className="btn btn-outline" htmlFor="file-upload">
            <IconPlus />
            <span>Add Image / Video</span>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*, video/*"
              onChange={handleFilesAdd}
            />
          </label>
        ) : (
          <div
            className={`flex flex-col ${
              useExistingBlink ? 'border border-base-300' : ''
            }`}
          >
            <div className="carousel w-full z-0">
              {files.map((file) => (
                <div
                  id={file.id}
                  key={file.id}
                  className="carousel-item relative z-0 items-center justify-center flex aspect-square w-full"
                >
                  {file.fileType == 'blinks' &&
                    (checkUrlIsValid(file.uri) ? (
                      <Blinks
                        actionUrl={new URL(file.uri)}
                        hideCaption={false}
                        hideUserPanel={false}
                        hideBorder={true}
                        hideComment={true}
                        expandAll={true}
                      />
                    ) : (
                      <div className="flex gap-2 flex-col items-center ">
                        <span>Url Is Invalid</span>
                        <div className="loading loading-dots" />
                      </div>
                    ))}
                  {file.fileType.startsWith('image/') && (
                    <Image
                      className={`object-contain bg-black`}
                      fill={true}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      src={file.uri}
                      alt={''}
                    />
                  )}
                  {file.fileType.startsWith('video/') && (
                    <video
                      ref={handleVideoRef(file.id)}
                      className="w-full h-full bg-black"
                      autoPlay
                      muted
                      playsInline
                      preload="auto"
                      onLoadedMetadata={() => handleLoadedMetadata(file.id)}
                    >
                      <source src={file.uri} type={file.fileType} />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  <button
                    onClick={() => {
                      if (useExistingBlink) {
                        setUri('');
                        const filteredFiles = files.filter(
                          (x) => x.fileType !== 'blinks'
                        );
                        setFiles([
                          ...filteredFiles,
                          {
                            fileType: 'blinks',
                            uri: '',
                            id: 'blinks',
                          },
                        ]);
                      } else {
                        setFiles((previous) =>
                          previous.filter((x) => x.id != file.id)
                        );
                      }
                    }}
                    className="absolute btn rounded-full btn-sm px-2 z-1 top-4 right-4"
                  >
                    <IconX />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {!useExistingBlink && files.length > 0 && (
          <div className="flex items-center gap-2">
            {files.map((file) => (
              <button
                key={file.id}
                className="aspect-square w-14 h-14 relative flex border border-base-300 items-center justify-center"
                onClick={() =>
                  document.getElementById(file.id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                  })
                }
              >
                {file.fileType.startsWith('image') && (
                  <>
                    <Image
                      className="cursor-pointer bg-black object-contain"
                      fill={true}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      src={file.uri}
                      alt={''}
                    />
                    <div className="absolute btn btn-xs p-0 bottom-1 right-1">
                      <IconPhoto />
                    </div>
                  </>
                )}
                {file.fileType.startsWith('video') && file.thumbnail && (
                  <>
                    <Image
                      className="cursor-pointer bg-black object-contain"
                      fill={true}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      src={file.thumbnail}
                      alt={''}
                    />
                    <div className="absolute btn btn-xs p-0 bottom-1 right-1">
                      <IconVideo />
                    </div>
                  </>
                )}
              </button>
            ))}
            {files.length < 3 && (
              <label
                className="border-base-300 rounded-none w-14 h-14 btn btn-outline"
                htmlFor="file-upload"
              >
                <IconPlus />
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*, video/*"
                  onChange={handleFilesAdd}
                />
              </label>
            )}
          </div>
        )}
        {!useExistingBlink && (
          <input
            type="text"
            className="input input-bordered w-full text-base"
            placeholder="Title"
            value={title}
            onChange={handleInputChange(setTitle)}
          />
        )}
        {!useExistingBlink && (
          <textarea
            className="textarea textarea-bordered w-full text-base"
            placeholder="Description"
            value={description}
            onChange={handleInputChange(setDescription)}
          />
        )}
        {!useExistingBlink && (
          <AddActions
            post={post}
            tempCampaign={tempCampaign}
            setTempCampaign={setTempCampaign}
            action={action}
            setAction={setAction}
          />
        )}
      </div>
      <UploadContentBtn
        tempCampaign={tempCampaign}
        useExistingBlink={useExistingBlink}
        mint={mint}
        id={id}
        files={files}
        title={title}
        description={description}
        action={action}
      />
    </div>
  );
};
const UploadContentBtn: FC<{
  tempCampaign: Partial<TempPostCampaign> | undefined;
  useExistingBlink: boolean;
  id?: string;
  mint: PublicKey | null;
  files: UploadFileTypes[];
  title: string;
  description: string;
  action: ActionTypeEnum;
}> = ({
  useExistingBlink,
  mint,
  files,
  id,
  title,
  description,
  tempCampaign,
  action,
}) => {
  const { publicKey } = useWallet();
  const uploadMutation = useUploadMutation({ mint });
  const [loading, setLoading] = useState(false);

  const handleUpload = useCallback(async () => {
    if (!files || !mint || !tempCampaign?.postId) return;
    setLoading(true);
    try {
      const postId = tempCampaign.postId;
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

        await uploadMutation.mutateAsync({
          postContent: {
            url: generatePostEndPoint(mint.toBase58(), postId, apiUrl),
            mint: mint.toBase58(),
            id: postId,
          },
        });
      } else if (publicKey) {
        if (tempCampaign?.links) {
          tempCampaign.links.actions = tempCampaign.links?.actions.filter(
            (x) => x.type == action
          );
        }
        if (action == ActionTypeEnum.REWARD) {
          if (!tempCampaign || !tempCampaign.budget) {
            toast.error('No Budget Found');
            return;
          }
        }

        const carousel = await Promise.all(
          files
            .filter(
              (x) =>
                x.id !== 'blinks' &&
                (x.fileType.startsWith('image/') ||
                  x.fileType.startsWith('video/'))
            )
            .map(async (x) => {
              const mediaUrl = x.file
                ? await uploadMedia(x.file, publicKey)
                : x.uri;
              if (x.fileType.startsWith('image/')) {
                return { uri: mediaUrl, fileType: x.fileType };
              } else {
                return {
                  uri: mediaUrl,
                  fileType: x.fileType,
                  duration: x.duration,
                };
              }
            })
        );
        if (carousel.length > 0) {
          const iconUrl = carousel[0]!.fileType.startsWith('video/')
            ? await uploadMedia(
                files.find((x) => x.fileType === carousel[0]!.fileType)
                  ?.thumbnailFile!,
                publicKey
              )
            : carousel[0]!.uri;
          await uploadMutation.mutateAsync({
            postContent: {
              icon: iconUrl,
              title,
              description,
              label: 'Subscribe', // default
              url: generatePostEndPoint(mint.toBase58(), postId),
              mint: mint.toBase58(),
              id: postId,
              carousel,
              links: tempCampaign.links,
            },
            postCampaign: {
              initialTokensRemaining: tempCampaign.initialTokensRemaining,
              postId: tempCampaign.postId,
              amountPerQuery: tempCampaign.amountPerQuery,
              id: tempCampaign.id,
              mint: tempCampaign.mint,
              mintToSend: tempCampaign.mintToSend,
              mintToSendDecimals: tempCampaign.mintToSendDecimals,
              mintToSendTokenProgram: tempCampaign.mintToSendTokenProgram,
              budget: tempCampaign.budget,
              tokensRemaining: tempCampaign.tokensRemaining,
              eligibility: tempCampaign.eligibility,
              criteria: tempCampaign.criteria,
              endDate: tempCampaign.endDate,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error uploading post:', error);
    } finally {
      setLoading(false);
    }
  }, [files, mint, id, title, description, uploadMutation]);

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
    <button
      disabled={!files.length || loading}
      onClick={handleUpload}
      className="btn btn-primary w-full"
    >
      {loading ? (
        <div className="loading loading-spinner loading-sm" />
      ) : id ? (
        'Edit Post'
      ) : (
        'Create Post'
      )}
    </button>
  );
};

export const AddActions: FC<{
  post: PostContent | null | undefined;
  tempCampaign: Partial<TempPostCampaign> | undefined;
  setTempCampaign: Dispatch<
    SetStateAction<Partial<TempPostCampaign> | undefined>
  >;
  action: ActionTypeEnum;
  setAction: Dispatch<SetStateAction<ActionTypeEnum>>;
}> = ({ post, tempCampaign, setTempCampaign, action, setAction }) => {
  const [selectedQuery, setSelectedQuery] = useState<LinkedActionWithType>();

  function isSubscribe(href: string, post: PostContent) {
    return href == generatePostSubscribeApiEndPoint(post.mint, post.id)
      ? ActionTypeEnum.SUBSCRIBE
      : ActionTypeEnum.REWARD;
  }

  useEffect(() => {
    if (
      post &&
      post.links?.actions &&
      post.links?.actions.length > 0 &&
      !tempCampaign?.links
    ) {
      setAction(isSubscribe(post?.links?.actions[0].href!, post!));
      const actions = post!.links!.actions.map((x) => ({
        ...x,
        type: isSubscribe(x.href, post!),
      }));
      if (actions.findIndex((x) => x.type == ActionTypeEnum.SUBSCRIBE) == -1) {
        actions.push({
          href: generatePostSubscribeApiEndPoint(post!.mint, post!.id),
          type: ActionTypeEnum.SUBSCRIBE,
          label: 'Subscribe',
        });
      }
      setTempCampaign((prev) => {
        if (prev) {
          return {
            ...prev,
            links: {
              actions: actions,
            },
          };
        }
        return undefined;
      });
    }
  }, [post, tempCampaign]);

  // Helper to show a modal by id
  const showModalById = (id: string) => {
    (document.getElementById(id) as HTMLDialogElement).showModal();
  };

  // Render the action buttons (Subscribe and Reward)
  const renderActionButtons = () => (
    <div className="flex items-center gap-2">
      <ActionButton
        label="Subscribe"
        isActive={action === ActionTypeEnum.SUBSCRIBE}
        onClick={() => setAction(ActionTypeEnum.SUBSCRIBE)}
      />
      <ActionButton
        label="Reward"
        isActive={action === ActionTypeEnum.REWARD}
        onClick={() => {
          setAction(ActionTypeEnum.REWARD);
        }}
      />
    </div>
  );

  // Helper component for rendering individual action buttons
  const ActionButton: FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`badge badge-primary ${isActive ? '' : 'badge-outline'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="border rounded input-bordered p-4 flex flex-col gap-4">
      Actions:
      {renderActionButtons()}
      <span className="text-sm">
        {action === ActionTypeEnum.SUBSCRIBE
          ? 'Users can click on this button to create an associated token account for your token.'
          : 'Create customizable rewards for your users.'}
      </span>
      {action === ActionTypeEnum.REWARD && (
        <div className="flex flex-col gap-4">
          <div className="w-full flex items-center gap-2">
            <button
              onClick={() => showModalById('overall_post_campaign_modal')}
              className="btn btn-sm btn-outline"
            >
              {tempCampaign?.budget ? 'Edit' : 'Set'} Overall Budget
            </button>
            <div
              className={`${
                tempCampaign?.budget ? 'text-success' : 'text-warning'
              }`}
            >
              <div className="flex items-center gap-2">
                {tempCampaign?.budget ? (
                  <>
                    <IconDiscountCheck />
                    Completed
                  </>
                ) : (
                  <>
                    <IconExclamationCircle />
                    Budget not found
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tempCampaign?.links?.actions
              .filter((x) => x.type == ActionTypeEnum.REWARD)
              .map((x, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedQuery(
                      !x.parameters
                        ? {
                            type: ActionTypeEnum.REWARD,
                            href: x.href,
                            label: x.label,
                          }
                        : x
                    );
                    showModalById('action_modal');
                  }}
                  className="btn btn-sm btn-outline"
                >
                  {x.label}
                </button>
              ))}
            <button
              onClick={() => {
                setSelectedQuery(undefined);
                showModalById('action_modal');
              }}
              className="btn btn-sm btn-outline"
            >
              <IconPlus /> Add Action
            </button>
          </div>
        </div>
      )}
      <div>Preview:</div>
      {action === ActionTypeEnum.REWARD ? (
        <PreviewBlinksActionButton
          actions={tempCampaign?.links?.actions.filter(
            (x) => x.type == ActionTypeEnum.REWARD
          )}
        />
      ) : (
        <SubscribeBtn
          mintId={tempCampaign?.mint || null}
          subscribeOnly={true}
        />
      )}
      {action === ActionTypeEnum.REWARD && (
        <>
          <OverallPostCampaignModal
            tempCampaign={tempCampaign}
            setTempCampaign={setTempCampaign}
          />
          <ActionModal
            tempCampaign={tempCampaign}
            query={selectedQuery}
            setTempCampaign={setTempCampaign}
          />
        </>
      )}
    </div>
  );
};

interface OverallPostCampaignModalProps {
  tempCampaign: Partial<TempPostCampaign> | undefined;
  setTempCampaign: Dispatch<
    SetStateAction<Partial<TempPostCampaign> | undefined>
  >;
}

export const OverallPostCampaignModal: FC<OverallPostCampaignModalProps> = ({
  tempCampaign,
  setTempCampaign,
}) => {
  const currentTime = Date.now() / 1000;

  // Initializing state with a single useState call for all form fields
  const [campaignDetails, setCampaignDetails] = useState({
    mintToSend: tempCampaign?.mint || '',
    tokensRemaining: '',
    endDate: undefined as number | undefined,
    duration: Duration.UNTILL_BUDGET_FINISHES,
  });

  // Destructuring state for easier access
  const { mintToSend, tokensRemaining, endDate, duration } = campaignDetails;
  const [mintToSendDetails, setMintToSendDetails] =
    useState<DAS.GetAssetResponse>();
  useEffect(() => {
    try {
      if (mintToSend && new PublicKey(mintToSend)) {
        getAsset(new PublicKey(mintToSend)).then((res) =>
          setMintToSendDetails(res)
        );
      }
    } catch (e) {
      console.log('Invalid Pubkey');
    }
  }, [mintToSend]);

  useEffect(() => {
    if (tempCampaign) {
      setCampaignDetails({
        mintToSend: tempCampaign.mintToSend || tempCampaign?.mint || '',
        tokensRemaining: tempCampaign.tokensRemaining?.toString() || '',
        endDate: tempCampaign.endDate,
        duration: tempCampaign.endDate
          ? Duration.CUSTOM_DATE
          : Duration.UNTILL_BUDGET_FINISHES,
      });
    } else {
      resetForm();
    }
  }, [tempCampaign]);

  const resetForm = () => {
    setCampaignDetails({
      mintToSend: tempCampaign?.mint || '',
      tokensRemaining: '',
      endDate: undefined,
      duration: Duration.UNTILL_BUDGET_FINISHES,
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setCampaignDetails((prevDetails) => ({
      ...prevDetails,
      [field]: value,
    }));
  };

  const handleBudgetSubmit = async () => {
    const currentBudget = tempCampaign?.budget || 0;
    const currentTokensRemaining = tempCampaign?.tokensRemaining || 0;
    const difference =
      (tokensRemaining ? parseFloat(tokensRemaining) : 0) -
      currentTokensRemaining;

    setTempCampaign((prev) => ({
      ...prev,
      mintToSend: mintToSend,
      mintToSendDecimals: mintToSendDetails?.token_info?.decimals,
      mintToSendTokenProgram: mintToSendDetails?.token_info?.token_program,
      endDate:
        duration == Duration.CUSTOM_DATE && endDate ? endDate : undefined,
      criteria: Criteria.ANYONE,
      eligibility: Eligibility.ONCE_PER_ADDRESS,
      budget: currentBudget + difference,
      tokensRemaining: currentTokensRemaining + difference,
    }));

    closeModal();
  };

  const closeModal = () => {
    (
      document.getElementById(
        'overall_post_campaign_modal'
      ) as HTMLDialogElement
    ).close();
  };

  return (
    <dialog id="overall_post_campaign_modal" className="modal">
      <div className="modal-box flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-center">
            {tempCampaign?.budget
              ? 'Edit Overall Budget'
              : 'Set Overall Budget'}
          </span>
          <form method="dialog">
            <button>
              <IconX />
            </button>
          </form>
        </div>
        <div className="flex w-full gap-2 justify-end items-center">
          <div className="w-8 h-8 relative rounded-full">
            <Image
              priority={true}
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt=""
              src={mintToSendDetails?.content?.links?.image || placeholderImage}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">
              {`Name: ${mintToSendDetails?.content?.metadata.name}`}
            </span>
            <span className="text-sm">
              {`Symbol: ${mintToSendDetails?.content?.metadata.symbol}`}
            </span>
          </div>
        </div>
        <InputField
          tooltip="Mint token to reward users. Defaults to your account token."
          label="Mint"
          type="text"
          value={mintToSend}
          onChange={(e) => handleInputChange('mintToSend', e.target.value)}
          placeholder="Enter a mint address"
        />

        <InputField
          tooltip="Total amount of tokens allocated as rewards for this post."
          label="Budget"
          type="number"
          value={tokensRemaining}
          onChange={(e) => handleInputChange('tokensRemaining', e.target.value)}
          placeholder="How many tokens do you want to give out?"
          suffix={
            tempCampaign?.budget
              ? `/ ${formatLargeNumber(tempCampaign.budget)} left`
              : ''
          }
        />
        <SelectField
          type="select"
          label="Duration"
          value={duration}
          onChange={(e) => handleInputChange('duration', e.target.value)}
          options={Object.entries(Duration).map(([key, value]) => ({
            key,
            value,
          }))}
        />

        {duration === Duration.CUSTOM_DATE && (
          <InputField
            label="End Date"
            type="date"
            value={getDDMMYYYY(new Date((endDate || currentTime) * 1000))}
            onChange={(e) =>
              handleInputChange('endDate', Date.parse(e.target.value) / 1000)
            }
          />
        )}

        <div className="flex items-center justify-end">
          <button
            onClick={handleBudgetSubmit}
            className="btn btn-primary btn-sm"
          >
            Set Budget
          </button>
        </div>
      </div>
    </dialog>
  );
};

interface InputFieldProps {
  label: string;
  type: string;
  value: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  tooltip?: string;
  min?: number;
  suffix?: string;
}

const InputField: FC<InputFieldProps> = ({
  label,
  tooltip,
  type,
  value,
  onChange,
  placeholder,
  min,
  suffix,
}) => (
  <label className="input input-bordered w-full text-base flex items-center gap-2">
    <span> {label}</span>
    <div
      data-tip={tooltip}
      className={`grow ${tooltip ? 'tooltip tooltip-primary' : ''}`}
    >
      <input
        type={type}
        className={`text-end w-full`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
      />
    </div>
    {suffix && <span>{suffix}</span>}
  </label>
);

interface SelectFieldProps {
  type: string;
  label: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => void;
  options: { key: string; value: string }[];
  tooltip?: string;
}

const SelectField: FC<SelectFieldProps> = ({
  type,
  label,
  value: validationText,
  onChange,
  options,
  tooltip,
}) => {
  return (
    <div className="px-2 flex justify-between items-center gap-2">
      <div
        className={`${tooltip ? 'tooltip tooltip-right tooltip-primary' : ''}`}
        data-tip={tooltip}
      >
        <span>{label}</span>
      </div>
      <div className={`grow justify-end flex `}>
        {type == 'select' && (
          <select
            value={validationText}
            onChange={onChange}
            className="select bg-transparent w-fit border-none focus-within:outline-none"
          >
            {options.map(({ key, value }) => (
              <option key={key}>{value}</option>
            ))}
          </select>
        )}
        {(type == 'radio' || type == 'checkbox') && (
          <div className="flex flex-wrap gap-2 items-center">
            {options.map(({ key, value }) => (
              <label key={key} className="label flex gap-2 cursor-pointer">
                <span className="label-text">{value}</span>
                <input
                  key={key}
                  type={type}
                  value={value}
                  checked={
                    validationText == value ||
                    (validationText == '' && value == 'No Validation')
                  }
                  onChange={onChange}
                  className={type}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ActionModal: FC<{
  tempCampaign: Partial<TempPostCampaign> | undefined;
  setTempCampaign: Dispatch<
    SetStateAction<Partial<TempPostCampaign> | undefined>
  >;
  query?: LinkedAction;
}> = ({ tempCampaign, setTempCampaign, query }) => {
  const [amount, setAmount] = useState('');
  const [additionalFields, setAdditionalFields] = useState<
    {
      id: string;
      type: any;
      fieldName: string;
      placeholder?: string;
      validation?: string;
      options?: Array<{
        id: string;
        /** displayed UI label of this selectable option */
        label: string;
        /** value of this selectable option */
        value: string;
        /** whether this option should be selected by default */
        selected?: boolean;
      }>;
    }[]
  >([]);
  const [label, setLabel] = useState('');

  const action = tempCampaign?.amountPerQuery?.find(
    (x) => query && x.linkedAction === JSON.stringify(query)
  );

  useEffect(() => {
    if (action) {
      setAmount(Number.isNaN(action.amount) ? '' : action.amount.toString());
    } else {
      setAmount('');
    }
    if (query) {
      setLabel(query.label);
    } else {
      setLabel('');
    }
    if (query && action) {
      setAdditionalFields(
        query.parameters?.map((x) => ({
          options: isParameterSelectable(x)
            ? x.options.map((y) => ({ ...y, id: y.label }))
            : [],
          type: x.type,
          fieldName: x.name,
          placeholder: x.label,
          id: x.name,
          validation: action.query.find((q) => q.key === x.name && !q.value)
            ?.validation,
        })) || []
      );
    } else {
      setAdditionalFields([]);
    }
  }, [query, action]);

  const handleAdditionalFieldChange = useCallback(
    (id: string, field: string, value: string) => {
      setAdditionalFields((prev) =>
        prev.map((prev) =>
          prev.id === id ? { ...prev, [field]: value } : prev
        )
      );
    },
    []
  );

  const handleAddField = useCallback(() => {
    setAdditionalFields((prev) => [
      ...prev,
      {
        validation: '',
        fieldName: '',
        placeholder: '',
        type: 'text',
        id: crypto.randomUUID(),
      },
    ]);
  }, []);

  const handleDeleteAction = useCallback(() => {
    setTempCampaign((prev) => {
      if (!prev || !prev.links || !prev.amountPerQuery || !query) {
        return prev;
      }
      return {
        ...prev,
        links: {
          actions: prev.links.actions.filter(
            (x: { href: string }) => x.href !== query.href
          ),
        },
        amountPerQuery: prev.amountPerQuery.filter(
          (x) => x.linkedAction !== JSON.stringify(query)
        ),
      };
    });
    (document.getElementById('action_modal') as HTMLDialogElement).close();
  }, [query, setTempCampaign]);

  const handleSaveAction = useCallback(() => {
    if (!tempCampaign || !tempCampaign.mint || !tempCampaign.postId) return;
    const nonEmptyAdditionalFields = additionalFields.filter(
      (x) => x.fieldName != ''
    );
    const newActionQuery = buildActionQuery(nonEmptyAdditionalFields, label);
    if (!newActionQuery) {
      return;
    }
    const newHref = createHref(tempCampaign, newActionQuery);
    if (
      tempCampaign.links?.actions &&
      tempCampaign.links?.actions
        .filter((x) => x.href !== query?.href)
        .findIndex((x) => x.href === newHref) !== -1
    ) {
      toast.error(
        'One of the labels or fields names are already used in another action.'
      );
      return;
    }
    const newLinkedAction = {
      type: ActionTypeEnum.REWARD,
      href: newHref,
      label,
      parameters:
        nonEmptyAdditionalFields.length > 0
          ? nonEmptyAdditionalFields.map((x) => ({
              type: x.type,
              name: x.fieldName,
              label: x.placeholder,
              options: x.options?.map((x) => ({
                label: x.label,
                value: x.value,
                selected: x.selected,
              })),
            }))
          : undefined,
    };

    const existingAmountPerQueryIndex = tempCampaign.amountPerQuery?.findIndex(
      (x) => query && x.linkedAction === JSON.stringify(query)
    );
    const newAmountPerQuery =
      existingAmountPerQueryIndex !== undefined &&
      existingAmountPerQueryIndex !== -1
        ? tempCampaign.amountPerQuery?.map((x, index) => {
            if (index === existingAmountPerQueryIndex) {
              return {
                linkedAction: JSON.stringify(newLinkedAction),
                query: newActionQuery,
                amount: amount !== '' ? parseFloat(amount) : 0,
              };
            }
            return x;
          }) || []
        : (tempCampaign.amountPerQuery || []).concat({
            linkedAction: JSON.stringify(newLinkedAction),
            query: newActionQuery,
            amount: amount !== '' ? parseFloat(amount) : 0,
          });

    const newLinkedActions = query
      ? tempCampaign.links?.actions.map((x) => {
          if (x.href === query.href) {
            return newLinkedAction;
          }
          return x;
        }) || []
      : (tempCampaign.links?.actions || []).concat(newLinkedAction);

    setTempCampaign((prev) => ({
      ...prev,
      links: {
        actions: newLinkedActions,
      },
      amountPerQuery: newAmountPerQuery,
    }));

    (document.getElementById('action_modal') as HTMLDialogElement).close();
    resetFields();
  }, [amount, additionalFields, label, query, setTempCampaign, tempCampaign]);

  function resetFields() {
    setAmount('');
    setLabel('');
    setAdditionalFields([]);
  }
  return (
    <dialog id="action_modal" className="modal">
      <div className="modal-box flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-center">
            {action ? 'Edit Action Button' : 'Add Action Button'}
          </span>
          <form method="dialog">
            <button>
              <IconX />
            </button>
          </form>
        </div>

        <div className="overflow-y-scroll flex flex-col gap-4 scrollbar-none">
          <div className="flex flex-col gap-2">
            <InputField
              label="Label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder=""
            />
            <InputField
              label="Reward"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Optional"
              tooltip="Amount of tokens to reward user for this action."
            />
          </div>
          {additionalFields.map((field, index) => (
            <AdditionalFieldComponent
              key={field.id}
              field={field}
              index={index}
              setAdditionalFields={setAdditionalFields}
              handleAdditionalFieldChange={handleAdditionalFieldChange}
            />
          ))}
        </div>
        <button onClick={handleAddField} className="btn w-fit btn-sm">
          <IconPlus />
          Add Additional Field
        </button>
        <div className="flex items-center justify-end gap-2">
          {action && query && (
            <button
              onClick={handleDeleteAction}
              className="btn btn-outline btn-sm"
            >
              Delete Action
            </button>
          )}
          <button onClick={handleSaveAction} className="btn btn-primary btn-sm">
            {action ? 'Edit' : 'Add'} Action
          </button>
        </div>
      </div>
    </dialog>
  );
};

export const AdditionalFieldComponent: FC<{
  field: {
    id: string;
    type: any;
    fieldName: string;
    placeholder?: string;
    validation?: string;
    options?: Array<{
      id: string;
      /** displayed UI label of this selectable option */
      label: string;
      /** value of this selectable option */
      value: string;
      /** whether this option should be selected by default */
      selected?: boolean;
    }>;
  };
  index: number;
  setAdditionalFields: Dispatch<
    SetStateAction<
      {
        id: string;
        type: any;
        fieldName: string;
        placeholder?: string;
        validation?: string;
        options?: Array<{
          id: string;
          /** displayed UI label of this selectable option */
          label: string;
          /** value of this selectable option */
          value: string;
          /** whether this option should be selected by default */
          selected?: boolean;
        }>;
      }[]
    >
  >;
  handleAdditionalFieldChange: (id: string, field: string, value: any) => void;
}> = ({ field, index, setAdditionalFields, handleAdditionalFieldChange }) => {
  const handleSelectableOptionsChange = useCallback(
    (id: string, x: string[], value: string | boolean) => {
      handleAdditionalFieldChange(
        field.id,
        'options',
        field.options?.map((prev) =>
          prev.id === id ? { ...prev, [x[0]]: value, [x[1]]: value } : prev
        )
      );
    },
    [field]
  );
  const handleAddOption = useCallback(() => {
    handleAdditionalFieldChange(
      field.id,
      'options',
      (field.options || []).concat([
        {
          id: crypto.randomUUID(),
          label: '',
          value: '',
          selected: false,
        },
      ])
    );
  }, [field]);
  const handleDeleteOption = useCallback(
    (x: any) => {
      if (field.validation == x.label) {
        handleAdditionalFieldChange(field.id, 'validation', '');
      }
      handleAdditionalFieldChange(
        field.id,
        'options',
        field.options?.filter((f) => f.id !== x.id)
      );
    },
    [field]
  );
  return (
    <div className="border input-bordered rounded p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {`Additional Field ${index + 1}`}
        <button
          onClick={() =>
            setAdditionalFields((prev) => prev.filter((f) => f.id !== field.id))
          }
        >
          <IconTrash />
        </button>
      </div>
      <InputField
        label={'Field Name'}
        type={'text'}
        value={field.fieldName}
        onChange={(e) =>
          handleAdditionalFieldChange(field.id, 'fieldName', e.target.value)
        }
        placeholder=""
      />
      <InputField
        label={'Placeholder'}
        type="text"
        value={field.placeholder}
        onChange={(e) =>
          handleAdditionalFieldChange(field.id, 'placeholder', e.target.value)
        }
        placeholder=""
      />
      <div className="border border-base-300 p-2 rounded flex flex-col gap-2">
        <SelectField
          type="select"
          label="Input Type"
          value={field.type}
          onChange={(e) =>
            handleAdditionalFieldChange(field.id, 'type', e.target.value)
          }
          options={[
            'number',
            'text',
            'email',
            'url',
            'date',
            'datetime-local',
            'textarea',
            'select',
            'radio',
            'checkbox',
          ].map((type) => ({ key: type, value: type }))}
        />
        {(field.type == 'select' ||
          field.type == 'radio' ||
          field.type == 'checkbox') && (
          <>
            {field.options?.map((x) => (
              <div key={x.id} className="flex w-full items-center gap-2">
                <InputField
                  label={''}
                  placeholder="Input Label"
                  type={'text'}
                  value={x.label}
                  onChange={(e) => {
                    handleSelectableOptionsChange(
                      x.id,
                      ['label', 'value'],
                      e.target.value
                    );
                  }}
                />
                <label className="text-sm flex items-center gap-2">
                  Preselected
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={x.selected || false}
                    onChange={(e) =>
                      handleSelectableOptionsChange(
                        x.id,
                        ['selected'],
                        e.target.checked
                      )
                    }
                  />
                </label>
                <button onClick={() => handleDeleteOption(x)}>
                  <IconTrash />
                </button>
              </div>
            ))}
            <div onClick={handleAddOption} className="btn btn-sm w-fit">
              <IconPlus />
              Add Input Options
            </div>
          </>
        )}
        {field.type == 'select' ||
        field.type == 'radio' ||
        field.type == 'checkbox' ? (
          field.options &&
          field.options.filter((x) => x.label).length > 0 && (
            <SelectField
              type={field.type}
              tooltip="Verify if the user's response matches this field. Only matching response will receive a reward."
              label={'Validation'}
              value={field.validation || ''}
              onChange={(e) =>
                handleAdditionalFieldChange(
                  field.id,
                  'validation',
                  e.target.value == 'No Validation' ? '' : e.target.value
                )
              }
              options={[
                {
                  key: field.options.length.toString(),
                  value: 'No Validation',
                },
              ].concat(
                field.options
                  .filter((x) => x.label)
                  .map((type, index) => ({
                    key: index.toString(),
                    value: type.value,
                  }))
              )}
            />
          )
        ) : (
          <InputField
            tooltip="Verify if the user's response matches this field. Only matching response will receive a reward."
            label={'Validation'}
            type={field.type}
            value={field.validation}
            onChange={(e) =>
              handleAdditionalFieldChange(
                field.id,
                'validation',
                e.target.value
              )
            }
            placeholder="Optional"
          />
        )}
      </div>
    </div>
  );
};

function createHref(
  tempPost: Partial<TempPostCampaign>,
  newActionQuery: { key: string; value?: string; validation?: string }[]
) {
  return (
    generatePostTransferApiEndPoint(tempPost.mint!, tempPost.postId!) +
    (newActionQuery.length > 0 ? '&' : '') +
    newActionQuery
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((q) => q.key + '=' + (q.value ? q.value : `{${q.key}}`))
      .join('&')
  );
}

function buildActionQuery(
  additionalFields: {
    id: string;
    type: any;
    fieldName: string;
    placeholder?: string;
    validation?: string;
  }[],
  label: string
) {
  const result: { key: string; value?: string; validation?: string }[] = [
    {
      key: 'label',
      value: label,
      validation: label,
    },
  ];
  for (const x of additionalFields) {
    if (x.fieldName.toLowerCase() == 'label') {
      toast.error("'Label' cannot be used as a field name.");
      return null;
    }
    if (x.fieldName.toLowerCase() == 'action') {
      toast.error("'Action' cannot be used as a field name.");
      return;
    }
    if (result.findIndex((y) => y.key == x.fieldName) !== -1) {
      toast.error('Field names must be unique.');
      return null;
    }
    result.push({ key: x.fieldName, validation: x.validation });
  }

  return result;
}

export const PreviewBlinksActionButton: FC<{
  actions?: LinkedAction[];
}> = ({ actions }) => {
  const [buttons, inputs, form] = useMemo(() => {
    const actionComponent = actions?.map((x) =>
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
  }, [actions]);

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
    <ActionContent
      buttons={buttons?.map(asButtonProps)}
      inputs={inputs?.map((input) => asInputProps(input))}
      form={form ? asFormProps(form) : undefined}
    />
  );
};
