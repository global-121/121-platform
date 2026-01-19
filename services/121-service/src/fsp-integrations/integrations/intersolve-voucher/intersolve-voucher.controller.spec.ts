import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import { IdentifyVoucherDto } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/dto/identify-voucher.dto';
import { IntersolveVoucherController } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/intersolve-voucher.controller';
import { IntersolveVoucherService } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/services/intersolve-voucher.service';

describe('IntersolveVoucherController', () => {
  let controller: IntersolveVoucherController;
  let service: IntersolveVoucherService;
  let mockResponse: Partial<Response>;

  const mockIntersolveVoucherService = {
    getVoucherImage: jest.fn(),
    getVoucherBalance: jest.fn(),
    getInstruction: jest.fn(),
    postInstruction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntersolveVoucherController],
      providers: [
        {
          provide: IntersolveVoucherService,
          useValue: mockIntersolveVoucherService,
        },
      ],
    }).compile();

    controller = module.get<IntersolveVoucherController>(
      IntersolveVoucherController,
    );
    service = module.get<IntersolveVoucherService>(IntersolveVoucherService);

    mockResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      write: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('getPaperVoucherImage', () => {
    it('should call service.getVoucherImage with correct parameters and send image response', async () => {
      // Arrange
      const programId = 1;
      const queryParams: IdentifyVoucherDto = {
        referenceId: 'ref-123',
        paymentId: 5,
      };
      const mockBlob = 'mock-image-blob';
      mockIntersolveVoucherService.getVoucherImage.mockResolvedValue(mockBlob);

      // Act
      await controller.getPaperVoucherImage(
        programId,
        queryParams,
        mockResponse as Response,
      );

      // Assert
      expect(service.getVoucherImage).toHaveBeenCalledWith(
        queryParams.referenceId,
        queryParams.paymentId,
        programId,
      );
      expect(mockResponse.writeHead).toHaveBeenCalledWith(HttpStatus.OK, {
        'Content-Type': 'image/png',
      });
    });
  });

  describe('getWhatsappVoucherImage', () => {
    it('should call service.getVoucherImage with correct parameters and send image response', async () => {
      // Arrange
      const programId = 1;
      const queryParams: IdentifyVoucherDto = {
        referenceId: 'ref-456',
        paymentId: 10,
      };
      const mockBlob = 'mock-whatsapp-image-blob';
      mockIntersolveVoucherService.getVoucherImage.mockResolvedValue(mockBlob);

      // Act
      await controller.getWhatsappVoucherImage(
        programId,
        queryParams,
        mockResponse as Response,
      );

      // Assert
      expect(service.getVoucherImage).toHaveBeenCalledWith(
        queryParams.referenceId,
        queryParams.paymentId,
        programId,
      );
      expect(mockResponse.writeHead).toHaveBeenCalledWith(HttpStatus.OK, {
        'Content-Type': 'image/png',
      });
    });
  });

  describe('getBalance', () => {
    it('should call service.getVoucherBalance with correct parameters and return balance', async () => {
      // Arrange
      const programId = 1;
      const queryParams: IdentifyVoucherDto = {
        referenceId: 'ref-789',
        paymentId: 15,
      };
      const mockBalance = 100.5;
      mockIntersolveVoucherService.getVoucherBalance.mockResolvedValue(
        mockBalance,
      );

      // Act
      const result = await controller.getBalance(programId, queryParams);

      // Assert
      expect(service.getVoucherBalance).toHaveBeenCalledWith(
        queryParams.referenceId,
        queryParams.paymentId,
        programId,
      );
      expect(result).toBe(mockBalance);
    });
  });

  describe('intersolveInstructions', () => {
    it('should call service.getInstruction with correct programId and send image response', async () => {
      // Arrange
      const programId = 1;
      const mockBlob = 'mock-instruction-blob';
      mockIntersolveVoucherService.getInstruction.mockResolvedValue(mockBlob);

      // Act
      await controller.intersolveInstructions(
        mockResponse as Response,
        programId,
      );

      // Assert
      expect(service.getInstruction).toHaveBeenCalledWith(programId);
      expect(mockResponse.writeHead).toHaveBeenCalledWith(HttpStatus.OK, {
        'Content-Type': 'image/png',
      });
    });
  });

  describe('postIntersolveInstructions', () => {
    it('should call service.postInstruction with correct parameters', async () => {
      // Arrange
      const programId = 1;
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };
      mockIntersolveVoucherService.postInstruction.mockResolvedValue(undefined);

      // Act
      await controller.postIntersolveInstructions(mockFile, programId);

      // Assert
      expect(service.postInstruction).toHaveBeenCalledWith(programId, mockFile);
    });

    it('should handle service errors when posting instructions', async () => {
      // Arrange
      const programId = 1;
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };
      const error = new Error('Service error');
      mockIntersolveVoucherService.postInstruction.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.postIntersolveInstructions(mockFile, programId),
      ).rejects.toThrow('Service error');
    });
  });
});
