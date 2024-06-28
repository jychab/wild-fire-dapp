'use client';

import { useState } from 'react';
import { AppHero } from '../ui/ui-layout';
import { CreatePanel, ProgressBar } from './create-ui';

export default function CreateFeature() {
  const [page, setPage] = useState(1);
  return (
    <div className="flex flex-col w-full items-center pb-[32px]">
      <AppHero
        title={<ProgressBar page={page} setPage={setPage} />}
        subtitle={<CreatePanel page={page} setPage={setPage} />}
      />
    </div>
  );
}
