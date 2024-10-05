import { ActionTypeEnum } from '@/utils/enums/post';
import { uploadMedia } from '@/utils/firebase/functions';
import { unfurlUrlToActionApiUrl } from '@/utils/helper/blinks';
import {
  generatePostEndPoint,
  generatePostSubscribeApiEndPoint,
  proxify,
} from '@/utils/helper/endpoints';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FC, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { TempPostCampaign, UploadFileTypes } from './upload-ui';
import { useUploadMutation } from './upload.data-access';

export const UploadContentBtn: FC<{
  tempCampaign: Partial<TempPostCampaign> | undefined;
  useExistingBlink: boolean;
  id?: string;
  mint: PublicKey | null;
  files: UploadFileTypes[];
  title: string;
  description: string;
  action: ActionTypeEnum;
  tags: string;
}> = ({
  useExistingBlink,
  mint,
  files,
  id,
  title,
  description,
  tempCampaign,
  action,
  tags,
}) => {
  const { publicKey } = useWallet();
  const uploadMutation = useUploadMutation({ mint });
  const [loading, setLoading] = useState(false);

  const handleUpload = useCallback(async () => {
    if (!files || !mint || !tempCampaign?.postId) return;
    setLoading(true);
    try {
      const postId = tempCampaign.postId;
      if (useExistingBlink) {
        let mediaUrl = files.find((x) => x.id == 'blinks')?.uri;

        if (!mediaUrl) {
          toast.error('No Blinks Url Found');
          return;
        }
        const apiUrl = await unfurlUrlToActionApiUrl(mediaUrl);
        if (!apiUrl) {
          toast.error('Unable to unfurl to action api url');
          return;
        }
        const response = await (await fetch(proxify(apiUrl))).json();

        await uploadMutation.mutateAsync({
          postContent: {
            ...response,
            url: generatePostEndPoint(mint.toBase58(), postId, apiUrl),
            mint: mint.toBase58(),
            id: postId,
            tags: tags.split(','),
          },
        });
      } else if (publicKey) {
        if (tempCampaign?.links) {
          tempCampaign.links.actions = tempCampaign.links?.actions.filter(
            (x) => x.type == action
          );
          if (action == ActionTypeEnum.SUBSCRIBE) {
            tempCampaign.links.actions[0].href =
              generatePostSubscribeApiEndPoint(
                mint.toBase58(),
                tempCampaign.postId
              );
          }
        }
        const carousel = await Promise.all(
          files
            .filter(
              (x) =>
                x.id !== 'blinks' &&
                (x.fileType.startsWith('image/') ||
                  x.fileType.startsWith('video/'))
            )
            .map(async (x) => {
              const mediaUrl = x.file
                ? await uploadMedia(x.file, publicKey)
                : x.uri;
              if (x.fileType.startsWith('image/')) {
                return { uri: mediaUrl, fileType: x.fileType };
              } else {
                return {
                  uri: mediaUrl,
                  fileType: x.fileType,
                  duration: x.duration,
                };
              }
            })
        );
        if (carousel.length > 0) {
          const iconUrl = carousel[0]!.fileType.startsWith('video/')
            ? await uploadMedia(
                files.find((x) => x.fileType === carousel[0]!.fileType)
                  ?.thumbnailFile!,
                publicKey
              )
            : carousel[0]!.uri;
          const postContent = {
            tags: tags.split(','),
            icon: iconUrl,
            title,
            description,
            label: 'Subscribe', // default
            url: generatePostEndPoint(mint.toBase58(), postId),
            mint: mint.toBase58(),
            id: postId,
            carousel,
            links: tempCampaign.links,
          };
          const postCampaign = {
            initialBudget: tempCampaign.initialBudget,
            initialTokensRemaining: tempCampaign.initialTokensRemaining,
            postId: tempCampaign.postId,
            amountPerQuery: tempCampaign.amountPerQuery,
            id: tempCampaign.id,
            mint: tempCampaign.mint,
            mintToSend: tempCampaign.mintToSend,
            mintToSendDecimals: tempCampaign.mintToSendDecimals,
            mintToSendTokenProgram: tempCampaign.mintToSendTokenProgram,
            budget: tempCampaign.budget,
            tokensRemaining: tempCampaign.tokensRemaining,
            eligibility: tempCampaign.eligibility,
            criteria: tempCampaign.criteria,
            endDate: tempCampaign.endDate,
          };
          await uploadMutation.mutateAsync({
            postContent,
            postCampaign,
          });
        }
      }
    } catch (error) {
      console.error('Error uploading post:', error);
    } finally {
      setLoading(false);
    }
  }, [files, mint, id, title, description, uploadMutation]);

  return (
    <button
      disabled={!files.length || loading}
      onClick={handleUpload}
      className="btn btn-primary"
    >
      {loading ? (
        <div className="loading loading-spinner loading-sm" />
      ) : (
        'Confirm'
      )}
    </button>
  );
};
