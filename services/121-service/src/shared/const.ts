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
  'note',
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
  'importedDate',
  'invitedDate',
  'startedRegistrationDate',
  'registeredWhileNoLongerEligibleDate',
  'registeredDate',
  'rejectionDate',
  'noLongerEligibleDate',
  'validationDate',
  'inclusionDate',
  'inclusionEndDate',
  'selectedForValidationDate',
  'deleteDate',
  'completedDate',
  'lastMessageStatus',
  'lastMessageType',
];

export const NameConstraintQuestions = formatArray(
  nameConstraintQuestionsArray,
);

//To avoid endpoint confusion in registration.controller
const referenceIdConstraintArray = ['status'];
export const ReferenceIdConstraints = formatArray(referenceIdConstraintArray);
