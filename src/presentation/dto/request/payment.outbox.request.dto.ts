import { ApiProperty } from '@nestjs/swagger';
import { IPaymentOutboxMetadata } from 'src/domain/reservation/model/entity/payment.outbox.entity';

export class PaymentOutboxRequestCommonDto {
  @ApiProperty({ description: 'Event ID' })
  eventId: number;

  @ApiProperty({ description: '결제 정보 메타데이터' })
  metadata: IPaymentOutboxMetadata;
}
