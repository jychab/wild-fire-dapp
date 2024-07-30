import { CreateWithExistingPanel } from '@/components/create/create-feature';

export default function page() {
  return (
    <div className="flex flex-col w-full items-center py-[32px]">
      <div className="w-full max-w-2xl">
        <CreateWithExistingPanel />
      </div>
    </div>
  );
}
