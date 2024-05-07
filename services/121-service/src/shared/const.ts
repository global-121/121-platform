const formatArray = (array: string[]): string => {
  return array
    .map((item, index) => {
      if (index === array.length - 1) {
        return `'${item}'`;
      }
      return `'${item}',`;
    })
    .join(' ');
};

export const nameConstraintQuestionsArray = [
  'id',
  'status',
  'referenceId',
  'preferredLanguage',
  'inclusionScore',
  'paymentAmountMultiplier',
  'financialServiceProvider',
  'registrationProgramId',
  'maxPayments',
  'lastTransactionCreated',
  'lastTransactionPaymentNumber',
  'lastTransactionStatus',
  'lastTransactionAmount',
  'lastTransactionErrorMessage',
  'lastTransactionCustomData',
  'paymentCount',
  'paymentCountRemaining',
  'registeredDate',
  'validationDate',
  'inclusionDate',
  'deleteDate',
  'completedDate',
  'lastMessageStatus',
  'lastMessageType',
  'declinedDate',
];

export const NameConstraintQuestions = formatArray(
  nameConstraintQuestionsArray,
);

//To avoid endpoint confusion in registration.controller
const referenceIdConstraintArray = ['status'];
export const ReferenceIdConstraints = formatArray(referenceIdConstraintArray);
