import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnReferredByToUser1727872588827 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users 
            ADD COLUMN referred_by TEXT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users
            DROP COLUMN referred_by
        `);
    }

}
