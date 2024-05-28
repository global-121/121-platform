/**
 * Get the name of a Queue to be mocked
 *
 * @param name Of the queue to be mocked
 * @returns Queue name to be used for mocking
 */
export function getQueueName(name: string | undefined): string {
  return `BullQueue_${name}`;
}
