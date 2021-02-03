import {
  Get,
  Post,
  Put,
  Body,
  Param,
  Controller,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRO } from './user.interface';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
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

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('user')
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({ title: 'Sign-up new user' })
  @Post('user')
  public async create(@Body() userData: CreateUserDto): Promise<UserRO> {
    return this.userService.create(userData);
  }

  @ApiOperation({ title: 'Log in existing user' })
  @Post('user/login')
  public async login(@Body() loginUserDto: LoginUserDto): Promise<UserRO> {
    const _user = await this.userService.findOne(loginUserDto);
    if (!_user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.userService.generateJWT(_user);
    const { email, roles } = _user;
    const user = {
      email,
      token,
      roles,
    };

    return { user };
  }

  @Roles(UserRole.ProjectOfficer, UserRole.ProgramManager, UserRole.Aidworker)
  @ApiOperation({ title: 'Change password of logged in user' })
  @Post('user/change-password')
  public async update(
    @User('id') userId: number,
    @Body() userData: UpdateUserDto,
  ): Promise<any> {
    return this.userService.update(userId, userData);
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({ title: 'Delete user by userId' })
  @Post('user/delete/:userId')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'string' })
  public async delete(
    @User('id') deleterId: number,
    @Param() params,
  ): Promise<DeleteResult> {
    return await this.userService.delete(deleterId, params.userId);
  }

  @Roles(UserRole.ProjectOfficer, UserRole.ProgramManager, UserRole.Aidworker)
  @ApiBearerAuth()
  @ApiOperation({ title: 'Get current user' })
  @Get('user')
  public async findMe(@User('email') email: string): Promise<UserRO> {
    return await this.userService.findByEmail(email);
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({ title: 'Assign Aidworker to program' })
  @Post('user/:userId/:programId')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'number' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  public async assignProgram(
    @Param('userId') userId: number,
    @Param('programId') programId: number,
  ): Promise<UserRO> {
    return await this.userService.assignProgram(userId, programId);
  }
}
