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
import stream from 'stream';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { IdentifyVoucherDto } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/identify-voucher.dto';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { IntersolveVoucherCronService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher-cron.service';
import { IMAGE_UPLOAD_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/intersolve-voucher')
@Controller()
export class IntersolveVoucherController {
  public constructor(
    private intersolveVoucherService: IntersolveVoucherService,
    private intersolveVoucherCronService: IntersolveVoucherCronService,
    private azureLogService: AzureLogService,
  ) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentVoucherREAD] })
  @ApiOperation({
    summary: '[SCOPED] Export Intersolve voucher image',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Voucher exported - NOTE: this endpoint is scoped, depending on project configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('projects/:projectId/fsps/intersolve-voucher/vouchers')
  public async exportVouchers(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Query() queryParams: IdentifyVoucherDto,
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveVoucherService.exportVouchers(
      queryParams.referenceId,
      Number(queryParams.paymentId),
      projectId,
    );
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentVoucherREAD] })
  @ApiOperation({
    summary: '[SCOPED] Get balance of Intersolve voucher',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @ApiQuery({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Voucher balance retrieved - NOTE: this endpoint is scoped, depending on project configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('projects/:projectId/fsps/intersolve-voucher/vouchers/balance')
  public async getBalance(
    @Param('projectId', ParseIntPipe)
    projectId: number,
    @Query() queryParams: IdentifyVoucherDto,
  ): Promise<number> {
    return await this.intersolveVoucherService.getVoucherBalance(
      queryParams.referenceId,
      Number(queryParams.paymentId),
      projectId,
    );
  }

  @ApiOperation({
    summary:
      'Get intersolve voucher instructions image - used by Twilio to include in WhatsApp message',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get intersolve instructions',
  })
  @Get('projects/:projectId/fsps/intersolve-voucher/instructions')
  public async intersolveInstructions(
    @Res() response: Response,
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<void> {
    const blob = await this.intersolveVoucherService.getInstruction(projectId);
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Post Intersolve instructions-image (Only .png-files supported)',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(IMAGE_UPLOAD_API_FORMAT)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post intersolve instructions',
  })
  @Post('projects/:projectId/fsps/intersolve-voucher/instructions')
  @UseInterceptors(FileInterceptor('image'))
  public async postIntersolveInstructions(
    @UploadedFile() instructionsFileBlob: Express.Multer.File,
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<void> {
    await this.intersolveVoucherService.postInstruction(
      projectId,
      instructionsFileBlob,
    );
  }
}
