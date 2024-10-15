import { validatePost } from '@/utils/firebase/functions';
import { PostBlinksDetail } from '@/utils/types/post';
import { publicKey } from '@coral-xyz/anchor/dist/cjs/utils';
import {
  IconBrandTelegram,
  IconBrandTwitterFilled,
  IconCheck,
  IconShare3,
} from '@tabler/icons-react';
import { FC, useState } from 'react';

export const ShareContent: FC<{
  blinksDetail: PostBlinksDetail;
}> = ({ blinksDetail }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [url, setUrl] = useState(
    `https://t.me/blinksfeedbot/blinksfeed?startapp=${blinksDetail.mint}_${blinksDetail.id}`
  );
  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);

      // Revert back to "Copy" after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <>
      <button
        className="link link-hover flex items-end gap-2"
        onClick={() =>
          (
            document.getElementById('share_content')! as HTMLDialogElement
          ).showModal()
        }
      >
        <IconShare3 size={16} />
        <span className="stat-desc">{`${
          blinksDetail.sharesCount || 0
        } shares`}</span>
      </button>
      <dialog id="share_content" className="modal modal-middle">
        <div
          onClick={() =>
            (
              document.getElementById('share_content')! as HTMLDialogElement
            ).close()
          }
          className="modal-backdrop"
        />
        <div className="modal-box flex flex-col gap-8 animate-fade-up animate-once animate-duration-500 animate-ease-out">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Share Url</h3>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost">✕</button>
            </form>
          </div>
          <div className="flex justify-center items-center gap-8">
            <button
              onClick={() =>
                setUrl(
                  `https://t.me/blinksfeedbot/blinksfeed?startapp=${blinksDetail.mint}_${blinksDetail.id}`
                )
              }
            >
              <IconBrandTelegram size={40} />
            </button>
            <button
              onClick={() =>
                setUrl(
                  `https://blinksfeed.com/post?mint=${blinksDetail.mint}&id=${blinksDetail.id}`
                )
              }
            >
              <IconBrandTwitterFilled size={40} />
            </button>
          </div>
          <label className="input input-bordered flex gap-2 justify-between items-center">
            <span className="w-full truncate ">{url}</span>
            <button
              onClick={() => {
                if (!blinksDetail.memberMint) return;
                if (publicKey) {
                  validatePost(
                    blinksDetail.memberMint,
                    blinksDetail.mint,
                    blinksDetail.id,
                    'Shares'
                  );
                }
                handleCopy(url);
              }}
              className="btn btn-sm btn-primary"
            >
              {isCopied ? <IconCheck /> : 'Copy'}
            </button>
          </label>
        </div>
      </dialog>
    </>
  );
};
