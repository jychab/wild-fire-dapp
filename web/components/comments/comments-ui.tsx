import { db } from '@/utils/firebase/firebase';
import { createOrEditComment } from '@/utils/firebase/functions';
import { getTimeAgo } from '@/utils/helper/format';
import { PublicKey } from '@solana/web3.js';
import { IconSend, IconUserCircle, IconX } from '@tabler/icons-react';
import {
  collection,
  DocumentData,
  limit,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  where,
} from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { getMintFromPubkey } from '../content/content-data-access';
import { AdditionalMetadata } from '../content/content-ui';
import { useGetTokenDetails } from '../profile/profile-data-access';

interface Comment {
  commentId: string;
  createdAt: number;
  mentions: string[];
  mint: string;
  postId: string;
  text: string;
  updatedAt: number;
  user: string;
  repliesCount: number;
}

export const CommentsSection: FC<{
  additionalMetadata: AdditionalMetadata;
  multiGrid: boolean;
}> = ({ additionalMetadata, multiGrid }) => {
  const [commentsLimit, setCommentsLimit] = useState(20);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const commentsRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<number | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleCommentSubmit = () => {
    if (additionalMetadata && comment) {
      createOrEditComment(
        additionalMetadata?.mint,
        additionalMetadata?.id,
        crypto.randomUUID(),
        comment,
        []
      );
      setComment('');
    }
  };

  const handleSnapshotUpdate = useCallback(
    (snapshot: QuerySnapshot<DocumentData>) => {
      if (snapshot.docs.length < commentsLimit) {
        setHasMore(false);
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc);

      setComments((prevContent) => {
        const updatedComments = prevContent ? [...prevContent] : [];

        snapshot.docChanges().forEach((change) => {
          const commentData = change.doc.data() as Comment;
          const existingIndex = updatedComments.findIndex(
            (item) => item.commentId === commentData.commentId
          );

          if (change.type === 'removed') {
            if (existingIndex > -1) {
              updatedComments.splice(existingIndex, 1);
            }
          } else if (existingIndex > -1) {
            updatedComments[existingIndex] = commentData;
          } else {
            updatedComments.push(commentData);
            updatedComments.sort((a, b) => b.createdAt - a.createdAt);
          }
        });

        return updatedComments;
      });
    },
    [commentsLimit]
  );

  const fetchComments = useCallback(() => {
    if (!additionalMetadata) return;
    const q = query(
      collection(
        db,
        `Mint/${additionalMetadata.mint}/Post/${additionalMetadata.id}/Comments`
      ),
      where('softDelete', '==', false),
      orderBy('createdAt', 'desc'),
      limit(commentsLimit)
    );
    // Cancel previous subscription if it exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    // Set up new subscription
    const unsubscribe = onSnapshot(q, handleSnapshotUpdate);
    unsubscribeRef.current = unsubscribe;
  }, [
    additionalMetadata.mint,
    additionalMetadata.id,
    handleSnapshotUpdate,
    unsubscribeRef,
    commentsLimit,
  ]);

  useEffect(() => {
    if (commentsLimit > 20) {
      fetchComments();
    }
  }, [commentsLimit]);

  useEffect(() => {
    const onScroll = () => {
      if (commentsRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = commentsRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 300) {
          if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
          }
          debounceTimeout.current = window.setTimeout(() => {
            if (hasMore) {
              setCommentsLimit(commentsLimit + 20);
            }
          }, 500);
        }
      }
    };

    const currentCommentsRef = commentsRef.current;
    if (currentCommentsRef) {
      currentCommentsRef.addEventListener('scroll', onScroll);
    }

    return () => {
      if (currentCommentsRef) {
        currentCommentsRef.removeEventListener('scroll', onScroll);
      }
    };
  }, [lastVisible, hasMore, setCommentsLimit]);

  const toggleModal = (open: boolean) => {
    if (open) {
      fetchComments();
      (
        document.getElementById(
          additionalMetadata.id + '/comments'
        ) as HTMLDialogElement
      ).showModal();
    } else {
      (
        document.getElementById(
          additionalMetadata.id + '/comments'
        ) as HTMLDialogElement
      ).close();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    }
  };

  return (
    <div className="flex flex-col pt-2 gap-1 items-start">
      {additionalMetadata.commentsCount && (
        <button
          onClick={() => {
            if (multiGrid) {
              router.push(
                `/content?mintId=${additionalMetadata.mint}&id=${additionalMetadata.id}`
              );
            } else {
              toggleModal(true);
            }
          }}
          className="stat-desc link link-hover"
        >{`View ${additionalMetadata.commentsCount} comments`}</button>
      )}
      <button className="stat-desc" onClick={() => toggleModal(true)}>
        Add a comment
      </button>
      <dialog
        id={additionalMetadata.id + '/comments'}
        className="modal modal-bottom sm:modal-middle"
      >
        <div onClick={() => toggleModal(false)} className="modal-backdrop" />
        <div className="modal-box flex flex-col gap-4 h-3/5 rounded-t-lg px-0 animate-fade-up animate-once animate-duration-500 animate-ease-out">
          <div className="flex justify-between px-4">
            <div className="flex gap-2 items-center">
              <span className="font-semibold text-lg">{`Comments`}</span>
              <span className="text-base stat-desc">
                {additionalMetadata.commentsCount || ''}
              </span>
            </div>
            <button onClick={() => toggleModal(false)} className="">
              <IconX />
            </button>
          </div>
          <div
            ref={commentsRef}
            className="overflow-y-scroll mb-6 pb-4 px-4 scrollbar-none"
          >
            <div className="flex flex-col gap-4 ">
              {comments.map((x) => (
                <AvatarWithText key={x.commentId} comment={x} />
              ))}
            </div>
          </div>
          <label className="absolute max-w-lg bottom-0 z-2 input input-bordered focus-within:outline-none rounded-none border-x-0 border-b-0 flex w-full input-base group items-center">
            <input
              autoFocus={true}
              placeholder="Add a comment"
              type="text"
              className="w-full text-base"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevents the default Enter key action
                  handleCommentSubmit();
                }
              }}
            />
            <button onClick={handleCommentSubmit}>
              <IconSend />
            </button>
          </label>
        </div>
      </dialog>
    </div>
  );
};

export const AvatarWithText: FC<{ comment: Comment }> = ({ comment }) => {
  const { data: metadata } = useGetTokenDetails({
    mint: getMintFromPubkey(new PublicKey(comment.user)),
    withContent: false,
  });
  return (
    <div className="animate-fade-right animate-once animate-duration-300 animate-ease-out">
      <div className="chat chat-start">
        <div className="chat-image avatar">
          {metadata?.content?.links?.image ? (
            <div className="w-10 h-10 relative rounded-full">
              <Image
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt=""
                src={metadata?.content?.links?.image}
              />
            </div>
          ) : (
            <div className="flex w-10 h-10 items-center justify-center ">
              <div className="items-center flex justify-center h-full">
                <IconUserCircle size={40} />
              </div>
            </div>
          )}
        </div>
        <div className="chat-header flex items-center gap-2">
          <span className="truncate max-w-[120px] sm:max-w-xs">
            {metadata ? metadata.content?.metadata.name : comment.user}
          </span>
          <time className="text-xs opacity-50">
            {`${getTimeAgo(comment.updatedAt)}${
              comment.updatedAt != comment.createdAt ? ' (edited)' : ''
            }`}
          </time>
        </div>
        <div className="text-sm whitespace-pre-wrap">{comment.text}</div>
        {comment.repliesCount && (
          <div className="chat-footer opacity-50 link">{`${comment.repliesCount}Replies`}</div>
        )}
      </div>
    </div>
  );
};
