'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
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
    mints: allTokenAccounts
      ? allTokenAccounts.items
          .filter((x) => x.content)
          .map((x) => {
            return { mint: new PublicKey(x.id), uri: x.content!.json_uri };
          })
      : [],
  });

  const content = allMintMetadataQuery
    .filter((x) => x.data && x.data.content != undefined)
    .map((x) => {
      return x.data!.content?.map((y) => {
        return {
          ...y,
          name: x.data!.name,
          symbol: x.data!.symbol,
          image: x.data!.image,
          mint: x.data!.mint,
        };
      });
    });

  const flattenedContent = content.reduce((acc, val) => acc!.concat(val!), []);

  return flattenedContent && <ContentGrid content={flattenedContent} />;
};
