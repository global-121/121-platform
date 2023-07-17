import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Admin } from '../../../guards/admin.decorator';
import { AdminAuthGuard } from '../../../guards/admin.guard';
import { Permissions } from '../../../guards/permissions.decorator';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { PermissionEnum } from '../../../user/permission.enum';
import { IntersolveBlockWalletResponseDto } from './dto/intersolve-block.dto';
import { GetWalletsResponseDto } from './dto/intersolve-get-wallet-details.dto';
import { IntersolveVisaService } from './intersolve-visa.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('fsp-integration/intersolve-visa')
@Controller()
export class IntersolveVisaController {
  public constructor(private intersolveVisaService: IntersolveVisaService) {}

  @Permissions(PermissionEnum.FspDebitCardREAD)
  @ApiOperation({
    summary: 'Get Intersolve Visa wallets and details',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({ status: 201, description: 'Wallets and details retrieved' })
  @Get('programs/:programId/fsp-integration/intersolve-visa/wallets')
  public async getVisaWalletsAndDetails(
    @Query('referenceId') referenceId,
    @Param() params,
  ): Promise<GetWalletsResponseDto> {
    return await this.intersolveVisaService.getVisaWalletsAndDetails(
      referenceId,
      params.programId,
    );
  }

  @Permissions(PermissionEnum.FspDebitCardBLOCK)
  @ApiOperation({
    summary: 'Block Intersolve Visa wallet',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'tokenCode', required: true, type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'Blocked wallet and stored in 121 db',
  })
  @ApiResponse({
    status: 405,
    description: 'Method not allowed (e.g. token already blocked)',
  })
  @Post(
    'programs/:programId/fsp-integration/intersolve-visa/wallets/:tokenCode/block',
  )
  public async blockWallet(
    @Param() params,
  ): Promise<IntersolveBlockWalletResponseDto> {
    return await this.intersolveVisaService.toggleBlockWallet(
      params.tokenCode,
      true,
    );
  }

  @Permissions(PermissionEnum.FspDebitCardUNBLOCK)
  @ApiOperation({
    summary: 'Unblock Intersolve Visa wallet',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'tokenCode', required: true, type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'Unblocked wallet and stored in 121 db',
  })
  @ApiResponse({
    status: 405,
    description: 'Method not allowed (e.g. token already unblocked)',
  })
  @Post(
    'programs/:programId/fsp-integration/intersolve-visa/wallets/:tokenCode/unblock',
  )
  public async unblockWallet(
    @Param() params,
  ): Promise<IntersolveBlockWalletResponseDto> {
    return await this.intersolveVisaService.toggleBlockWallet(
      params.tokenCode,
      false,
    );
  }

  @Admin()
  @ApiOperation({
    summary:
      'Update Intersolve Visa customer phone number to same as 121 phone number',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Phone number updated',
  })
  @Put(
    'programs/:programId/fsp-integration/intersolve-visa/customers/:referenceId',
  )
  public async updateCustomerPhoneNumber(
    @Param() params,
  ): Promise<IntersolveBlockWalletResponseDto> {
    return await this.intersolveVisaService.updateCustomerPhoneNumber(
      params.referenceId,
      params.programId,
    );
  }
}
