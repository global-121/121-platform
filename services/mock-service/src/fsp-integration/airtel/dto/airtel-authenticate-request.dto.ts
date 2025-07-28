import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';

export class AirtelAuthenticateRequestDto {
  @ApiProperty({ example: uuid() })
  public client_id: string;
  @ApiProperty({ example: uuid() })
  public client_secret: string;
  @ApiProperty({ example: 'client_credentials' })
  public grant_type: string;
}
