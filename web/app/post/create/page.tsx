import UploadFeature from '@/components/upload/upload-feature';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};
export default function Page({ searchParams }: Props) {
  const { mint } = searchParams;
  return <UploadFeature mintId={mint as string | undefined} post={undefined} />;
}
