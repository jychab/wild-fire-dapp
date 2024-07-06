'use client';

import Authentication from '@/components/authentication/authentication-feature';
import { AppHero } from '@/components/ui/ui-layout';
import { useWallet } from '@solana/wallet-adapter-react';

// Register the plugins
export default function Page() {
  const { publicKey } = useWallet();
  return (
    <AppHero
      title={'Your feed, reimagined.'}
      subtitle={
        <div className="flex flex-col gap-4 items-center lg:items-start">
          <p className="text-neutral text-lg">
            Discover content specially curated by the tokens you hold.
          </p>
          {!publicKey && <Authentication />}
        </div>
      }
      children={
        <div className="mockup-phone w-80">
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
