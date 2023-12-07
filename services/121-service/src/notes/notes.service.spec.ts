import { Test } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { ResponseNoteDto } from './dto/response-note.dto';
import { NoteController } from './notes.controller';
import { NoteService } from './notes.service';

const moduleMocker = new ModuleMocker(global);

describe('NotesService', () => {
  let controller: NoteController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NoteController],
    })
      .useMocker((token) => {
        const results = { userId: 1, text: 'test1' };
        if (token === NoteService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(NoteController);
  });

  describe('createNote', () => {
    it('should create note', async () => {
      // Arrange
      const programId = 1;
      const createNoteMock = jest
        .spyOn(controller, 'createNote')
        .mockResolvedValue();
      const note = {
        referenceId: 'dsadsaasd12123dsa',
        text: 'test1',
      };

      // Act
      const response = await controller.createNote(1, programId, note);

      // Assert
      expect(response).toEqual(undefined);
      expect(createNoteMock).toHaveBeenCalledWith(1, programId, note);
    });

    it('should get notes', async () => {
      // Arrange
      const programId = 1;
      const result: ResponseNoteDto[] = [
        {
          registrationId: 1,
          userId: 1,
          text: 'note here',
          id: 1,
          created: new Date(),
          username: 'string',
        },
      ];

      // Mock the createNote method to return the array of notes
      const createNoteMock = jest
        .spyOn(controller, 'retrieveNotes')
        .mockResolvedValue(result);

      const params = {
        referenceId: 'dsadsaasd12123dsa',
        programId,
      };

      // Act
      const response = await controller.retrieveNotes(params);

      // Assert
      expect(response).toEqual(result);
      expect(createNoteMock).toHaveBeenCalledWith(params);
    });
  });
});
