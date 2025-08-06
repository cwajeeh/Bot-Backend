import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bot_conversation')
export class BotConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bot_id: number;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column('json')
  response_data: any; // Assuming response_data holds JSON data

  @Column({ type: 'timestamp without time zone' })
  created_at: Date;

  @Column({ type: 'timestamp without time zone' })
  updated_at: Date;

  @Column('text')
  agent: string;

  @Column('text')
  source: string;

  @Column('text', { nullable: true })
  session_id: string;
}
