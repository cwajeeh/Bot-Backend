import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWhatsappIntegrationsTable1710971109725
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS public.whatsapp_integrations
            (
                id SERIAL PRIMARY KEY,
                chatbot_id VARCHAR NOT NULL,
                verification_token VARCHAR NOT NULL,
                phone_number_id VARCHAR NOT NULL,
                access_token VARCHAR NOT NULL,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS public.whatsapp_integrations`,
    );
  }
}
