import { ApiProperty } from '@nestjs/swagger';

export class VisaCardOrderResponseDto {
  @ApiProperty({ example: 100 })
  public readonly noOfCardsOrdered: number;

  @ApiProperty({ example: 'Damrak 1 A, 1011AB Amsterdam' })
  public readonly address: string;

  @ApiProperty({ example: 'manager@example.org' })
  public readonly orderedByUsername: string;

  @ApiProperty({ example: '2026-05-26T08:30:00.000Z' })
  public readonly orderedAt: Date;
}
