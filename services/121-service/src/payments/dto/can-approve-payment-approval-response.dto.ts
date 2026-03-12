import { ApiProperty } from '@nestjs/swagger';

export class CanApprovePaymentApprovalResponseDto {
  @ApiProperty({ example: true })
  public readonly canApprove: boolean;
}
