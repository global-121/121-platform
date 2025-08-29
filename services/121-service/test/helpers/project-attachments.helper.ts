import { getServer } from '@121-service/test/helpers/utility.helper';

export async function uploadAttachment({
  projectId,
  filePath,
  filename,
  accessToken,
}: {
  projectId: number;
  filePath: string;
  filename: string;
  accessToken: string;
}) {
  return await getServer()
    .post(`/projects/${projectId}/attachments`)
    .set('Cookie', [accessToken])
    .attach('file', filePath)
    .field('filename', filename);
}

export async function getAttachments({
  projectId,
  accessToken,
}: {
  projectId: number;
  accessToken: string;
}) {
  return await getServer()
    .get(`/projects/${projectId}/attachments`)
    .set('Cookie', [accessToken]);
}

export function getAttachment({
  projectId,
  attachmentId,
  accessToken,
}: {
  projectId: number;
  attachmentId: number;
  accessToken: string;
}) {
  return getServer()
    .get(`/projects/${projectId}/attachments/${attachmentId}`)
    .set('Cookie', [accessToken]);
}

export async function deleteAttachment({
  projectId,
  attachmentId,
  accessToken,
}: {
  projectId: number;
  attachmentId: number;
  accessToken: string;
}) {
  return await getServer()
    .delete(`/projects/${projectId}/attachments/${attachmentId}`)
    .set('Cookie', [accessToken]);
}
