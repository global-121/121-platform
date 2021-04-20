import { ImageCodeService } from './image-code.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageCodeEntity } from './image-code.entity';
import { ImageCodeController } from './image-code.controller';
import { ImageCodeExportVouchersEntity } from './image-code-export-vouchers.entity';
import { ConnectionEntity } from '../../connection/connection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImageCodeEntity,
      ImageCodeExportVouchersEntity,
      ConnectionEntity,
    ]),
  ],
  providers: [ImageCodeService],
  controllers: [ImageCodeController],
  exports: [ImageCodeService],
})
export class ImageCodeModule {}
