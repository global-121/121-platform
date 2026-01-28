import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { IdentifyVoucherDto } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/dto/identify-voucher.dto';
import { IntersolveVoucherService } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/services/intersolve-voucher.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { IMAGE_UPLOAD_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { sendImageResponse } from '@121-service/src/utils/send-image-response.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/intersolve-voucher')
@Controller()
export class IntersolveVoucherController {
  public constructor(
    private readonly intersolveVoucherService: IntersolveVoucherService,
  ) {}

  @AuthenticatedUser({
    permissions: [PermissionEnum.PaymentVoucherPaperREAD],
  })
  @ApiOperation({
    summary: '[SCOPED] Get Intersolve paper voucher image',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Voucher exported - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/fsps/intersolve-voucher/voucher/image-paper')
  public async getPaperVoucherImage(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query() queryParams: IdentifyVoucherDto,
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveVoucherService.getVoucherImage(
      queryParams.referenceId,
      Number(queryParams.paymentId),
      programId,
    );

    sendImageResponse(blob, response);
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.PaymentVoucherWhatsappREAD],
  })
  @ApiOperation({
    summary: '[SCOPED] Get Intersolve WhatsApp voucher image',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Voucher exported - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/fsps/intersolve-voucher/voucher/image-whatsapp')
  public async getWhatsappVoucherImage(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query() queryParams: IdentifyVoucherDto,
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveVoucherService.getVoucherImage(
      queryParams.referenceId,
      Number(queryParams.paymentId),
      programId,
    );

    sendImageResponse(blob, response);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentREAD] })
  @ApiOperation({
    summary: '[SCOPED] Get balance of Intersolve voucher',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Voucher balance retrieved - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/fsps/intersolve-voucher/voucher/balance')
  public async getBalance(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query() queryParams: IdentifyVoucherDto,
  ): Promise<number> {
    return await this.intersolveVoucherService.getVoucherBalance(
      queryParams.referenceId,
      Number(queryParams.paymentId),
      programId,
    );
  }

  @ApiOperation({
    summary:
      'Get intersolve voucher instructions image - used by Twilio to include in WhatsApp message',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get intersolve instructions',
  })
  @Get('programs/:programId/fsps/intersolve-voucher/instructions')
  public async intersolveInstructions(
    @Res() response: Response,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    const blob = await this.intersolveVoucherService.getInstruction(programId);
    sendImageResponse(blob, response);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Post Intersolve instructions-image (Only .png-files supported)',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(IMAGE_UPLOAD_API_FORMAT)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post intersolve instructions',
  })
  @Post('programs/:programId/fsps/intersolve-voucher/instructions')
  @UseInterceptors(FileInterceptor('image'))
  public async postIntersolveInstructions(
    @UploadedFile() instructionsFileBlob: Express.Multer.File,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    await this.intersolveVoucherService.postInstruction(
      programId,
      instructionsFileBlob,
    );
  }
}
