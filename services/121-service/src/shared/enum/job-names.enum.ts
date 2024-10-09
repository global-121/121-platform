// NOTE: job names are used to distinguish jobs in 1 queue that have to be handled differently.
// This is currently not the case for any payment-related queues, for which this enum is implemented
// Separate job/process-names are currently used only in message-status-callback.processor, which is not using this generic enum yet.
export enum JobNames {
  default = 'default',
}
