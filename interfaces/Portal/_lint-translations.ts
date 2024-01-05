import {
  ErrorFlow,
  ErrorTypes,
  IRulesConfig,
  LanguagesModel,
  NgxTranslateLint,
  ResultCliModel,
  ToggleRule,
} from 'ngx-translate-lint';
import RegistrationStatus from 'src/app/enums/registration-status.enum';
import { BulkActionId } from 'src/app/models/bulk-actions.models';
import { ExportType } from 'src/app/models/export-type.model';
import { ProgramPhase } from 'src/app/models/program.model';

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const viewsPath: string = './src/app/**/*.{html,ts}';
const languagesPath: string = './src/assets/i18n/en.json';
const ignoredLanguagesPath: string = '';

const ruleConfig: IRulesConfig = {
  keysOnViews: ErrorTypes.warning,
  zombieKeys: ErrorTypes.error,
  misprintKeys: ErrorTypes.warning,
  deepSearch: ToggleRule.enable,
  emptyKeys: ErrorTypes.warning,
  maxWarning: 0,
  misprintCoefficient: 0.9,
  ignoredKeys: [
    // Plain string or RegExp
    'page.program.program-people-affected.column.(.*)',
    'page.program.program-people-affected.edit-person-affected-popup.properties.error.(not-an-integer|not-empty|too-low)',
    'page.program.program-people-affected.edit-person-affected-popup.properties.whatsappPhoneNumber.explanation',
    'page.program.program-people-affected.language.(.*)',
    'page.program.program-people-affected.message-history-popup.chip-status.(.*)',
    'page.program.program-people-affected.message-history-popup.content-type.(.*)',
    'page.program.program-people-affected.message-history-popup.type..(.*)',
    `page.program.program-people-affected.status.(${anyValueFrom(
      RegistrationStatus,
    )})`,
    'page.program.program-people-affected.transaction.custom-data.(.*)',
    `page.program.export-list.(${anyValueFrom(
      ExportType,
    )}).(btn-text|confirm-message)`,
    `page.program.phases.(${anyValueFrom(ProgramPhase)}).(btnText|label)`,
    `page.program.program-people-affected.bulk-action-conditions.(${anyValueFrom(
      BulkActionId,
    )})`,
    `registration-details.activity-overview.filters.(null|dataChanges|payment|message|notes|status)`,
    'registration-details.personal-information-table.(status|primaryLanguage|phone|fsp|scope)',
    '_dir',
  ],
  ignoredMisprintKeys: [],
  customRegExpToFindKeys: [],
};

// ----------------------------------------------------------------------------

console.info('NGX-Translate-Lint: Linting...');
console.log('\n');

const ngxTranslateLint = new NgxTranslateLint(
  viewsPath,
  languagesPath,
  ignoredLanguagesPath,
  ruleConfig,
);

// ----------------------------------------------------------------------------

// Get Languages with all keys and views
const languages: LanguagesModel[] = ngxTranslateLint.getLanguages();

console.info(`Checking ${languages.length} language(s):`);
languages.forEach((language) => {
  console.info(`${getLocalPath(language.path)} : ${language.keys.length} keys`);
});
console.log('\n');

// ----------------------------------------------------------------------------

// Run Lint
const results: ResultCliModel = ngxTranslateLint.lint();

if (results.errors.length) {
  console.error(`Found ${results.errors.length} issue(s).`);
  console.log('\n');

  results.errors.forEach((result, index) => {
    console.warn(
      `Issue: #${index + 1} - ${result.errorType} - ${getIssueLabel(
        result.errorFlow,
      )}`,
    );
    console.log(` Path:`, getLocalPath(result.currentPath));
    console.log(`  Key:`, result.value);
    if (result.absentedPath) {
      console.log(` From:`, result.absentedPath);
    }
    if (result.suggestions.length) {
      console.log('        Suggestions:', result.suggestions);
    }
    console.log('\n');
  });

  console.info(
    'If these issues are false positives, please review the configuration.',
  );
  console.info(`See: ${getLocalPath(__filename)}`);
  console.log('\n');

  process.exit(1);
} else {
  console.info('Everything looks fine!');
  console.log('\n');
  process.exit(0);
}

// ----------------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------------
function getIssueLabel(type: ErrorFlow) {
  switch (type) {
    case ErrorFlow.zombieKeys:
      return 'No use-case found';
    case ErrorFlow.keysOnViews:
      return 'Missing translation';
    case ErrorFlow.misprintKeys:
      return 'Typo in key?';
    case ErrorFlow.emptyKeys:
      return 'Empty key/translation';
    default:
      return type;
  }
}

function getLocalPath(fullPath: string): string {
  return fullPath.replace(process.cwd(), '');
}
function anyValueFrom(set: any): string {
  return Object.values(set).join('|');
}
