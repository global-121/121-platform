import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AccessGroupLevelsResponseDto {
  @ApiProperty({
    example: ['region', 'district', 'subDistrict'],
  })
  @IsArray()
  @IsString({ each: true })
  public readonly accessGroupRegistrationAttributeNames: string[];
}
