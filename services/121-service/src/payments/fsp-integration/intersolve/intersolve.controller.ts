import {
  Post,
  Body,
  Controller,
  Get,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiUseTags,
  ApiResponse,
  ApiOperation,
  ApiImplicitFile,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IntersolveService } from './intersolve.service';
import { IdentifyVoucherDto } from './dto/identify-voucher.dto';
import { Response } from 'express-serve-static-core';
import stream from 'stream';
import { PermissionsGuard } from '../../../permissions.guard';
import { Permissions } from '../../../permissions.decorator';
import { PermissionEnum } from '../../../user/permission.enum';

@UseGuards(PermissionsGuard)
@ApiUseTags('payments/intersolve')
@Controller('payments/intersolve')
export class IntersolveController {
  public constructor(private intersolveService: IntersolveService) {}

  @Permissions(PermissionEnum.PaymentVoucherREAD)
  @ApiOperation({
    title: 'Export Intersolve vouchers',
  })
  @ApiResponse({ status: 200, description: 'Vouchers exported' })
  @Post('export-voucher')
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
    title: 'Get Intersolve voucher balance',
  })
  @ApiResponse({ status: 200, description: 'Vouchers balance retrieved' })
  @Post('balance')
  public async getBalance(
    @Body() identifyVoucherDto: IdentifyVoucherDto,
  ): Promise<number> {
    return await this.intersolveService.getVoucherBalance(
      identifyVoucherDto.referenceId,
      identifyVoucherDto.payment,
    );
  }

  @ApiOperation({
    title: 'Get intersolve instructions',
  })
  @ApiResponse({ status: 200, description: 'Get intersolve instructions' })
  @Get('instruction')
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

  @Permissions(PermissionEnum.PaymentVoucherInstructionUPDATE)
  @ApiOperation({
    title: 'Post intersolve instructions',
  })
  @ApiImplicitFile({
    name: 'image',
    required: true,
    description: 'Upload image with voucher instructions (PNG format only',
  })
  @ApiResponse({ status: 200, description: 'Post intersolve instructions' })
  @Post('instruction')
  @UseInterceptors(FileInterceptor('image'))
  public async postIntersolveInstructions(
    @UploadedFile() instructionsFileBlob,
  ): Promise<void> {
    await this.intersolveService.postInstruction(instructionsFileBlob);
  }
}
