import { FC } from 'react';
import { Blinks } from '../blinks/blinks-ui';
import { ContentType } from '../upload/upload-ui';
import { Content } from '../upload/upload.data-access';

interface ContentGridProps {
  content: Content[];
}

export const ContentGrid: FC<ContentGridProps> = ({ content }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 p-4">
      {content.map((x) => {
        if (x.type.toLowerCase() == ContentType.BLINKS.toLowerCase()) {
          return <BlinksCard key={x.uri} uri={x.uri} />;
        }
      })}
    </div>
  );
};

export const BlinksCard: FC<{ uri: string }> = ({ uri }) => {
  try {
    const url = new URL(uri);
    return <Blinks actionUrl={url} />;
  } catch (e) {
    console.error(e);
    return;
  }
};

export const ImageCard: FC = () => {
  return <div className="aspect"></div>;
};

export const VideoCard: FC = () => {
  return <div className="aspect"></div>;
};
