import { ActionGetResponse } from '@solana/actions';

export interface GetPostsResponse {
  posts?: PostBlinksDetail[]; // sorted actionUrls for a particular mint/address
}

export interface PostContent extends ActionGetResponse, PostBlinksDetail {
  carousel?: Carousel[];
  softDelete?: boolean;
  commentsEngagementScore?: { mint: string; amount: number }[];
  postEngagementScore?: { mint: string; amount: number }[];
}
export interface PostBlinksDetail {
  creator: string;
  url: string;
  mint: string;
  id: string;
  createdAt: number;
  updatedAt: number;
  commentsCount?: number;
  tags?: string[];
}

export interface PostCreatorDetails {
  mint?: string;
  price?: number;
  quantity?: number;
  verified?: boolean;
}

export type Carousel = ImageContent | VideoContent;

export interface ImageContent {
  uri: string;
  fileType: string;
}

export interface VideoContent {
  uri: string;
  fileType: string;
  duration: number;
}
