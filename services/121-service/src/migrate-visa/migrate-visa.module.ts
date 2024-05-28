import { MigrateVisaSController as MigrateVisaController } from '@121-service/src/migrate-visa/migrate-visa.controller';
import { MigrateVisaService } from '@121-service/src/migrate-visa/migrate-visa.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature(), UserModule, HttpModule],
  providers: [MigrateVisaService, CustomHttpService],
  controllers: [MigrateVisaController],
  exports: [MigrateVisaService],
})
export class MigrateVisaModule {}
