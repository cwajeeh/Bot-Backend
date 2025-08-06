import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetTokenToUsers1706774679124
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS public.users
             ADD COLUMN IF NOT EXISTS password_reset_token character varying;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.users
             DROP COLUMN IF EXISTS password_reset_token;`,
    );
  }
}
