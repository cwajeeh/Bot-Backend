import { ApiProperty } from '@nestjs/swagger';

export class CreateWhatsappWebhookResponseDTO {
  @ApiProperty()
  webhookUrl: string;
}

export class GetWhatsappWebhookResponseDTO {
  @ApiProperty()
  webhook_url: string;

  @ApiProperty()
  chatbot_id: string;

  @ApiProperty()
  access_token: string;

  @ApiProperty()
  verification_token: string;

  @ApiProperty()
  phone_number_id: string;
}

export class DeleteWhatsappWebhookResponseDTO {
  @ApiProperty()
  message: string;
}
