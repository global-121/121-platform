import { GRAPH_ATTACHMENT_DATA_TYPE } from '@121-service/src/emails/graph/const/graph-attachment-data-type.const';

export interface GraphFileAttachment {
  '@odata.type': typeof GRAPH_ATTACHMENT_DATA_TYPE;
  name: string;
  contentBytes: string;
}
