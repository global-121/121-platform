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
        isActive: Equal(true),
      },
      relations: { programAidworkerAssignment: { user: true } },
    });
    if (!approver) {
      throw new HttpException(
        'User is not an (active) approver for this program',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.entityToDto(approver);
  }

  public async getApprovers({
    programId,
    filterOnActive = true,
  }: {
    programId: number;
    filterOnActive?: boolean;
  }): Promise<ApproverResponseDto[]> {
    const whereClause = {
      programAidworkerAssignment: { program: { id: Equal(programId) } },
    };
    if (filterOnActive) {
      Object.assign(whereClause, { isActive: Equal(true) });
    }
    const approverEntities = await this.approverRepository.find({
      where: whereClause,
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
    await this.checkUniqueOrderOrThrow(programId, order);

    const programAidworkerAssignment =
      await this.assignmentRepository.findOneOrFail({
        where: {
          program: { id: Equal(programId) },
          user: { id: Equal(userId) },
        },
        relations: { user: true },
      });
    const existingApprover = await this.approverRepository.findOne({
      where: {
        programAidworkerAssignmentId: Equal(programAidworkerAssignment.id),
      },
    });
    if (existingApprover) {
      throw new HttpException(
        'User is already an approver for this program',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (programAidworkerAssignment.scope !== '') {
      throw new HttpException(
        'Only users without scope (for a program) can be made approver (for that program). Edit the scope of the user-program assignment first (if intended) and retry here.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const approver = new ApproverEntity();
    approver.programAidworkerAssignment = programAidworkerAssignment;
    approver.order = order;
    approver.isActive = true;
    await this.approverRepository.save(approver);
    return this.entityToDto(approver);
  }

  private async checkUniqueOrderOrThrow(
    programId: number,
    order: number,
  ): Promise<void> {
    const existingApprover = await this.approverRepository.findOne({
      where: {
        order: Equal(order),
        programAidworkerAssignment: {
          program: { id: Equal(programId) },
        },
      },
    });
    if (existingApprover) {
      throw new HttpException(
        `An approver with order ${order} already exists for this program`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async updateApprover({
    programId,
    approverId,
    order,
    isActive,
  }: {
    programId: number;
    approverId: number;
    order?: number;
    isActive?: boolean;
  }): Promise<ApproverResponseDto> {
    const approver = await this.approverRepository.findOneOrFail({
      where: {
        id: Equal(approverId),
        programAidworkerAssignment: { programId: Equal(programId) },
      },
      relations: {
        programAidworkerAssignment: {
          user: true,
        },
      },
    });

    if (order) {
      await this.checkUniqueOrderOrThrow(programId, order);
      approver.order = order;
    }

    if (isActive !== undefined) {
      if (isActive === approver.isActive) {
        throw new HttpException(
          `Approver is already ${isActive ? 'active' : 'inactive'}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      approver.isActive = isActive;
    }

    await this.approverRepository.save(approver);
    return this.entityToDto(approver);
  }

  private entityToDto(approver: ApproverEntity): ApproverResponseDto {
    const { id, programAidworkerAssignment, order, isActive } = approver;
    const { user } = programAidworkerAssignment;
    return {
      id,
      userId: user.id,
      username: user.username,
      order,
      isActive,
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
      order: { rank: 'ASC' },
    });
    return paymentApprovals.map((approval) => {
      const { approver } = approval;
      const { user } = approver.programAidworkerAssignment;
      return {
        id: approval.id,
        approved: approval.approved,
        username: user.username,
        rank: approval.rank,
      };
    });
  }
}
