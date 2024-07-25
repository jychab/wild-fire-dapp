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
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { PostContent } from '../upload/upload.data-access';
import { fetchOwnerTokenDetails as useFetchOwnerTokenDetails } from './content-data-access';
import { ContentGrid, ContentWithMetadata, DisplayContent } from './content-ui';

const batchSize = 30;

export const ContentGridFeature: FC = () => {
  const { publicKey } = useWallet();
  // Check for cached content
  useEffect(() => {
    if (publicKey) {
      const cachedContent = localStorage.getItem(
        `cachedFeed, ${publicKey.toBase58()}`
      );
      if (cachedContent) {
        setContent(JSON.parse(cachedContent));
      }
    }
  }, [publicKey]);
  const [postLimit, setPostLimit] = useState(30);
  const [content, setContent] = useState<ContentWithMetadata[]>([]);
  const [sortedTokenIds, setSortedTokenIds] = useState<string[]>([]);
  const [nextTokenIndex, setNextTokenIndex] = useState(0);

  const [isFetching, setIsFetching] = useState(false);

  const { data: ownerTokenDetails } = useFetchOwnerTokenDetails({
    address: publicKey,
  });

  const sortedTokenDetails = useMemo(() => {
    if (!ownerTokenDetails) return [];
    return ownerTokenDetails
      .slice()
      .sort(
        (a, b) =>
          (b.price || 0) * (b.quantity || 0) -
          (a.price || 0) * (a.quantity || 0)
      );
  }, [ownerTokenDetails]);

  const updateSortedTokenIds = useCallback(() => {
    if (!sortedTokenDetails.length) return;
    setSortedTokenIds(sortedTokenDetails.map((item) => item.id));
    setNextTokenIndex(0); // Reset index for pagination
  }, [sortedTokenDetails]);

  const fetchPosts = useCallback(
    (tokenChunk: string[]) => {
      const q = query(
        collectionGroup(db, 'Post'),
        where('softDelete', '==', false),
        where('mint', 'in', tokenChunk),
        orderBy('createdAt', 'desc'),
        limit(postLimit)
      );
      return onSnapshot(q, (snapshot) => {
        handleSnapshotUpdate(snapshot);
      });
    },
    [sortedTokenDetails]
  );

  const handleSnapshotUpdate = useCallback(
    (snapshot: QuerySnapshot<DocumentData>) => {
      if (!sortedTokenDetails) return;

      // Process each change in the snapshot
      const newUpdatedContent = snapshot.docs
        .map((doc) => {
          const postData = doc.data() as PostContent;

          const tokenDetails = sortedTokenDetails.find(
            (x) => x.id === postData.mint
          );

          if (!tokenDetails?.content?.links?.image) return null;

          return {
            ...tokenDetails,
            ...postData,
            name: tokenDetails.content.metadata.name,
            symbol: tokenDetails.content.metadata.symbol,
            image: tokenDetails.content.links.image,
            mint: tokenDetails.id,
          };
        })
        .filter((x) => x != null);
      newUpdatedContent.sort(
        (a, b) => (b?.createdAt || 0) - (a?.createdAt || 0)
      );
      if (publicKey) {
        // Cache the content
        localStorage.setItem(
          `cachedFeed, ${publicKey?.toBase58()}`,
          JSON.stringify(newUpdatedContent)
        );
      }

      setContent(newUpdatedContent);
      setIsFetching(false);
    },
    [sortedTokenDetails, publicKey]
  );

  useEffect(() => {
    if (sortedTokenIds.length === 0 || isFetching) return;

    if (
      !(content.length < postLimit && nextTokenIndex < sortedTokenIds.length)
    ) {
      return;
    }
    const endIndex = Math.min(
      nextTokenIndex + batchSize,
      sortedTokenIds.length
    );
    const tokenChunk = sortedTokenIds.slice(nextTokenIndex, endIndex);

    if (tokenChunk.length === 0) return;

    setIsFetching(true);
    fetchPosts(tokenChunk);

    setNextTokenIndex(endIndex);
  }, [sortedTokenIds, nextTokenIndex, fetchPosts, isFetching]);

  useEffect(() => {
    updateSortedTokenIds();
  }, [updateSortedTokenIds]);

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
    <div className="flex flex-col w-full items-center sm:py-4">
      <div className="max-w-lg w-full">
        <DisplayContent
          expandAll={true}
          content={content as ContentWithMetadata}
          showMintDetails={true}
        />
      </div>
    </div>
  ) : (
    <div>No Content Found</div>
  );
};
