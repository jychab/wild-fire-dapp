'use client';

import { uploadMedia } from '@/utils/firebase/functions';
import {
  generatePostEndPoint,
  generatePostSubscribeApiEndPoint,
} from '@/utils/helper/proxy';
import { PostContent } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconPhoto, IconPlus, IconVideo, IconX } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { Blinks } from '../blinks/blinks-feature';
import { CreateAccountBtn } from '../create/create-ui';
import { checkUrlIsValid, useUploadMutation } from './upload.data-access';

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

  const updateFiles = useCallback(
    (newFiles: any) => {
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
    },
    [setFiles]
  );

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
  }, [post, filesLoaded, files]);

  useEffect(() => {
    if (uri) {
      updateFiles({ id: 'blinks', uri });
    }
  }, [uri, files, updateFiles]);

  const handleInputChange = (setter: (value: string) => void) => (e: any) => {
    setter(e.target.value);
  };

  const captureThumbnail = useCallback(
    (id: string) => {
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

  const handleFilesAdd = (e: any) => {
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
  };

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
                      className="cursor-pointer bg-base-content object-contain"
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
                      className="cursor-pointer bg-base-content object-contain"
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
      </div>
      <UploadContentBtn
        useExistingBlink={useExistingBlink}
        mint={mint}
        id={id}
        files={files}
        title={title}
        description={description}
      />
    </div>
  );
};
const UploadContentBtn: FC<{
  useExistingBlink: boolean;
  id?: string;
  mint: PublicKey | null;
  files: UploadFileTypes[];
  title: string;
  description: string;
}> = ({ useExistingBlink, mint, files, id, title, description }) => {
  const { publicKey } = useWallet();
  const uploadMutation = useUploadMutation({ mint });
  const [loading, setLoading] = useState(false);

  const handleUpload = useCallback(async () => {
    if (!files || !mint) return;

    setLoading(true);

    try {
      const postId = id || crypto.randomUUID();
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
                mint
              )
            : carousel[0]!.uri;
          await uploadMutation.mutateAsync({
            icon: iconUrl,
            title,
            description,
            label: 'Subscribe', // default
            url: generatePostEndPoint(mint.toBase58(), postId),
            mint: mint.toBase58(),
            id: postId,
            carousel,
            links: {
              actions: [
                {
                  href: generatePostSubscribeApiEndPoint(
                    mint.toBase58(),
                    postId
                  ),
                  label: 'Subscribe',
                },
              ],
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
