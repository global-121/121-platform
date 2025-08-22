import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentEventEntity } from '@121-service/src/payments/payment-events/entities/payment-event.entity';
import { PaymentEventAttributeEntity } from '@121-service/src/payments/payment-events/entities/payment-event-attribute.entity';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEventEntity, PaymentEventAttributeEntity]),
  ],
  providers: [PaymentEventsService],
  exports: [PaymentEventsService],
})
export class PaymentEventsModule {}
