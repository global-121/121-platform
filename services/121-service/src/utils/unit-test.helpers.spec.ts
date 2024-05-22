import { getQueueName } from '@121-service/src/utils/unit-test.helpers';

describe('getQueueName', () => {
  it('should return a correctly formatted Queue-name', () => {
    // Arrange
    const testNames = [
      undefined,
      '',
      'test',
      '123',
      'test-name_with.special/characters',
    ];
    const testOutput = [
      'BullQueue_undefined',
      'BullQueue_',
      'BullQueue_test',
      'BullQueue_123',
      'BullQueue_test-name_with.special/characters',
    ];

    testNames.forEach((name, index) => {
      // Act
      const result = getQueueName(name);

      // Assert
      expect(result).toBe(testOutput[index]);
    });
  });
});
