import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { EspocrmActionTypeEnum } from '../espocrm-action-type.enum';
import { EspocrEntityTypeEnum } from './../espocrm-entity-type';

export class EspocrmWebhookDto {
  @ApiProperty({
    example: '63f77488410458465',
  })
  @IsString()
  public referenceid: string;

  @ApiProperty({
    enum: EspocrmActionTypeEnum,
    example: EspocrmActionTypeEnum.update,
  })
  @IsEnum(EspocrmActionTypeEnum)
  public actionType: EspocrmActionTypeEnum;

  @ApiProperty({
    enum: EspocrEntityTypeEnum,
    example: EspocrEntityTypeEnum.registration,
  })
  @IsEnum(EspocrEntityTypeEnum)
  public entityType: EspocrEntityTypeEnum;

  @ApiProperty({
    example: 'secret-key',
  })
  @IsString()
  public secretKey: string;
}
