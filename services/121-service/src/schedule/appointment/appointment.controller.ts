import { Get, Post, Body, Param, Controller, UseGuards } from '@nestjs/common';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { AvailabilityEntity } from '../appointment/availability.entity';
import { CreateAvailabilityDto, RegisterTimeslotDto } from './dto';
import { AppointmentEntity } from './appointment.entity';
import { User } from '../../user/user.decorator';
import { RolesGuard } from '../../roles.guard';
import { Roles } from '../../roles.decorator';
import { UserRole } from '../../user-role.enum';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('appointment')
@Controller('appointment')
export class AppointmentController {
  private readonly appointmentService: AppointmentService;
  public constructor(appointmentService: AppointmentService) {
    this.appointmentService = appointmentService;
  }

  @Roles(UserRole.Aidworker)
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
    @Body() didData: RegisterTimeslotDto,
  ): Promise<AppointmentEntity> {
    return await this.appointmentService.registerTimeslot(timeslotId, didData);
  }

  @Roles(UserRole.Aidworker)
  @ApiOperation({ title: 'Get appointments per timeslot (for AW)' })
  @Get('appointments')
  public async getAppointments(
    @User('id') userId: number,
  ): Promise<AppointmentEntity[]> {
    return await this.appointmentService.getAppointments(userId);
  }

  @Roles(UserRole.Aidworker)
  @ApiOperation({
    title:
      'Change status of did in appointments-list (waiting/validated/postponed) (for AW)',
  })
  @ApiImplicitParam({ name: 'timeslotId', required: true, type: 'number' })
  @ApiImplicitParam({ name: 'newStatus', required: true, type: 'string' })
  @Post('register/:timeslotId/:newStatus')
  public async changeAppointmentStatus(
    @Param('timeslotId') timeslotId: number,
    @Param('newStatus') newStatus: string,
    @Body() didData: RegisterTimeslotDto,
  ): Promise<void> {
    await this.appointmentService.changeAppointmentStatus(
      timeslotId,
      didData,
      newStatus,
    );
  }
}
