import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { MigrateVisaService } from '@121-service/src/migrate-visa/migrate-visa.service';
import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('migrate')
@Controller('migrate-visa')
export class MigrateVisaSController {
  public constructor(private readonly migrateVisaService: MigrateVisaService) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Migrate visa data. One time use' })
  @Post('visa')
  public async migrateVisaData(): Promise<void> {
    await this.migrateVisaService.migrateData();
  }
}
