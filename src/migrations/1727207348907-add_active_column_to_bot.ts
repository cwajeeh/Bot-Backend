import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActiveColumnToBot1727207348907 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE bots 
            ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE bots 
            DROP COLUMN is_enabled
        `);
    }

}
