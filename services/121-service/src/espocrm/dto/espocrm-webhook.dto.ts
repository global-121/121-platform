import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { EspoCrmActionTypeEnum } from '../espocrm-action-type.enum';
import { EspoCrmEntityTypeEnum } from './../espocrm-entity-type';

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
    enum: EspoCrmActionTypeEnum,
    example: EspoCrmActionTypeEnum.update,
  })
  @IsEnum(EspoCrmActionTypeEnum)
  public actionType: EspoCrmActionTypeEnum;

  @ApiProperty({
    description: 'The entity type that triggers this webhook.',
    enum: EspoCrmEntityTypeEnum,
    example: EspoCrmEntityTypeEnum.registration,
  })
  @IsEnum(EspoCrmEntityTypeEnum)
  public entityType: EspoCrmEntityTypeEnum;

  @ApiProperty({
    description: 'The secret key that is used to verify the webhook.',
    example: 'secret-key',
  })
  @IsString()
  public secretKey: string;
}
