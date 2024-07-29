import { ContentType } from '../enums/post';

export interface PostContent {
  carousel: Carousel[];
  caption: string;
  tags: string[];
  type: ContentType;
  id: string;
  mint: string;
  createdAt: number;
  updatedAt: number;
  price?: number;
  quantity?: number;
  verified?: boolean;
  likesCount?: number;
  likesUserTruncated?: string[];
  commentsCount?: number;
  softDelete?: boolean;
  recencyScore?: number;
  engagementScore?: number;
}

export type Carousel = StaticContent | VideoContent;

export interface StaticContent {
  uri: string;
  fileType: string;
}

export interface VideoContent {
  uri: string;
  fileType: string;
  duration: number;
}
