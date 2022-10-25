import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationEntity } from '../../registration/registration.entity';
import { ImageCodeExportVouchersEntity } from './image-code-export-vouchers.entity';
import { ImageCodeController } from './image-code.controller';
import { ImageCodeEntity } from './image-code.entity';
import { ImageCodeService } from './image-code.service';

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
