'use client';

import { AppHero } from '@/components/ui/ui-layout';
import Image from 'next/image';
import step1 from '.././images/How it works-1.png';

import step2 from '.././images/How it works-2.png';

import step3 from '.././images/How it works-3.png';

import step4 from '.././images/How it works-4.png';

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
        <div className="carousel carousel-center rounded-box">
          <div id="item1" className="carousel-item bg-base-content">
            <Image src={step1} alt="Pizza" width={250} />
          </div>
          <div id="item2" className="carousel-item">
            <Image src={step2} alt="Pizza" width={250} />
          </div>
          <div id="item3" className="carousel-item">
            <Image src={step3} alt="Pizza" width={250} />
          </div>
          <div id="item4" className="carousel-item">
            <Image src={step4} alt="Pizza" width={250} />
          </div>
        </div>
      }
    />
  );
}
