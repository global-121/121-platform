import { GraphMessage } from '@121-service/src/emails/graph/interfaces/graph-message.interface';

export interface GraphSendMailRequest {
  message: GraphMessage;
  saveToSentItems: boolean;
}
