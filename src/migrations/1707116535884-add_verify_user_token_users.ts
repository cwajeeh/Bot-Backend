import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerifyUserTokenToUsers1707116535884
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS public.users
             ADD COLUMN IF NOT EXISTS verify_user_token character varying;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.users
             DROP COLUMN IF EXISTS verify_user_token;`,
    );
  }
}
