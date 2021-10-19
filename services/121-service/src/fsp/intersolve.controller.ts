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
import { FspService } from './fsp.service';
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
import { UserRole } from '../user-role.enum';
import { Roles } from '../roles.decorator';
import { RolesGuard } from '../roles.guard';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('fsp')
@Controller('fsp')
export class FspController {
  private readonly fspService: FspService;
  public constructor(
    fspService: FspService,
    private intersolveService: IntersolveService,
  ) {
    this.fspService = fspService;
  }

  @Roles(UserRole.RunProgram, UserRole.PersonalData, UserRole.View)
  @ApiOperation({
    title: 'Export Intersolve vouchers',
  })
  @ApiResponse({ status: 200, description: 'Vouchers exported' })
  @Post('intersolve/export-voucher')
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

  @Roles(UserRole.RunProgram, UserRole.PersonalData, UserRole.View)
  @ApiOperation({
    title: 'Get Intersolve voucher balance',
  })
  @ApiResponse({ status: 200, description: 'Vouchers balance retrieved' })
  @Post('intersolve/balance')
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
  @Get('intersolve/instruction')
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

  @Roles(UserRole.Admin)
  @ApiOperation({
    title: 'Post intersolve instructions',
  })
  @ApiImplicitFile({
    name: 'image',
    required: true,
    description: 'Upload image with voucher instructions (PNG format only',
  })
  @ApiResponse({ status: 200, description: 'Post intersolve instructions' })
  @Post('intersolve/instruction')
  @UseInterceptors(FileInterceptor('image'))
  public async postIntersolveInstructions(
    @UploadedFile() instructionsFileBlob,
  ): Promise<void> {
    await this.intersolveService.postInstruction(instructionsFileBlob);
  }
}
