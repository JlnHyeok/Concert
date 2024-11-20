import { ApiProperty } from '@nestjs/swagger';

export class PaymentOutboxRequestCommonDto {
  @ApiProperty({ description: 'Event ID' })
  eventId: number;
}
