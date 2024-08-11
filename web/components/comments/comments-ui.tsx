import { db } from '@/utils/firebase/firebase';
import { createOrEditComment } from '@/utils/firebase/functions';
import { checkIfTruncated, getTimeAgo } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { PostContent } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconSend, IconX } from '@tabler/icons-react';
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
import toast from 'react-hot-toast';
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
  post: PostContent;
  multiGrid: boolean;
}> = ({ post, multiGrid }) => {
  const [commentsLimit, setCommentsLimit] = useState(20);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const commentsRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<number | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useWallet();
  const { data: metadata } = useGetTokenDetails({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });

  const handleCommentSubmit = () => {
    if (post?.mint && post.id && comment && publicKey) {
      createOrEditComment(
        post?.mint,
        post?.id,
        crypto.randomUUID(),
        comment,
        []
      );
      setComment('');
    } else if (!publicKey) {
      toast.error('Connect a wallet first!');
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

      setLoading(false);
    },
    [commentsLimit]
  );

  const fetchComments = useCallback(() => {
    if (!post) return;
    const q = query(
      collection(db, `Mint/${post.mint}/Post/${post.id}/Comments`),
      where('softDelete', '==', false),
      orderBy('createdAt', 'desc'),
      limit(commentsLimit)
    );
    // Cancel previous subscription if it exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    setLoading(true);
    // Set up new subscription
    const unsubscribe = onSnapshot(q, handleSnapshotUpdate);
    unsubscribeRef.current = unsubscribe;
  }, [post.mint, post.id, handleSnapshotUpdate, unsubscribeRef, commentsLimit]);

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
        document.getElementById(post.id + '/comments') as HTMLDialogElement
      ).showModal();
    } else {
      (
        document.getElementById(post.id + '/comments') as HTMLDialogElement
      ).close();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    }
  };

  return (
    <div className="flex flex-col pt-2 gap-1 items-start">
      {post.commentsCount && (
        <button
          onClick={() => {
            if (multiGrid) {
              router.push(`/post?mintId=${post.mint}&id=${post.id}`);
            } else {
              toggleModal(true);
            }
          }}
          className="stat-desc link link-hover"
        >{`View ${post.commentsCount} comments`}</button>
      )}
      <button className="stat-desc" onClick={() => toggleModal(true)}>
        Add a comment
      </button>
      <dialog
        id={post.id + '/comments'}
        className="modal modal-bottom sm:modal-middle"
      >
        <div onClick={() => toggleModal(false)} className="modal-backdrop" />
        <div className="modal-box flex flex-col gap-4 h-3/5 rounded-t-lg px-0 animate-fade-up animate-once animate-duration-500 animate-ease-out">
          <div className="flex justify-between px-4">
            <div className="flex gap-2 items-center">
              <span className="font-semibold text-lg">{`Comments`}</span>
              <span className="text-base stat-desc">
                {post.commentsCount || ''}
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
              {loading && (
                <div className="w-full items-end justify-center flex gap-2">
                  Loading
                  <div className="loading loading-dots loading-xs" />
                </div>
              )}
            </div>
          </div>
          <label className="absolute max-w-lg bottom-0 gap-2 h-fit z-2 py-2 input input-bordered focus-within:outline-none rounded-none border-x-0 border-b-0 flex w-full input-base group items-center">
            <div className="avatar">
              <div className=" w-8 h-8 relative rounded-full">
                <Image
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  alt=""
                  src={
                    metadata?.content?.links?.image ||
                    'https://buckets.hashfeed.social/placeholder.png'
                  }
                />
              </div>
            </div>
            <textarea
              rows={1}
              autoFocus={true}
              placeholder="Add a comment"
              className="textarea textarea-bordered textarea-base leading-normal scrollbar-none w-full text-base"
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
  const [showMore, setShowMore] = useState(false);
  const { data: metadata } = useGetTokenDetails({
    mint: getDerivedMint(new PublicKey(comment.user)),
  });

  const commentRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  return (
    <div className="animate-fade-right animate-once animate-duration-300 animate-ease-out">
      <div className="chat chat-start">
        <button
          disabled={!metadata}
          className="chat-image avatar"
          onClick={() =>
            metadata && router.push(`/profile?mintId=${metadata.id}`)
          }
        >
          <div className="w-8 h-8 relative rounded-full">
            <Image
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt=""
              src={
                metadata?.content?.links?.image ||
                'https://buckets.hashfeed.social/placeholder.png'
              }
            />
          </div>
        </button>
        <div className="chat-header flex items-center gap-2">
          <button
            disabled={!metadata}
            onClick={() =>
              metadata && router.push(`/profile?mintId=${metadata.id}`)
            }
            className="truncate max-w-[120px] sm:max-w-xs"
          >
            {metadata ? metadata.content?.metadata.name : comment.user}
          </button>
          <time className="text-xs opacity-50">
            {`${getTimeAgo(comment.updatedAt)}${
              comment.updatedAt != comment.createdAt ? ' (edited)' : ''
            }`}
          </time>
        </div>
        <div className="flex flex-col gap-1 items-start">
          <span
            ref={commentRef}
            className={`text-sm w-full break-all ${
              showMore ? 'whitespace-prewrap' : 'line-clamp-3'
            }`}
          >
            {comment.text}
          </span>
          {!showMore && checkIfTruncated(commentRef.current) && (
            <button
              className="text-xs stat-desc"
              onClick={() => setShowMore(true)}
            >
              Show More
            </button>
          )}
        </div>

        {comment.repliesCount && (
          <div className="chat-footer opacity-50 link">{`${comment.repliesCount}Replies`}</div>
        )}
      </div>
    </div>
  );
};
