import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface KoboSurveyItem {
  name?: string;
  type: string;
  $kuid: string;
  $xpath?: string;
  $autoname?: string;
  label?: string[];
  required?: boolean;
  constraint_message?: string;
  select_from_list_name?: string;
}

interface KoboChoice {
  name: string;
  $kuid: string;
  label: string[];
  list_name: string;
  $autovalue: string;
}

interface KoboAssetSummary {
  languages: string[];
}

interface KoboAssetContent {
  survey?: KoboSurveyItem[];
  choices?: KoboChoice[];
}

interface KoboAsset {
  name: string;
  date_deployed: string;
  version_id: string;
  summary: KoboAssetSummary;
  content: KoboAssetContent;
}

export interface KoboAssetDeployment {
  asset: KoboAsset;
  version_id: string;
}

export enum KoboMockAssetUids {
  bodyThatTriggersErrors = 'asset-id-body-that-triggers-errors',
  notFound = 'asset-id-not-found',
  happyFlowWithChanges = 'asset-id-happy-flow-with-changes',
  withExistingWebhook = 'asset-id-with-existing-webhook',
}

const bodyThatTriggersErrors: KoboAssetDeployment = {
  version_id: KoboMockAssetUids.bodyThatTriggersErrors,
  asset: {
    name: '29042025 Prototype Sprint - wo nationalId',
    date_deployed: '2025-04-29T13:01:57.902823Z',
    version_id: KoboMockAssetUids.bodyThatTriggersErrors,
    summary: {
      languages: ['English (en)', 'Dutch (nl)', null],
    },
    content: {
      survey: [
        {
          name: 'start',
          type: 'start',
          $kuid: 'bo0eEr0hk',
          $xpath: 'start',
          $autoname: 'start',
        },
        {
          name: 'end',
          type: 'end',
          $kuid: 'TVoofeSlN',
          $xpath: 'end',
          $autoname: 'end',
        },
        {
          name: 'group_or1bl43',
          type: 'begin_group',
          $kuid: 'xs0uz53',
          label: [
            'This is the first grouping',
            'Dit is het eerste groepje',
            null,
          ],
          $xpath: 'group_or1bl43',
          required: false,
          $autoname: 'group_or1bl43',
        },
        {
          type: 'note',
          $kuid: 'jk5rl97',
          label: ['This is a note', 'Dit is een notitie', null],
          $xpath: 'group_or1bl43/This_is_a_note',
          required: false,
          $autoname: 'This_is_a_note',
        },
        {
          type: 'select_one',
          $kuid: 'cu7lm16',
          label: ['How are you today (select one)?', 'Hoe gaat het?', null],
          $xpath: 'group_or1bl43/How_are_you_today_select_one',
          required: false,
          $autoname: 'How_are_you_today_select_one',
          select_from_list_name: 'ol0qe57',
        },
        {
          type: 'end_group',
          $kuid: '/xs0uz53',
        },
        {
          type: 'integer',
          $kuid: 'cg7oe89',
          label: ['What is 2+2 (number)?', 'Wat is 2+2?', null],
          $xpath: 'group_ad8jk55/group_gz24g15/What_is_2_2_number',
          required: true,
          $autoname: 'What_is_2_2_number',
        },
        {
          name: 'addressHouseNumber',
          type: 'text',
          $kuid: 'sk4iu70',
          label: [
            "What is you housenumber but with a wrong type. It's text but we expect a number",
            null,
            null,
          ],
          $xpath: 'addressHouseNumber',
          required: false,
          $autoname: 'addressHouseNumber',
        },
      ],
      choices: [
        {
          name: 'great',
          $kuid: 'Op4dDqyni',
          label: ['Great', 'Geweldig', null],
          list_name: 'ol0qe57',
          $autovalue: 'great',
        },
        {
          name: 'ok',
          $kuid: 'zExJMwth7',
          label: ['Ok', 'Ok', null],
          list_name: 'ol0qe57',
          $autovalue: 'ok',
        },
        {
          name: 'terrible',
          $kuid: 'wIQ2VnH15',
          label: ['Terrible', 'Gruwelijk', null],
          list_name: 'ol0qe57',
          $autovalue: 'terrible',
        },
        {
          name: 'tower',
          $kuid: 'VTu19WnKE',
          label: ['Tower', 'Toren', null],
          list_name: 'xg8ep41',
          $autovalue: 'tower',
        },
        {
          name: 'car',
          $kuid: 'R5cxjTPsS',
          label: ['Car', 'Auto', null],
          list_name: 'xg8ep41',
          $autovalue: 'car',
        },
        {
          name: 'sandwich',
          $kuid: 'o3xKer2E9',
          label: ['Sandwich', 'Broodje', null],
          list_name: 'xg8ep41',
          $autovalue: 'sandwich',
        },
        {
          name: 'apple',
          $kuid: 'Hzv4gbOfr',
          label: ['Apple', 'Appel', null],
          list_name: 'xg8ep41',
          $autovalue: 'apple',
        },
      ],
    },
  },
};

const happyFlowFromDefinition: KoboAssetDeployment = {
  version_id: 'version-succes',
  asset: {
    name: '25042025 Prototype Sprint',
    date_deployed: '2025-04-30T14:49:53.989148Z',
    version_id: 'version-succes',
    summary: {
      languages: ['English (en)', 'Dutch (nl)'],
    },
    content: {
      survey: [
        {
          name: 'start',
          type: 'start',
          $kuid: '3pTXFjOFa',
          $xpath: 'start',
          $autoname: 'start',
        },
        {
          name: 'end',
          type: 'end',
          $kuid: 'gHDXZWdPn',
          $xpath: 'end',
          $autoname: 'end',
        },
        {
          name: 'group_or1bl43',
          type: 'begin_group',
          $kuid: 'xs0uz53',
          label: ['This is the first grouping', 'Dit is het eerste groepje'],
          $xpath: 'group_or1bl43',
          required: false,
          $autoname: 'group_or1bl43',
        },
        {
          type: 'note',
          $kuid: 'jk5rl97',
          label: ['This is a note', 'Dit is een notitie'],
          $xpath: 'group_or1bl43/This_is_a_note',
          required: false,
          $autoname: 'This_is_a_note',
        },
        {
          type: 'select_one',
          $kuid: 'cu7lm16',
          label: ['How are you today (select one)?', 'Hoe gaat het?'],
          $xpath: 'group_or1bl43/How_are_you_today_select_one',
          required: false,
          $autoname: 'How_are_you_today_select_one',
          select_from_list_name: 'ol0qe57',
        },
        {
          type: 'end_group',
          $kuid: '/xs0uz53',
        },
        {
          name: 'fullName',
          type: 'text',
          $kuid: 'lk78g76',
          label: ['What is your name (text)?', 'Hoe heet je?'],
          $xpath: 'group_ad8jk55/fullName',
          required: true,
          $autoname: 'fullName',
          constraint_message: 'You have to give your name!',
        },
        {
          type: 'integer',
          $kuid: 'cg7oe89',
          label: ['What is 2+2 (number)?', 'Wat is 2+2?'],
          $xpath: 'group_ad8jk55/group_gz24g15/What_is_2_2_number',
          required: true,
          $autoname: 'What_is_2_2_number',
        },
        {
          name: 'nationalId',
          type: 'text',
          $kuid: 'tb8qh86',
          label: ['National ID number', null],
          $xpath: 'nationalId',
          required: false,
          $autoname: 'nationalId',
        },
        {
          name: 'phoneNumber',
          type: 'text',
          $kuid: 'tb8qh83',
          label: ['Phone number', null],
          $xpath: 'phoneNumber',
          required: false,
          $autoname: 'phoneNumber',
        },
      ],
      choices: [
        {
          name: 'great',
          $kuid: 'Op4dDqyni',
          label: ['Great', 'Geweldig'],
          list_name: 'ol0qe57',
          $autovalue: 'great',
        },
        {
          name: 'ok',
          $kuid: 'zExJMwth7',
          label: ['Ok', 'Ok'],
          list_name: 'ol0qe57',
          $autovalue: 'ok',
        },
        {
          name: 'terrible',
          $kuid: 'wIQ2VnH15',
          label: ['Terrible', 'Gruwelijk'],
          list_name: 'ol0qe57',
          $autovalue: 'terrible',
        },
        {
          name: 'tower',
          $kuid: 'VTu19WnKE',
          label: ['Tower', 'Toren'],
          list_name: 'xg8ep41',
          $autovalue: 'tower',
        },
        {
          name: 'car',
          $kuid: 'R5cxjTPsS',
          label: ['Car', 'Auto'],
          list_name: 'xg8ep41',
          $autovalue: 'car',
        },
      ],
    },
  },
};

const getHappyFlowWithChanges = (): KoboAssetDeployment => {
  const withChanges = structuredClone(happyFlowFromDefinition);

  withChanges.version_id = KoboMockAssetUids.happyFlowWithChanges;
  withChanges.asset.version_id = KoboMockAssetUids.happyFlowWithChanges;

  withChanges.asset.summary.languages.push('French (fr)');

  withChanges.asset.content.survey.push({
    name: 'newAttribute',
    type: 'text',
    $kuid: 'newKuid123',
    label: [
      'This is a new attribute',
      'Dit is een nieuw attribuut',
      'Ceci est un nouvel attribut',
    ],
    $xpath: 'newAttribute',
    required: false,
    $autoname: 'newAttribute',
  });

  // update an existing attribute label
  const fullNameAttribute = withChanges.asset.content.survey.find(
    (item) => item.name === 'fullName',
  );

  fullNameAttribute.label = ['new label', 'new label', 'new label'];

  // remove an attribute from the survey that existed before
  withChanges.asset.content.survey = withChanges.asset.content.survey.filter(
    (item) => item.name !== 'How_are_you_today_select_one',
  );

  return withChanges;
};

@Injectable()
export class KoboMockService {
  public getAssetDeployment(uid_asset: string): KoboAssetDeployment {
    switch (uid_asset) {
      case KoboMockAssetUids.notFound:
        throw new HttpException(
          {
            detail: 'Not found.', // Kobo API style error message
          },
          HttpStatus.NOT_FOUND,
        );
      case KoboMockAssetUids.bodyThatTriggersErrors:
        return bodyThatTriggersErrors;
      case KoboMockAssetUids.happyFlowWithChanges:
        return getHappyFlowWithChanges();
      default: {
        return happyFlowFromDefinition;
      }
    }
  }

  public getExistingWebhooks(uid_asset: string): {
    results: {
      name: string;
      url: string;
      subset_fields: string[];
    }[];
  } {
    switch (uid_asset) {
      case KoboMockAssetUids.notFound:
        throw new HttpException(
          {
            detail: 'Not found.', // Kobo API style error message
          },
          HttpStatus.NOT_FOUND,
        );
      case KoboMockAssetUids.withExistingWebhook:
        return {
          results: [
            {
              name: 'External System Webhook',
              url: 'https://external-system.example.com/webhook',
              subset_fields: ['fullName', 'phoneNumber', 'nationalId'],
            },
          ],
        };
      default:
        return {
          results: [],
        };
    }
  }
}
