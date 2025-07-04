import { Processor } from '@nestjs/bull';

const ProcessorRegistry = new Set<string>();

export function RegisteredProcessor(
  queueName: string,
  scope?: any,
): ClassDecorator {
  return (target) => {
    ProcessorRegistry.add(queueName);
    if (scope) {
      Processor({ name: queueName, scope })(target);
    } else {
      Processor(queueName)(target);
    }
  };
}

export function getRegisteredProcessors() {
  return Array.from(ProcessorRegistry);
}
