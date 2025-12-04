import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa-account-management/intersolve-visa-account-management.service';
import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/debit-cards-intersolve-visa')
@Controller()
export class IntersolveVisaAccountManagementController {
  public constructor(
    private readonly userService: UserService,
    private readonly intersolveVisaAccountManagementService: IntersolveVisaAccountManagementService,
  ) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardCREATE] })
  @ApiOperation({
    summary: '[SCOPED] Re-issue card: replace existing card with a new card.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Card replaced - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Post(
    'programs/:programId/registrations/:referenceId/fsps/intersolve-visa/wallet/cards',
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  public async reissueCardAndSendMessage(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
    @Req() req,
  ): Promise<void> {
    const userId = req.user.id;
    await this.intersolveVisaAccountManagementService.reissueCardAndSendMessage(
      referenceId,
      programId,
      userId,
    );
  }

  @AuthenticatedUser()
  @ApiOperation({
    summary: '[SCOPED] [EXTERNALLY USED] Pause Intersolve Visa Card',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiParam({ name: 'tokenCode', required: true, type: 'string' })
  @ApiQuery({ name: 'pause', type: 'boolean' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Body.status 204: Paused card, stored in 121 db and sent notification to registration. - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Patch(
    'programs/:programId/registrations/:referenceId/fsps/intersolve-visa/wallet/cards/:tokenCode',
  )
  public async pauseCardAndSendMessage(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
    @Param('tokenCode') tokenCode: string,
    @Query('pause', ParseBoolPipe) pause: boolean,
    @Req() req,
  ) {
    const userId = req.user.id;
    const permission = pause
      ? PermissionEnum.FspDebitCardBLOCK
      : PermissionEnum.FspDebitCardUNBLOCK;

    const hasPermission = await this.userService.canActivate(
      [permission],
      programId,
      userId,
    );

    if (!hasPermission) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    if (pause === undefined) {
      throw new HttpException(
        'No pause value (true/false) provided in query parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.intersolveVisaAccountManagementService.pauseCardAndSendMessage(
      referenceId,
      programId,
      tokenCode,
      pause,
      userId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] [EXTERNALLY USED] Retrieves and updates latest wallet and cards data for a Registration from Intersolve and returns it',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Wallet and cards data retrieved from intersolve and updated in the 121 Platform. - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: IntersolveVisaWalletDto,
  })
  @Patch(
    'programs/:programId/registrations/:referenceId/fsps/intersolve-visa/wallet',
  )
  public async retrieveAndUpdateIntersolveVisaWalletAndCards(
    @Param('referenceId') referenceId: string,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    return await this.intersolveVisaAccountManagementService.retrieveAndUpdateIntersolveVisaWalletAndCards(
      referenceId,
      programId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.FspDebitCardREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] Gets wallet and cards data for a Registration and returns it',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Wallet and cards data retrieved from database. - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: IntersolveVisaWalletDto,
  })
  @Get(
    'programs/:programId/registrations/:referenceId/fsps/intersolve-visa/wallet',
  )
  public async getIntersolveVisaWalletAndCards(
    @Param('referenceId') referenceId: string,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<IntersolveVisaWalletDto> {
    return await this.intersolveVisaAccountManagementService.getIntersolveVisaWalletAndCards(
      referenceId,
      programId,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Send Visa Customer Information of a registration to Intersolve',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer data sent',
  })
  @Post(
    'programs/:programId/registrations/:referenceId/fsps/intersolve-visa/contact-information',
  )
  public async getRegistrationAndSendContactInformationToIntersolve(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('referenceId') referenceId: string,
  ): Promise<void> {
    return await this.intersolveVisaAccountManagementService.getRegistrationAndSendContactInformationToIntersolve(
      referenceId,
      programId,
    );
  }
}
