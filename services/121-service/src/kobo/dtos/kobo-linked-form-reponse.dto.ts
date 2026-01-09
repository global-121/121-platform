import { ApiProperty } from '@nestjs/swagger';

export class KoboLinkedFormResponseDto {
  @ApiProperty({
    example: 'Example Kobo-form',
    description: 'Name of the form',
  })
  name: string;
}
