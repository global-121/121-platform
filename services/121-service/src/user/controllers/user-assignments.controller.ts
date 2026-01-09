import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import {
  CreateProgramAssignmentDto,
  DeleteProgramAssignmentDto,
  UpdateProgramAssignmentDto,
} from '@121-service/src/user/dto/assign-aw-to-program.dto';
import { GetUserReponseDto } from '@121-service/src/user/dto/get-user-response.dto';
import { AssignmentResponseDTO } from '@121-service/src/user/dto/userrole-response.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { throwIfSelfUpdate } from '@121-service/src/user/helpers/throw-if-self-update';
import { UserService } from '@121-service/src/user/user.service';

@ApiTags('user-assignments')
@UseGuards(AuthenticatedUserGuard)
@Controller()
export class UserAssignmentsController {
  private readonly userService: UserService;
  public constructor(userService: UserService) {
    this.userService = userService;
  }

  @AuthenticatedUser({ isAdmin: true })
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
    userIdToUpdate: number,

    @Body()
    assignAidworkerToProgram: CreateProgramAssignmentDto,

    @Req() req: ScopedUserRequest,
  ): Promise<AssignmentResponseDTO> {
    throwIfSelfUpdate(req, userIdToUpdate);
    return await this.userService.assignAidworkerToProgram(
      programId,
      userIdToUpdate,
      assignAidworkerToProgram,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
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
    userIdToUpdate: number,
    @Body() assignAidworkerToProgram: UpdateProgramAssignmentDto,
    @Req() req: ScopedUserRequest,
  ): Promise<AssignmentResponseDTO> {
    throwIfSelfUpdate(req, userIdToUpdate);
    return await this.userService.updateAidworkerProgramAssignment(
      programId,
      userIdToUpdate,
      assignAidworkerToProgram,
    );
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
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
    userIdToUpdate: number,

    @Req() req: ScopedUserRequest,
    @Body() deleteProgramAssignment?: DeleteProgramAssignmentDto,
  ): Promise<AssignmentResponseDTO | void> {
    throwIfSelfUpdate(req, userIdToUpdate);

    return await this.userService.deleteAidworkerRolesOrAssignment({
      programId,
      userId: userIdToUpdate,
      roleNamesToDelete: deleteProgramAssignment?.rolesToDelete,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramREAD] })
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
}
