import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DEBUG } from '../config';
import { Admin } from '../guards/admin.decorator';
import { AdminAuthGuard } from '../guards/admin.guard';
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { CookieNames } from '../shared/enum/cookie.enums';
import { LoginUserDto, UpdateUserDto } from './dto';
import { AssignAidworkerToProgramDto } from './dto/assign-aw-to-program.dto';
import { CreateUserAidWorkerDto } from './dto/create-user-aid-worker.dto';
import { CreateUserPersonAffectedDto } from './dto/create-user-person-affected.dto';
import { FindUserReponseDto } from './dto/find-user-response.dto';
import { GetUserReponseDto } from './dto/get-user-response.dto';
import { CreateUserRoleDto, UpdateUserRoleDto } from './dto/user-role.dto';
import { PermissionEnum } from './permission.enum';
import { User } from './user.decorator';
import { UserEntity } from './user.entity';
import { UserRO } from './user.interface';
import { tokenExpirationDays, UserService } from './user.service';
import { UserRoleResponseDTO } from './dto/userrole-response.dto';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  //No permission decorator possible because this endpoint is program-agnostic, instead check in service  @ApiTags('roles')
  @ApiTags('roles')
  @ApiOperation({ summary: 'Get all user roles' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of roles and their permissions',
    type: [UserRoleResponseDTO],
  })
  @Get('roles')
  public async getUserRoles(
    @User('id') userId: number,
  ): Promise<UserRoleResponseDTO[]> {
    return await this.userService.getUserRoles(userId);
  }

  @Admin()
  @ApiTags('roles')
  @ApiOperation({ summary: 'Create new user role' })
  @ApiResponse({
    status: 200,
    description: 'Returns the created role',
    type: UserRoleResponseDTO,
  })
  @Post('roles')
  public async addUserRole(
    @Body() userRoleData: CreateUserRoleDto,
  ): Promise<UserRoleResponseDTO> {
    return await this.userService.addUserRole(userRoleData);
  }

  @Admin()
  @ApiTags('roles')
  @ApiOperation({ summary: 'Update existing user role' })
  @ApiParam({ name: 'userRoleId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated user role',
    type: UserRoleResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Role already exists',
  })
  @Put('roles/:userRoleId')
  public async updateUserRole(
    @Param() params,
    @Body() userRoleData: UpdateUserRoleDto,
  ): Promise<UserRoleResponseDTO> {
    return await this.userService.updateUserRole(
      params.userRoleId,
      userRoleData,
    );
  }

  @Admin()
  @ApiTags('roles')
  @ApiOperation({ summary: 'Delete existing user role' })
  @ApiParam({ name: 'userRoleId', required: true, type: 'integer' })
  // TODO: REFACTOR: rename to /users/roles/
  @ApiResponse({
    status: 200,
    description: 'Returns the deleted role',
    type: UserRoleResponseDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'No role found',
  })
  @Delete('roles/:userRoleId')
  public async deleteUserRole(@Param() params): Promise<UserRoleResponseDTO> {
    return await this.userService.deleteUserRole(params.userRoleId);
  }

  @Admin()
  @ApiTags('users')
  @ApiOperation({ summary: 'Get all users' })
  @Get('users')
  public async getUsers(@User('id') userId: number): Promise<UserEntity[]> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    return await this.userService.getUsers();
  }

  // TODO: define response type, this cannot use an interface though
  @ApiTags('users')
  @ApiOperation({ summary: 'Sign-up new Aid Worker user' })
  @ApiResponse({
    status: 201,
    description: 'Created new Aid Worker user',
  })
  @Post('users')
  public async createAw(
    @Body() userData: CreateUserAidWorkerDto,
  ): Promise<UserRO> {
    return this.userService.createAidWorker(userData);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Sign-up new Person Affected user' })
  @ApiResponse({
    status: 201,
    description: 'Created new Person Affected user',
  })
  @Post('users/person-affected')
  public async createPA(
    @Body() userData: CreateUserPersonAffectedDto,
    @Res() res,
    @Req() req,
  ): Promise<UserRO> {
    let sameSite = 'None';
    let secure = true;

    if (DEBUG) {
      const origin = req.get('origin');
      const serviceWorkerDebug = origin?.includes('8088');
      sameSite = serviceWorkerDebug ? 'None' : 'Lax';
      secure = serviceWorkerDebug;
    }

    try {
      const user = await this.userService.createPersonAffected(userData);
      const exp = new Date(Date.now() + tokenExpirationDays * 24 * 3600000);
      res.cookie(CookieNames.paApp, user.user.token, {
        sameSite: sameSite,
        secure: secure,
        expires: exp,
        httpOnly: true,
      });
      return res.send({
        username: user.user.username,
        permissions: user.user.permissions,
        expires: exp,
      });
    } catch (error) {
      throw error;
    }
  }

  @Throttle(
    +process.env.HIGH_THROTTLING_LIMIT || 30,
    +process.env.HIGH_THROTTLING_TTL || 60,
  )
  @ApiTags('users')
  @ApiOperation({ summary: 'Log in existing user' })
  @ApiResponse({
    status: 201,
    description: 'Logged in successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Wrong username and/or password',
  })
  @Post('users/login')
  public async login(
    @Body() loginUserDto: LoginUserDto,
    @Res() res,
    @Req() req,
  ): Promise<UserRO> {
    try {
      const loginResponse = await this.userService.login(loginUserDto);
      const origin = req.get('origin');
      const serviceWorkerDebug = origin?.includes('8088');

      res.cookie(
        loginResponse.cookieSettings.tokenKey,
        loginResponse.cookieSettings.tokenValue,
        {
          sameSite: serviceWorkerDebug
            ? 'None'
            : loginResponse.cookieSettings.sameSite,
          secure: serviceWorkerDebug
            ? true
            : loginResponse.cookieSettings.secure,
          expires: loginResponse.cookieSettings.expires,
          httpOnly: loginResponse.cookieSettings.httpOnly,
        },
      );
      return res.send({
        username: loginResponse.userRo.user.username,
        permissions: loginResponse.userRo.user.permissions,
        access_token_general: loginResponse.token,
        expires: loginResponse.cookieSettings.expires,
        isAdmin: loginResponse.userRo.user.isAdmin,
      });
    } catch (error) {
      throw error;
    }
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Log out existing user' })
  @Post('users/logout')
  public async logout(@Res() res): Promise<UserRO> {
    try {
      const key = this.userService.getInterfaceKeyByHeader();
      res.cookie(key, '', {
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() - 1),
        httpOnly: true,
      });
      return res.send();
    } catch (error) {
      throw error;
    }
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Change password of logged in user' })
  // TODO: Change this in to a PATCH request
  @Post('users/password')
  @ApiResponse({
    status: 201,
    description: 'Changed password of user',
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  public async update(
    @User('id') userId: number,
    @Body() userData: UpdateUserDto,
  ): Promise<any> {
    if (!userId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return this.userService.update(userData);
  }

  @Admin()
  @ApiTags('users')
  @ApiOperation({ summary: 'Delete user by userId' })
  @ApiResponse({ status: 200, description: 'User deleted', type: UserEntity })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @Delete('users/:userId')
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  public async delete(@Param() params): Promise<UserEntity> {
    return await this.userService.delete(Number(params.userId));
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'User deletes itself' })
  @Delete('users')
  @ApiResponse({ status: 200, description: 'User deleted', type: UserEntity })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  public async deleteCurrentUser(
    @User('id') deleterId: number,
  ): Promise<UserEntity> {
    if (!deleterId) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return await this.userService.delete(deleterId);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Get current user' })
  @Get('users')
  @ApiResponse({ status: 200, description: 'User returned' })
  @ApiResponse({
    status: 401,
    description: 'No user detectable from cookie or no cookie present',
  })
  public async findMe(@User('username') username: string): Promise<UserRO> {
    if (!username) {
      const errors = `No user detectable from cookie or no cookie present'`;
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return await this.userService.findByUsername(username);
  }

  @Admin()
  @ApiTags('users/roles')
  @ApiOperation({ summary: 'Get roles for given user program assignment' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of roles assigned to the user',
    type: [UserRoleResponseDTO],
  })
  @ApiResponse({
    status: 404,
    description: 'No roles found for user',
  })
  @Get('programs/:programId/users/:userId/roles')
  public async getProgramRoles(
    @Param() params,
  ): Promise<UserRoleResponseDTO[]> {
    return await this.userService.getProgramRoles(
      Number(params.programId),
      Number(params.userId),
    );
  }

  @Permissions(PermissionEnum.AidWorkerProgramUPDATE)
  @ApiTags('users/roles')
  @ApiOperation({
    summary:
      'Create program assignment including roles or OVERWRITE roles of existing program assignment',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the created or updated program assignment including a list of roles',
    type: [UserRoleResponseDTO],
  })
  @ApiResponse({
    status: 404,
    description: 'User, program or role(s) not found',
  })
  @Put('programs/:programId/users/:userId/roles')
  public async assignAidworkerRolesAndAssignmentToProgram(
    @Param() params,
    @Body() assignAidworkerToProgram: AssignAidworkerToProgramDto,
  ): Promise<UserRoleResponseDTO[]> {
    return await this.userService.assignAidworkerRolesAndAssignmentToProgram(
      Number(params.programId),
      Number(params.userId),
      assignAidworkerToProgram,
    );
  }

  @Permissions(PermissionEnum.AidWorkerProgramUPDATE)
  @ApiTags('users/roles')
  @ApiOperation({
    summary:
      'Add roles to existing program assignment (UNION of existing and new roles)',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Returns new list of roles of the program assignment',
    type: [UserRoleResponseDTO],
  })
  @ApiResponse({
    status: 404,
    description: 'User, program or role(s) not found',
  })
  @Patch('programs/:programId/users/:userId/roles')
  public async assigAidworkerRolesToProgram(
    @Param() params,
    @Body() assignAidworkerToProgram: AssignAidworkerToProgramDto,
  ): Promise<UserRoleResponseDTO[]> {
    return await this.userService.assigAidworkerRolesToProgram(
      Number(params.programId),
      Number(params.userId),
      assignAidworkerToProgram,
    );
  }

  @Permissions(PermissionEnum.AidWorkerProgramUPDATE)
  @ApiTags('users/roles')
  @ApiOperation({
    summary:
      'Remove roles from program-assignment (pass roles to delete in body) or remove aidworker from program (no body)',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'userId', required: true, type: 'integer' })
  @ApiBody({ type: AssignAidworkerToProgramDto, required: false })
  @ApiResponse({
    status: 200,
    description:
      'Returns the remaining roles of the program assignment (empty array if program assignment removed)',
    type: [UserRoleResponseDTO],
  })
  @ApiResponse({
    status: 404,
    description: 'User, program, role(s) or assignment not found',
  })
  @Delete('programs/:programId/users/:userId/roles')
  public async deleteAidworkerRolesOrAssignment(
    @Param() params,
    @Body() assignAidworkerToProgram: AssignAidworkerToProgramDto,
  ): Promise<UserRoleResponseDTO[]> {
    return await this.userService.deleteAidworkerRolesOrAssignment(
      Number(params.programId),
      Number(params.userId),
      assignAidworkerToProgram,
    );
  }

  @Permissions(PermissionEnum.AidWorkerProgramREAD)
  @ApiTags('users')
  @ApiOperation({ summary: 'Get all users by programId' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of users assigned to a program',
    type: [GetUserReponseDto],
  })
  @Get('programs/:programId/users')
  public async getUsersInProgram(
    @Param() params,
  ): Promise<GetUserReponseDto[]> {
    return await this.userService.getUsersInProgram(Number(params.programId));
  }

  // This endpoint searches users accross all programs, which is needed to add a user to a program
  // We did not create an extra permission for this as it is always used in combination with adding new users to a program
  // ProgramId is therefore not needed in the service
  @Permissions(PermissionEnum.AidWorkerProgramUPDATE)
  @ApiTags('users')
  @ApiOperation({
    summary:
      'Search for users who are already part of a program or who can be added to a program, based on their username or a substring of their username.',
  })
  @ApiParam({ name: 'username', required: true, type: 'string' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of users that match the search criteria.',
    type: [FindUserReponseDto],
  })
  @Get('programs/:programId/users/:username')
  public async getUsersByName(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('username') username: string,
  ): Promise<FindUserReponseDto[]> {
    return await this.userService.findUsersByName(username);
  }
}
