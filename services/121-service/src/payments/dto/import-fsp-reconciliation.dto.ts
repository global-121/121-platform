import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { StatusEnum } from '../../shared/enum/status.enum';

export class ImportFspReconciliationArrayDto {
  @ApiProperty({ example: +24300000000 })
  @IsOptional()
  public phoneNumber: string;

  @ApiProperty({ example: StatusEnum.success })
  @IsOptional()
  public status: string;

  @ApiProperty({ example: 50 })
  @IsOptional()
  public amount: string;
}

export class ImportFspReconciliationDto {
  @ApiProperty({ example: [] })
  @IsArray()
  public validatedArray: ImportFspReconciliationArrayDto[];

  @ApiProperty({ example: 1 })
  @IsNumber()
  public recordsCount: number;
}
