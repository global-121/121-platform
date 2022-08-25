import { ApiProperty } from '@nestjs/swagger';

import { MinLength } from 'class-validator';

export class QrIdentifierDto {
  @ApiProperty({ example: 'SuperAwesomeCustomQr' })
  @MinLength(10)
  public readonly qrIdentifier: string;
}
