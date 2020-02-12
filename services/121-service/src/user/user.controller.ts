import {
  Get,
  Post,
  Put,
  Body,
  Delete,
  Param,
  Controller,
  UsePipes,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRO } from './user.interface';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { User } from './user.decorator';
import { ValidationPipe } from '../shared/pipes/validation.pipe';

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
    } else if (_user.status == 'inactive') {
      throw new HttpException(
        'Account deactivated. Contact organization administration.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = await this.userService.generateJWT(_user);
    const { email, username, role, status, countryId } = _user;
    const user = {
      email,
      token,
      username,
      role,
      status,
      countryId,
    };

    return { user };
  }

  @Roles(UserRole.ProgramManager, UserRole.PrivacyOfficer, UserRole.Admin)
  @ApiOperation({ title: 'Change password of logged in user' })
  @Post('user/change-password')
  public async update(
    @User('id') userId: number,
    @Body() userData: UpdateUserDto,
  ): Promise<any> {
    return this.userService.update(userId, userData);
  }

  @Roles(UserRole.Admin)
  @ApiOperation({ title: 'Delete user by userId' })
  @Delete('user/:userId')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'string' })
  public async delete(@Param() params): Promise<DeleteResult> {
    return await this.userService.delete(params.userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Get current user' })
  @Get('user')
  public async findMe(@User('email') email: string): Promise<UserRO> {
    return await this.userService.findByEmail(email);
  }

  @Roles(UserRole.ProgramManager)
  @ApiOperation({ title: 'Deactivate Aidworker' })
  @Put('user/:userId/deactivate')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'number' })
  public async deactivate(@Param('userId') userId: number): Promise<UserRO> {
    return await this.userService.deactivate(userId);
  }

  @Roles(UserRole.ProgramManager)
  @ApiOperation({ title: 'Activate Aidworker' })
  @Put('user/:userId/activate')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'number' })
  public async activate(@Param('userId') userId: number): Promise<UserRO> {
    return await this.userService.activate(userId);
  }

  @Roles(UserRole.ProgramManager)
  @ApiOperation({ title: 'Assign Aidworker to program' })
  @Put('user/:userId/:programId')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'number' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  public async assignProgram(
    @Param('userId') userId: number,
    @Param('programId') programId: number,
  ): Promise<UserRO> {
    return await this.userService.assignProgram(userId, programId);
  }
}
