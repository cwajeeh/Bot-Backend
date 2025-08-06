import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSubscriptionDTO {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    priceId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    successUrl: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    cancelUrl: string;

}