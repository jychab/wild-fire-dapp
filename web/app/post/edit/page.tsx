import UploadFeature from '@/components/upload/upload-feature';
import { fetchPost } from '@/utils/helper/post';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};
export default async function Page({ searchParams }: Props) {
  const { mint, id } = searchParams;
  const post = await fetchPost(mint as string, id as string);
  return (
    <UploadFeature
      mintId={mint as string | undefined}
      id={id as string | undefined}
      post={post}
    />
  );
}
