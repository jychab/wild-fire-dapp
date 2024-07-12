'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';
import { HASHFEED_MINT } from '../../utils/consts';
import { useGetTokenDetails } from '../dashboard/dashboard-data-access';
import {
  useGetAllFungibleTokensFromOwner,
  useGetMultipleMintUriMetadata,
} from './content-data-access';
import { ContentGrid, ContentWithMetada, DisplayContent } from './content-ui';
export const ContentGridFeature: FC = () => {
  const { publicKey } = useWallet();
  const { data: whitelistedMint } = useGetTokenDetails({ mint: HASHFEED_MINT });
  const { data: allTokenAccounts } = useGetAllFungibleTokensFromOwner({
    address: publicKey,
  });
  const tokenAccounts = whitelistedMint
    ? allTokenAccounts?.items.find((x) => x.id == whitelistedMint.id) ==
      undefined
      ? allTokenAccounts?.items.concat(whitelistedMint)
      : allTokenAccounts.items
    : allTokenAccounts?.items;

  const allMintMetadataQuery = useGetMultipleMintUriMetadata({
    mints: tokenAccounts
      ? tokenAccounts
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

  const flattenedContent = content.reduce(
    (acc, val) => acc!.concat(val!),
    []
  ) as ContentWithMetada[] | undefined;

  return <ContentGrid content={flattenedContent} />;
};

interface ContentFeatureProps {
  mintId: string;
  id: string;
}

export const ContentFeature: FC<ContentFeatureProps> = ({ mintId, id }) => {
  const { data: metadataQuery } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  const content =
    metadataQuery &&
    metadataQuery.jsonUriData &&
    metadataQuery.jsonUriData.content
      ? {
          ...(metadataQuery.jsonUriData.content.find((x) => x.id == id) || []),
          name: metadataQuery.content?.metadata.name,
          symbol: metadataQuery.content?.metadata.symbol,
          image: metadataQuery.jsonUriData.imageUrl,
          mint: new PublicKey(metadataQuery.id),
        }
      : undefined;
  return content ? (
    <div className="flex flex-col py-[32px] w-full items-center">
      <div className="max-w-xl w-full">
        <DisplayContent content={content as ContentWithMetada} />
      </div>
    </div>
  ) : (
    <div>No Content Found</div>
  );
};
