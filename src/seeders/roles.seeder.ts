import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { RolesEntity } from '../modules/roles/roles.entity';

export default class RolesSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
  ): Promise<void> {
    await dataSource.query('TRUNCATE "roles" RESTART IDENTITY CASCADE;');

    const repository = dataSource.getRepository(RolesEntity);

    await repository.insert(
        [
            {
                name: 'ADMIN'
            },
            {
                name: 'USER'
            }
        ]
    );
  }
}