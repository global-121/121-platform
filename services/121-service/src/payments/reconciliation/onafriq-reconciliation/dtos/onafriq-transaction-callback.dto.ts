import { ApiProperty } from '@nestjs/swagger';

class OnafriqTransactionCallbackStatus {
  @ApiProperty()
  readonly code: string;
  @ApiProperty()
  readonly message: string;
}

export class OnafriqTransactionCallbackDto {
  @ApiProperty()
  readonly thirdPartyTransId: string;
  @ApiProperty()
  readonly status: OnafriqTransactionCallbackStatus;
}
