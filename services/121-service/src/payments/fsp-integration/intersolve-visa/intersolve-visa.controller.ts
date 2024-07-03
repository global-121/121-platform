import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';

import { GetWalletsResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-get-wallet-details.dto';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Retrieve and update all Visa balance, spent this month and cards data for all programs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Data retrieved from Intersolve and entities updated for all programs.',
  })
  @Patch('programs/:programId/financial-service-providers/intersolve-visa/')
  public async retrieveAndUpdateAllCards(): Promise<void> {
    await this.intersolveVisaService.retrieveAndUpdateAllWalletsAndCards();
  }
}
