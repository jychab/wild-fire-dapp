'use client';

import { AuthenticationBtn } from '@/components/authentication/authentication-ui';
import { ContentFeature } from '@/components/content/content-feature';
import { CreateAccountBtn } from '@/components/create/create-ui';
import { useGetToken } from '@/components/dashboard/dashboard-data-access';
import { AppHero } from '@/components/ui/ui-layout';
import { useWallet } from '@solana/wallet-adapter-react';

// Register the plugins
export default function Page() {
  const { publicKey } = useWallet();
  const { data } = useGetToken({ address: publicKey });
  return publicKey ? (
    <div className="flex w-full items-center justify-center">
      <div className="max-w-7xl h-full">
        <ContentFeature />
      </div>
    </div>
  ) : (
    <AppHero
      title={'Your feed, reimagined.'}
      subtitle={
        <div className="flex flex-col gap-4 items-center lg:items-start">
          <p className="text-neutral text-lg">
            Discover content specially curated by the tokens you hold.
          </p>
          {publicKey && !data && (
            <div className="w-36">
              <CreateAccountBtn />
            </div>
          )}
          {!publicKey && (
            <div className="w-24">
              <AuthenticationBtn />
            </div>
          )}
        </div>
      }
      children={
        <div className="mockup-phone w-full max-w-xs">
          <div className="camera"></div>
          <div className="display w-full">
            <div className="artboard artboard-demo phone-1">
              <div className="carousel carousel-vertical rounded-box w-full">
                <div className="carousel-item h-full">
                  <img src="https://img.daisyui.com/images/stock/photo-1559703248-dcaaec9fab78.jpg" />
                </div>
                <div className="carousel-item h-full">
                  <img src="https://img.daisyui.com/images/stock/photo-1565098772267-60af42b81ef2.jpg" />
                </div>
                <div className="carousel-item h-full">
                  <img src="https://img.daisyui.com/images/stock/photo-1572635148818-ef6fd45eb394.jpg" />
                </div>
                <div className="carousel-item h-full">
                  <img src="https://img.daisyui.com/images/stock/photo-1494253109108-2e30c049369b.jpg" />
                </div>
                <div className="carousel-item h-full">
                  <img src="https://img.daisyui.com/images/stock/photo-1550258987-190a2d41a8ba.jpg" />
                </div>
                <div className="carousel-item h-full">
                  <img src="https://img.daisyui.com/images/stock/photo-1559181567-c3190ca9959b.jpg" />
                </div>
                <div className="carousel-item h-full">
                  <img src="https://img.daisyui.com/images/stock/photo-1601004890684-d8cbf643f5f2.jpg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
