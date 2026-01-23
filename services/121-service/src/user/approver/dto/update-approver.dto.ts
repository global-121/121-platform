import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateApproverDto {
  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsOptional()
  public readonly order?: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  public readonly isActive?: boolean;
}
