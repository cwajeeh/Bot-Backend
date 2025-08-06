import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDeletedColumnToBotsTable1715932964110
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bots" ADD "is_deleted" boolean DEFAULT false;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bots" DROP COLUMN "is_deleted";`);
  }
}
