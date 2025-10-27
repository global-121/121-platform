import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentEventEntity } from '@121-service/src/payments/payment-events/entities/payment-event.entity';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventAttributeKey } from '@121-service/src/payments/payment-events/enums/payment-event-attribute-key.enum';
import { PaymentEventsMapper } from '@121-service/src/payments/payment-events/mappers/payment-events.mapper';

@Injectable()
export class PaymentEventsService {
  @InjectRepository(PaymentEventEntity)
  private readonly paymentEventRepository: Repository<PaymentEventEntity>;

  // TODO: move some of these methods to repository
  public async getPaymentEvents(
    paymentId: number,
  ): Promise<PaymentEventsReturnDto> {
    const paymentEventEntities = await this.paymentEventRepository.find({
      where: { paymentId: Equal(paymentId) },
      order: { created: 'DESC' },
      relations: ['user', 'attributes'],
    });

    return PaymentEventsMapper.mapToPaymentEventsDto(paymentEventEntities);
  }

  public async createEventWithoutAttributes({
    paymentId,
    userId,
    type,
  }: {
    paymentId: number;
    userId: number;
    type: PaymentEvent;
  }): Promise<void> {
    await this.paymentEventRepository.save({
      type,
      paymentId,
      user: { id: userId },
    });
  }

  public async createStartedEvent({
    paymentId,
    userId,
  }: {
    paymentId: number;
    userId: number;
  }): Promise<void> {
    await this.paymentEventRepository.save({
      type: PaymentEvent.started,
      paymentId,
      user: { id: userId },
    });
  }

  public async createNoteEvent({
    paymentId,
    userId,
    note,
  }: {
    paymentId: number;
    userId: number;
    note: string;
  }): Promise<void> {
    await this.paymentEventRepository.save({
      type: PaymentEvent.note,
      paymentId,
      user: { id: userId },
      attributes: [
        {
          key: PaymentEventAttributeKey.note,
          value: note,
        },
      ],
    });
  }
}
