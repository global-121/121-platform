import { PermissionsGuard } from './../permissions.guard';
import { PermissionEnum } from './permission.enum';
import { PersonAffectedRole } from './../user-role.enum';
import { UserEntity } from './user.entity';
import { CreateUserPersonAffectedDto } from './dto/create-user-person-affected.dto';
import { CreateUserAidWorkerDto } from './dto/create-user-aid-worker.dto';
import {
  Get,
  Post,
  Body,
  Param,
  Controller,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRO } from './user.interface';
import { LoginUserDto, UpdateUserDto } from './dto';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { User } from './user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { UserRole } from '../user-role.enum';
import { UserType } from './user-type-enum';
import { AssignAidworkerToProgramDto } from './dto/assign-aw-to-program.dto';
import { UserRoleEntity } from './user-role.entity';
import { Permissions } from '../permissions.decorator';

@UseGuards(RolesGuard, PermissionsGuard)
@ApiUseTags('user')
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @ApiBearerAuth()
  @Roles(UserRole.RunProgram)
  @ApiOperation({ title: 'Sign-up new Aid Worker user' })
  @Post('user/aidworker')
  public async createAw(
    @Body() userData: CreateUserAidWorkerDto,
  ): Promise<UserRO> {
    return this.userService.createAidWorker(userData);
  }

  @ApiOperation({ title: 'Sign-up new Person Affected user' })
  @Post('user/person-affected')
  public async createPA(
    @Body() userData: CreateUserPersonAffectedDto,
  ): Promise<UserRO> {
    return this.userService.createPersonAffected(userData);
  }

  @ApiOperation({ title: 'Log in existing user' })
  @Post('user/login')
  public async login(@Body() loginUserDto: LoginUserDto): Promise<UserRO> {
    return await this.userService.login(loginUserDto);
  }

  @ApiBearerAuth()
  @Roles(
    UserRole.View,
    UserRole.RunProgram,
    UserRole.PersonalData,
    UserRole.FieldValidation,
  )
  @Permissions(PermissionEnum.changePassword)
  @ApiOperation({ title: 'Change password of logged in user' })
  @Post('user/change-password')
  public async update(
    @User('id') userId: number,
    @Body() userData: UpdateUserDto,
  ): Promise<any> {
    return this.userService.update(userId, userData);
  }

  @ApiBearerAuth()
  @Roles(UserRole.RunProgram)
  @ApiOperation({ title: 'Delete user by userId' })
  @Post('user/delete/:userId')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'integer' })
  public async delete(@Param() params): Promise<UserEntity> {
    return await this.userService.delete(Number(params.userId));
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Person Affected deletes itself an related entities' })
  @Roles(PersonAffectedRole.PersonAffected)
  @Post('user/delete-person-affected')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'integer' })
  public async deletePersonAffected(
    @User('id') deleterId: number,
  ): Promise<UserEntity> {
    return await this.userService.deletePersonAffected(deleterId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.RunProgram)
  @ApiOperation({ title: 'User deletes itself' })
  @Post('user/delete')
  public async deleteCurrentUser(
    @User('id') deleterId: number,
  ): Promise<UserEntity> {
    return await this.userService.delete(deleterId);
  }

  @ApiBearerAuth()
  @Roles(
    UserRole.View,
    UserRole.RunProgram,
    UserRole.PersonalData,
    UserRole.FieldValidation,
  )
  @ApiOperation({ title: 'Get current user' })
  @Get('user')
  public async findMe(@User('username') username: string): Promise<UserRO> {
    return await this.userService.findByUsername(username);
  }

  @ApiBearerAuth()
  @Roles(UserRole.RunProgram)
  @ApiOperation({ title: 'Assign Aidworker to program' })
  @Post('user/assign-to-program')
  public async assignFieldValidationAidworkerToProgram(
    @Body() assignAidworkerToProgram: AssignAidworkerToProgramDto,
  ): Promise<UserRoleEntity[]> {
    return await this.userService.assigAidworkerToProgram(
      assignAidworkerToProgram,
    );
  }
}
