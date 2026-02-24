import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ApproverResponseDto } from '@121-service/src/programs/approvers/dto/approver-response.dto';
import { ApproverEntity } from '@121-service/src/programs/approvers/entities/approver.entity';

@Injectable()
export class ApproversService {
  @InjectRepository(ApproverEntity)
  private readonly approverRepository: Repository<ApproverEntity>;

  public async getApproverByUserIdOrThrow({
    userId,
    programId,
  }: {
    userId: number;
    programId: number;
  }): Promise<ApproverResponseDto> {
    const approver = await this.approverRepository.findOne({
      where: {
        programAidworkerAssignment: {
          program: { id: Equal(programId) },
          user: { id: Equal(userId) },
        },
      },
      relations: { programAidworkerAssignment: { user: true } },
    });
    if (!approver) {
      throw new HttpException(
        'User is not an approver for this program',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.entityToDto(approver);
  }

  private entityToDto(approver: ApproverEntity): ApproverResponseDto {
    const {
      id,
      programAidworkerAssignment,
      programApprovalThresholdId,
      order,
    } = approver;
    const { user } = programAidworkerAssignment;
    return {
      id,
      userId: user.id,
      username: user.username,
      programApprovalThresholdId,
      order,
    };
  }
}
