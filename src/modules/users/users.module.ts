import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersEntity } from './users.entity';
import { UserController } from './users.controller';
import { SharedModule } from '../shared/shared.module';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersEntity]),
    SharedModule,
    forwardRef(() => BotsModule),
  ],
  providers: [UsersService],
  controllers: [UserController],
  exports: [UsersService, TypeOrmModule.forFeature([UsersEntity])],
})
export class UsersModule {}
