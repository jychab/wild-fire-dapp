import { ActionGetResponse } from '@solana/actions';

export interface GetPostsResponse {
  posts?: PostBlinksDetail[]; // sorted actionUrls for a particular mint/address
}

export interface PostContent extends ActionGetResponse, PostBlinksDetail {
  carousel?: Carousel[];
  softDelete?: boolean;
}
export interface PostBlinksDetail {
  memberMint?: string;
  creator?: string;
  url: string;
  mint: string;
  id: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  commentsCount?: number;
  likesCount?: number;
  sharesCount?: number;
  viewsCount?: number;
  liked?: boolean;
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
