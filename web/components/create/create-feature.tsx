'use client';

import { CreatePanel } from './create-ui';

export default function CreateFeature() {
  return (
    <div className="flex flex-col w-full items-center py-[32px]">
      <div className="w-full max-w-2xl">
        <CreatePanel />
      </div>
    </div>
  );
}
