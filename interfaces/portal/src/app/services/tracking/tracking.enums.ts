/**
 * Matomo tracking Category-names.
 *
 * These are used to group events in "user goal focused"-groups.
 *
 * Naming convention:
 * For the keys:
 * - Follow the "camelCase" code-conventions
 * - Use singular nouns...
 *
 * For the values:
 * - Use "Title Case" (i.e. "Export")
 * - Use "human readable" values (but be concise.)
 *
 */
export enum TrackingCategory {
  additionalInformationViewed = 'Additional Information Viewed',
  createNewProgram = 'Create New Program',
  export = 'Export',
  hiddenFeatures = 'Hidden Features',
  manageRegistrations = 'Manage Registrations',
  manageTableSettings = 'Manage Table-settings',
  manageTransactions = 'Manage Transactions',
  programSettings = 'Program Settings',
}

/**
 * Matomo tracking Action-names.
 *
 * These are used to describe the action that was performed.
 *
 * Naming convention:
 * - Use am active verb prefix; i.e. "submit", "click", "open", "select", etc.
 * - Use "human readable" values (but be concise.)
 */
export enum TrackingAction {
  addUserToProgramTeam = 'add: User to Program Team',
  clickBulkActionButton = 'click: Bulk Action Button',
  clickClearAllFiltersButton = 'click: Clear All Filters Button',
  clickClearColumnFilterButton = 'click: Clear Column-filter Button',
  clickGlobalFilterButton = 'click: Global-filter Button',
  clickGlobalFilterClearButton = 'click: Clear Global-filter Button',
  clickManageTableButton = 'click: Manage Table Button',
  clickMoreActionsMenuButton = 'click: More-Actions-menu Button',
  clickOpenExplainer = 'click: Explainer',
  clickProceedButton = 'click: Proceed Button',
  clickRetryTransactionButton = 'click: Retry Transaction(s) Button',
  clickRevertToDefaultButton = 'click: Revert to Default Button',

  createNewProgramBackButtonClicks = 'event: createNewProgram back button clicks',
  createNewProgramCloseDialog = 'event: close createNewProgram dialog',
  createNewProgramStep1Error = 'errors: createNewProgram Step 1',
  createNewProgramStep1TotalTimeSpent = 'time: createNewProgram Step 1',
  createNewProgramStep2Error = 'errors: createNewProgram Step 2',
  createNewProgramStep2TotalTimeSpent = 'time: createNewProgram Step 2',
  createNewProgramStep3Error = 'errors: createNewProgram Step 3',
  createNewProgramStep3TotalTimeSpent = 'time: createNewProgram Step 3',
  createNewProgramTotalTimeSpent = 'time: createNewProgram Total Time',
  formValidationError = 'errors: Form Validation',

  hoverInformationIcon = 'hover: Information Icon',

  programSettingsBasicInfoSaveButtonClick = 'click: Program Settings info Save Button',
  programSettingsBudgetSaveButtonClick = 'click: Program Settings Budget Save Button',

  selectContextMenuOption = 'select: Context-menu Option',
  selectDropdownOption = 'select: Dropdown Option',
  showColumnFilter = 'show: Column-filter',
  showContextMenu = 'show: Context Menu',
  showHenryDunant = 'show: Henry Dunant!',
  showSnakeGameOver = 'show: Snake Game Over',

  toggleProgramScope = 'toggle: Use Program Scope',
  toggleProgramValidation = 'toggle: Use Program Validation',
}

export enum ExplainerTrackingName {
  koboToolboxApiKey = 'Explainer: KoboToolbox API key',
  koboToolboxFormUrl = 'Explainer: KoboToolbox form URL',
  requiredDataColumnNamesExplainer = 'Explainer: Required Data Column Names',
}

export enum InfoTooltipTrackingName {
  attributeEditInfoFullName = 'Edit Attributes: Name Info',
  attributeEditInfoInclusionScore = 'Edit Attributes: Inclusion Score Info',
  attributeEditInfoMaxPayments = 'Edit Attributes: Max Payments Info',
  attributeEditInfoPaymentAmountMultiplier = 'Edit Attributes: Payment Amount Multiplier Info',
  attributeEditInfoPaymentCountRemaining = 'Edit Attributes: Payment Count Remaining Info',
  attributeEditInfoPhoneNumber = 'Edit Attributes: Phone Number Info',
  attributeEditInfoScope = 'Edit Attributes: Scope Info',

  customMessageCharacterLimit = 'Message: Custom Message Character Limit',
  fspConfigurationSensitiveProperty = 'Fsp Configuration: Sensitive Property',

  koboConfigurationErrorInfo = 'Kobo: Configuration Error Info',
  koboFormSettingErrorInfo = 'Kobo: Form Setting Error Info',
  koboFormSettingErrors = 'Kobo: Form Setting Errors',
  koboImportSkippedSubmissions = 'Kobo: Import Skipped Submissions',
  koboMissingRequiredFields = 'Kobo: Missing Required Fields',

  monitoringBaseTransferValue = 'Monitoring: Base Transfer Value',
  monitoringIncludedRegistrations = 'Monitoring: Included Registrations',
  monitoringTotalRegistrations = 'Monitoring: Total Registrations',

  paymentApprovalAdditionalStepThreshold = 'Payment: Approval Additional Step Threshold',
  paymentApprovalFirstStepRequired = 'Payment: Approval First Step',
  paymentApprovalThresholdColumn = 'Payment: Approval Threshold',
  paymentName = 'Payment: Name',
  paymentTotalAmountCalculation = 'Payment: Total Amount',

  programCurrency = 'Program: Currency',
  programDistributionDuration = 'Program: Distribution per Registration',
  programEnableScope = 'Program: Enable Scope',
  programTargetRegistrations = 'Program: Target Registrations',
  programValidationProcess = 'Program: Use validation Process',

  registrationQuestionDataColumnName = 'Registration Questions: Data Column Name',
  registrationQuestionLabel = 'Registration Questions: Label',

  requiredAttributeFspInfo = 'Kobo Required Attribute: Fsp Info',
  requiredAttributeScopeInfo = 'Kobo Required Attribute: Scope Info',
  unsupportedLanguageWarning = 'Registration Questions: Unsupported Language Warning',
}
