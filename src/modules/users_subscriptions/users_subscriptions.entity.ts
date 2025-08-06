import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { UsersEntity } from '../users/users.entity';

@Entity('users_subscriptions')
export class UsersSubscriptionsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subscription_id: string;

  @Column()
  customer: string;

  @Column()
  amount_total: string;

  @Column()
  currency: string;

  @Column()
  expires_at: string;

  @Column()
  invoice: string;

  @Column()
  mode: string;

  @Column()
  customer_email: string;

  @Column()
  price_id: string;

  @Column()
  payment_status: string;

  @Column()
  status: string;

  @Column()
  subscription: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  remaining_msg_credits: number;

  @Column()
  total_msg_credits: number;

  @Column()
  user_id: number;

  @Column()
  current: boolean;

  @ManyToOne(() => UsersEntity, user => user.user_subscriptions)
    @JoinColumn({ name: 'user_id' }) // Foreign key
    user: UsersEntity;
}
