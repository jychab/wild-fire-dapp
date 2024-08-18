import { IconStar } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';

export const CreateAccountBtn: FC = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/mint/create')}
      className="btn btn-primary rounded btn w-full"
    >
      <IconStar />
      Become a Creator
    </button>
  );
};
