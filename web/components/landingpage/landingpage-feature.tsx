import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { useGetPostsFromAddress } from '../content/content-data-access';
import { DisplayContent } from '../content/content-ui';
import { AppHero } from '../ui/ui-layout';

export const LandingPage: FC = () => {
  const { data: posts } = useGetPostsFromAddress({
    address: new PublicKey('1nc1nerator11111111111111111111111111111111'),
  });
  return (
    <AppHero
      title={'Your Perfect Feed, Curated by Your Tokens.'}
      subtitle={
        <div className="flex flex-col gap-4 items-center lg:items-start">
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
                {posts?.posts?.map((x) => (
                  <DisplayContent
                    key={x.id}
                    blinksDetail={x}
                    hideComment={true}
                    showMintDetails={true}
                    editable={false}
                    multiGrid={false}
                    hideBorder={true}
                    expandAll={true}
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
