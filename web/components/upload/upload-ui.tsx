'use client';

import { uploadMedia } from '@/utils/firebase/functions';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconEye,
  IconPhoto,
  IconPlus,
  IconVideo,
  IconX,
} from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { Blinks } from '../blinks/blinks-ui';
import { CreateAccountBtn } from '../create/create-ui';
import {
  useGetToken,
  useGetTokenDetails,
} from '../profile/profile-data-access';
import {
  PostContent,
  VideoContent,
  checkUrlIsValid,
  useUploadMutation,
} from './upload.data-access';

export const UploadBtn: FC<{ mintId?: string }> = ({ mintId }) => {
  const router = useRouter();
  return (
    <button
      onClick={() =>
        router.push(`/content/create${mintId ? `?mintId=${mintId}` : ''}`)
      }
      className="btn btn-sm btn-outline "
    >
      <IconPlus />
      Upload
    </button>
  );
};
export enum ContentType {
  POST = 'Post',
}
interface UploadProps {
  mintId?: string;
  id?: string;
}

export const Upload: FC<UploadProps> = ({ mintId, id }) => {
  const { publicKey } = useWallet();

  const { data } = useGetToken({ address: publicKey });

  const { data: metadataQuery } = useGetTokenDetails({
    mint: data ? new PublicKey(data[0].mint) : null,
  });

  if (data && mintId && data[0].mint.toBase58() != mintId) {
    return (
      <div className="flex flex-col max-w-2xl h-full items-center justify-center w-full text-center">
        <span>You are not the creator of this token.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 my-4 items-center w-full p-4 pb-32">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        {id ? 'Edit Post' : 'Create a New Post'}
      </span>
      <div className="flex flex-col gap-4 items-center max-w-md w-full">
        <UploadPost
          id={id}
          mint={metadataQuery?.id}
          content={
            metadataQuery &&
            metadataQuery.additionalInfoData &&
            metadataQuery.additionalInfoData.content
              ? (metadataQuery.additionalInfoData.content.find(
                  (x) => x.id == id
                ) as PostContent) || undefined
              : undefined
          }
        />
      </div>
    </div>
  );
};

export const UploadContentBtn: FC<{
  id?: string;
  mint?: string;
  content:
    | PostContent
    | { file: UploadFileTypes[]; caption: string }
    | undefined;
}> = ({ mint, content, id }) => {
  const { publicKey } = useWallet();
  const uploadMutation = useUploadMutation({
    mint: mint ? new PublicKey(mint) : null,
  });
  const [loading, setLoading] = useState(false);
  return (
    <div className="w-full">
      {publicKey && mint && (
        <button
          disabled={!content || loading}
          onClick={async () => {
            if (!content || !mint) return;
            setLoading(true);

            let postContent = content as {
              file: UploadFileTypes[];
              caption: string;
            };
            const carousel = await Promise.all(
              postContent.file.map(async (x) => {
                const mediaUrl = x.file
                  ? await uploadMedia(x.file, new PublicKey(mint))
                  : x.uri;
                if (x.fileType.startsWith('image/') || x.fileType == 'blinks') {
                  return {
                    uri: mediaUrl,
                    fileType: x.fileType,
                  };
                } else if (x.fileType.startsWith('video/')) {
                  return {
                    uri: mediaUrl,
                    fileType: x.fileType,
                    duration: x.duration,
                  };
                }
              })
            );
            if (carousel.length > 0) {
              await uploadMutation.mutateAsync({
                content: {
                  id: id ? id : crypto.randomUUID(),
                  type: ContentType.POST,
                  caption: postContent.caption,
                  carousel: carousel,
                } as PostContent,
              });
            } else {
              toast.error('No Files Found');
            }

            setLoading(false);
          }}
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
      )}
      {publicKey && !mint && <CreateAccountBtn />}
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
  uri: string;
  id: string;
  duration?: number;
  thumbnail?: string;
}

export const UploadPost: FC<{
  content: PostContent | undefined;
  mint?: string;
  id?: string;
}> = ({ content, mint, id }) => {
  const [files, setFiles] = useState<UploadFileTypes[]>([]);
  const previousFilesRef = useRef(files);
  const [caption, setCaption] = useState('');
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [captionLoaded, setCaptionLoaded] = useState(false);
  const [selectedBlink, setSelectedBlink] = useState<UploadFileTypes>();
  const [uri, setUri] = useState('');

  useEffect(() => {
    if (checkUrlIsValid(uri)) {
      const existingIndex = files.findIndex((item) => item.id === 'blinks');
      if (existingIndex > -1) {
        files[existingIndex] = {
          fileType: 'blinks',
          uri: uri,
          id: 'blinks',
        };
        setFiles(files);
        handleScroll('blinks');
      }
    }
  }, [uri]);

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
              uri: x.uri,
              id: crypto.randomUUID(),
            };
          } else if (x.fileType == 'blinks') {
            return {
              fileType: x.fileType,
              uri: x.uri,
              id: 'blinks',
            };
          } else {
            let videoContent = x as VideoContent;
            return {
              fileType: videoContent.fileType,
              uri: videoContent.uri,
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

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setSelectedBlink(files.find((x) => x.id == 'blinks'));
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  useEffect(() => {
    const previousFiles = previousFilesRef.current;
    if (files.length > previousFiles.length) {
      handleScroll(files[files.length - 1].id);
    }
    previousFilesRef.current = files;
  }, [files]);

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
            uri: url,
            id: id,
          }
        : { fileType: selectedFile.type, file: selectedFile, uri: url, id: id };
      setFiles((previous) => [...previous, file]);
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
      <div className="w-full relative">
        <div className="absolute top items-center flex">
          <div className="flex gap-2 items-center">
            {files.map((file) => (
              <button
                key={file.id}
                className="aspect-square w-14 h-14 relative border border-base-content flex items-center"
                onClick={() => handleScroll(file.id)}
              >
                {file.fileType.startsWith('image') && (
                  <>
                    <Image
                      className={`cursor-pointer object-contain`}
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
                      className={`cursor-pointer object-contain`}
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
                {file.fileType == 'blinks' && (
                  <>
                    {checkUrlIsValid(file.uri) ? (
                      <Blinks
                        actionUrl={new URL(file.uri)}
                        hideCaption={true}
                        hideUserPanel={true}
                        hideComment={true}
                      />
                    ) : (
                      <div />
                    )}
                    <div className="absolute btn btn-xs p-0 bottom-1 right-1">
                      <IconEye />
                    </div>
                  </>
                )}
              </button>
            ))}
            <div className="dropdown dropdown-hover dropdown-right">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-outline rounded-none w-14 h-14"
              >
                <IconPlus />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 border rounded z-10 p-2 shadow"
              >
                <li>
                  <button
                    onClick={() => {
                      setFiles((previous) => [
                        ...previous,
                        {
                          fileType: 'blinks',
                          uri: '',
                          id: 'blinks',
                        },
                      ]);
                    }}
                  >
                    Blinks
                  </button>
                </li>
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
                      className="hidden text-base"
                      name="dropzone-file-video"
                      onChange={handleFilesAdd}
                    />
                  </label>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-16">
          {selectedBlink && (
            <input
              type="url"
              autoFocus={true}
              placeholder="Add Blink Url"
              className="input input-bordered w-full text-base mb-4"
              value={uri?.toString()}
              onChange={(e) => {
                setUri(e.target.value);
              }}
            />
          )}
          {files.length == 0 ? (
            <div className="flex flex-col w-full h-full aspect-square items-center justify-center bg-base-100 border z-0 rounded">
              <span className="font-semibold">Add a Blink/ Image / Video </span>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="carousel w-full z-0">
                {files.map((file) => (
                  <div
                    id={file.id}
                    key={file.id}
                    className="carousel-item relative z-0 items-center flex aspect-square w-full"
                  >
                    {file.fileType == 'blinks' &&
                      (checkUrlIsValid(file.uri) ? (
                        <Blinks
                          actionUrl={new URL(file.uri)}
                          hideCaption={true}
                          hideUserPanel={true}
                          hideComment={true}
                        />
                      ) : (
                        <div />
                      ))}
                    {file.fileType.startsWith('image/') && (
                      <Image
                        className={`object-contain`}
                        fill={true}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        src={file.uri}
                        alt={''}
                      />
                    )}
                    {file.fileType.startsWith('video/') && (
                      <video
                        ref={handleVideoRef(file.id)}
                        width="300"
                        height="300"
                        className="w-full h-full"
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
                        if (file.fileType == 'blinks') {
                          setSelectedBlink(undefined);
                        }
                        setFiles((previous) =>
                          previous.filter((x) => x.id != file.id)
                        );
                      }}
                      className="absolute btn rounded-full btn-sm px-2 z-1 top-4 right-4"
                    >
                      <IconX />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center w-full">
                {selectedBlink ? (
                  checkUrlIsValid(selectedBlink.uri) ? (
                    <Blinks
                      actionUrl={new URL(selectedBlink.uri)}
                      hideCaption={false}
                      hideCarousel={true}
                      hideComment={true}
                      hideUserPanel={true}
                      expandAll={true}
                    />
                  ) : (
                    <div />
                  )
                ) : (
                  <textarea
                    maxLength={200}
                    placeholder="Insert your caption here..."
                    className="mt-4 textarea textarea-bordered leading-normal textarea-base text-base w-full h-24 overflow-hidden"
                    value={caption}
                    onChange={handleCaptionChange}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <UploadContentBtn
        id={id}
        mint={mint}
        content={{ file: files, caption: caption }}
      />
    </div>
  );
};

// interface UploadComponentProps {
//   content: BlinkContent | undefined;
//   id?: string;
//   mint?: string;
// }

// export const UploadBlinks: FC<UploadComponentProps> = ({
//   id,
//   mint,
//   content,
// }) => {
//   const [uri, setUri] = useState('');
//   const [uriLoaded, setUriLoaded] = useState(false);
//   useEffect(() => {
//     if (!uriLoaded && uri == '' && content && content.uri != '') {
//       setUri(content.uri);
//       setUriLoaded(true);
//     }
//   }, [content, uri]);
//   const validUrl = useMemo(() => {
//     try {
//       const result = new URL(uri);
//       return result;
//     } catch (e) {
//       return null;
//     }
//   }, [uri]);

//   const blinkContent: BlinkContent | undefined =
//     validUrl && mint
//       ? {
//           mint: mint,
//           uri: validUrl.toString(),
//           type: ContentType.BLINKS,
//           id: crypto.randomUUID(),
//         }
//       : undefined;

//   return (
//     <div className="flex flex-col gap-4 w-full">
//       <div className="flex items-center gap-4">
//         <input
//           type="url"
//           placeholder="Add Blink Url"
//           className="input input-bordered w-full text-base"
//           value={uri?.toString()}
//           onChange={(e) => setUri(e.target.value)}
//         />
//       </div>
//       {validUrl && (
//         <div className="bg-base-100 border rounded">
//           <Blinks hideComment={true} actionUrl={validUrl} />
//         </div>
//       )}
//       <UploadContentBtn
//         id={id}
//         mint={mint}
//         content={blinkContent}
//         contentType={ContentType.BLINKS}
//       />
//     </div>
//   );
// };
