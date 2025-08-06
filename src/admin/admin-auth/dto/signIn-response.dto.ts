import { ApiProperty } from '@nestjs/swagger';
import { IsJSON, IsString } from 'class-validator';

export class SignInResponseDTO {
  @ApiProperty()
  @IsJSON()
  user: object;

  @ApiProperty()
  @IsString()
  access_token: string;
}
