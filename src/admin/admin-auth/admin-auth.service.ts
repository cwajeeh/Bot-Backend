import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDTO } from './dto/signIn.dto';
import { SignInResponseDTO } from './dto/signIn-response.dto';
import { Repository } from 'typeorm';
import { UsersEntity } from 'src/modules/users/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ROLES_ENUM } from 'src/modules/roles/roles.enum';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { useEnv } from 'typeorm-extension';

@Injectable()
export class AdminAuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(request: SignInDTO): Promise<SignInResponseDTO> {
    const user = await this.usersService.signIn(request);

    if (!user) {
      throw new NotFoundException();
    }
    if (user.role.name !== ROLES_ENUM.ADMIN) {
      throw new UnauthorizedException('User is not an admin');
    }

    const { id, email, role, first_name, last_name } = user;

    return {
      user: { id, email, role, first_name, last_name },
      access_token: await this.jwtService.signAsync({
        id,
        email,
        role,
      }),
    };
  }

  async updateProfile(
    email: string,
    request: UpdateProfileDTO,
  ): Promise<object> {
    const user = await this.usersService.updateProfile(email, request);

    const { id, role, first_name, last_name } = user;
    return {
      message: 'Admin has been updated!',
      user: { id, email, role, first_name, last_name },
      access_token: await this.jwtService.signAsync({
        id,
        email,
        role,
      }),
    };
  }
}
