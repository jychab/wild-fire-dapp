import { Criteria, Eligibility } from '../enums/campaign';
import { ActionCostEnum } from '../enums/post';

export interface Campaign extends CampaignDetails {
  name: string;
  amount: number;
}

export interface AmountPerQuery {
  linkedAction: string;
  query: {
    key: string;
    value?: string;
    validation?: string;
  }[];
  amount: number;
}

export interface CostPerQuery {
  type: ActionCostEnum;
  mint: string;
  receiver: string;
  tokenProgram: string;
  decimals: number;
  queries: {
    key: string;
    value?: string;
  }[];
  amount: number;
}

export interface PostCampaign extends CampaignDetails {
  postId: string;
  winners: string[];
  amountPerQuery?: AmountPerQuery[];
  cost?: CostPerQuery[];
}

interface CampaignDetails {
  id: number;
  mint: string;
  admin: string;
  mintToSend: string;
  mintToSendDecimals: number;
  mintToSendTokenProgram: string;
  budget: number;
  tokensRemaining: number;
  eligibility: Eligibility;
  criteria: Criteria;
  startDate: number;
  endDate?: number;
  wallets: string[];
  softDelete: boolean;
}
