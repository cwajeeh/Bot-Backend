import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BotsEntity } from './bots.entity'; // Adjust the import path as necessary

@Entity('bot_sources')
export class BotSources {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bot_id: number;

  @Column({ type: 'varchar' })
  source_type: string;

  @Column({ type: 'json' })
  source_data: any; // 'json' type allows storing JSON data

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => BotsEntity, (bot) => bot.botSources)
  @JoinColumn({ name: 'bot_id' })
  bot: BotsEntity;
}
