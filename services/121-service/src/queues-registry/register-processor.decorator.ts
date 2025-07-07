import { Processor } from '@nestjs/bull';

export const REGISTERED_PROCESSORS = new Set<string>();

export function RegisteredProcessor(
  queueName: string,
  scope?: any,
): ClassDecorator {
  return (target) => {
    if (REGISTERED_PROCESSORS.has(queueName)) {
      throw new Error(
        `Processor for queue "${queueName}" is already registered. Please ensure each queue has a unique processor.`,
      );
    }
    REGISTERED_PROCESSORS.add(queueName);
    if (scope) {
      Processor({ name: queueName, scope })(target);
    } else {
      Processor(queueName)(target);
    }
  };
}
