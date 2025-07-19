import { BlobServiceClient } from '@azure/storage-blob';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachement.entity';
import { ProgramAttachmentScopedRepository } from '@121-service/src/programs/program-attachments/program-attachement.repository';

@Injectable()
export class ProgramAttachmentsService {
  public constructor(
    private readonly programAttachmentScopedRepository: ProgramAttachmentScopedRepository,
    @Inject(BlobServiceClient)
    private readonly blobServiceClient: BlobServiceClient,
  ) {}

  public async createProgramAttachment(
    programId: number,
    file: Express.Multer.File,
  ): Promise<void> {
    // TODO: only accept certain file types and sizes

    // Connecting creating a container should happen on startup in a smart way, not here
    const containerClient = this.blobServiceClient.getContainerClient(
      process.env.ENV_NAME!.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    );
    await containerClient.createIfNotExists();
    console.log('🚀 ~ ProgramAttachmentsService ~ programId:', programId);

    // Upload to Blob Storage
    const blobName = `${programId}/${Date.now()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    // Save metadata to DB
    const attachment = new ProgramAttachmentEntity();
    attachment.fileName = file.originalname;
    attachment.mimeType = file.mimetype;
    attachment.blobName = blobName;
    await this.programAttachmentScopedRepository.save(attachment);
  }

  public async getProgramAttachmentsMeta(
    programId: number,
  ): Promise<ProgramAttachmentEntity[]> {
    // TODO: Also use programId here to ensure the attachment belongs to the program
    // For people not exising attachment they do not have access to
    console.log('🚀 ~ ProgramAttachmentsService ~ programId:', programId);
    return this.programAttachmentScopedRepository.find({});
  }

  public async getProgramAttachmentById(
    programId: number,
    attachmentId: number,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType: string; // Should be a better type than string?
    fileName: string;
  }> {
    // TODO: Also use programId here to ensure the attachment belongs to the program
    // For people not exising attachment they do not have access to
    console.log(
      '🚀 ~ ProgramAttachmentsService ~ programId, attachmentId:',
      programId,
      attachmentId,
    );
    const programAttachment =
      await this.programAttachmentScopedRepository.findOne({
        where: { id: Equal(attachmentId) },
      });

    if (!programAttachment) {
      throw new HttpException(
        `Attachment with ID ${attachmentId} not found for program ${programId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const containerClient = this.blobServiceClient.getContainerClient(
      process.env.ENV_NAME!.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    );
    await containerClient.createIfNotExists();
    const blockBlobClient = containerClient.getBlockBlobClient(
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
      mimeType: programAttachment.mimeType,
      stream: downloadBlockBlobResponse.readableStreamBody,
      fileName: programAttachment.fileName,
    };
  }
}
