'use client';

import { Duration, Eligibility } from '@/utils/enums/campaign';
import { ActionTypeEnum } from '@/utils/enums/post';
import { uploadMedia } from '@/utils/firebase/functions';
import {
  generatePostEndPoint,
  generatePostSubscribeApiEndPoint,
  generatePostTransferApiEndPoint,
} from '@/utils/helper/endpoints';
import { formatLargeNumber, getDDMMYYYY } from '@/utils/helper/format';
import { generateRandomU64Number } from '@/utils/helper/post';
import { Parameter } from '@/utils/types/blinks';
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
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { Blinks } from '../blinks/blinks-feature';
import { ActionContent } from '../blinks/blinks-ui';
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

export const UploadPost: FC<{
  post: PostContent | undefined | null;
  mint: PublicKey | null;
  id?: string;
}> = ({ post, mint, id }) => {
  const [tempPost, setTempPost] = useState<PostContent | any>();
  const [files, setFiles] = useState<UploadFileTypes[]>([]);
  const previousFilesRef = useRef(files);
  const [useExistingBlink, setUseExistingBlink] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [filesLoaded, setFilesLoaded] = useState(false);
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
    if (post && !filesLoaded && files.length === 0) {
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
      setFilesLoaded(true);
    }
    if (mint) {
      setTempPost({
        ...post,
        id: id || crypto.randomUUID(),
        mint: mint.toBase58(),
      });
    }
  }, [post, filesLoaded, mint, id]);

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
            tempPost={tempPost}
            setTempPost={setTempPost}
            action={action}
            setAction={setAction}
          />
        )}
      </div>
      <UploadContentBtn
        tempPost={tempPost}
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
  tempPost: PostContent;
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
  tempPost,
  action,
}) => {
  const { publicKey } = useWallet();
  const uploadMutation = useUploadMutation({ mint });
  const [loading, setLoading] = useState(false);

  const handleUpload = useCallback(async () => {
    if (!files || !mint) return;

    setLoading(true);

    try {
      const postId = tempPost.id;
      if (useExistingBlink) {
        const mediaUrl = files.find((x) => x.id == 'blinks')?.uri;
        if (mediaUrl) {
          await uploadMutation.mutateAsync({
            url: mediaUrl,
            mint: mint.toBase58(),
            id: postId,
          });
        } else {
          toast.error('No Blinks Url Found');
        }
      } else if (publicKey) {
        if (
          !tempPost.links ||
          tempPost.links.actions.length == 0 ||
          action == ActionTypeEnum.SUBSCRIBE
        ) {
          tempPost.links = {
            actions: [
              {
                href: generatePostSubscribeApiEndPoint(mint.toBase58(), postId),
                label: 'Subscribe',
              },
            ],
          };
        } else {
          if (!tempPost.campaign || !tempPost.campaign.budget) {
            toast.error('No Budget Found');
            return;
          }
          if (
            tempPost.campaign.eligibility == Eligibility.ONCE_PER_ADDRESS &&
            !tempPost.campaign.participants
          ) {
            tempPost.campaign.participants = [];
          }
        }

        const carousel = await Promise.all(
          files
            .filter((x) => x.id !== 'blinks')
            .map(async (x) => {
              const mediaUrl = x.file
                ? await uploadMedia(x.file, publicKey)
                : x.uri;
              if (x.fileType.startsWith('image/')) {
                return { uri: mediaUrl, fileType: x.fileType };
              } else if (x.fileType.startsWith('video/')) {
                return {
                  uri: mediaUrl,
                  fileType: x.fileType,
                  duration: x.duration,
                };
              }
              return null;
            })
        ).then((results) => results.filter((x) => x != null));
        if (carousel.length > 0) {
          const iconUrl = carousel[0]!.fileType.startsWith('video/')
            ? await uploadMedia(
                files.find((x) => x.fileType === carousel[0]!.fileType)
                  ?.thumbnailFile!,
                publicKey
              )
            : carousel[0]!.uri;
          await uploadMutation.mutateAsync({
            ...tempPost,
            icon: iconUrl,
            title,
            description,
            label: 'Subscribe', // default
            url: generatePostEndPoint(mint.toBase58(), postId),
            mint: mint.toBase58(),
            id: postId,
            carousel,
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
  tempPost: PostContent | undefined;
  setTempPost: Dispatch<SetStateAction<PostContent | undefined>>;
  action: ActionTypeEnum;
  setAction: Dispatch<SetStateAction<ActionTypeEnum>>;
}> = ({ tempPost, setTempPost, action, setAction }) => {
  const [selectedQuery, setSelectedQuery] = useState<LinkedAction>();

  function isNewPost(tempPost: PostContent | undefined) {
    return !(
      tempPost &&
      tempPost.links?.actions &&
      tempPost.links.actions.length > 0
    );
  }

  function isSubscribeAction(tempPost: PostContent | undefined) {
    return (
      tempPost &&
      tempPost.links?.actions &&
      tempPost.links?.actions.length > 0 &&
      tempPost.links?.actions[0].href ===
        generatePostSubscribeApiEndPoint(tempPost.mint, tempPost.id)
    );
  }

  // Memoize the current action to avoid unnecessary updates
  useEffect(() => {
    if (isNewPost(tempPost) || isSubscribeAction(tempPost)) {
      setAction(ActionTypeEnum.SUBSCRIBE);
    } else {
      setAction(ActionTypeEnum.REWARD);
    }
  }, [tempPost]);

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
          if (isSubscribeAction(tempPost)) {
            setTempPost((prev) => {
              if (prev?.links) {
                prev.links = { actions: [] };
              }
              return prev ? { ...prev } : undefined;
            });
          }
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
              {tempPost?.campaign?.budget ? 'Edit' : 'Set'} Overall Budget
            </button>
            <div
              className={`badge ${
                tempPost?.campaign?.budget ? 'text-success' : 'text-warning'
              }`}
            >
              {tempPost?.campaign?.budget ? (
                <div className="flex items-center gap-2">
                  <IconDiscountCheck />
                  Completed
                </div>
              ) : (
                <IconExclamationCircle />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tempPost?.links?.actions.map((x, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedQuery(
                    !x.parameters ? { href: x.href, label: x.label } : x
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
        <PreviewBlinksActionButton actions={tempPost?.links?.actions} />
      ) : (
        <SubscribeBtn mintId={tempPost?.mint || null} subscribeOnly={true} />
      )}

      {action === ActionTypeEnum.REWARD && (
        <>
          <OverallPostCampaignModal
            tempPost={tempPost}
            setTempPost={setTempPost}
          />
          <ActionModal
            tempPost={tempPost}
            query={selectedQuery}
            setTempPost={setTempPost}
          />
        </>
      )}
    </div>
  );
};

interface OverallPostCampaignModalProps {
  tempPost: any | undefined;
  setTempPost: Dispatch<SetStateAction<any>>;
}

export const OverallPostCampaignModal: FC<OverallPostCampaignModalProps> = ({
  tempPost,
  setTempPost,
}) => {
  const currentTime = Date.now();

  // Initializing state with a single useState call for all form fields
  const [campaignDetails, setCampaignDetails] = useState({
    mint: '',
    allocatedBudget: '',
    eligibility: Eligibility.ONCE_PER_ADDRESS,
    endDate: undefined as number | undefined,
    duration: Duration.UNTILL_BUDGET_FINISHES,
  });

  // Destructuring state for easier access
  const { mint, allocatedBudget, eligibility, endDate, duration } =
    campaignDetails;

  useEffect(() => {
    if (tempPost) {
      setCampaignDetails({
        mint: tempPost.mint,
        allocatedBudget: tempPost.campaign?.tokensRemaining?.toString() || '',
        eligibility:
          tempPost.campaign?.eligibility || Eligibility.ONCE_PER_ADDRESS,
        endDate: tempPost.campaign?.endDate,
        duration: tempPost.campaign?.endDate
          ? Duration.CUSTOM_DATE
          : Duration.UNTILL_BUDGET_FINISHES,
      });
    } else {
      resetForm();
    }
  }, [tempPost]);

  const resetForm = () => {
    setCampaignDetails({
      mint: '',
      allocatedBudget: '',
      eligibility: Eligibility.ONCE_PER_ADDRESS,
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

  const handleBudgetSubmit = () => {
    const currentBudget = tempPost?.campaign?.budget || 0;
    const currentTokensRemaining = tempPost?.campaign?.tokensRemaining || 0;
    const difference =
      (allocatedBudget ? parseInt(allocatedBudget) : 0) -
      currentTokensRemaining;

    setTempPost({
      ...(tempPost || {}),
      campaign: {
        id: generateRandomU64Number(),
        ...(tempPost?.campaign || {}),
        mint,
        endDate: endDate ? endDate / 1000 : undefined,
        eligibility,
        budget: currentBudget + difference,
        tokensRemaining: currentTokensRemaining + difference,
        amount: difference,
      },
    });

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
            {tempPost?.campaign?.budget
              ? 'Edit Overall Budget'
              : 'Set Overall Budget'}
          </span>
          <form method="dialog">
            <button>
              <IconX />
            </button>
          </form>
        </div>

        <InputField
          label="Mint"
          type="text"
          value={mint}
          onChange={(e) => handleInputChange('mint', e.target.value)}
          placeholder="Enter a mint address"
        />

        <InputField
          label="Budget"
          type="number"
          value={allocatedBudget}
          onChange={(e) => handleInputChange('allocatedBudget', e.target.value)}
          placeholder="How many tokens do you want to give out?"
          suffix={
            tempPost?.campaign?.budget
              ? `/ ${formatLargeNumber(tempPost.campaign.budget)} left`
              : ''
          }
        />

        <SelectField
          label="Eligibility"
          value={eligibility}
          onChange={(e) => handleInputChange('eligibility', e.target.value)}
          options={Object.entries(Eligibility).map(([key, value]) => ({
            key,
            value,
          }))}
        />

        <SelectField
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
            value={getDDMMYYYY(new Date(endDate || currentTime))}
            onChange={(e) =>
              handleInputChange('endDate', Date.parse(e.target.value))
            }
            min={currentTime}
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
  min?: number;
  suffix?: string;
}

const InputField: FC<InputFieldProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  min,
  suffix,
}) => (
  <label className="input input-bordered text-base flex items-center gap-2">
    {label}
    <input
      type={type}
      className="grow text-end"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
    />
    {suffix && <span>{suffix}</span>}
  </label>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { key: string; value: string }[];
}

const SelectField: FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
}) => (
  <label className="flex px-2 justify-between items-center gap-2">
    {label}
    <select
      value={value}
      onChange={onChange}
      className="select bg-transparent w-fit sm:w-full border-none focus-within:outline-none max-w-xs"
    >
      {options.map(({ key, value }) => (
        <option key={key}>{value}</option>
      ))}
    </select>
  </label>
);

const ActionModal: FC<{
  tempPost: PostContent | undefined;
  setTempPost: Dispatch<SetStateAction<any>>;
  query?: LinkedAction;
}> = ({ tempPost, setTempPost, query }) => {
  const [amount, setAmount] = useState('');
  const [additionalFields, setAdditionalFields] = useState<
    {
      id: string;
      type: any;
      fieldName: string;
      placeholder?: string;
      validation?: string;
    }[]
  >([]);
  const [label, setLabel] = useState('');

  const action = tempPost?.campaign?.amountPerQuery?.find(
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
    setTempPost(
      (prev: {
        links: { actions: any };
        campaign: { amountPerQuery: any[] };
      }) => {
        if (!prev || !prev.links || !prev.campaign?.amountPerQuery || !query) {
          return prev;
        }
        return {
          ...prev,
          links: {
            actions: (prev.links.actions || []).filter(
              (x: { href: string }) => x.href !== query.href
            ),
          },
          campaign: {
            ...prev.campaign,
            amountPerQuery: prev.campaign.amountPerQuery.filter(
              (x) => x.linkedAction !== JSON.stringify(query)
            ),
          },
        };
      }
    );
    (document.getElementById('action_modal') as HTMLDialogElement).close();
  }, [query, setTempPost]);

  const handleSaveAction = useCallback(() => {
    if (!tempPost) return;
    if (
      !query &&
      tempPost.links?.actions &&
      tempPost.links?.actions.findIndex((x) => x.label === label) !== -1
    ) {
      toast.error('Label needs to be unique!');
      return;
    }
    const newActionQuery = buildActionQuery(additionalFields, label);
    const newLinkedAction = {
      href: createHref(tempPost, newActionQuery),
      label,
      parameters:
        additionalFields.length > 0
          ? additionalFields.map((x) => ({
              type: x.type,
              name: x.fieldName,
              label: x.placeholder,
            }))
          : undefined,
    };
    const existingAmountPerQueryIndex =
      tempPost.campaign?.amountPerQuery?.findIndex(
        (x) => query && x.linkedAction === JSON.stringify(query)
      );
    const newAmountPerQuery =
      existingAmountPerQueryIndex !== undefined &&
      existingAmountPerQueryIndex !== -1
        ? tempPost.campaign?.amountPerQuery.map((x, index) => {
            if (index === existingAmountPerQueryIndex) {
              return {
                linkedAction: JSON.stringify(newLinkedAction),
                query: newActionQuery,
                amount: amount !== '' ? parseInt(amount) : 0,
              };
            }
            return x;
          }) || []
        : (tempPost.campaign?.amountPerQuery || []).concat({
            linkedAction: JSON.stringify(newLinkedAction),
            query: newActionQuery,
            amount: amount !== '' ? parseInt(amount) : 0,
          });

    const newLinkedActions = query
      ? tempPost.links?.actions.map((x) => {
          if (x.href === query.href) {
            return newLinkedAction;
          }
          return x;
        }) || []
      : (tempPost.links?.actions || []).concat(newLinkedAction);

    setTempPost((prev: any) => ({
      ...(prev || {}),
      links: {
        actions: newLinkedActions,
      },
      campaign: {
        ...(prev?.campaign || {}),
        amountPerQuery: newAmountPerQuery,
      },
    }));

    (document.getElementById('action_modal') as HTMLDialogElement).close();
    setAmount('');
    setLabel('');
    setAdditionalFields([]);
  }, [amount, additionalFields, label, query, setTempPost, tempPost]);

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
        <InputField
          label="Label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder=""
        />
        <InputField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount per action"
        />
        <div className="overflow-y-scroll flex flex-col gap-4 scrollbar-none">
          {additionalFields.map((field, index) => (
            <div
              key={field.id}
              className="border input-bordered rounded p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                {`Additional Field ${index + 1}`}
                <button
                  onClick={() =>
                    setAdditionalFields((prev) =>
                      prev.filter((f) => f.id !== field.id)
                    )
                  }
                >
                  <IconTrash />
                </button>
              </div>
              <SelectField
                label="Type"
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
                ].map((type) => ({ key: type, value: type }))}
              />
              <InputField
                label={
                  field.type === 'datetime-local' || field.type === 'date'
                    ? 'Field Name'
                    : ''
                }
                type={field.type}
                value={field.fieldName}
                onChange={(e) =>
                  handleAdditionalFieldChange(
                    field.id,
                    'fieldName',
                    e.target.value
                  )
                }
                placeholder="Field Name"
              />
              <InputField
                label={
                  field.type === 'datetime-local' || field.type === 'date'
                    ? 'Placeholder'
                    : ''
                }
                type="text"
                value={field.placeholder}
                onChange={(e) =>
                  handleAdditionalFieldChange(
                    field.id,
                    'placeholder',
                    e.target.value
                  )
                }
                placeholder="Placeholder"
              />
              <InputField
                label={
                  field.type === 'datetime-local' || field.type === 'date'
                    ? 'Validation Text'
                    : ''
                }
                type={field.type}
                value={field.validation}
                onChange={(e) =>
                  handleAdditionalFieldChange(
                    field.id,
                    'validation',
                    e.target.value
                  )
                }
                placeholder="Validation Text"
              />
            </div>
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

function createHref(
  tempPost: PostContent,
  newActionQuery: { key: string; value?: string; validation?: string }[]
) {
  return (
    generatePostTransferApiEndPoint(tempPost.mint, tempPost.id) +
    (newActionQuery.length > 0 ? '&' : '') +
    newActionQuery.map((q) => q.key + '=' + q.value || `{${q.key}}`).join('&')
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

  additionalFields.forEach((x) =>
    result.push({ key: x.fieldName, validation: x.validation })
  );
  return result;
}

export const PreviewBlinksActionButton: FC<{
  actions?: LinkedAction[];
}> = ({ actions }) => {
  const buttons = useMemo(
    () => actions?.filter((it) => !it.parameters) ?? [],
    [actions]
  );
  const inputs = useMemo(
    () => actions?.filter((it) => it.parameters?.length === 1) ?? [],
    [actions]
  );
  const form = useMemo(() => {
    const [formComponent] =
      actions?.filter((it) => it.parameters && it.parameters.length > 1) ?? [];
    return formComponent;
  }, [actions]);

  const asButtonProps = (
    it: LinkedAction
  ): {
    text: string | null;
    loading?: boolean;
    variant?: 'default' | 'success' | 'error';
    disabled?: boolean;
    onClick: (params?: Record<string, string>) => void;
  } => ({
    text: it.label,
    loading: false,
    disabled: false,
    variant: 'default',
    onClick: () => {},
  });

  const asInputProps = (it: LinkedAction, parameter?: Parameter) => {
    const placeholder = !parameter ? it.parameters![0].label : parameter.label;
    const name = !parameter ? it.parameters![0].name : parameter.name;
    return {
      // since we already filter this, we can safely assume that parameter is not null
      placeholder,
      disabled: false,
      name,
      button: !parameter ? asButtonProps(it) : undefined,
    };
  };

  const asFormProps = (it: LinkedAction) => {
    return {
      button: asButtonProps(it),
      inputs: it.parameters!.map((parameter) => asInputProps(it, parameter)),
    };
  };

  return (
    <ActionContent
      buttons={buttons.map(asButtonProps)}
      inputs={inputs.map((input) => asInputProps(input))}
      form={form ? asFormProps(form) : undefined}
    />
  );
};
