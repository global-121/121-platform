import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMiddleware } from '../user/auth.middleware';
// import { AuthMiddlewareAdmin } from '../user/auth.middlewareAdmin';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { AvailabilityEntity } from './availability.entity';
import { AppointmentEntity } from './appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AvailabilityEntity, AppointmentEntity, UserEntity]),
    UserModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService]
})
export class AppointmentModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    // consumer
    //   .apply(AuthMiddlewareAdmin)
    //   .forRoutes();
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'availability', method: RequestMethod.POST });
  }
}