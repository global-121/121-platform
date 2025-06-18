import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

class OnafriqTransactionCallbackStatus {
  @ApiProperty()
  @IsNotEmpty() // REFACTOR: Ideally we don't want to block callbacks, but without these decorators, the callback is actually blocked. Solve differently.
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
