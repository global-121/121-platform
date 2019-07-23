import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityEntity } from './availability.entity';
import { AppointmentEntity } from './appointment.entity';
import { UserEntity } from '../../user/user.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import { UserModule } from '../../user/user.module';
import { AuthMiddlewareAW } from '../../user/auth.middlewareAW';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AvailabilityEntity,
      AppointmentEntity,
      UserEntity,
      ProgramEntity,
    ]),
    UserModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    // consumer
    //   .apply(AuthMiddlewareAdmin)
    //   .forRoutes();
    consumer
      .apply(AuthMiddlewareAW)
      .forRoutes({ path: 'availability', method: RequestMethod.POST });
  }
}
