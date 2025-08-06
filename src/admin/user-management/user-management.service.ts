import {
  Get,
  Injectable,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from 'src/modules/users/users.entity';
import { UsersService } from 'src/modules/users/users.service';
import { Repository } from 'typeorm';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ROLES_ENUM } from 'src/modules/roles/roles.enum';
import { StripeService } from 'src/modules/stripe/stripe.service';
import { GetUsersDto } from 'src/modules/users/dtos/get-users.dto';
import { PaginatedUsers } from 'src/modules/users/interfaces/users.interface';

@Injectable()
export class UserManagementService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
    private stripeService: StripeService,
  ) {}
  getAllUsers(getUsersDto: GetUsersDto): Promise<PaginatedUsers> {
    return this.usersService.getAllUsers(getUsersDto);
  }

  async updateUserStatus(
    id: number,
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<object> {
    const { isActive } = updateUserStatusDto;

    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    if (user.role.name === ROLES_ENUM.ADMIN) {
      throw new UnauthorizedException('An admin status cannot be changed');
    }
    if (user.is_active === isActive) {
      return { message: `User is already ${isActive ? 'active' : 'inactive'}` };
    }

    user.is_active = isActive;
    await this.usersRepository.save(user);

    return { message: 'User Successfully Updated', user };
  }

  async deleteUserById(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    if (user.role.name === ROLES_ENUM.ADMIN) {
      throw new UnauthorizedException('An admin cannot delete another admin');
    }
    if (user?.is_deleted) {
      return { message: `User is already deleted` };
    }

    await this.usersService.deleteProfile(user.email);

    return { message: 'User Soft Deleted Successfully' };
  }

  async getUserDetails(id: number): Promise<object> {
    const user = await this.usersRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.bots', 'bot') 
    .leftJoinAndSelect(
      'user.user_subscriptions', 
      'subscription', 
      'subscription.expires_at > :currentDate',  
      { currentDate: new Date() }
    )
    .where('user.id = :id', { id })
    .orderBy('subscription.expires_at', 'DESC')  
    .getOne();
  
  
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    user.bots = user.bots.sort((a: any, b: any) => {
      return a.is_deleted - b.is_deleted || a.created_at - b.created_at;
    });

    const { password: _, ...userWithoutPassword } = user;

    if (!user.user_subscriptions.length) {
      return userWithoutPassword;
    }

    const user_with_current_plan =
      await this.usersService.findUserWithSubscription(id);

    const { invoices } = await this.stripeService.getPaymentsForCustomer(
      user.user_subscriptions[0].customer,
    );
    const payments = invoices.data.map((inv) => ({
      id: inv.id,
      created: new Date(inv.created * 1000).toISOString(),
      currency: inv.currency,
      customer_email: inv.customer_email,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      amount_paid: inv.amount_paid,
    }));

    return {
      ...userWithoutPassword,
      user_stripe_invoices: payments,
      user_with_current_plan,
    };
  }
}
