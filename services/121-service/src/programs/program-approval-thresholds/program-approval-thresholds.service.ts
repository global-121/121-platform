import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { UpdateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/update-program-approval-threshold.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';

@Injectable()
export class ProgramApprovalThresholdsService {
  public constructor(
    private readonly programApprovalThresholdRepository: ProgramApprovalThresholdRepository,
  ) {}

  public async createProgramApprovalThreshold(
    createDto: CreateProgramApprovalThresholdDto,
  ): Promise<GetProgramApprovalThresholdResponseDto> {
    const threshold = new ProgramApprovalThresholdEntity();
    threshold.thresholdAmount = createDto.thresholdAmount;
    threshold.approvalLevel = createDto.approvalLevel;
    threshold.programId = createDto.programId;

    const savedThreshold =
      await this.programApprovalThresholdRepository.save(threshold);

    return this.mapEntityToDto(savedThreshold);
  }

  public async getProgramApprovalThresholds(
    programId: number,
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    const thresholds = await this.programApprovalThresholdRepository.find({
      where: { programId: Equal(programId) },
      order: { approvalLevel: 'ASC' },
    });

    return thresholds.map((threshold) => this.mapEntityToDto(threshold));
  }

  public async getProgramApprovalThresholdById(
    id: number,
  ): Promise<GetProgramApprovalThresholdResponseDto> {
    const threshold = await this.programApprovalThresholdRepository.findOne({
      where: { id: Equal(id) },
    });

    if (!threshold) {
      throw new HttpException(
        `Program approval threshold with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapEntityToDto(threshold);
  }

  public async updateProgramApprovalThreshold(
    id: number,
    updateDto: UpdateProgramApprovalThresholdDto,
  ): Promise<GetProgramApprovalThresholdResponseDto> {
    const threshold = await this.programApprovalThresholdRepository.findOne({
      where: { id: Equal(id) },
    });

    if (!threshold) {
      throw new HttpException(
        `Program approval threshold with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (updateDto.thresholdAmount !== undefined) {
      threshold.thresholdAmount = updateDto.thresholdAmount;
    }

    if (updateDto.approvalLevel !== undefined) {
      threshold.approvalLevel = updateDto.approvalLevel;
    }

    const updatedThreshold =
      await this.programApprovalThresholdRepository.save(threshold);

    return this.mapEntityToDto(updatedThreshold);
  }

  public async deleteProgramApprovalThreshold(id: number): Promise<void> {
    const threshold = await this.programApprovalThresholdRepository.findOne({
      where: { id: Equal(id) },
    });

    if (!threshold) {
      throw new HttpException(
        `Program approval threshold with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.programApprovalThresholdRepository.remove(threshold);
  }

  private mapEntityToDto(
    entity: ProgramApprovalThresholdEntity,
  ): GetProgramApprovalThresholdResponseDto {
    return {
      id: entity.id,
      thresholdAmount: entity.thresholdAmount,
      approvalLevel: entity.approvalLevel,
      programId: entity.programId,
      created: entity.created,
      updated: entity.updated,
    };
  }
}
