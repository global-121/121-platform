export const nameConstraintQuestionsArray = [
  'id',
  'status',
  'referenceId',
  'preferredLanguage',
  'inclusionScore',
  'paymentAmountMultiplier',
  'note',
  'noteUpdated',
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
export const NameConstraintQuestions = nameConstraintQuestionsArray
  .map((item, index) => {
    if (index === nameConstraintQuestionsArray.length - 1) {
      return `'${item}'`;
    }
    return `'${item}',`;
  })
  .join(' ');
