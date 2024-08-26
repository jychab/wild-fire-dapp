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
    if (post && !filesLoaded && files.length === 0 && mint) {
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
        setTempPost({
          ...post,
          id: id || crypto.randomUUID(),
          mint: mint.toBase58(),
        });
        setUseExistingBlink(false);
      } else if (post.url) {
        setUri(post.url);
        setFiles([{ fileType: 'blinks', uri: post.url, id: 'blinks' }]);
        setUseExistingBlink(true);
      }
      setFilesLoaded(true);
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

  useEffect(() => {
    if (tempPost?.links?.actions && tempPost.links?.actions.length > 0) {
      setAction(
        tempPost?.links?.actions[0].href ==
          generatePostSubscribeApiEndPoint(tempPost.mint, tempPost.id)
          ? ActionTypeEnum.SUBSCRIBE
          : ActionTypeEnum.REWARD
      );
    }
  }, [tempPost]);

  return (
    <div className="border rounded input-bordered p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 ">
        <span className="">Actions:</span>
        <button
          onClick={() => {
            setAction(ActionTypeEnum.SUBSCRIBE);
          }}
          className={`badge badge-primary ${
            action == ActionTypeEnum.SUBSCRIBE ? '' : 'badge-outline'
          }`}
        >
          Subscribe
        </button>
        <button
          onClick={() => {
            setAction(ActionTypeEnum.REWARD);
          }}
          className={`badge badge-primary ${
            action == ActionTypeEnum.REWARD ? '' : 'badge-outline'
          }`}
        >
          Reward
        </button>
      </div>
      <span className="text-sm">
        {action == ActionTypeEnum.SUBSCRIBE
          ? 'Users can click on this button to create an associated token account for your token.'
          : 'Create customizable rewards for your users.'}
      </span>
      {action == ActionTypeEnum.REWARD && (
        <div className="flex flex-col gap-4">
          <div className="w-full flex items-center gap-2">
            <button
              onClick={() =>
                (
                  document.getElementById(
                    'overall_post_campaign_modal'
                  ) as HTMLDialogElement
                ).showModal()
              }
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
                  if (!x.parameters) {
                    setSelectedQuery({ href: x.href, label: x.label });
                  } else {
                    setSelectedQuery(x);
                  }
                  (
                    document.getElementById('action_modal') as HTMLDialogElement
                  ).showModal();
                }}
                className="btn btn-sm btn-outline"
              >
                {x.label}
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedQuery(undefined);
                (
                  document.getElementById('action_modal') as HTMLDialogElement
                ).showModal();
              }}
              className="btn btn-sm btn-outline"
            >
              <IconPlus /> Add Action
            </button>
          </div>
        </div>
      )}
      Preview:
      {action == ActionTypeEnum.REWARD && (
        <PreviewBlinksActionButton actions={tempPost?.links?.actions} />
      )}
      {action == ActionTypeEnum.SUBSCRIBE && (
        <SubscribeBtn mintId={tempPost?.mint || null} subscribeOnly={true} />
      )}
      {action == ActionTypeEnum.REWARD && (
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

export const OverallPostCampaignModal: FC<{
  tempPost: any | undefined;
  setTempPost: Dispatch<SetStateAction<any>>;
}> = ({ tempPost, setTempPost }) => {
  const currentTime = Date.now();
  const [mint, setMint] = useState('');
  const [allocatedBudget, setAllocatedBudget] = useState('');
  const [eligibility, setEligibility] = useState(Eligibility.ONCE_PER_ADDRESS);
  const [endDate, setEndDate] = useState<number | undefined>();
  const [duration, setDuration] = useState(Duration.UNTILL_BUDGET_FINISHES);
  useEffect(() => {
    if (tempPost) {
      setMint(tempPost.mint);
      setAllocatedBudget(tempPost.campaign?.tokensRemaining?.toString() || '');
      setEligibility(
        tempPost.campaign?.eligibility || Eligibility.ONCE_PER_ADDRESS
      );
      setEndDate(tempPost.campaign?.endDate);
      setDuration(
        tempPost.campaign?.endDate
          ? Duration.CUSTOM_DATE
          : Duration.UNTILL_BUDGET_FINISHES
      );
    } else {
      setMint('');
      setAllocatedBudget('');
      setEligibility(Eligibility.ONCE_PER_ADDRESS);
      setEndDate(undefined);
      setDuration(Duration.UNTILL_BUDGET_FINISHES);
    }
  }, [tempPost]);

  return (
    <dialog id="overall_post_campaign_modal" className="modal">
      <div className="modal-box flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-center">
            {tempPost ? 'Edit Overall Budget' : 'Set Overall Budget'}
          </span>
          <form method="dialog">
            <button>
              <IconX />
            </button>
          </form>
        </div>
        <label className="input input-bordered text-base flex items-center gap-2">
          Mint
          <input
            type="string"
            className="grow text-end"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            placeholder="Enter a mint address"
          />
        </label>
        <label className="input input-bordered text-base flex items-center gap-2">
          Budget
          <input
            type="number"
            className="grow text-end"
            value={allocatedBudget}
            onChange={(e) => setAllocatedBudget(e.target.value)}
            placeholder="How many tokens do you want to give out?"
          />
          {`${
            tempPost.campaign.budget
              ? `/ ${formatLargeNumber(tempPost.campaign.budget)} left`
              : ''
          }`}
        </label>
        <label className="flex px-2 justify-between items-center gap-2">
          Elligibility
          <select
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value as Eligibility)}
            className="select bg-transparent w-fit sm:w-full border-none focus-within:outline-none max-w-xs"
          >
            {Object.entries(Eligibility).map((x) => (
              <option key={x[0]}>{x[1]}</option>
            ))}
          </select>
        </label>
        <label className="flex px-2 justify-between items-center gap-2">
          Duration
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as Duration)}
            className="select bg-transparent w-fit sm:w-full border-none focus-within:outline-none max-w-xs"
          >
            {Object.entries(Duration).map((x) => (
              <option key={x[0]}>{x[1]}</option>
            ))}
          </select>
        </label>
        {duration == Duration.CUSTOM_DATE && (
          <label className="flex px-2 justify-between items-center gap-2">
            End Date
            <input
              type="date"
              id="campaign start date"
              className="cursor-pointer input input-bordered w-fit sm:w-full max-w-xs"
              onChange={(e) => setEndDate(Date.parse(e.target.value))}
              value={getDDMMYYYY(new Date(endDate || currentTime))}
              min={currentTime}
            />
          </label>
        )}
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              const difference =
                parseInt(allocatedBudget) -
                (tempPost.campaign.tokensRemaining || 0);
              setTempPost({
                ...(tempPost || {}),
                campaign: {
                  id: generateRandomU64Number(),
                  ...(tempPost?.campaign || {}),
                  mint: mint,
                  endDate: endDate,
                  eligibility: eligibility,
                  budget: tempPost.campaign.budget
                    ? tempPost.campaign.budget + difference
                    : difference,
                  tokensRemaining:
                    (tempPost.campaign.tokensRemaining || 0) + difference,
                  amount: difference,
                },
              });
              (
                document.getElementById(
                  'overall_post_campaign_modal'
                ) as HTMLDialogElement
              ).close();
            }}
            className="btn btn-primary btn-sm"
          >
            Set Budget
          </button>
        </div>
      </div>
    </dialog>
  );
};

export const ActionModal: FC<{
  tempPost: PostContent | undefined;
  setTempPost: Dispatch<SetStateAction<any>>;
  query?: LinkedAction;
}> = ({ tempPost, setTempPost, query }) => {
  const action = tempPost?.campaign?.amountPerQuery?.find(
    (x) => query && x.linkedAction == JSON.stringify(query)
  );
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
          validation: action.query.find((q) => q.key == x.name && !q.value)
            ?.validation,
        })) || []
      );
    } else {
      setAdditionalFields([]);
    }
  }, [query, action]);

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
        <label className="input input-bordered text-base flex items-center gap-2">
          Label
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            type="text"
            className="grow text-end"
            placeholder=""
          />
        </label>
        <label className="input input-bordered text-base flex items-center gap-2">
          Amount
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            className="grow text-end"
            placeholder="How much should each user receive?"
          />
        </label>
        <div className="overflow-y-scroll flex flex-col gap-4 scrollbar-none">
          {additionalFields.map((x, index) => (
            <div
              key={x.id}
              className="border input-bordered rounded p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                {`Additional Field ${index + 1}`}
                <button
                  onClick={() =>
                    setAdditionalFields((previous) =>
                      previous.filter((y) => y.id !== x.id)
                    )
                  }
                >
                  <IconTrash />
                </button>
              </div>
              <label className="flex px-2 justify-between items-center gap-2">
                Type
                <select
                  value={x.type}
                  onChange={(e) =>
                    setAdditionalFields((previous) =>
                      previous.map((p) => {
                        if (p.id == x.id) {
                          return {
                            ...p,
                            type: e.target.value as
                              | 'number'
                              | 'text'
                              | 'email'
                              | 'url'
                              | 'date'
                              | 'datetime-local'
                              | 'textarea',
                          };
                        }
                        return p;
                      })
                    )
                  }
                  className="select bg-transparent w-fit sm:w-full border-none focus-within:outline-none max-w-xs"
                >
                  {[
                    'number',
                    'text',
                    'email',
                    'url',
                    'date',
                    'datetime-local',
                    'textarea',
                  ].map((x, index) => (
                    <option key={index}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="input input-bordered text-base flex items-center gap-2">
                {(x.type == 'datetime-local' || x.type == 'date') && (
                  <span className="text-sm">Field Name</span>
                )}
                <input
                  value={x.fieldName}
                  onChange={(e) =>
                    setAdditionalFields((previous) =>
                      previous.map((p) => {
                        if (p.id == x.id) {
                          return {
                            ...p,
                            fieldName: e.target.value,
                          };
                        }
                        return p;
                      })
                    )
                  }
                  type={x.type}
                  className="grow"
                  placeholder="Field Name"
                />
              </label>
              <label className="input input-bordered text-base flex items-center gap-2">
                {(x.type == 'datetime-local' || x.type == 'date') && (
                  <span className="text-sm">Placeholder</span>
                )}
                <input
                  value={x.placeholder}
                  onChange={(e) =>
                    setAdditionalFields((previous) =>
                      previous.map((p) => {
                        if (p.id == x.id) {
                          return {
                            ...p,
                            placeholder: e.target.value,
                          };
                        }
                        return p;
                      })
                    )
                  }
                  type="text"
                  className="grow"
                  placeholder="Placeholder"
                />
              </label>
              <label className="input input-bordered text-base flex items-center gap-2">
                {(x.type == 'datetime-local' || x.type == 'date') && (
                  <span className="text-sm">Validation Text</span>
                )}
                <input
                  value={x.validation}
                  onChange={(e) =>
                    setAdditionalFields((previous) =>
                      previous.map((p) => {
                        if (p.id == x.id) {
                          return {
                            ...p,
                            validation: e.target.value,
                          };
                        }
                        return p;
                      })
                    )
                  }
                  type={x.type}
                  className="grow"
                  placeholder="Validation Text"
                />
              </label>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            setAdditionalFields((previous) => [
              ...previous,
              {
                validation: '',
                fieldName: '',
                placeholder: '',
                type: 'text',
                id: crypto.randomUUID(),
              },
            ])
          }
          className="btn w-fit btn-sm"
        >
          <IconPlus />
          Add Additional Field
        </button>
        <div className="flex items-center justify-end gap-2">
          {action && query && (
            <button
              onClick={() => {
                setTempPost({
                  ...(tempPost || {}),
                  links: {
                    actions: (tempPost?.links?.actions || []).filter(
                      (x) => JSON.stringify(x) != JSON.stringify(query)
                    ),
                  },
                  campaign: {
                    ...(tempPost?.campaign || {}),
                    amountPerQuery: tempPost?.campaign?.amountPerQuery.filter(
                      (x) => x.linkedAction != JSON.stringify(query)
                    ),
                  },
                });
                (
                  document.getElementById('action_modal') as HTMLDialogElement
                ).close();
              }}
              className="btn btn-outline btn-sm"
            >
              Delete Action
            </button>
          )}
          <button
            onClick={() => {
              if (!tempPost) return;
              const newActionQuery = buildActionQuery(additionalFields, amount);
              let newLinkedAction = {
                href:
                  generatePostTransferApiEndPoint(tempPost.mint, tempPost.id) +
                  '&' +
                  newActionQuery
                    .map((q) => q.key + '=' + q.value || `{${q.key}}`)
                    .join('&'),
                label: label,
                parameters:
                  additionalFields.length > 0
                    ? additionalFields.map((x) => ({
                        type: x.type,
                        name: x.fieldName,
                        label: x.placeholder,
                      }))
                    : undefined,
              };
              let existingAmountPerQueryIndex =
                tempPost.campaign?.amountPerQuery?.findIndex(
                  (x) => query && x.linkedAction == JSON.stringify(query)
                );
              let newAmountPerQuery =
                existingAmountPerQueryIndex != undefined &&
                existingAmountPerQueryIndex != -1
                  ? tempPost.campaign?.amountPerQuery.map((x, index) => {
                      if (index == existingAmountPerQueryIndex) {
                        return {
                          linkedAction: JSON.stringify(newLinkedAction),
                          query: newActionQuery,
                          amount: parseInt(amount),
                        };
                      }
                      return x;
                    }) || []
                  : (tempPost.campaign?.amountPerQuery || []).concat({
                      linkedAction: JSON.stringify(newLinkedAction),
                      query: newActionQuery,
                      amount: parseInt(amount),
                    });
              let existingLinkedActionIndex = tempPost.links?.actions.findIndex(
                (x) => query && JSON.stringify(x) == JSON.stringify(query)
              );
              let newLinkedActions =
                existingLinkedActionIndex != undefined &&
                existingLinkedActionIndex != -1
                  ? tempPost.links?.actions.map((x, index) => {
                      if (index == existingLinkedActionIndex) {
                        return newLinkedAction;
                      }
                      return x;
                    }) || []
                  : (tempPost.links?.actions || []).concat(newLinkedAction);
              setTempPost({
                ...tempPost,
                links: {
                  actions: newLinkedActions,
                },
                campaign: {
                  ...tempPost?.campaign,
                  amountPerQuery: newAmountPerQuery,
                },
              });
              (
                document.getElementById('action_modal') as HTMLDialogElement
              ).close();
              setAmount('');
              setLabel('');
              setAdditionalFields([]);
            }}
            className="btn btn-primary btn-sm"
          >
            {action ? 'Edit' : 'Add'} Action
          </button>
        </div>
      </div>
    </dialog>
  );
};

function buildActionQuery(
  additionalFields: {
    id: string;
    type: any;
    fieldName: string;
    placeholder?: string;
    validation?: string;
  }[],
  amount?: string
) {
  const result = [];
  let base: { key: string; value?: string; validation?: string } = {
    key: 'amount',
  };
  if (amount) {
    base['value'] = amount;
  }
  result.push(base);
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
    const placeholder = !parameter ? it.label : parameter.label;
    const name = !parameter ? it.label : parameter.name;

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
