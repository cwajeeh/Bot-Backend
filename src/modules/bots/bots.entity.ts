import {
  BeforeInsert,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BotSources } from './bot-sources.entity';
import { UsersEntity } from '../users/users.entity';

export enum BotStatus {
  Trained = 'trained',
  Pending = 'pending',
}

@Entity('bots')
export class BotsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: false })
  bot_name: string;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('text')
  instructions: string;

  @Column()
  model: string;

  @Column()
  display_id: string;

  // @Column({ type: 'enum', enum: BotStatus, default: BotStatus.Pending })
  // status: BotStatus;

  @Column()
  status: string;

  @Column()
  is_deleted: boolean;

  @Column({ type: 'json' })
  interface: object;

  @Column({ type: 'json' })
  security: object;

  @Column()
  visibility: string;

  @Column({ type: 'json' })
  leads: object;

  @Column({ type: 'json' })
  notifications: object;

  @Column()
  characters_count: number;

  @Column()
  is_enabled: boolean;

  @OneToMany(() => BotSources, (botSource) => botSource.bot)
  botSources: BotSources[];

  @ManyToOne(() => UsersEntity)
  @JoinColumn({ name: 'created_by' })
  user: UsersEntity;
}
