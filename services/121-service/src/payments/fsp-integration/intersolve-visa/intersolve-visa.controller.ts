import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { AuthenticatedUser } from '../../../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../../../guards/authenticated-user.guard';
import { PermissionEnum } from '../../../user/enum/permission.enum';
import { IntersolveBlockWalletResponseDto } from './dto/intersolve-block.dto';
import { GetWalletsResponseDto } from './dto/intersolve-get-wallet-details.dto';
import { IntersolveVisaService } from './intersolve-visa.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('financial-service-providers/intersolve-visa')
@Controller()
export class IntersolveVisaController {
  public constructor(private intersolveVisaService: IntersolveVisaService) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] [EXTERNALLY USED] Get Intersolve Visa wallet data related to a registration',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Wallets data retrieved - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: GetWalletsResponseDto,
  })
  @Get(
    'programs/:programId/financial-service-providers/intersolve-visa/wallets',
  )
  public async getVisaWalletsAndDetails(
    // TODO: REFACTOR: rename to registration.referenceid
    @Query('referenceId') referenceId,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<GetWalletsResponseDto> {
    return await this.intersolveVisaService.getVisaWalletsAndDetails(
      referenceId,
      programId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardBLOCK] })
  @ApiOperation({
    summary: '[SCOPED] [EXTERNALLY USED] Block Intersolve Visa wallet',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'tokenCode', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Body.status 204: Blocked wallet, stored in 121 db and sent notification to registration. Body.status 405 Method not allowed (e.g. token already blocked) - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  // TODO: change to PATCH programs/:programId/financial-service-providers/intersolve-visa/wallets/:tokenCode + combine with unblock endpoint
  @Post(
    'programs/:programId/financial-service-providers/intersolve-visa/wallets/:tokenCode/block',
  )
  public async blockWallet(
    @Param() params,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<IntersolveBlockWalletResponseDto> {
    return await this.intersolveVisaService.toggleBlockWalletNotification(
      params.tokenCode,
      true,
      programId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardUNBLOCK] })
  @ApiOperation({
    summary: '[SCOPED] Unblock Intersolve Visa wallet',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'tokenCode', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Body.status 201: Unblocked wallet, stored in 121 db and sent notification to registration. Body.status 405 Method not allowed (e.g. token already unblocked) - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  // TODO: change to PATCH programs/:programId/financial-service-providers/intersolve-visa/wallets/:tokenCode + combine with block endpoint
  @Post(
    'programs/:programId/financial-service-providers/intersolve-visa/wallets/:tokenCode/unblock',
  )
  public async unblockWallet(
    @Param() params,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<IntersolveBlockWalletResponseDto> {
    return await this.intersolveVisaService.toggleBlockWalletNotification(
      params.tokenCode,
      false,
      programId,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Send FSP Visa Customer data of a registration to Intersolve',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer data updated',
  })
  // TODO: REFACTOR: POST /api/programs/{programId}/financial-service-providers/intersolve-visa/customers/:holderid/sync
  @Put(
    'programs/:programId/financial-service-providers/intersolve-visa/customers/:referenceId',
  )
  public async syncIntersolveCustomerWith121(
    @Param() params,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<any> {
    return await this.intersolveVisaService.syncIntersolveCustomerWith121(
      params.referenceId,
      programId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardCREATE] })
  @ApiOperation({
    summary:
      '[SCOPED] Replace wallet and card: issue new wallet and card for Intersolve Visa customer and unload/block old wallet',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Wallet and card replaced - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  // TODO: REFACTOR: PUT /api/programs/{programId}/financial-service-providers/intersolve-visa/wallets/:tokencode
  @Put(
    'programs/:programId/financial-service-providers/intersolve-visa/customers/:referenceId/wallets',
  )
  public async reissueWalletAndCard(
    @Param() params,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<IntersolveBlockWalletResponseDto> {
    return await this.intersolveVisaService.reissueWalletAndCard(
      params.referenceId,
      programId,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Update all Visa wallet details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet and card replaced',
  })
  @Patch(
    'programs/:programId/financial-service-providers/intersolve-visa/wallets',
  )
  public async updateVisaDebitWalletDetails(): Promise<void> {
    console.info('CronjobService - Started: updateVisaDebitWalletDetailsCron');
    await this.intersolveVisaService.updateVisaDebitWalletDetails();
    console.info('CronjobService - Complete: updateVisaDebitWalletDetailsCron');
  }
}
