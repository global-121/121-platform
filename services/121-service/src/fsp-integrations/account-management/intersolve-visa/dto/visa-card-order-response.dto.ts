import { ApiProperty } from '@nestjs/swagger';

import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';

export class VisaCardOrderResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({
    enum: VisaCardOrderStatus,
    example: VisaCardOrderStatus.Completed,
  })
  public readonly status: VisaCardOrderStatus;

  @ApiProperty({ example: 100 })
  public readonly noOfCards: number;

  @ApiProperty({ example: 100 })
  public readonly noOfCardsOrdered: number;

  @ApiProperty({ example: 'Damrak 1 A, 1011AB Amsterdam' })
  public readonly address: string;

  @ApiProperty({ example: '+31612345678', nullable: true })
  public readonly addresseePhoneNumber: string | null;

  @ApiProperty({ example: 'manager@example.org' })
  public readonly orderedByUsername: string;

  @ApiProperty({ example: '2026-05-26T08:30:00.000Z' })
  public readonly created: Date;
}
