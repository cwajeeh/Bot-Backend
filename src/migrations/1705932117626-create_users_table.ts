import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsersTable1705932117626 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
              name: 'users',
              columns: [
                {
                  name: 'id',
                  type: 'int4',
                  isPrimary: true,
                  isGenerated: true,
                  generationStrategy: 'increment',
                },
                {
                  name: 'username',
                  type: 'varchar',
                  isNullable: true,
                  isUnique: true,
                },
                {
                  name: 'email',
                  type: 'varchar',
                  isNullable: false,
                  isUnique: true,
                },
                {
                  name: 'password',
                  type: 'varchar',
                  isNullable: false,
                },
                {
                  name: 'first_name',
                  type: 'varchar',
                  isNullable: true,
                },
                {
                  name: 'last_name',
                  type: 'varchar',
                  isNullable: true,
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
        queryRunner.query(`DROP TABLE users`);
    }

}
