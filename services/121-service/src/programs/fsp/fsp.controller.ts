import { AfricasTalkingService } from './africas-talking.service';
import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FspService } from './fsp.service';
import {
  ApiUseTags,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
  ApiImplicitFile,
} from '@nestjs/swagger';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import {
  FinancialServiceProviderEntity,
  fspName,
} from './financial-service-provider.entity';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { IntersolveService } from './intersolve.service';
import { ExportVoucherDto } from './dto/export-voucher.dto';
import { Response } from 'express-serve-static-core';
import stream from 'stream';
import { UserRole } from '../../user-role.enum';
import { Roles } from '../../roles.decorator';
import { UpdateFspAttributeDto, UpdateFspDto } from './dto/update-fsp.dto';
import { FspAttributeEntity } from './fsp-attribute.entity';

@ApiUseTags('fsp')
@Controller('fsp')
export class FspController {
  private readonly fspService: FspService;
  private readonly africasTalkingService: AfricasTalkingService;
  public constructor(
    fspService: FspService,
    africasTalkingService: AfricasTalkingService,
    private intersolveService: IntersolveService,
  ) {
    this.fspService = fspService;
    this.africasTalkingService = africasTalkingService;
  }

  @ApiOperation({ title: 'Get fsp' })
  @ApiImplicitParam({ name: 'fspId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Fsp with attributes',
  })
  @Get(':fspId')
  public async getFspById(
    @Param() param,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.getFspById(param.fspId);
  }

  @ApiOperation({
    title:
      'Validation callback used by Africas Talking to request validity of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Validated' })
  @Post('africastalking/validation')
  public async validationCallback(
    @Body() africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<void> {
    return await this.fspService.checkPaymentValidation(
      fspName.africasTalking,
      africasTalkingValidationData,
    );
  }

  @ApiOperation({
    title:
      'Notification callback used by Africas Talking to notify status of payment to us.',
  })
  @ApiResponse({ status: 200, description: 'Notified' })
  @Post('africastalking/notification')
  public async notificationCallback(
    @Body() africasTalkingNotificationData: AfricasTalkingNotificationDto,
  ): Promise<void> {
    await this.fspService.processPaymentNotification(
      fspName.africasTalking,
      africasTalkingNotificationData,
    );
  }

  @ApiOperation({
    title: 'Export Intersolve vouchers',
  })
  @ApiResponse({ status: 200, description: 'Vouchers exported' })
  @Post('intersolve/export-voucher')
  public async exportVouchers(
    @Body() exportVoucherDto: ExportVoucherDto,
    @Res() response: Response,
  ): Promise<void> {
    const blob = await this.intersolveService.exportVouchers(
      exportVoucherDto.did,
      exportVoucherDto.installment,
    );
    var bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(blob, 'binary'));
    response.writeHead(200, {
      'Content-Type': 'image/png',
    });
    bufferStream.pipe(response);
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
    response.writeHead(200, {
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

  @Roles(UserRole.Admin)
  @ApiOperation({ title: 'Update FSP' })
  @Post('update/fsp')
  public async updateFsp(
    @Body() updateFspDto: UpdateFspDto,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.fspService.updateFsp(updateFspDto);
  }

  @Roles(UserRole.Admin)
  @ApiOperation({ title: 'Update FSP attribute' })
  @Post('update/fsp-attribute')
  public async updateFspAttribute(
    @Body() updateFspAttributeDto: UpdateFspAttributeDto,
  ): Promise<FspAttributeEntity> {
    return await this.fspService.updateFspAttribute(updateFspAttributeDto);
  }
}
