import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetProgramAttributesQueryParamDto {
  @ApiProperty({ required: false, type: 'boolean' })
  @IsBoolean()
  @IsOptional()
  showInPeopleAffectedTable?: boolean;

  @ApiProperty({ required: false, type: 'boolean' })
  @IsBoolean()
  @IsOptional()
  includeProgramQuestions?: boolean;

  @ApiProperty({ required: false, type: 'boolean' })
  @IsBoolean()
  @IsOptional()
  includeCustomAttributes?: boolean;

  @ApiProperty({ required: false, type: 'boolean' })
  @IsBoolean()
  @IsOptional()
  includeFspQuestions?: boolean;

  @ApiProperty({ required: false, type: 'boolean' })
  @IsBoolean()
  @IsOptional()
  includeTemplateDefaultAttributes?: boolean;
}
