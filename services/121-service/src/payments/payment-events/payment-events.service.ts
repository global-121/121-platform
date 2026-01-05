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

  public async createEvent({
    paymentId,
    userId,
    type,
    attributes,
  }: {
    paymentId: number;
    userId: number;
    type: PaymentEvent;
    attributes?: { key: PaymentEventAttributeKey; value: string }[];
  }): Promise<void> {
    await this.paymentEventRepository.save({
      type,
      paymentId,
      user: { id: userId },
      attributes,
    });
  }

  public async createApprovedEvent({
    paymentId,
    userId,
    rank,
    total,
  }: {
    paymentId: number;
    userId: number;
    rank: number;
    total: number;
  }): Promise<void> {
    await this.createEvent({
      type: PaymentEvent.approved,
      paymentId,
      userId,
      attributes: [
        {
          key: PaymentEventAttributeKey.approveOrder,
          value: rank.toString(),
        },
        {
          key: PaymentEventAttributeKey.approveTotal,
          value: total.toString(),
        },
      ],
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
    await this.createEvent({
      type: PaymentEvent.note,
      paymentId,
      userId,
      attributes: [
        {
          key: PaymentEventAttributeKey.note,
          value: note,
        },
      ],
    });
  }
}
