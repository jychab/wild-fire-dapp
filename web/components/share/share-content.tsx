import {
  IconBrandTelegram,
  IconBrandTwitterFilled,
  IconCheck,
  IconShare3,
} from '@tabler/icons-react';
import { FC, useState } from 'react';

export const ShareContent: FC<{
  mint: string;
  id: string;
}> = ({ mint, id }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [url, setUrl] = useState(
    `https://t.me/blinksfeedbot/blinksfeed?startapp=${mint}_${id}`
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
        onClick={() =>
          (
            document.getElementById('share_content')! as HTMLDialogElement
          ).showModal()
        }
      >
        <IconShare3 className="fill-primary" />
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
                  `https://t.me/blinksfeedbot/blinksfeed?startapp=${mint}_${id}`
                )
              }
            >
              <IconBrandTelegram size={40} />
            </button>
            <button
              onClick={() =>
                setUrl(`https://blinksfeed.com/post?mint=${mint}&id=${id}`)
              }
            >
              <IconBrandTwitterFilled size={40} />
            </button>
          </div>
          <label className="input input-bordered flex gap-2 justify-between items-center">
            <span className="w-full truncate ">{url}</span>
            <button
              onClick={() => handleCopy(url)}
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
