import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

class OnafriqTransactionCallbackStatus {
  @ApiProperty()
  @IsNotEmpty()
  readonly code: string;
  @ApiProperty()
  @IsNotEmpty()
  readonly message: string;
}

export class OnafriqTransactionCallbackDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly thirdPartyTransId: string;
  @ApiProperty()
  @IsNotEmpty()
  readonly status: OnafriqTransactionCallbackStatus;
}
