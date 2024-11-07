import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';

import { Dto } from '~/utils/dto-type';

export type MessageTemplate = Dto<MessageTemplateEntity>;

export type MessageTemplateWithTranslatedLabel = {
  label: string;
} & Omit<MessageTemplate, 'label'>;
