import { SovrinSetupService } from './setup.service';
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiResponse,
  ApiImplicitParam,
} from '@nestjs/swagger';

@ApiUseTags('sovrin')
@Controller('sovrin/setup')
export class SovrinSetupController {
  private readonly sovrinSetupService: SovrinSetupService;
  public constructor(sovrinSetupService: SovrinSetupService) {
    this.sovrinSetupService = sovrinSetupService;
  }
}
