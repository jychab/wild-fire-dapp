'use client';

import { db } from '@/utils/firebase/firebase';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  collectionGroup,
  DocumentData,
  limit,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  where,
} from 'firebase/firestore';
import { FC, useCallback, useEffect, useState } from 'react';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { UploadContent } from '../upload/upload.data-access';
import { fetchOwnerTokenDetails as useFetchOwnerTokenDetails } from './content-data-access';
import { ContentGrid, ContentWithMetadata, DisplayContent } from './content-ui';

export const ContentGridFeature: FC = () => {
  const { publicKey } = useWallet();
  const [content, setContent] = useState<ContentWithMetadata[]>();
  const [postLimit, setPostLimit] = useState(20);

  const { data: ownerTokenDetails, isLoading } = useFetchOwnerTokenDetails({
    address: publicKey,
  });

  const handleSnapshotUpdate = useCallback(
    (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
      if (!ownerTokenDetails) return;
      setContent((prevContent) => {
        const updatedContent = prevContent ? [...prevContent] : [];

        snapshot.docChanges().forEach((change) => {
          const postData = change.doc.data() as UploadContent;

          const tokenDetails = ownerTokenDetails.find(
            (x) => x.id === postData.mint
          );

          if (!tokenDetails?.content?.links?.image) return;

          const newContent = {
            ...tokenDetails,
            ...postData,
            name: tokenDetails.content.metadata.name,
            symbol: tokenDetails.content.metadata.symbol,
            image: tokenDetails.content.links.image,
            mint: tokenDetails.id,
          };

          const existingIndex = updatedContent.findIndex(
            (item) => item.id === newContent.id
          );

          if (change.type === 'removed') {
            if (existingIndex > -1) {
              updatedContent.splice(existingIndex, 1);
            }
          } else if (existingIndex > -1) {
            updatedContent[existingIndex] = newContent;
          } else {
            updatedContent.push(newContent);
          }
        });

        return updatedContent;
      });
    },
    [ownerTokenDetails]
  );

  useEffect(() => {
    if (!ownerTokenDetails || isLoading) return;

    const q = query(
      collectionGroup(db, 'Post'),
      where('softDelete', '==', false),
      where(
        'mint',
        'in',
        ownerTokenDetails.map((x) => x.id)
      ),
      orderBy('createdAt', 'desc'),
      limit(postLimit)
    );

    const unsubscribe = onSnapshot(q, handleSnapshotUpdate);

    return () => unsubscribe();
  }, [ownerTokenDetails, postLimit, isLoading, handleSnapshotUpdate]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setPostLimit((prevLimit) => prevLimit + 20);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return <ContentGrid content={content} />;
};

interface ContentCardFeatureProps {
  mintId: string;
  id: string;
}

export const ContentCardFeature: FC<ContentCardFeatureProps> = ({
  mintId,
  id,
}) => {
  const { data: metadataQuery } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  const content =
    metadataQuery &&
    metadataQuery.content?.links?.image &&
    metadataQuery.additionalInfoData &&
    metadataQuery.additionalInfoData.content
      ? {
          ...(metadataQuery.additionalInfoData.content.find(
            (x) => x.id == id
          ) || []),
          name: metadataQuery.content.metadata.name,
          symbol: metadataQuery.content.metadata.symbol,
          image: metadataQuery.content.links.image,
          mint: metadataQuery.id,
        }
      : undefined;
  return content ? (
    <div className="flex flex-col py-[32px] w-full items-center">
      <div className="max-w-lg w-full">
        <DisplayContent content={content as ContentWithMetadata} />
      </div>
    </div>
  ) : (
    <div>No Content Found</div>
  );
};
