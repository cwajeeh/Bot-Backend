import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgentAndSourceColumnToBotConversationTable1715945213508
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE public.bot_conversation
        ADD COLUMN agent TEXT NULL,
        ADD COLUMN session_id TEXT NULL,
        ADD COLUMN source TEXT NULL;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE public.bot_conversation
        DROP COLUMN IF EXISTS agent,
        DROP COLUMN IF EXISTS session_id,
        DROP COLUMN IF EXISTS source;
  `);
  }
}
