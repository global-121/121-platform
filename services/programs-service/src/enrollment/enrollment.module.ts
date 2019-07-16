import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { ProgramEntity } from '../program/program.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { AuthMiddleware } from '../user/auth.middleware';
// import { AuthMiddlewareAdmin } from '../user/auth.middlewareAdmin';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { CustomCriterium } from '../program/custom-criterium.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramEntity, CustomCriterium, UserEntity]),
    UserModule,
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService]
})
export class EnrollmentModule {}