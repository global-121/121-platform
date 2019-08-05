import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { ProgramEntity } from '../programs/program/program.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { CustomCriterium } from '../programs/program/custom-criterium.entity';
import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramEntity, CustomCriterium, UserEntity, ConnectionEntity]),
    UserModule,
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService]
})
export class EnrollmentModule {}
