'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { FC } from 'react';
import {
  useGetAllFungibleTokensFromOwner,
  useGetMultipleMintUriMetadata,
} from './content-data-access';
import { ContentGrid } from './content-ui';
export const ContentFeature: FC = () => {
  const { publicKey } = useWallet();
  const { data: allTokenAccounts } = useGetAllFungibleTokensFromOwner({
    address: publicKey,
  });

  const allMintMetadataQuery = useGetMultipleMintUriMetadata({
    mintsUri: allTokenAccounts
      ? allTokenAccounts.items
          .filter((x) => x.content)
          .map((x) => x.content!.json_uri)
      : [],
  });

  const content = allMintMetadataQuery
    .filter((x) => x.data && x.data.content != undefined)
    .map((x) => x.data?.content);

  const flattenedContent = content.reduce((acc, val) => acc!.concat(val!), []);

  return flattenedContent && <ContentGrid content={flattenedContent} />;
};
