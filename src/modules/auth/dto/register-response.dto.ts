import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDTO {

  @ApiProperty()
  email: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;
}