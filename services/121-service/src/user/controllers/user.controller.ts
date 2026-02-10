import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { THROTTLING_LIMIT_HIGH } from '@121-service/src/config';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { NoUserAuthenticationEndpoint } from '@121-service/src/guards/no-user-authentication.decorator';
import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import { changePasswordWithoutCurrentPasswordDto } from '@121-service/src/user/dto/change-password-without-current-password.dto';
import { CreateUsersDto } from '@121-service/src/user/dto/create-user.dto';
import { FindUserReponseDto } from '@121-service/src/user/dto/find-user-response.dto';
import { LoginUserDto } from '@121-service/src/user/dto/login-user.dto';
import {
  UpdateUserDto,
  UpdateUserPasswordDto,
} from '@121-service/src/user/dto/update-user.dto';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserRO } from '@121-service/src/user/user.interface';
import { UserService } from '@121-service/src/user/user.service';

@ApiTags('users')
@UseGuards(AuthenticatedUserGuard)
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all users',
    type: [UserEntity],
  })
  @Get('users')
  public async getUsers() {
    return await this.userService.getUsers();
  }

  // TODO: define response type, this cannot use an interface though
  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiOperation({ summary: '[EXTERNALLY USED] Sign-up new user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Successfully created new user(s)',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('users')
  public async createUsers(@Body() userData: CreateUsersDto): Promise<void> {
    return this.userService.createUsers(userData);
  }

  @NoUserAuthenticationEndpoint(
    '[EXTERNALLY USED] Login endpoint must be accessible without authentication.',
  )
  @Throttle(THROTTLING_LIMIT_HIGH)
  @ApiOperation({ summary: '[EXTERNALLY USED] Log in existing user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Logged in successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Wrong username and/or password',
  })
  @Post('users/login')
  public async login(
    @Body() loginUserDto: LoginUserDto,
    @Res() res,
  ): Promise<UserRO> {
    try {
      const loginResponse = await this.userService.login(loginUserDto);

      res.cookie(
        loginResponse.cookieSettings.tokenKey,
        loginResponse.cookieSettings.tokenValue,
        {
          sameSite: loginResponse.cookieSettings.sameSite,
          secure: loginResponse.cookieSettings.secure,
          expires: loginResponse.cookieSettings.expires,
          httpOnly: loginResponse.cookieSettings.httpOnly,
        },
      );
      return res.send({
        username: loginResponse.userRo.user.username,
        permissions: loginResponse.userRo.user.permissions,
        [CookieNames.general]: loginResponse.token,
        expires: loginResponse.cookieSettings.expires,
        isAdmin: loginResponse.userRo.user.isAdmin,
        isEntraUser: loginResponse.userRo.user.isEntraUser,
        isOrganizationAdmin: loginResponse.userRo.user.isOrganizationAdmin,
      });
    } catch (error) {
      throw error;
    }
  }

  @AuthenticatedUser()
  @ApiOperation({ summary: 'Log out existing user' })
  @Post('users/logout')
  public async logout(@Res() res): Promise<UserRO> {
    try {
      const key = this.userService.getInterfaceKeyByHeader();
      const { sameSite, secure, httpOnly } =
        this.userService.getCookieSecuritySettings();

      res.cookie(key, '', {
        sameSite,
        secure,
        httpOnly,
        expires: new Date(Date.now() - 1),
      });
      return res.send();
    } catch (error) {
      throw error;
    }
  }

  @Throttle(THROTTLING_LIMIT_HIGH)
  @AuthenticatedUser()
  @ApiOperation({ summary: 'Change password of logged in user' })
  // TODO: Change this in to a PATCH request
  @Post('users/password')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Changed password of user',
    type: UpdateUserDto,
  })
  public async update(
    @Body() userPasswordData: UpdateUserPasswordDto,
  ): Promise<any> {
    return this.userService.updatePassword(userPasswordData);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: 'Delete user by userId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted',
    type: UserEntity,
  })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @Delete('users/:userId')
  public async delete(
    @Param('userId', ParseIntPipe)
    userId: number,
  ): Promise<UserEntity> {
    return await this.userService.delete(userId);
  }

  @AuthenticatedUser()
  @ApiOperation({ summary: 'Get current user' })
  @Get('users/current')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User returned',
  })
  public async findMe(@Req() req): Promise<UserRO> {
    if (!req.user || !req.user.username) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    return await this.userService.getUserRoByUsernameOrThrow(
      req.user.username,
      req.user.exp,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
  @ApiOperation({
    summary:
      'Search, across all programs, for users who are already part of a program or who can be added to a program, based on their username or a substring of their username.' +
      'Is **NOT** limited to the provided `programId`;' +
      "The `programId` used to check for the requesting user's permissions only.",
  })
  @ApiQuery({ name: 'username', required: true, type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of users that match the search criteria.',
    type: [FindUserReponseDto],
  })
  @Get('programs/:programId/users/search')
  public async getUsersByName(
    @Param('programId', ParseIntPipe)
    _programId: number,

    @Query('username') username: string,
  ): Promise<FindUserReponseDto[]> {
    return await this.userService.findUsersByName(username);
  }

  @AuthenticatedUser({ isOrganizationAdmin: true })
  @ApiOperation({ summary: 'Reset user password without current password' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password has been updated',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('users/password')
  public async changePasswordWithoutCurrentPassword(
    @Body() changePasswordDto: changePasswordWithoutCurrentPasswordDto,
  ): Promise<void> {
    await this.userService.changePasswordWithoutCurrentPassword(
      changePasswordDto,
    );
  }

  // Make sure this endpoint is below users/password endpoint in this controller, to avoid endpoint confusion
  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Update user properties (currently isOrganizationAdmin and displayName)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Updated user',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @Patch('users/:userId')
  public async updateUser(
    @Param('userId', ParseIntPipe)
    userId: number,

    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserRO> {
    const user = await this.userService.updateUser({
      id: userId,
      isOrganizationAdmin: updateUserDto.isOrganizationAdmin,
      displayName: updateUserDto.displayName,
    });

    return this.userService.buildUserRO(user);
  }
}
