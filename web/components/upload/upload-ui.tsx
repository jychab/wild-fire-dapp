'use client';

import { Scope } from '@/utils/enums/das';
import { uploadMedia } from '@/utils/firebase/functions';
import {
  generatePostActionApiEndPoint,
  generatePostEndPoint,
} from '@/utils/helper/proxy';
import { PostContent, VideoContent } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconPhoto, IconPlus, IconVideo, IconX } from '@tabler/icons-react';
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
  checkUrlIsValid,
  useGetPost,
  useUploadMutation,
} from './upload.data-access';

export const UploadBtn: FC<{ mintId?: string }> = ({ mintId }) => {
  const router = useRouter();
  return (
    <button
      onClick={() =>
        router.push(`/post/create${mintId ? `?mintId=${mintId}` : ''}`)
      }
      className="btn btn-sm btn-outline "
    >
      <IconPlus />
      Create Post
    </button>
  );
};

interface UploadProps {
  mintId?: string;
  id?: string;
}

export const Upload: FC<UploadProps> = ({ mintId, id }) => {
  const { publicKey } = useWallet();
  const { data } = useGetToken({ address: publicKey });
  const { data: metadataQuery } = useGetTokenDetails({
    mint: data ? new PublicKey(data.mint) : null,
  });
  const { data: post } = useGetPost({
    mint: mintId ? new PublicKey(mintId) : null,
    postId: id,
  });
  if (
    data &&
    mintId &&
    data.mint != mintId &&
    !(
      publicKey &&
      metadataQuery?.authorities?.find(
        (x) =>
          x.scopes.includes(Scope.METADATA) || x.scopes.includes(Scope.FULL)
      )?.address == publicKey.toBase58()
    )
  ) {
    return (
      <div className="flex flex-col max-w-2xl h-full items-center justify-center w-full text-center">
        <span>You are not the update authority for this token.</span>
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
          mint={data ? new PublicKey(data?.mint) : null}
          post={post}
        />
      </div>
    </div>
  );
};

const UploadContentBtn: FC<{
  id?: string;
  mint: PublicKey | null;
  post?: { file: UploadFileTypes[]; title: string; description: string };
}> = ({ mint, post, id }) => {
  const { publicKey } = useWallet();
  const uploadMutation = useUploadMutation({
    mint: mint,
  });
  const [loading, setLoading] = useState(false);
  return (
    <div className="w-full">
      {publicKey && mint && (
        <button
          disabled={!post || loading}
          onClick={async () => {
            if (!post) return;
            setLoading(true);
            const carousel = (
              await Promise.all(
                post.file.map(async (x) => {
                  const mediaUrl = x.file
                    ? await uploadMedia(x.file, mint)
                    : x.uri;
                  if (x.fileType.startsWith('image/')) {
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
                  } else {
                    return null;
                  }
                })
              )
            ).filter((x) => x != null);
            const randomId = crypto.randomUUID();
            if (carousel.length > 0) {
              const iconUrl = carousel[0]!.fileType.startsWith('video/')
                ? await uploadMedia(
                    post.file.find((x) => x.fileType == carousel[0]!.fileType)
                      ?.thumbnailFile!,
                    mint
                  )
                : carousel[0]!.uri;
              await uploadMutation.mutateAsync({
                post: {
                  icon: iconUrl,
                  title: post.title,
                  description: post.description,
                  label: 'Subscribe',
                  url: generatePostEndPoint(
                    mint.toBase58(),
                    id ? id : randomId
                  ),
                  mint: mint.toBase58(),
                  id: id ? id : randomId,
                  carousel: carousel,
                  links: {
                    actions: [
                      {
                        href: generatePostActionApiEndPoint(
                          mint.toBase58(),
                          id ? id : randomId
                        ),
                        label: 'Subscribe',
                      },
                    ],
                  },
                },
              });
            } else if (post.file[0].fileType == 'blinks') {
              await uploadMutation.mutateAsync({
                post: {
                  url: carousel[0]!.uri,
                  mint: mint,
                  id: id ? id : randomId,
                },
              });
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
  thumbnailFile?: File;
}

export const UploadPost: FC<{
  post: PostContent | undefined | null;
  mint: PublicKey | null;
  id?: string;
}> = ({ post, mint, id }) => {
  const [files, setFiles] = useState<UploadFileTypes[]>([]);
  const previousFilesRef = useRef(files);
  const [useExistingBlink, setUseExistingBlink] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [uri, setUri] = useState('');

  useEffect(() => {
    const existingIndex = files.findIndex((item) => item.id === 'blinks');
    if (existingIndex > -1) {
      const updatedFiles = files.map((file, index) =>
        index === existingIndex ? { ...file, uri: uri } : file
      );
      setFiles(updatedFiles);
    }
  }, [uri]);

  useEffect(() => {
    if (!filesLoaded && files.length == 0 && post) {
      if (post.carousel && post.carousel.length > 0) {
        setUseExistingBlink(false);
        setFiles(
          post.carousel.map((x) => {
            if (x.fileType.startsWith('image/')) {
              return {
                fileType: x.fileType,
                uri: x.uri,
                id: crypto.randomUUID(),
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
        if (description == '' && post.description != '') {
          setDescription(post.description);
        }
        if (title == '' && post.title != '') {
          setTitle(post.title);
        }
      } else if (post.url) {
        setUseExistingBlink(true);
        setUri(post.url);
        setFiles([
          {
            fileType: 'blinks',
            uri: post.url,
            id: 'blinks',
          },
        ]);
      }
      setFilesLoaded(true);
    }
  }, [files, post, description]);

  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };

  const handleTitleChange = (e: any) => {
    setTitle(e.target.value);
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
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnail = new File([blob], `${id}-thumbnail.png`, {
              type: 'image/png',
            });

            const dataUrl = URL.createObjectURL(thumbnail);

            setFiles((previous) =>
              previous.map((file) =>
                file.id === id
                  ? {
                      ...file,
                      thumbnail: dataUrl,
                      duration: video.duration,
                      thumbnailFile: thumbnail,
                    }
                  : file
              )
            );
          }
        }, 'image/png');
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
      <label className="label flex w-fit gap-4">
        <span className="label-text">Use an Existing Blink</span>
        <input
          type="checkbox"
          className="toggle "
          checked={useExistingBlink}
          onChange={(e) => {
            if (e.target.checked) {
              setUri('');
              setFiles([
                {
                  fileType: 'blinks',
                  uri: '',
                  id: 'blinks',
                },
              ]);
            } else {
              setFiles((previous) =>
                previous.filter((x) => x.fileType !== 'blinks')
              );
            }
            setUseExistingBlink(e.target.checked);
          }}
        />
      </label>
      {useExistingBlink && (
        <input
          type="url"
          autoFocus={true}
          placeholder="Add a Blink Url"
          className="input input-bordered w-full text-base"
          value={uri?.toString()}
          onChange={(e) => {
            setUri(e.target.value);
          }}
        />
      )}

      <div className="w-full relative">
        {!useExistingBlink && (
          <div className="absolute top items-center flex">
            <div className="flex gap-2 items-center">
              {files.map((file) => (
                <button
                  key={file.id}
                  className="aspect-square w-14 h-14 relative flex border border-base-300 items-center justify-center"
                  onClick={() => handleScroll(file.id)}
                >
                  {file.fileType.startsWith('image') && (
                    <>
                      <Image
                        className={`cursor-pointer bg-base-content object-contain`}
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
                        className={`cursor-pointer bg-base-content object-contain`}
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
              <div className="dropdown dropdown-hover dropdown-right">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-outline border-base-300 rounded-none w-14 h-14"
                >
                  <IconPlus />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 border border-base-300 rounded z-10 p-2 shadow"
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
        )}
        <div className={`${!useExistingBlink ? 'mt-16' : ''}`}>
          {files.length == 0 ? (
            <div className="flex flex-col w-full h-full aspect-square items-center justify-center bg-base-100 border border-base-300 z-0 rounded">
              <span className="font-semibold">Add an Image / Video </span>
            </div>
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
                        />
                      ) : (
                        <div className="flex gap-2 flex-col items-center ">
                          <span>Url Is Invalid</span>
                          <div className="loading loading-dots" />
                        </div>
                      ))}
                    {file.fileType.startsWith('image/') && (
                      <Image
                        className={`object-contain bg-base-content`}
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
                        className="w-full h-full bg-base-content"
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
              {!useExistingBlink && (
                <div className="flex items-center w-full">
                  <input
                    autoFocus={true}
                    type="text"
                    maxLength={80}
                    placeholder="Add a title"
                    className="mt-4 leading-normal input rounded input-sm input-bordered px-4 text-base bg-base-100 w-full"
                    value={title}
                    onChange={handleTitleChange}
                  />
                </div>
              )}
              {!useExistingBlink && (
                <div className="flex items-center justify-center w-full">
                  <textarea
                    maxLength={200}
                    placeholder="Add a description"
                    className="mt-2 textarea leading-normal rounded textarea-base textarea-bordered text-base w-full h-24 overflow-hidden"
                    value={description}
                    onChange={handleDescriptionChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UploadContentBtn
        id={id}
        mint={mint}
        post={{ file: files, description: description, title: title }}
      />
    </div>
  );
};
