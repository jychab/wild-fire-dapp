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
import { FC, useCallback, useEffect, useState } from 'react';
import { AdditionalMetadata } from '../content/content-ui';
import {
  useGetToken,
  useGetTokenDetails,
} from '../profile/profile-data-access';

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
}> = ({ additionalMetadata }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
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
    []
  );

  useEffect(() => {
    const q = query(
      collection(
        db,
        `Mint/${additionalMetadata.mint}/Post/${additionalMetadata.id}/Comments`
      ),
      where('softDelete', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, handleSnapshotUpdate);

    return () => unsubscribe();
  }, [additionalMetadata]);

  return (
    <>
      <button
        className="stat-desc"
        onClick={() =>
          (
            document.getElementById(
              additionalMetadata.id + '/comments'
            ) as HTMLDialogElement
          ).showModal()
        }
      >
        Add a comment
      </button>
      <dialog
        id={additionalMetadata.id + '/comments'}
        className="modal modal-bottom sm:modal-middle"
      >
        <div
          onClick={() =>
            (
              document.getElementById(
                additionalMetadata.id + '/comments'
              ) as HTMLDialogElement
            ).close()
          }
          className="modal-backdrop"
        />
        <div className="modal-box flex flex-col gap-4 h-3/5 rounded-t-lg px-0 animate-fade-up animate-once animate-duration-500 animate-ease-out">
          <div className="flex justify-between px-4">
            <div className="flex gap-2 items-center">
              <span className="font-semibold text-lg">{`Comments`}</span>
              <span className="text-base stat-desc">
                {additionalMetadata.commentsCount || ''}
              </span>
            </div>
            <button
              onClick={() =>
                (
                  document.getElementById(
                    additionalMetadata.id + '/comments'
                  ) as HTMLDialogElement
                ).close()
              }
              className=""
            >
              <IconX />
            </button>
          </div>
          <div className="overflow-y-scroll mb-6 pb-4 px-4 scrollbar-none">
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
    </>
  );
};

export const AvatarWithText: FC<{ comment: Comment }> = ({ comment }) => {
  const { data: authorityData } = useGetToken({
    address: new PublicKey(comment.user),
  });
  const { data: metadata } = useGetTokenDetails({
    mint: authorityData ? authorityData[0].mint : null,
    withContent: false,
  });
  return (
    <div className="animate-fade-right animate-once animate-duration-500 animate-ease-out">
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
