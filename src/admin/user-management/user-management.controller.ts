import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { UsersEntity } from 'src/modules/users/users.entity';
import { Roles } from 'src/modules/roles/roles.decorator';
import { ROLES_ENUM } from 'src/modules/roles/roles.enum';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { User } from 'aws-sdk/clients/budgets';
import { RequestWithUserDto } from '../common/dto/request-with-user.dto';
import { GetUsersDto } from 'src/modules/users/dtos/get-users.dto';
import { PaginatedUsers } from 'src/modules/users/interfaces/users.interface';

@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
export class UserManagementController {
  constructor(private userManagementService: UserManagementService) {}

  // this route only get those users which are not admin
  @Get()
  @Roles(ROLES_ENUM.ADMIN)
  getAllUsers(@Query() getUsersDto: GetUsersDto): Promise<PaginatedUsers> {
    return this.userManagementService.getAllUsers(getUsersDto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/status')
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<object> {
    return this.userManagementService.updateUserStatus(id, updateUserStatusDto);
  }

  @Delete(':id')
  @Roles(ROLES_ENUM.ADMIN)
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userManagementService.deleteUserById(id);
  }

  @Get(':id')
  @Roles(ROLES_ENUM.ADMIN)
  getUserDetails(@Param('id', ParseIntPipe) id: number) {
    return this.userManagementService.getUserDetails(id);
  }
}
