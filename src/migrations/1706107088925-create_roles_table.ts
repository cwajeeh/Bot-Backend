import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateRolesTable1706107088925 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
              name: 'roles',
              columns: [
                {
                  name: 'id',
                  type: 'int4',
                  isPrimary: true,
                  isGenerated: true,
                  generationStrategy: 'increment',
                },
                {
                  name: 'name',
                  type: 'varchar',
                  isNullable: true,
                  isUnique: true,
                },
                {
                  name: 'created_at',
                  type: 'timestamptz',
                  isNullable: false,
                  default: 'now()',
                },
                {
                  name: 'updated_at',
                  type: 'timestamptz',
                  isNullable: false,
                  default: 'now()',
                },
              ],
            }),
            false,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`DROP TABLE roles`);
    }

}
