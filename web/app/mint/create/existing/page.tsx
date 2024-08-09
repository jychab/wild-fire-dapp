import { CreateWithExistingPanel } from '@/components/create/create-feature';

export default function page() {
  return (
    <div className="flex flex-col h-full w-full items-center">
      <div className="w-full max-w-2xl h-full">
        <CreateWithExistingPanel />
      </div>
    </div>
  );
}
