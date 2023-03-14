import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { EspocrmActionTypeEnum } from '../espocrm-action-type.enum';
import { EspocrEntityTypeEnum } from './../espocrm-entity-type';

export class EspocrmWebhookDto {
  @ApiProperty({
    description:
      'ID of the EspoCRM webhook entity. This can be copied from the URL when editing the webhook in EspoCRM.',
    example: '63f77488410458465',
  })
  @IsString()
  public referenceId: string;

  @ApiProperty({
    description: 'The type of action that triggers this webhook.',
    enum: EspocrmActionTypeEnum,
    example: EspocrmActionTypeEnum.update,
  })
  @IsEnum(EspocrmActionTypeEnum)
  public actionType: EspocrmActionTypeEnum;

  @ApiProperty({
    description: 'The entity type that triggers this webhook.',
    enum: EspocrEntityTypeEnum,
    example: EspocrEntityTypeEnum.registration,
  })
  @IsEnum(EspocrEntityTypeEnum)
  public entityType: EspocrEntityTypeEnum;

  @ApiProperty({
    description: 'The secret key that is used to verify the webhook.',
    example: 'secret-key',
  })
  @IsString()
  public secretKey: string;
}
