'use client';

import { uploadMedia } from '@/utils/firebase/functions';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconCheck,
  IconChevronDown,
  IconPhoto,
  IconPlus,
  IconVideo,
  IconX,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { Blinks } from '../blinks/blinks-ui';
import { CreateAccountBtn } from '../create/create-ui';
import {
  useGetMintMetadata,
  useGetToken,
} from '../dashboard/dashboard-data-access';
import { AuthorityData } from '../dashboard/dashboard-ui';
import {
  BlinkContent,
  Content,
  PostContent,
  VideoContent,
  useUploadMutation,
} from './upload.data-access';

export const UploadBtn: FC = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/content/create')}
      className="btn btn-sm btn-outline "
    >
      <IconPlus />
      Upload
    </button>
  );
};

export enum ContentType {
  POST = 'POST',
  BLINKS = 'BLINKS',
}

interface UploadProps {
  mintId?: string;
  id?: string;
}

export const Upload: FC<UploadProps> = ({ mintId, id }) => {
  const [content, setContent] = useState<
    Content | { file: UploadFileTypes[]; caption: string }
  >();

  const { data: metadataQuery } = useGetMintMetadata({
    mint: mintId ? new PublicKey(mintId) : undefined,
  });

  const [contentType, setContentType] = useState(ContentType.POST);
  const { publicKey } = useWallet();
  const { data } = useGetToken({ address: publicKey });
  return (
    <div className="flex flex-col gap-8 my-4 items-center w-full p-4">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        {mintId ? 'Edit a Post' : 'Create a New Post'}
      </span>
      <div className="flex flex-col gap-4 items-center max-w-md w-full">
        <div className="flex gap-4 w-full items-center">
          <span className="whitespace-nowrap font-semibold">Content Type:</span>
          <div className="dropdown w-full ">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-sm w-full btn-outline flex justify-between"
            >
              {contentType}
              <IconChevronDown />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow"
            >
              {Object.entries(ContentType).map((x) => (
                <li onClick={() => setContentType(x[1])} key={x[0]}>
                  <a>{x[0]}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {contentType == ContentType.BLINKS && (
          <UploadBlinks
            setContent={setContent}
            content={
              !content && metadataQuery && metadataQuery.content
                ? (metadataQuery.content.find(
                    (x) => x.id == id && x.type == ContentType.BLINKS
                  ) as BlinkContent) || undefined
                : (content as BlinkContent)
            }
          />
        )}
        {contentType == ContentType.POST && (
          <UploadPost
            setContent={setContent}
            content={
              !content && metadataQuery && metadataQuery.content
                ? (metadataQuery.content.find(
                    (x) => x.id == id && x.type == ContentType.POST
                  ) as PostContent) || undefined
                : (content as PostContent)
            }
          />
        )}
        <UploadContent
          id={id}
          mintId={mintId}
          content={content}
          publicKey={publicKey}
          data={data}
          contentType={contentType}
        />
      </div>
    </div>
  );
};

export const UploadContent: FC<{
  id?: string;
  mintId?: string;
  contentType: ContentType;
  content: Content | { file: UploadFileTypes[]; caption: string } | undefined;
  publicKey: PublicKey | null;
  data: AuthorityData[] | null | undefined;
}> = ({ mintId, content, data, publicKey, contentType, id }) => {
  const uploadMutation = useUploadMutation({
    mint: mintId ? new PublicKey(mintId) : data ? data[0].mint : null,
  });
  return (
    <div className="w-full">
      {publicKey && data && (
        <button
          disabled={!content || uploadMutation.isPending}
          onClick={async () => {
            if (!content) return;
            try {
              if (contentType == ContentType.BLINKS) {
                const blinkContent = content as BlinkContent;
                if (id) {
                  blinkContent.id = id;
                }
                await uploadMutation.mutateAsync({
                  content: blinkContent,
                });
              } else {
                let postContent = content as {
                  file: UploadFileTypes[];
                  caption: string;
                };
                await uploadMutation.mutateAsync({
                  content: {
                    createdAt: Math.round(Date.now() / 1000),
                    updatedAt: Math.round(Date.now() / 1000),
                    id: id ? id : crypto.randomUUID(),
                    type: ContentType.POST,
                    caption: postContent.caption,
                    carousel: await Promise.all(
                      postContent.file.map(async (x) => {
                        const mediaUrl = x.file
                          ? await uploadMedia(x.file, data[0].mint)
                          : x.url;
                        if (x.fileType.startsWith('image/')) {
                          return {
                            uri: mediaUrl,
                            fileType: x.fileType,
                          };
                        } else {
                          return {
                            uri: mediaUrl,
                            fileType: x.fileType,
                            duration: x.duration,
                          };
                        }
                      })
                    ),
                  } as PostContent,
                });
              }
            } catch (e) {
              console.log(e);
            }
          }}
          className="btn btn-primary w-full"
        >
          {uploadMutation.isPending ? (
            <div className="loading loading-spinner loading-sm" />
          ) : contentType == ContentType.BLINKS ? (
            'Upload Blink'
          ) : id ? (
            'Edit Post'
          ) : (
            'Create Post'
          )}
        </button>
      )}
      {publicKey && !data && <CreateAccountBtn />}
      {!publicKey && (
        <div className="w-full">
          <AuthenticationBtn
            children={
              <div className="btn w-full btn-primary rounded">
                Connect Wallet
              </div>
            }
          />
        </div>
      )}
    </div>
  );
};

interface UploadFileTypes {
  file?: File;
  fileType: string;
  url: string;
  id: string;
  duration?: number;
  thumbnail?: string;
}

export const UploadPost: FC<{
  content: PostContent | undefined;
  setContent: Dispatch<
    SetStateAction<
      Content | { file: UploadFileTypes[]; caption: string } | undefined
    >
  >;
}> = ({ content, setContent }) => {
  const [files, setFiles] = useState<UploadFileTypes[]>([]);
  const [caption, setCaption] = useState('');
  const router = useRouter();
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [captionLoaded, setCaptionLoaded] = useState(false);

  useEffect(() => {
    if (
      !filesLoaded &&
      files.length == 0 &&
      content &&
      content.carousel &&
      content.carousel.length > 0
    ) {
      setFiles(
        content.carousel.map((x) => {
          if (x.fileType.startsWith('image/')) {
            return {
              fileType: x.fileType,
              url: x.uri,
              id: crypto.randomUUID(),
            };
          } else {
            let videoContent = x as VideoContent;
            return {
              fileType: videoContent.fileType,
              url: videoContent.uri,
              id: crypto.randomUUID(),
              duration: videoContent.duration,
            };
          }
        })
      );
      setFilesLoaded(true);
    }

    if (!captionLoaded && caption == '' && content && content.caption != '') {
      setCaption(content.caption);
      setCaptionLoaded(true);
    }
  }, [files, content, caption]);

  const handleCaptionChange = (e: any) => {
    setCaption(e.target.value);
  };

  const captureThumbnail = (id: string) => {
    const video = videoRefs.current[id];
    if (video) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setFiles((previous) =>
          previous.map((file) =>
            file.id === id
              ? { ...file, thumbnail: dataUrl, duration: video.duration }
              : file
          )
        );
      }
    }
  };

  const handleLoadedMetadata = (id: string) => {
    const video = videoRefs.current[id];
    if (video) {
      video.currentTime = 1; // Seek to 1 second to capture the thumbnail
      video.addEventListener('seeked', () => captureThumbnail(id), {
        once: true,
      });
    }
  };

  useEffect(() => {
    if (((files.length > 0 || caption != '') && !content) || content) {
      setContent({ file: files, caption: caption });
    }
  }, [files, caption]);

  const handleFilesAdd = (e: any) => {
    if (files.length >= 3) {
      toast.error('A maximum of 3 files can be added in a post');
      return;
    }
    const selectedFile = e.target.files[0];
    if (selectedFile !== undefined) {
      if (selectedFile.size > 1e8) {
        toast.error('File size exceeded maximum allowed 100MB');
        return;
      }
      const url = URL.createObjectURL(selectedFile);
      const id = crypto.randomUUID();
      const file = (selectedFile as File).type.startsWith('image/')
        ? {
            file: selectedFile,
            fileType: selectedFile.type,
            url: url,
            id: id,
          }
        : { fileType: selectedFile.type, file: selectedFile, url: url, id: id };
      setFiles((previous) => [...previous, file]);
      router.push(`#${id}`);
    }
  };

  const handleVideoRef = (id: string) => (el: HTMLVideoElement | null) => {
    if (el) {
      el.setAttribute('crossorigin', 'anonymous');
      videoRefs.current[id] = el;
    }
  };
  return (
    <div className="flex flex-col w-full gap-4">
      <div className="w-full relative pb-16">
        {files.length == 0 ? (
          <div className="flex flex-col w-full h-full aspect-square items-center justify-center bg-base-300 z-0 rounded">
            <span className="font-semibold">Add an Image / Video</span>
          </div>
        ) : (
          <div className="carousel w-full bg-base-300 rounded">
            {files.map((file) => (
              <div
                id={file.id}
                key={file.id}
                className="carousel-item relative items-center flex aspect-square w-full"
              >
                {file.fileType.startsWith('image/') && (
                  <Image
                    className={`rounded object-contain`}
                    fill={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    src={file.url}
                    alt={''}
                  />
                )}
                {file.fileType.startsWith('video/') && (
                  <video
                    ref={handleVideoRef(file.id)}
                    width="300"
                    height="300"
                    className="w-full h-full rounded"
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    onLoadedMetadata={() => handleLoadedMetadata(file.id)}
                  >
                    <source src={file.url} type={file.fileType} />
                    Your browser does not support the video tag.
                  </video>
                )}
                <button
                  onClick={() =>
                    setFiles((previous) =>
                      previous.filter((x) => x.id != file.id)
                    )
                  }
                  className="absolute btn rounded-full btn-sm px-2 z-1 top-4 right-4"
                >
                  <IconX />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="absolute -bottom-18 mt-2 items-center flex">
          <div className="flex gap-2 items-center">
            {files.map((file) => (
              <Link
                key={file.id}
                className="aspect-square w-14 h-14 relative rounded bg-base-300 flex items-center"
                href={`#${file.id}`}
              >
                {file.fileType.startsWith('image') && (
                  <>
                    <Image
                      className={`cursor-pointer rounded object-contain`}
                      fill={true}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      src={file.url}
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
                      className={`cursor-pointer rounded object-contain`}
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
              </Link>
            ))}
            <div className="dropdown dropdown-hover dropdown-right">
              <div
                tabIndex={0}
                role="button"
                className="btn m-1 btn-outline rounded w-14 h-14"
              >
                <IconPlus />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-200 rounded-box z-1 p-2 shadow"
              >
                <li>
                  <label htmlFor="dropzone-file-image">
                    Image
                    <input
                      multiple
                      id="dropzone-file-image"
                      type="file"
                      className="hidden"
                      name="dropzone-file-image"
                      accept="image/*"
                      onChange={handleFilesAdd}
                    />
                  </label>
                </li>
                <li>
                  <label htmlFor="dropzone-file-video">
                    Video
                    <input
                      multiple
                      id="dropzone-file-video"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      name="dropzone-file-video"
                      onChange={handleFilesAdd}
                    />
                  </label>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full">
        <textarea
          maxLength={200}
          placeholder="Insert your caption here..."
          className="textarea textarea-bordered leading-normal textarea-sm w-full h-24 overflow-hidden"
          value={caption}
          onChange={handleCaptionChange}
        />
      </div>
    </div>
  );
};

interface UploadComponentProps {
  content: BlinkContent | undefined;
  setContent: Dispatch<
    SetStateAction<
      Content | { file: UploadFileTypes[]; caption: string } | undefined
    >
  >;
}

export const UploadBlinks: FC<UploadComponentProps> = ({
  content,
  setContent,
}) => {
  const [uri, setUri] = useState('');
  const [uriLoaded, setUriLoaded] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!uriLoaded && uri == '' && content && content.uri != '') {
      setUri(content.uri);
      setUriLoaded(true);
    }
  }, [content, uri]);
  const validUrl = useMemo(() => {
    try {
      const result = new URL(uri);
      return result;
    } catch (e) {
      return null;
    }
  }, [uri]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-4">
        <input
          type="url"
          placeholder="Add Blink Url"
          className="input input-bordered w-full"
          value={uri?.toString()}
          onChange={(e) => setUri(e.target.value)}
        />
        <button
          onClick={() => {
            if (validUrl) {
              const blinkContent: BlinkContent = {
                uri: validUrl.toString(),
                type: ContentType.BLINKS,
                createdAt: Math.round(Date.now() / 1000),
                updatedAt: Math.round(Date.now() / 1000),
                id: crypto.randomUUID(),
              };
              setContent(blinkContent);
              setAdded(true);
            }
          }}
          className="btn btn-square btn-outline btn-sm rounded-full"
        >
          {added ? <IconCheck /> : <IconPlus />}
        </button>
      </div>

      {validUrl && (
        <div className="bg-base-300 rounded">
          <Blinks actionUrl={validUrl} />
        </div>
      )}
    </div>
  );
};
