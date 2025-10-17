import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class KoboWebhookIncomingSubmission {
  @ApiProperty({
    description: 'Unique identifier of the submission',
    example: '45ede11e-c80d-46ae-ab52-5072750a5bfe',
  })
  @IsOptional()
  readonly _uuid: string;

  @ApiProperty({
    description: 'Asset ID of the Kobo form',
    example: '<form_id>',
  })
  @IsOptional()
  readonly _xform_id_string: string;
}
