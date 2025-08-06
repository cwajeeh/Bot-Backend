import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('whatsapp_integrations')
export class WhatsAppIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  chatbot_id: string;

  @Column()
  verification_token: string;

  @Column()
  phone_number_id: string;

  @Column()
  access_token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
