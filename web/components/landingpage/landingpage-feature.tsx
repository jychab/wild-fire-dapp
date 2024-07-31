import { HASHFEED_MINT } from '@/utils/consts';
import { FC } from 'react';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { DisplayContent } from '../content/content-ui';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { AppHero } from '../ui/ui-layout';

export const LandingPage: FC = () => {
  const { data: metadataQuery } = useGetTokenDetails({
    mint: HASHFEED_MINT,
  });
  const posts = metadataQuery?.additionalInfoData?.posts
    ? metadataQuery.additionalInfoData.posts.map((x) => {
        return {
          ...x,
          metadataQuery,
        };
      })
    : undefined;
  return (
    <AppHero
      title={'Your feed, reimagined.'}
      subtitle={
        <div className="flex flex-col gap-4 items-center lg:items-start">
          <p className="text-lg">
            Discover content curated by the tokens you hold.
          </p>
          <AuthenticationBtn
            children={
              <div className="btn btn-outline bg-base-100 rounded-none">
                Get Started
              </div>
            }
          />
        </div>
      }
      children={
        <div className="mockup-phone w-full max-w-xs">
          <div className="camera"></div>
          <div className="display w-full">
            <div className="artboard artboard-demo bg-base-100 h-[600px] overflow-y-scroll scrollbar-none">
              <div className="grid grid-cols-1 gap-2 h-full w-full">
                {posts?.map((x) => (
                  <DisplayContent
                    key={x.id}
                    post={x}
                    hideComment={true}
                    showMintDetails={true}
                    editable={false}
                    multiGrid={false}
                    hideBorder={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};
