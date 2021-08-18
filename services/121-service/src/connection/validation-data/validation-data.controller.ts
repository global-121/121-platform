import { DownloadData } from './interfaces/download-data.interface';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUseTags,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { Controller, Get, Body, Post, Param, UseGuards } from '@nestjs/common';
import { ValidationDataService } from './validation-data.service';
import { PrefilledAnswersDto } from './dto/prefilled-answers.dto';
import { ValidationIssueDataDto } from './dto/validation-issue-data.dto';
import { RolesGuard } from '../../roles.guard';
import { Roles } from '../../roles.decorator';
import { UserRole } from '../../user-role.enum';
import { ReferenceIdProgramDto } from './dto/reference-id-program.dto';
import { User } from '../../user/user.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('connection/validation-data')
@Controller('connection/validation-data')
export class ValidationDataController {
  private readonly validationDataService: ValidationDataService;
  public constructor(validationDataService: ValidationDataService) {
    this.validationDataService = validationDataService;
  }
}
