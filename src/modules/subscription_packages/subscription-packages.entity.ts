import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('subscription_packages')
export class SubscriptionPackagesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  stripe_price_id: string;

  @Column()
  stripe_annual_price_id: string;

  @Column('json', { nullable: true })
  features: object;

  @Column('json', { nullable: true })
  features_metadata: object;

  @Column('json', { nullable: true })
  price: object;

  @Column('json', { nullable: true })
  annual_price: object;
}
