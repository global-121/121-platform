import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ImageCodeEntity } from '@121-service/src/payments/imagecode/entities/image-code.entity';
import { ImageCodeExportVouchersEntity } from '@121-service/src/payments/imagecode/entities/image-code-export-vouchers.entity';
import { ImageCodeController } from '@121-service/src/payments/imagecode/image-code.controller';
import { ImageCodeService } from '@121-service/src/payments/imagecode/image-code.service';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImageCodeEntity,
      ImageCodeExportVouchersEntity,
      RegistrationEntity,
    ]),
  ],
  providers: [ImageCodeService],
  controllers: [ImageCodeController],
  exports: [ImageCodeService],
})
export class ImageCodeModule {}
