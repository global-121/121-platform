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

@ApiUseTags('user')
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @ApiOperation({ title: 'Sign-up new user' })
  @UsePipes(new ValidationPipe())
  @Post('user')
  public async create(@Body() userData: CreateUserDto): Promise<UserRO> {
    return this.userService.create(userData);
  }

  @ApiOperation({ title: 'Log in existing user' })
  @UsePipes(new ValidationPipe())
  @Post('user/login')
  public async login(@Body() loginUserDto: LoginUserDto): Promise<UserRO> {
    const _user = await this.userService.findOne(loginUserDto);
    if (!_user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    } else if (_user.status == 'inactive') {
      throw new HttpException('Account deactivated. Contact organization administration.', HttpStatus.UNAUTHORIZED);
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

  @ApiBearerAuth()
  @ApiOperation({ title: 'Change password of logged in user' })
  @Post('user/change-password')
  public async update(
    @User('id') userId: number,
    @Body() userData: UpdateUserDto,
  ) {
    return this.userService.update(userId, userData);
  }

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @ApiOperation({ title: 'Deactivate Aidworker' })
  @Put('user/:userId/deactivate')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'number' })
  public async deactivate(@Param('userId') userId: number): Promise<UserRO> {
    return await this.userService.deactivate(userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Activate Aidworker' })
  @Put('user/:userId/activate')
  @ApiImplicitParam({ name: 'userId', required: true, type: 'number' })
  public async activate(@Param('userId') userId: number): Promise<UserRO> {
    return await this.userService.activate(userId);
  }
}
