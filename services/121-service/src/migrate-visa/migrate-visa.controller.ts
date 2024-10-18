import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { MigrateVisaService } from '@121-service/src/migrate-visa/migrate-visa.service';
import { FILE_UPLOAD_API_FORMAT } from '@121-service/src/shared/file-upload-api-format';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('migrate')
@Controller('migrate-visa')
export class MigrateVisaController {
  public constructor(private readonly migrateVisaService: MigrateVisaService) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'integer',
    description: 'Optional limit for the number of records to migrate',
  })
  @ApiOperation({ summary: 'Migrate visa data. One time use' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_API_FORMAT)
  @UseInterceptors(FileInterceptor('file'))
  @Post('visa')
  public async migrateVisaData(
    @Query('limit') limit: number,
    @UploadedFile() csvFileWithPreActivationValues: Blob,
  ): Promise<void> {
    await this.migrateVisaService.migrateData(
      limit,
      csvFileWithPreActivationValues,
    );
  }
}
