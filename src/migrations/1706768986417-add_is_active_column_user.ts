import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsActiveColumnToUsersTable1706768986417
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS public.users
             ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.users
             DROP COLUMN IF EXISTS is_active;`,
    );
  }
}
