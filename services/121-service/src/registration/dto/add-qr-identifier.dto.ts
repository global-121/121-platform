import { ApiProperty } from '@nestjs/swagger';

import { Length, MinLength } from 'class-validator';

export class AddQrIdentifierDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({ example: 'SuperAwesomeCustomQr' })
  @MinLength(10)
  public readonly qrIdentifier: string;
}
