import { ImageCodeExportVouchersEntity } from '@121-service/src/payments/imagecode/image-code-export-vouchers.entity';
import { ImageCodeController } from '@121-service/src/payments/imagecode/image-code.controller';
import { ImageCodeEntity } from '@121-service/src/payments/imagecode/image-code.entity';
import { ImageCodeService } from '@121-service/src/payments/imagecode/image-code.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
