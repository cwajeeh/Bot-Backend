import { MigrationInterface, QueryRunner } from 'typeorm';

export class BotsTableMigration1706509366143 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS public.bots
            (
                id SERIAL PRIMARY KEY,
                created_by INTEGER NOT NULL,
                created_at TIMESTAMP WITHOUT TIME ZONE,
                updated_at TIMESTAMP WITHOUT TIME ZONE,
                bot_name VARCHAR,
                last_trained_at TIMESTAMP WITHOUT TIME ZONE,
                instructions TEXT,
                model VARCHAR,
                interface JSON,
                security JSON,
                leads JSON,
                notifications JSON,
                display_id VARCHAR,
                visibility VARCHAR,
                status VARCHAR
            );
            
            ALTER TABLE public.bots ALTER COLUMN id SET DEFAULT nextval('bots_id_seq'::regclass);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.bots`);
  }
}
