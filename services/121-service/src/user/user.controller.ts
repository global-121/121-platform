import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import {
  CreateProgramAssignmentDto,
  DeleteProgramAssignmentDto,
  UpdateProgramAssignmentDto,
} from '@121-service/src/user/dto/assign-aw-to-program.dto';
import { changePasswordWithoutCurrentPasswordDto } from '@121-service/src/user/dto/change-password-without-current-password.dto';
import { CreateUserAidWorkerDto } from '@121-service/src/user/dto/create-user-aid-worker.dto';
import { FindUserReponseDto } from '@121-service/src/user/dto/find-user-response.dto';
import { GetUserReponseDto } from '@121-service/src/user/dto/get-user-response.dto';
import { LoginUserDto } from '@121-service/src/user/dto/login-user.dto';
import {
  UpdateUserDto,
  UpdateUserPasswordDto,
} from '@121-service/src/user/dto/update-user.dto';
import {
  CreateUserRoleDto,
  UpdateUserRoleDto,
} from '@121-service/src/user/dto/user-role.dto';
import {
  AssignmentResponseDTO,
  UserRoleResponseDTO,
} from '@121-service/src/user/dto/userrole-response.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserRO } from '@121-service/src/user/user.interface';
import { UserService } from '@121-service/src/user/user.service';
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
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@UseGuards(AuthenticatedUserGuard)
@Controller()
export class UserController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  //No permission decorator possible because this endpoint is program-agnostic, instead check in service  @ApiTags('roles')
  @AuthenticatedUser()
  @ApiTags('roles')
  @ApiOperation({ summary: 'Get all user roles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of roles and their permissions',
    type: [UserRoleResponseDTO],
  })
  @Get('roles')
  public async getUserRoles(@Req() req): Promise<UserRoleResponseDTO[]> {
    const userId = req.user.id;
    return await this.userService.getUserRoles(userId);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('roles')
  @ApiOperation({ summary: 'Create new user role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the created role',
    type: UserRoleResponseDTO,
  })
  @Post('roles')
  public async addUserRole(
    @Body() userRoleData: CreateUserRoleDto,
  ): Promise<UserRoleResponseDTO> {
    return await this.userService.addUserRole(userRoleData);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('roles')
  @ApiOperation({ summary: 'Update existing user role' })
  @ApiParam({ name: 'userRoleId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the updated user role',
    type: UserRoleResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
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

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('roles')
  @ApiOperation({ summary: 'Delete existing user role' })
  @ApiParam({ name: 'userRoleId', required: true, type: 'integer' })
  // TODO: REFACTOR: rename to /users/roles/
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the deleted role',
    type: UserRoleResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No role found',
  })
  @Delete('roles/:userRoleId')
  public async deleteUserRole(
    @Param('userRoleId', ParseIntPipe)
    userRoleId: number,
  ): Promise<UserRoleResponseDTO> {
    return await this.userService.deleteUserRole(userRoleId);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all users',
    type: [UserEntity],
  })
  @Get('users')
  public async getUsers(): Promise<UserEntity[]> {
    return await this.userService.getUsers();
  }

  // TODO: define response type, this cannot use an interface though
  @ApiTags('users')
  @ApiOperation({ summary: '[EXTERNALLY USED] Sign-up new Aid Worker user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Created new Aid Worker user',
  })
  @Post('users')
  public async createAw(
    @Body() userData: CreateUserAidWorkerDto,
  ): Promise<UserRO> {
    return this.userService.createAidWorker(userData);
  }

  @Throttle(
    parseInt(process.env.HIGH_THROTTLING_LIMIT ?? '30'),
    parseInt(process.env.HIGH_THROTTLING_TTL ?? '60'),
  )
  @ApiTags('users')
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
      });
    } catch (error) {
      throw error;
    }
  }

  @AuthenticatedUser()
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

  @AuthenticatedUser()
  @ApiTags('users')
  @ApiOperation({ summary: 'Change password of logged in user' })
  // TODO: Change this in to a PATCH request
  @Post('users/password')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Changed password of user',
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No user detectable from cookie or no cookie present',
  })
  public async update(
    @Body() userPasswordData: UpdateUserPasswordDto,
  ): Promise<any> {
    return this.userService.updatePassword(userPasswordData);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('users')
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
  @ApiTags('users')
  @ApiOperation({ summary: 'Get current user' })
  @Get('users/current')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User returned',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No user detectable from cookie or no cookie present',
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

  // This endpoint searches users accross all programs, which is needed to add a user to a program
  // We did not create an extra permission for this as it is always used in combination with adding new users to a program
  // ProgramId is therefore not needed in the service
  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
  @ApiTags('users')
  @ApiOperation({
    summary:
      'Search for users who are already part of a program or who can be added to a program, based on their username or a substring of their username.',
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

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('users/assignments')
  @ApiOperation({ summary: 'Get roles for given user program assignment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns program assignment including roles and scope',
    type: AssignmentResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No roles found for user',
  })
  @Get('programs/:programId/users/:userId')
  public async getAidworkerProgramAssignment(
    @Param('programId', ParseIntPipe)
    programId: number,

    @Param('userId', ParseIntPipe)
    userId: number,
  ): Promise<AssignmentResponseDTO> {
    return await this.userService.getAidworkerProgramAssignment(
      programId,
      userId,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
  @ApiTags('users/assignments')
  @ApiOperation({
    summary: 'Create or OVERWRITE program assignment including roles and scope',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Returns the created or overwritten program assignment including roles and scope',
    type: AssignmentResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User, program or role(s) not found',
  })
  @Put('programs/:programId/users/:userId')
  public async assignAidworkerToProgram(
    @Param('programId', ParseIntPipe)
    programId: number,

    @Param('userId', ParseIntPipe)
    userId: number,

    @Body()
    assignAidworkerToProgram: CreateProgramAssignmentDto,
  ): Promise<AssignmentResponseDTO> {
    return await this.userService.assignAidworkerToProgram(
      programId,
      userId,
      assignAidworkerToProgram,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
  @ApiTags('users/assignments')
  @ApiOperation({
    summary:
      'Update existing program assignment with new roles (UNION of existing and new roles) and/or overwrite scope',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns program assignment with all roles and scope',
    type: AssignmentResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User, program or role(s) not found',
  })
  @Patch('programs/:programId/users/:userId')
  public async updateAidworkerProgramAssignment(
    @Param('programId', ParseIntPipe)
    programId: number,

    @Param('userId', ParseIntPipe)
    userId: number,

    @Body() assignAidworkerToProgram: UpdateProgramAssignmentDto,
  ): Promise<AssignmentResponseDTO> {
    return await this.userService.updateAidworkerProgramAssignment(
      programId,
      userId,
      assignAidworkerToProgram,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
  @ApiTags('users/assignments')
  @ApiOperation({
    summary:
      'Remove roles from program-assignment (pass roles to delete in body) or remove assignment (no body)',
  })
  @ApiBody({ type: DeleteProgramAssignmentDto, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Returns the program assignment with the remaining roles or nothing (if program assignment removed)',
    type: AssignmentResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User, program, role(s) or assignment not found',
  })
  @Delete('programs/:programId/users/:userId')
  public async deleteAidworkerRolesOrAssignment(
    @Param('programId', ParseIntPipe)
    programId: number,

    @Param('userId', ParseIntPipe)
    userId: number,

    @Body() assignAidworkerToProgram: DeleteProgramAssignmentDto,
  ): Promise<AssignmentResponseDTO | void> {
    return await this.userService.deleteAidworkerRolesOrAssignment(
      programId,
      userId,
      assignAidworkerToProgram,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramREAD] })
  @ApiTags('users/assignments')
  @ApiOperation({ summary: 'Get all users by programId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of users assigned to a program',
    type: [GetUserReponseDto],
  })
  @Get('programs/:programId/users')
  public async getUsersInProgram(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<GetUserReponseDto[]> {
    return await this.userService.getUsersInProgram(programId);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiTags('users')
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
}
