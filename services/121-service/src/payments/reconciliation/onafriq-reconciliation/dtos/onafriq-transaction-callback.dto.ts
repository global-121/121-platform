import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

class OnafriqTransactionCallbackStatus {
  @ApiProperty()
  @IsOptional() // NOTE: this is optional in the sense that callbacks could theoretically change and we do not want to block that through validation. (Some validation decorator is required.)
  readonly code: string;
  @ApiProperty()
  @IsOptional()
  readonly message: string;
}

export class OnafriqTransactionCallbackDto {
  @ApiProperty()
  @IsOptional()
  readonly thirdPartyTransId: string;
  @ApiProperty()
  @IsOptional()
  readonly mfsTransId: string;
  @ApiProperty()
  @IsOptional()
  readonly status: OnafriqTransactionCallbackStatus;
}
