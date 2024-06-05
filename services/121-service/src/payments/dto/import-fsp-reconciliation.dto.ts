import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class ImportFspReconciliationArrayDto {
  @ApiProperty({ example: +24300000000 })
  @IsOptional()
  public phoneNumber?: string;

  @ApiProperty({ example: StatusEnum.success })
  @IsOptional()
  public status?: string;

  @ApiProperty({ example: 50 })
  @IsOptional()
  public amount?: string;

  @IsOptional()
  public paTransactionResult?: PaTransactionResultDto;
}

export class ImportFspReconciliationDto {
  @ApiProperty({ example: [] })
  @IsArray()
  public validatedArray: ImportFspReconciliationArrayDto[];

  @ApiProperty({ example: 1 })
  @IsNumber()
  public recordsCount: number;
}
