'use client';

import { AppHero } from '@/components/ui/ui-layout';
import Image from 'next/image';
import HowItWorks from '.././images/howitworks.png';

export default function Page() {
  return (
    <AppHero
      title={"On a mission to create the world's most distributed token ever"}
      subtitle={
        <div className="flex flex-col gap-4 py-6">
          <div className="stats shadow">
            <div className="stat gap-1 place-items-center">
              <div className="stat-title">Market Cap</div>
              <div className="stat-value">31K</div>
              <div className="stat-desc">↗︎ 40 (2%)</div>
            </div>

            <div className="stat gap-1 place-items-center">
              <div className="stat-title">Holders</div>
              <div className="stat-value text-secondary">4,200</div>
              <div className="stat-desc text-secondary">↘︎ 90 (14%)</div>
            </div>

            <div className="stat gap-1 place-items-center">
              <div className="stat-title">Price</div>
              <div className="stat-value">$1</div>
              <div className="stat-desc">↘︎ 90 (14%)</div>
            </div>
          </div>
        </div>
      }
      children={
        <div className="stats shadow py-6">
          <Image
            src={HowItWorks}
            alt={'how it works'}
            width={1200}
            height={800}
          />
        </div>
      }
    />
  );
}
