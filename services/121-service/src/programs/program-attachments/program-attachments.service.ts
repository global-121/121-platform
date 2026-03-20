import { BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

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
  }: {
    programId: number;
    file: Express.Multer.File;
    filename: string;
    userId: number;
    scope: string;
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

    // Save metadata to DB
    const attachment = new ProgramAttachmentEntity();
    attachment.filename = filenameWithExtension;
    attachment.mimetype = file.mimetype;
    attachment.blobName = blobName;
    attachment.programId = programId;
    attachment.userId = userId;
    attachment.scope = scope;

    const savedAttachment =
      await this.programAttachmentRepository.save(attachment);

    return {
      id: savedAttachment.id,
    };
  }

  public async getProgramAttachments(
    programId: number,
    scope: string,
  ): Promise<GetProgramAttachmentResponseDto[]> {
    const attachments = await this.programAttachmentRepository.findManyScoped({
      programId,
      scope,
      relations: {
        user: true,
      },
    });

    return ProgramAttachmentMapper.mapEntitiesToDtos(attachments);
  }

  public async getProgramAttachmentById(
    programId: number,
    attachmentId: number,
    scope: string,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    mimetype: string;
    filename: string;
  }> {
    const { programAttachment, blockBlobClient } =
      await this.getProgramAttachmentAndBlockBlobClient({
        programId,
        attachmentId,
        scope,
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
  }: {
    programId: number;
    attachmentId: number;
    filename: string;
  }): Promise<void> {
    const programAttachment = await this.getProgramAttachmentOrThrow({
      programId,
      attachmentId,
    });

    // Keep existing extension
    const currentFilenameParts = programAttachment.filename.split('.');
    const currentExtension =
      currentFilenameParts.length > 1 ? currentFilenameParts.pop() : undefined;

    programAttachment.filename = currentExtension
      ? `${filename}.${currentExtension}`
      : filename;

    await this.programAttachmentRepository.save(programAttachment);
  }

  public async deleteProgramAttachmentById(
    programId: number,
    attachmentId: number,
    scope: string,
  ): Promise<void> {
    const { programAttachment, blockBlobClient } =
      await this.getProgramAttachmentAndBlockBlobClient({
        programId,
        attachmentId,
        scope,
      });

    await blockBlobClient.deleteIfExists();

    // Delete from DB
    await this.programAttachmentRepository.remove(programAttachment);
  }

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
  }: {
    programId: number;
    attachmentId: number;
    scope: string;
  }): Promise<ProgramAttachmentEntity> {
    const programAttachment =
      await this.programAttachmentRepository.findOneScoped({
        programId,
        attachmentId,
        scope,
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
  }: {
    programId: number;
    attachmentId: number;
  }): Promise<{
    programAttachment: ProgramAttachmentEntity;
    blockBlobClient: BlockBlobClient;
  }> {
    const programAttachment = await this.getProgramAttachmentOrThrow({
      programId,
      attachmentId,
    });

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      `${programAttachment.blobName}`,
    );

    return { programAttachment, blockBlobClient };
  }
}
