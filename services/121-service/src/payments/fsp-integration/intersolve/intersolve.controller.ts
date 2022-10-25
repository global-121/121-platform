import {
  Body,
  Controller,
  Get,
  HttpStatus,
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
import { Permissions } from '../../../guards/permissions.decorator';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { PermissionEnum } from '../../../user/permission.enum';
import { AdminAuthGuard } from './../../../guards/admin.guard';
import { IMAGE_UPLOAD_API_FORMAT } from './../../../shared/file-upload-api-format';
import { IdentifyVoucherDto } from './dto/identify-voucher.dto';
import { IntersolveService } from './intersolve.service';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('payments/intersolve')
@Controller()
export class IntersolveController {
  public constructor(private intersolveService: IntersolveService) {}

  @Permissions(PermissionEnum.PaymentVoucherREAD)
  @ApiOperation({
    summary: 'Export Intersolve vouchers',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 200, description: 'Vouchers exported' })
  @Post('programs/:programId/payments/intersolve/export-voucher')
  public async exportVouchers(
    @Body() identifyVoucherDto: IdentifyVoucherDto,
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveService.exportVouchers(
      identifyVoucherDto.referenceId,
      identifyVoucherDto.payment,
    );
    var bufferStream = new stream.PassThrough();
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
  @ApiResponse({ status: 200, description: 'Vouchers balance retrieved' })
  @Post('programs/:programId/payments/intersolve/balance')
  public async getBalance(
    @Body() identifyVoucherDto: IdentifyVoucherDto,
  ): Promise<number> {
    return await this.intersolveService.getVoucherBalance(
      identifyVoucherDto.referenceId,
      identifyVoucherDto.payment,
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
    var bufferStream = new stream.PassThrough();
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
  @ApiResponse({ status: 200, description: 'Post intersolve instructions' })
  @Post('/payments/intersolve/instruction')
  @UseInterceptors(FileInterceptor('image'))
  public async postIntersolveInstructions(
    @UploadedFile() instructionsFileBlob,
  ): Promise<void> {
    await this.intersolveService.postInstruction(instructionsFileBlob);
  }
}
