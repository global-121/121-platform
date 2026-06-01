import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum VisaCardOrdersSortBy {
  Created = 'created',
  NoOfCardsOrdered = 'noOfCardsOrdered',
  OrderedByUsername = 'orderedByUsername',
}

export enum VisaCardOrdersSortOrder {
  Asc = 'ASC',
  Desc = 'DESC',
}

export class GetVisaCardOrdersQueryDto {
  @ApiPropertyOptional({
    enum: VisaCardOrdersSortBy,
    example: VisaCardOrdersSortBy.Created,
  })
  @IsOptional()
  @IsEnum(VisaCardOrdersSortBy)
  public readonly sortBy?: VisaCardOrdersSortBy;

  @ApiPropertyOptional({
    enum: VisaCardOrdersSortOrder,
    example: VisaCardOrdersSortOrder.Desc,
  })
  @IsOptional()
  @IsEnum(VisaCardOrdersSortOrder)
  public readonly sortOrder?: VisaCardOrdersSortOrder;
}
