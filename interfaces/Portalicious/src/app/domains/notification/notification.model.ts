import { MessageTemplateController } from '@121-service/src/notifications/message-template/message-template.controller';

import { Dto121Service } from '~/utils/dto-type';
import { ArrayElement } from '~/utils/type-helpers';

export type MessageTemplate = ArrayElement<
  Dto121Service<MessageTemplateController['getMessageTemplatesByProgramId']>
>;

export type MessageTemplateWithTranslatedLabel = {
  label: string;
} & Omit<MessageTemplate, 'label'>;
