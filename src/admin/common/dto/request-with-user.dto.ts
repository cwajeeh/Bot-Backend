import { UsersEntity } from 'src/modules/users/users.entity';

export interface RequestWithUserDto extends Express.Request {
  user?: UsersEntity;
}
