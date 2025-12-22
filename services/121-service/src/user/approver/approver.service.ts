import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { ApprovalStatusResponseDto } from '@121-service/src/user/approver/dto/approval-status-response.dto';
import { ApproverResponseDto } from '@121-service/src/user/approver/dto/approver-response.dto';
import { ApproverEntity } from '@121-service/src/user/approver/entities/approver.entity';
import { PaymentApprovalEntity } from '@121-service/src/user/approver/entities/payment-approval.entity';

@Injectable()
export class ApproverService {
  @InjectRepository(ApproverEntity)
  private readonly approverRepository: Repository<ApproverEntity>;
  @InjectRepository(ProgramAidworkerAssignmentEntity)
  private readonly assignmentRepository: Repository<ProgramAidworkerAssignmentEntity>;
  @InjectRepository(PaymentApprovalEntity)
  private readonly paymentApprovalRepository: Repository<PaymentApprovalEntity>;

  // ##TODO: move a lot of this stuff to repository?

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

  public async getApprovers({
    programId,
  }: {
    programId: number;
  }): Promise<ApproverResponseDto[]> {
    const approverEntities = await this.approverRepository.find({
      where: {
        programAidworkerAssignment: {
          program: { id: Equal(programId) },
        },
      },
      relations: { programAidworkerAssignment: { user: true } },
    });
    return approverEntities.map((approver) => this.entityToDto(approver));
  }

  public async createApprover({
    programId,
    userId,
    order,
  }: {
    programId: number;
    userId: number;
    order: number;
  }): Promise<ApproverResponseDto> {
    const programAidworkerAssignment =
      await this.assignmentRepository.findOneOrFail({
        where: {
          program: { id: Equal(programId) },
          user: { id: Equal(userId) },
        },
        relations: { user: true },
      });
    const approver = new ApproverEntity();
    approver.programAidworkerAssignment = programAidworkerAssignment;
    approver.order = order;
    await this.approverRepository.save(approver);
    return this.entityToDto(approver);
  }

  public async updateApprover({
    programId,
    approverId,
    order,
  }: {
    programId: number;
    approverId: number;
    order: number;
  }): Promise<ApproverResponseDto> {
    const approver = await this.approverRepository.findOneOrFail({
      where: { id: Equal(approverId) },
      relations: {
        programAidworkerAssignment: {
          user: true,
        },
      },
    });
    if (approver.programAidworkerAssignment.programId !== programId) {
      throw new HttpException(
        'Approver does not belong to the specified program',
        HttpStatus.BAD_REQUEST,
      );
    }
    approver.order = order;
    await this.approverRepository.save(approver);
    return this.entityToDto(approver);
  }

  public async deleteApprover({
    programId,
    approverId,
  }: {
    programId: number;
    approverId: number;
  }): Promise<void> {
    const approver = await this.approverRepository.findOneOrFail({
      where: { id: Equal(approverId) },
      relations: {
        programAidworkerAssignment: true,
      },
    });
    if (approver.programAidworkerAssignment.programId !== programId) {
      throw new HttpException(
        'Approver does not belong to the specified program',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.approverRepository.remove(approver);
  }

  private entityToDto(approver: ApproverEntity): ApproverResponseDto {
    const { id, programAidworkerAssignment, order } = approver;
    const { user } = programAidworkerAssignment;
    return {
      id,
      username: user.username,
      order,
    };
  }

  public async getPaymentApprovalStatus({
    paymentId,
  }: {
    paymentId: number;
  }): Promise<ApprovalStatusResponseDto[]> {
    const paymentApprovals = await this.paymentApprovalRepository.find({
      where: {
        paymentId: Equal(paymentId),
      },
      relations: { approver: { programAidworkerAssignment: { user: true } } },
      order: { approver: { order: 'ASC' } },
    });
    return paymentApprovals.map((approval) => {
      const { approver } = approval;
      const { user } = approver.programAidworkerAssignment;
      return {
        id: approval.id,
        approved: approval.approved,
        username: user.username,
        order: approver.order,
      };
    });
  }
}
