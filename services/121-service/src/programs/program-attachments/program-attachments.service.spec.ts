import { TestBed } from '@automock/jest';
import { HttpException, HttpStatus } from '@nestjs/common';

import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';
import { ProgramAttachmentRepository } from '@121-service/src/programs/program-attachments/program-attachment.repository';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachments.service';

describe('ProgramAttachmentsService', () => {
  let service: ProgramAttachmentsService;
  let programAttachmentRepository: ProgramAttachmentRepository;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      ProgramAttachmentsService,
    ).compile();
    service = unit;
    programAttachmentRepository = unitRef.get(ProgramAttachmentRepository);
  });

  describe('renameProgramAttachment', () => {
    it('should rename file while preserving the existing extension', async () => {
      // Arrange
      const existingAttachment = {
        id: 42,
        filename: 'report.pdf',
      } as ProgramAttachmentEntity;

      jest
        .spyOn(programAttachmentRepository, 'findOneScoped')
        .mockResolvedValue(existingAttachment);
      jest
        .spyOn(programAttachmentRepository, 'save')
        .mockResolvedValue(existingAttachment);

      // Act
      await service.renameProgramAttachment({
        programId: 1,
        attachmentId: 42,
        filename: 'summary',
        scope: 'test-scope',
      });

      // Assert
      expect(programAttachmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ filename: 'summary.pdf' }),
      );
    });

    it('should keep only the last extension when filename has multiple dots', async () => {
      // Arrange
      const existingAttachment = {
        id: 43,
        filename: 'my.report.pdf',
      } as ProgramAttachmentEntity;

      jest
        .spyOn(programAttachmentRepository, 'findOneScoped')
        .mockResolvedValue(existingAttachment);
      jest
        .spyOn(programAttachmentRepository, 'save')
        .mockResolvedValue(existingAttachment);

      // Act
      await service.renameProgramAttachment({
        programId: 1,
        attachmentId: 43,
        filename: 'summary',
        scope: 'test-scope',
      });

      // Assert
      expect(programAttachmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ filename: 'summary.pdf' }),
      );
    });

    it('should rename file without adding an extension when existing filename has no extension', async () => {
      // Arrange
      const existingAttachment = {
        id: 44,
        filename: 'report',
      } as ProgramAttachmentEntity;

      jest
        .spyOn(programAttachmentRepository, 'findOneScoped')
        .mockResolvedValue(existingAttachment);
      jest
        .spyOn(programAttachmentRepository, 'save')
        .mockResolvedValue(existingAttachment);

      // Act
      await service.renameProgramAttachment({
        programId: 1,
        attachmentId: 44,
        filename: 'summary',
        scope: 'test-scope',
      });

      // Assert
      expect(programAttachmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ filename: 'summary' }),
      );
    });

    it('should throw a 404 when the attachment does not exist', async () => {
      // Arrange
      jest
        .spyOn(programAttachmentRepository, 'findOneScoped')
        .mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.renameProgramAttachment({
          programId: 1,
          attachmentId: 99,
          filename: 'summary',
          scope: 'test-scope',
        }),
      ).rejects.toThrow(
        new HttpException(
          'Attachment with ID 99 not found for program 1',
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });
});
