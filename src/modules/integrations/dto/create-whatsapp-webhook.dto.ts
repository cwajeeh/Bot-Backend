import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWhatsAppWebhookDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  chatbot_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  verification_token: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_number_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  access_token: string;
}
