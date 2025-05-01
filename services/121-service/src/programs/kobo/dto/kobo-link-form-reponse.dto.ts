import { ApiProperty } from '@nestjs/swagger';

export class KoboLinkFormResponseDto {
  @ApiProperty({
    example: 'My awesome form',
    description: 'Name of the Kobo form',
  })
  name: string;
}
