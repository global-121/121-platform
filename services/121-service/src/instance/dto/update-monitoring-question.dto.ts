import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { CreateOptionsDto } from '../../programs/dto/create-options.dto';

export class UpdateMonitoringQuestionDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly id: number;

  @ApiProperty({ example: { en: 'intro text' } })
  @IsOptional()
  public intro: JSON;

  @ApiProperty({
    example: { en: 'conclusion text' },
  })
  @IsOptional()
  public conclusion: JSON;

  @ApiProperty()
  @IsOptional()
  @Type(() => CreateOptionsDto)
  public options: JSON;
}
