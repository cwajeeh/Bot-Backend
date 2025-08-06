import { UsersEntity } from '../users.entity';

export interface UserWithCurrentPlan {
  id: string;
  email: string;
  subscription_type: string;
  price_id: string;
  name: string;
  allowedBots?: number;
}
export interface PaginatedUsers {
  users: UsersEntity[];
  limit?: number;
  offset?: number;
  totalUsers:number;
}
