import { ImageCodeService } from './image-code.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageCodeEntity } from './image-code.entity';
import { ImageCodeController } from './image-code.controller';
import { ImageCodeExportVouchers } from './image-code-export-vouchers.entity';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImageCodeEntity,
      ImageCodeExportVouchers,
      ConnectionEntity,
    ]),
  ],
  providers: [ImageCodeService],
  controllers: [ImageCodeController],
  exports: [ImageCodeService],
})
export class ImageCodeModule {}
