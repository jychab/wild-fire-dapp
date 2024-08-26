import { ActionGetResponse } from '@solana/actions';
import { Eligibility } from '../enums/campaign';
import { ActionCostEnum } from '../enums/post';

export interface GetPostsResponse {
  posts: PostBlinksDetail[] | undefined; // sorted actionUrls for a particular mint/address
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

export interface PostContent
  extends ActionGetResponse,
    PostDetails,
    PostCampaignDetails {
  carousel?: Carousel[];
}

export interface PostCampaignDetails {
  cost?: {
    type: ActionCostEnum;
    mint: string;
    tokenProgram: string;
    decimals: number;
    queries: { key: string; value?: string }[];
    amount: number;
  }[];
  campaign?: {
    amountPerQuery: {
      linkedAction: string;
      query: { key: string; value?: string; validation?: string }[];
      amount: number;
    }[];
    endDate?: number;
    eligibility: Eligibility;
    participants: string[];
    winners: string[];
    budget: number;
    mint: string;
    tokensRemaining: number;
    id: number;
  };
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
