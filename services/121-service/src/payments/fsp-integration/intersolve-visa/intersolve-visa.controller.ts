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
@ApiTags('financial-service-providers/intersolve-visa')
@Controller()
export class IntersolveVisaController {
  public constructor(private intersolveVisaService: IntersolveVisaService) {}

  @Permissions(PermissionEnum.FspDebitCardREAD)
  @ApiOperation({
    summary: 'Get Intersolve Visa wallets and details',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: 201,
    description: 'Wallets and details retrieved',
    type: GetWalletsResponseDto,
  })
  @Get(
    'programs/:programId/financial-service-providers/intersolve-visa/wallets',
  )
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
    status: 201,
    description:
      'Body.status 204: Blocked wallet, stored in 121 db and sent notification to registration. Body.status 405 Method not allowed (e.g. token already blocked)',
  })
  @Post(
    'programs/:programId/financial-service-providers/intersolve-visa/wallets/:tokenCode/block',
  )
  public async blockWallet(
    @Param() params,
  ): Promise<IntersolveBlockWalletResponseDto> {
    return await this.intersolveVisaService.toggleBlockWalletNotification(
      params.tokenCode,
      true,
      Number(params.programId),
    );
  }

  @Permissions(PermissionEnum.FspDebitCardUNBLOCK)
  @ApiOperation({
    summary: 'Unblock Intersolve Visa wallet',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'tokenCode', required: true, type: 'string' })
  @ApiResponse({
    status: 201,
    description:
      'Body.status 201: Unblocked wallet, stored in 121 db and sent notification to registration. Body.status 405 Method not allowed (e.g. token already unblocked)',
  })
  @Post(
    'programs/:programId/financial-service-providers/intersolve-visa/wallets/:tokenCode/unblock',
  )
  public async unblockWallet(
    @Param() params,
  ): Promise<IntersolveBlockWalletResponseDto> {
    return await this.intersolveVisaService.toggleBlockWalletNotification(
      params.tokenCode,
      false,
      Number(params.programId),
    );
  }

  @Admin()
  @ApiOperation({
    summary:
      'Update Intersolve Visa customer data to same as 121 registration data',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Customer data updated',
  })
  @Put(
    'programs/:programId/financial-service-providers/intersolve-visa/customers/:referenceId',
  )
  public async syncIntersolveCustomerWith121(@Param() params): Promise<any> {
    return await this.intersolveVisaService.syncIntersolveCustomerWith121(
      params.referenceId,
      params.programId,
    );
  }

  @Permissions(PermissionEnum.FspDebitCardCREATE)
  @ApiOperation({
    summary: 'Issue new wallet and card for Intersolve Visa customer',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Issued new wallet and card',
  })
  @Put(
    'programs/:programId/financial-service-providers/intersolve-visa/customers/:referenceId/wallets',
  )
  public async reissueWalletAndCard(
    @Param() params,
  ): Promise<IntersolveBlockWalletResponseDto> {
    return await this.intersolveVisaService.reissueWalletAndCard(
      params.referenceId,
      params.programId,
    );
  }
}
