import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateMachineUserDto } from '@121-service/src/user/dto/create-machine-user.dto';

describe('CreateMachineUserDto', () => {
  const getValidationErrorProperties = async (
    input: Record<string, unknown>,
  ): Promise<string[]> => {
    const errors = await validate(plainToInstance(CreateMachineUserDto, input));
    return errors.map((error) => error.property);
  };

  it.each(['espo-connector', 'Scan_121', 'access.rc-connect', '123'])(
    'accepts the username %s',
    async (username) => {
      // Act
      const errorProperties = await getValidationErrorProperties({ username });

      // Assert
      expect(errorProperties).toEqual([]);
    },
  );

  it.each(['', 'user@example.org', 'with space', 'slash/name', 'ünïcode'])(
    'rejects the username "%s"',
    async (username) => {
      // Act
      const errorProperties = await getValidationErrorProperties({ username });

      // Assert
      expect(errorProperties).toEqual(['username']);
    },
  );

  it('accepts a display name', async () => {
    // Act
    const errorProperties = await getValidationErrorProperties({
      username: 'espo-connector',
      displayName: 'Espo connector',
    });

    // Assert
    expect(errorProperties).toEqual([]);
  });

  it('rejects a display name that is not a string', async () => {
    // Act
    const errorProperties = await getValidationErrorProperties({
      username: 'espo-connector',
      displayName: 123,
    });

    // Assert
    expect(errorProperties).toEqual(['displayName']);
  });
});
