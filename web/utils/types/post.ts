import { ActionGetResponse } from '@solana/actions';

export interface GetPostsResponse {
  posts: PostBlinksDetail[]; // sorted actionUrls for a particular mint/address
}

export interface PostBlinksDetail {
  url: string;
  mint: string;
  id: string;
  createdAt: number;
  updatedAt: number;
  likesCount?: number;
  likesUser?: string[];
  commentsCount?: number;
}

export interface PostContent extends ActionGetResponse, PostDetails {
  carousel?: Carousel[];
  onLoading?: string; // image to display on loading
  onError?: string; // image to display on error
  onCompletion?: string; // client will call this url on completion with the publickey -> to return an image string
}

export interface PostDetails extends PostBlinksDetail {
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
