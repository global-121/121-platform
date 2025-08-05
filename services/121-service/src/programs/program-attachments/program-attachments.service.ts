import { ContainerClient } from '@azure/storage-blob';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { GetProgramAttachmentDto } from '@121-service/src/programs/program-attachments/dto/get-program-attachment.dto';
import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';
import { ProgramAttachmentScopedRepository } from '@121-service/src/programs/program-attachments/program-attachment.repository';

@Injectable()
export class ProgramAttachmentsService {
  public constructor(
    private readonly programAttachmentScopedRepository: ProgramAttachmentScopedRepository,
    @Inject(ContainerClient)
    private readonly containerClient: ContainerClient,
  ) {}

  public async createProgramAttachment({
    programId,
    file,
    filename,
    userId,
  }: {
    programId: number;
    file: Express.Multer.File;
    filename: string;
    userId: number;
  }): Promise<ProgramAttachmentEntity> {
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
    return await this.programAttachmentScopedRepository.save(attachment);
  }

  public async getProgramAttachments(
    programId: number,
  ): Promise<GetProgramAttachmentDto[]> {
    return this.programAttachmentScopedRepository.find({
      where: { programId: Equal(programId) },
      relations: {
        user: true,
      },
    });
  }

  public async getProgramAttachmentById(
    programId: number,
    attachmentId: number,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    mimetype: string;
    filename: string;
  }> {
    const programAttachment =
      await this.programAttachmentScopedRepository.findOne({
        where: {
          programId: Equal(programId),
          id: Equal(attachmentId),
        },
      });

    if (!programAttachment) {
      throw new HttpException(
        `Attachment with ID ${attachmentId} not found for program ${programId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      `${programAttachment.blobName}`,
    );
    const downloadBlockBlobResponse = await blockBlobClient.download(0);

    if (!downloadBlockBlobResponse.readableStreamBody) {
      throw new HttpException(
        `Attachment with ID ${attachmentId} not found for program ${programId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      mimetype: programAttachment.mimetype,
      stream: downloadBlockBlobResponse.readableStreamBody,
      filename: programAttachment.filename,
    };
  }

  public async deleteProgramAttachmentById(
    programId: number,
    attachmentId: number,
  ): Promise<ProgramAttachmentEntity> {
    const programAttachment =
      await this.programAttachmentScopedRepository.findOne({
        where: {
          programId: Equal(programId),
          id: Equal(attachmentId),
        },
      });

    if (!programAttachment) {
      throw new HttpException(
        `Attachment with ID ${attachmentId} not found for program ${programId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete from Blob Storage
    const blockBlobClient = this.containerClient.getBlockBlobClient(
      `${programAttachment.blobName}`,
    );

    await blockBlobClient.deleteIfExists();

    // Delete from DB
    return await this.programAttachmentScopedRepository.remove(
      programAttachment,
    );
  }

  public async deleteAllProgramAttachments(programId: number): Promise<void> {
    const programAttachments =
      await this.programAttachmentScopedRepository.find({
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

    await this.programAttachmentScopedRepository.remove(programAttachments);
  }
}
