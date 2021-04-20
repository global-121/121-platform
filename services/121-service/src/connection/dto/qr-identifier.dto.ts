import { ApiModelProperty } from '@nestjs/swagger';

import { MinLength } from 'class-validator';

export class QrIdentifierDto {
  @ApiModelProperty({ example: 'SuperAwesomeCustomQr' })
  @MinLength(10)
  public readonly qrIdentifier: string;
}
