import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateProgramAccessGroupLevelsDto {
  @ApiProperty({
    example: ['region', 'district', 'subDistrict'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsString({ each: true })
  public readonly accessGroupRegistrationAttributeNames: string[];
}
