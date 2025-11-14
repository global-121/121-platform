import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
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

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { GetImportTemplateResponseDto } from '@121-service/src/payments/dto/get-import-template-response.dto';
import { ImportReconciliationResponseDto } from '@121-service/src/payments/reconciliation/excel/dtos/import-reconciliation-response.dto';
import { ExcelReconciliationService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation.service';
import { FILE_UPLOAD_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('payments')
@Controller()
export class ExcelReconciliationController {
  public constructor(
    private readonly excelReconciliationService: ExcelReconciliationService,
  ) {}

  @AuthenticatedUser({
    permissions: [PermissionEnum.PaymentFspInstructionREAD],
  })
  @ApiOperation({
    summary: 'Get a CSV template for importing reconciliation instructions',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Get payments template instructions to post in Fsp Portal - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @Get('programs/:programId/payments/excel-reconciliation/template')
  public async getImportFspReconciliationTemplate(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<GetImportTemplateResponseDto[]> {
    return await this.excelReconciliationService.getImportInstructionsTemplate(
      Number(programId),
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.PaymentUPDATE] })
  @ApiOperation({
    summary: '[SCOPED] Upload payment reconciliation data from FSP per payment',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'paymentId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Uploaded payment excel reconciliation data - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'This endpoint cannot be used when a payment is in progress',
  })
  @Post('programs/:programId/payments/:paymentId/excel-reconciliation')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  public async upsertExcelReconciliationData(
    @UploadedFile() file: Express.Multer.File,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Param('paymentId', ParseIntPipe)
    paymentId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<ImportReconciliationResponseDto> {
    const userId = RequestHelper.getUserId(req);
    return await this.excelReconciliationService.upsertFspReconciliationData({
      file,
      programId,
      paymentId,
      userId,
    });
  }
}
