import { Criteria, Eligibility } from '../enums/campaign';

export interface Campaign {
  id: number;
  name: string;
  allocatedBudget: number;
  amount: number;
  criteria: Criteria;
  eligibility: Eligibility;
  tokensRemaining: number;
  wallets: string[];
  startDate: number;
  endDate?: number;
  softDelete: boolean;
}
