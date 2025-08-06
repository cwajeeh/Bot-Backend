import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBotSourcesTable1706718141627 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS public.bot_sources
            (
                id SERIAL PRIMARY KEY,
                bot_id INTEGER NOT NULL,
                source_type VARCHAR,
                source_data JSON,
                created_at TIMESTAMP WITHOUT TIME ZONE,
                updated_at TIMESTAMP WITHOUT TIME ZONE
            );

            ALTER TABLE public.bot_sources ALTER COLUMN id SET DEFAULT nextval('"bot_sources_id_seq"'::regclass);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.bot_sources`);
  }
}
