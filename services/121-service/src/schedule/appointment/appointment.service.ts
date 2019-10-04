import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, HttpException } from '@nestjs/common';

import { CreateAvailabilityDto, RegisterTimeslotDto } from './dto';
import { AvailabilityEntity } from './availability.entity';
import { AppointmentEntity } from './appointment.entity';
import { UserEntity } from '../../user/user.entity';
import { ProgramEntity } from '../../programs/program/program.entity';

@Injectable()
export class AppointmentService {
  @InjectRepository(AvailabilityEntity)
  private readonly availabilityRepository: Repository<AvailabilityEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(AppointmentEntity)
  private readonly appointmentRepository: Repository<AppointmentEntity>;

  public constructor() { }

  public async postAvailability(
    userId: number,
    availabilityData: CreateAvailabilityDto,
  ): Promise<AvailabilityEntity> {
    let availability = new AvailabilityEntity();
    availability.startDate = availabilityData.startDate;
    availability.endDate = availabilityData.endDate;
    availability.location = availabilityData.location;

    const aidworker = await this.userRepository.findOne(userId);
    availability.aidworker = aidworker;

    const newAvailability = await this.availabilityRepository.save(
      availability,
    );

    return newAvailability;
  }

  public async getAvailability(
    programId: number,
  ): Promise<AvailabilityEntity[]> {
    const program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = { Program: ' not found' };
      throw new HttpException({ errors }, 401);
    }
    let aidworkers = await this.userRepository.find({
      where: { assignedProgram: { id: programId } },
    });
    if (aidworkers.length == 0) {
      const errors = { Message: 'No aidworkers assigned to this program yet.' };
      throw new HttpException({ errors }, 401);
    }
    let availabilities = [];
    for (let index in aidworkers) {
      const availabilityOneAidworker = await this.availabilityRepository.find({
        where: { aidworker: { id: aidworkers[index].id } },
      })
      availabilities.push(...availabilityOneAidworker);
    }
    if (availabilities.length == 0) {
      const errors = { Message: 'No available time-windows posted yet.' };
      throw new HttpException({ errors }, 401);
    }
    return availabilities;
  }

  public async registerTimeslot(
    timeslotId: number,
    didData: RegisterTimeslotDto
  ): Promise<AppointmentEntity> {
    let appointment = new AppointmentEntity();
    appointment.timeslotId = timeslotId;
    appointment.did = didData.did;
    appointment.status = 'waiting';
    const newAppointment = await this.appointmentRepository.save(appointment);
    return newAppointment;
  }

  public async getAppointments(userId: number): Promise<AppointmentEntity[]> {
    let user = await this.userRepository.findOne(userId);
    let timeslots = await this.availabilityRepository.find({
      where: { aidworker: { id: user.id } },
    });
    let appointments = [];
    for (let timeslot of timeslots) {
      let appointmentsPerTimeslot = await this.appointmentRepository.find({
        where: { timeslotId: timeslot.id },
        select: ["id", "did", "status"]
      });
      if (appointmentsPerTimeslot.length > 0) {
        let timeslotInclAppointments = {
          timeslotId: timeslot.id,
          startDate: timeslot.startDate,
          endDate: timeslot.endDate,
          location: timeslot.location,
          appointments: appointmentsPerTimeslot
        }
        appointments.push(timeslotInclAppointments);
      }
    }
    return appointments;
  }

  public async changeAppointmentStatus(timeslotId: number, didData: RegisterTimeslotDto, newStatus: string): Promise<void> {
    let appointment = await this.appointmentRepository.findOne({ where: { timeslotId: timeslotId, did: didData.did } });
    appointment.status = newStatus;
    this.appointmentRepository.save(appointment);
  }
}
