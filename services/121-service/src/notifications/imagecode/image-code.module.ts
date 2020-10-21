import { ImageCodeService } from './image-code.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageCodeEntity } from './image-code.entity';
import { ImageCodeController } from './image-code.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ImageCodeEntity])],
  providers: [ImageCodeService],
  controllers: [ImageCodeController],
  exports: [ImageCodeService],
})
export class ImageCodeModule {}
