import { SchemaService } from './schema.service';
import { SchemaEntity } from './schema.entity';
import {
  Module, HttpModule,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../user/user.module';
import { SchemaController } from './schema.controller';
import { UserEntity } from '../../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchemaEntity, UserEntity]),
    UserModule,
    HttpModule,
  ],
  providers: [SchemaService],
  controllers: [SchemaController],
  exports: [SchemaService],
})
export class SchemaModule {}
