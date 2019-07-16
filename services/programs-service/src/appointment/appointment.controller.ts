import { Get, Post, Body, Param, Controller } from '@nestjs/common';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { AvailabilityEntity } from '../appointment/availability.entity';
import { User } from '../user/user.decorator';
import { CreateAvailabilityDto } from './dto';
import { AppointmentEntity } from './appointment.entity';

@ApiUseTags('appointment')
@Controller('appointment')
export class AppointmentController {
  private readonly appointmentService: AppointmentService;
  public constructor(appointmentService: AppointmentService) {
    this.appointmentService = appointmentService;
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Give availability (for AW)' })
  @Post('availability')
  public async postAvailability(
    @User('id') userId: number,
    @Body() availabilityData: CreateAvailabilityDto,
  ): Promise<AvailabilityEntity> {
    return await this.appointmentService.postAvailability(
      userId,
      availabilityData,
    );
  }

  @ApiOperation({ title: 'Get available time-windows (for PA)' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Get('availability/:programId')
  public async getAvailability(
    @Param('programId') programId: number,
  ): Promise<AvailabilityEntity[]> {
    return await this.appointmentService.getAvailability(programId);
  }

  @ApiOperation({ title: 'Sign in to time-slot (for PA)' })
  @ApiImplicitParam({ name: 'timeslotId', required: true, type: 'number' })
  @Post('register/:timeslotId')
  public async registerTimeslot(
    @Param('timeslotId') timeslotId: number,
  ): Promise<AppointmentEntity> {
    return await this.appointmentService.registerTimeslot(timeslotId);
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Get appointments per timeslot (for AW)' })
  @Get('appointments')
  public async getAppointments(
    @User('id') userId: number,
  ): Promise<AppointmentEntity[]> {
    return await this.appointmentService.getAppointments(userId);
  }
}
