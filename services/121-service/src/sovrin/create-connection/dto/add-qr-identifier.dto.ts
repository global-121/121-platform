import { ApiModelProperty } from '@nestjs/swagger';

import { Length, MinLength } from 'class-validator';

export class AddQrIdentifierDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 'SuperAwesomeCustomQr' })
  @MinLength(10)
  public readonly qrIdentifier: string;
}
