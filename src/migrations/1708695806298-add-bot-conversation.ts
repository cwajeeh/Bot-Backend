import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBotConversationTable1708695806298
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.bot_conversation (
        id SERIAL NOT NULL,
        bot_id INTEGER NOT NULL,
        question TEXT,
        answer TEXT,
        response_data JSON,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bot_id FOREIGN KEY (bot_id)
          REFERENCES public.bots (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.bot_conversation;');
  }
}
