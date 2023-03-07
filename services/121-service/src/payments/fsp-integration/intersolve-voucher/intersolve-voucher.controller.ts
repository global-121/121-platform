import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express-serve-static-core';
import stream from 'stream';
import { Admin } from '../../../guards/admin.decorator';
import { AdminAuthGuard } from '../../../guards/admin.guard';
import { Permissions } from '../../../guards/permissions.decorator';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { IMAGE_UPLOAD_API_FORMAT } from '../../../shared/file-upload-api-format';
import { PermissionEnum } from '../../../user/permission.enum';
import { IdentifyVoucherDto } from './dto/identify-voucher.dto';
import { InersolveJobDetails } from './dto/job-details.dto';
import { IntersolveVoucherService } from './intersolve-voucher.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('payments/intersolve')
@Controller()
export class IntersolveVoucherController {
  public constructor(private intersolveService: IntersolveVoucherService) {}

  @Permissions(PermissionEnum.PaymentVoucherREAD)
  @ApiOperation({
    summary: 'Export Intersolve vouchers',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 201, description: 'Vouchers exported' })
  @Post('programs/:programId/payments/intersolve/export-voucher')
  public async exportVouchers(
    @Param() params,
    @Body() identifyVoucherDto: IdentifyVoucherDto,
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveService.exportVouchers(
      identifyVoucherDto.referenceId,
      identifyVoucherDto.payment,
      params.programId,
    );
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }

  @Permissions(PermissionEnum.PaymentVoucherREAD)
  @ApiOperation({
    summary: 'Get Intersolve voucher balance',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 201, description: 'Vouchers balance retrieved' })
  @Post('programs/:programId/payments/intersolve/balance')
  public async getBalance(
    @Param() params,
    @Body() identifyVoucherDto: IdentifyVoucherDto,
  ): Promise<number> {
    return await this.intersolveService.getVoucherBalance(
      identifyVoucherDto.referenceId,
      identifyVoucherDto.payment,
      params.programId,
    );
  }

  @ApiOperation({
    summary: 'Get intersolve instructions',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 200, description: 'Get intersolve instructions' })
  @Get('/payments/intersolve/instruction')
  public async intersolveInstructions(
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveService.getInstruction();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(HttpStatus.OK, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
  }

  @Admin()
  @ApiOperation({
    summary: 'Post Intersolve instructions-image (Only .png-files supported)',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(IMAGE_UPLOAD_API_FORMAT)
  @ApiResponse({ status: 201, description: 'Post intersolve instructions' })
  @Post('/payments/intersolve/instruction')
  @UseInterceptors(FileInterceptor('image'))
  public async postIntersolveInstructions(
    @UploadedFile() instructionsFileBlob,
  ): Promise<void> {
    await this.intersolveService.postInstruction(instructionsFileBlob);
  }

  @Admin()
  @ApiOperation({
    summary: 'Start a job to update all voucher balances of a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 201, description: 'Voucher update job started' })
  @Post('/programs/:programId/payments/intersolve/batch-jobs')
  public async createJob(
    @Body() jobDetails: InersolveJobDetails,
    @Param() param,
  ): Promise<void> {
    await this.intersolveService.updateVoucherBalanceJob(
      Number(param.programId),
      jobDetails.name,
    );
  }
}
