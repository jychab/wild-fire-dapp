'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';
import {
  useGetAllTokenAccountsFromOwner,
  useGetMultipleMintMetadata,
} from './content-data-access';
import { ContentGrid } from './content-ui';
export const ContentFeature: FC = () => {
  const { publicKey } = useWallet();
  const { data: allTokenAccounts } = useGetAllTokenAccountsFromOwner({
    address: publicKey,
  });
  const allMintMetadataQuery = useGetMultipleMintMetadata({
    mints: allTokenAccounts
      ? allTokenAccounts.map((x) => new PublicKey(x.mint))
      : [],
  });

  const content = allMintMetadataQuery
    .filter((x) => x.data && x.data.content != undefined)
    .map((x) => x.data?.content);

  const flattenedContent = content.reduce((acc, val) => acc!.concat(val!), []);

  return flattenedContent && <ContentGrid content={flattenedContent} />;
};
