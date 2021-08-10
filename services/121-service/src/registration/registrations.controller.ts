import { RegistrationEntity } from './registration.entity';
import { Post, Body, Controller, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../roles.guard';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { User } from '../user/user.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('registrations')
@Controller('registrations')
export class RegistrationsController {
  private readonly registrationsService: RegistrationsService;
  public constructor(registrationsService: RegistrationsService) {
    this.registrationsService = registrationsService;
  }

  @ApiOperation({ title: 'Create registration' })
  @ApiResponse({ status: 200, description: 'Created registration' })
  @Post()
  public async create(
    @Body() createRegistrationDto: CreateRegistrationDto,
    @User('id') userId: number,
  ): Promise<RegistrationEntity> {
    return await this.registrationsService.create(
      createRegistrationDto,
      userId,
    );
  }

  // @ApiOperation({ title: 'Update registration' })
  // @ApiResponse({ status: 200, description: 'Updated registration' })
  // @Post()
  // public async update(
  //   @Body() createRegistrationDto: CreateRegistrationDto,
  //   @User('id') userId: number,
  // ): Promise<RegistrationEntity> {
  //   return await this.registrationsService.update(
  //     createRegistrationDto,
  //     userId,
  //   );
  // }
}
