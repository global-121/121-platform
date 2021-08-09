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
import { DeleteResult } from 'typeorm';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { UserRole } from '../user-role.enum';

@UseGuards(RolesGuard)
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
  public async create(
    @Body() userData: CreateUserAidWorkerDto,
  ): Promise<UserRO> {
    return this.userService.createAidWorker(userData);
  }

  @ApiOperation({ title: 'Sign-up new Person Affected user' })
  @Post('user/personaffected')
  public async createPA(
    @Body() userData: CreateUserPersonAffectedDto,
  ): Promise<UserRO> {
    return this.userService.createPersonAffected(userData);
  }

  @ApiOperation({ title: 'Log in existing user' })
  @Post('user/login')
  public async login(@Body() loginUserDto: LoginUserDto): Promise<UserRO> {
    const _user = await this.userService.findOne(loginUserDto);
    if (!_user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.userService.generateJWT(_user);
    const { username, roles } = _user;
    const user = {
      username,
      token,
      roles,
    };

    return { user };
  }

  @ApiBearerAuth()
  @Roles(
    UserRole.View,
    UserRole.RunProgram,
    UserRole.PersonalData,
    UserRole.FieldValidation,
  )
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
  public async delete(
    @User('id') deleterId: number,
    @Param() params,
  ): Promise<DeleteResult> {
    return await this.userService.delete(deleterId, Number(params.userId));
  }

  @ApiBearerAuth()
  @Roles(UserRole.RunProgram)
  @ApiOperation({ title: 'User deletes itself' })
  @Post('user/delete')
  public async deleteCurrentUser(
    @User('id') deleterId: number,
  ): Promise<DeleteResult> {
    return await this.userService.delete(deleterId, deleterId);
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
  public async findMe(@User('email') email: string): Promise<UserRO> {
    return await this.userService.findByEmail(email);
  }

  @ApiBearerAuth()
  @Roles(UserRole.RunProgram)
  @ApiOperation({ title: 'Assign Aidworker to program' })
  @Post('user/:userId/:programId')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'integer' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  public async assignProgram(
    @Param('userId') userId: number,
    @Param('programId') programId: number,
  ): Promise<UserRO> {
    return await this.userService.assignProgram(
      Number(userId),
      Number(programId),
    );
  }
}
