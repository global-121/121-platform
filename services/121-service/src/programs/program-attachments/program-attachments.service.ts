import { BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';
import { CreateProgramAttachmentResponseDto } from '@121-service/src/programs/program-attachments/dtos/create-program-attachment-response.dto';
import { GetProgramAttachmentResponseDto } from '@121-service/src/programs/program-attachments/dtos/get-program-attachment-response.dto';
import { ProgramAttachmentMapper } from '@121-service/src/programs/program-attachments/mapper/program-attachment.mapper';
import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';
import { ProgramAttachmentRepository } from '@121-service/src/programs/program-attachments/program-attachment.repository';

@Injectable()
export class ProgramAttachmentsService {
  public constructor(
    private readonly programAttachmentRepository: ProgramAttachmentRepository,
    @Inject(ContainerClient)
    private readonly containerClient: ContainerClient,
  ) {}

  public async createProgramAttachment({
    programId,
    file,
    filename,
    userId,
    scope,
    accessGroups,
  }: {
    programId: number;
    file: Express.Multer.File;
    filename: string;
    userId: number;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<CreateProgramAttachmentResponseDto> {
    // get extension from original file name
    const extension = file.originalname.split('.').pop();
    const filenameWithExtension = `${filename}.${extension}`;

    // Upload to Blob Storage
    const blobName = `${programId}/${Date.now()}-${filenameWithExtension}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const id = await this.programAttachmentRepository.createWithAccessGroups({
      programId,
      userId,
      filename: filenameWithExtension,
      mimetype: file.mimetype,
      blobName,
      scope,
      accessGroups,
    });

    return { id };
  }

  public async getProgramAttachments({
    programId,
    scope,
    accessGroups,
  }: {
    programId: number;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<GetProgramAttachmentResponseDto[]> {
    const attachments =
      await this.programAttachmentRepository.getManyAccessible({
        programId,
        scope,
        accessGroups,
      });

    return ProgramAttachmentMapper.mapEntitiesToDtos(attachments);
  }

  public async getProgramAttachmentById({
    programId,
    attachmentId,
    scope,
    accessGroups,
  }: {
    programId: number;
    attachmentId: number;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<{
    stream: NodeJS.ReadableStream;
    mimetype: string;
    filename: string;
  }> {
    const { programAttachment, blockBlobClient } =
      await this.getProgramAttachmentAndBlockBlobClient({
        programId,
        attachmentId,
        scope,
        accessGroups,
      });

    const downloadBlockBlobResponse = await blockBlobClient.download(0);

    if (!downloadBlockBlobResponse.readableStreamBody) {
      throw new Error(
        `Attachment with ID ${attachmentId} not found in blob storage for program ${programId}`,
      );
    }

    return {
      mimetype: programAttachment.mimetype,
      stream: downloadBlockBlobResponse.readableStreamBody,
      filename: programAttachment.filename,
    };
  }

  public async renameProgramAttachment({
    programId,
    attachmentId,
    filename,
    scope,
    accessGroups,
  }: {
    programId: number;
    attachmentId: number;
    filename: string;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<void> {
    const programAttachment = await this.getProgramAttachmentOrThrow({
      programId,
      attachmentId,
      scope,
      accessGroups,
    });

    // Keep existing extension
    const currentFilenameParts = programAttachment.filename.split('.');
    const currentExtension =
      currentFilenameParts.length > 1 ? currentFilenameParts.pop() : undefined;

    await this.programAttachmentRepository.updateFilename({
      attachmentId: programAttachment.id,
      filename: currentExtension ? `${filename}.${currentExtension}` : filename,
    });
  }

  public async deleteProgramAttachmentById({
    programId,
    attachmentId,
    scope,
    accessGroups,
  }: {
    programId: number;
    attachmentId: number;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<void> {
    const { programAttachment, blockBlobClient } =
      await this.getProgramAttachmentAndBlockBlobClient({
        programId,
        attachmentId,
        scope,
        accessGroups,
      });

    await blockBlobClient.deleteIfExists();

    // Its access groups are deleted by the database cascade
    await this.programAttachmentRepository.deleteById({
      attachmentId: programAttachment.id,
    });
  }

  // Deletes all attachments of the program, regardless of the scope and access groups of the requesting user
  public async deleteAllProgramAttachments(programId: number): Promise<void> {
    const programAttachments = await this.programAttachmentRepository.find({
      where: { programId: Equal(programId) },
    });

    await Promise.all(
      programAttachments.map(async (attachment) => {
        const blockBlobClient = this.containerClient.getBlockBlobClient(
          `${attachment.blobName}`,
        );
        await blockBlobClient.deleteIfExists();
      }),
    );

    await this.programAttachmentRepository.remove(programAttachments);
  }

  private async getProgramAttachmentOrThrow({
    programId,
    attachmentId,
    scope,
    accessGroups,
  }: {
    programId: number;
    attachmentId: number;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<ProgramAttachmentEntity> {
    const programAttachment =
      await this.programAttachmentRepository.getOneAccessible({
        programId,
        attachmentId,
        scope,
        accessGroups,
      });

    if (!programAttachment) {
      throw new HttpException(
        `Attachment with ID ${attachmentId} not found for program ${programId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return programAttachment;
  }

  private async getProgramAttachmentAndBlockBlobClient({
    programId,
    attachmentId,
    scope,
    accessGroups,
  }: {
    programId: number;
    attachmentId: number;
    scope: string;
    accessGroups: readonly AssignedAccessGroupResult[];
  }): Promise<{
    programAttachment: ProgramAttachmentEntity;
    blockBlobClient: BlockBlobClient;
  }> {
    const programAttachment = await this.getProgramAttachmentOrThrow({
      programId,
      attachmentId,
      scope,
      accessGroups,
    });

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      `${programAttachment.blobName}`,
    );

    return { programAttachment, blockBlobClient };
  }
}
