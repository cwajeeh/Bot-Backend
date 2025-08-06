import {
  BeforeInsert,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RolesEntity } from '../roles/roles.entity';
import { UsersSubscriptionsEntity } from '../users_subscriptions/users_subscriptions.entity';
import { BotsEntity } from '../bots/bots.entity';

@Entity('users')
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: false })
  password: string;

  @Column({ unique: false })
  first_name: string;

  @Column()
  is_active: boolean;

  @Column()
  is_deleted: boolean;

  @Column({ unique: false })
  last_name: string;

  @Column()
  role_id: number;

  @Column()
  password_reset_token: string;

  @Column()
  verify_user_token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ unique: false })
  referred_by: string;

  @OneToMany(() => UsersSubscriptionsEntity, subscription => subscription.user)
  user_subscriptions: UsersSubscriptionsEntity[];

  @ManyToOne((type) => RolesEntity, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: RolesEntity;

  @OneToMany(() => BotsEntity, (botEntity) => botEntity.user)
  bots: BotsEntity[];

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
