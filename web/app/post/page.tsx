import { ContentCardFeature } from '@/components/content/content-feature';
import { fetchPost } from '@/utils/helper/post';
import { Metadata } from 'next';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { mint, id } = searchParams;

  const post = await fetchPost(mint as string, id as string);

  if (!post) {
    return {
      title: 'Post not found',
      description: 'The post you are looking for does not exist.',
    };
  }

  return {
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/post?mint=${post.mint}&id=${post.id}`,
      images: [
        {
          url: post.icon,
          alt: post.title,
        },
      ],
      type: 'website',
    },
  };
}

export default async function Page({ searchParams }: Props) {
  const { mint, id } = searchParams;
  const post = await fetchPost(mint as string, id as string);
  return <ContentCardFeature post={post} />;
}
