import { getServer } from '@121-service/test/helpers/utility.helper';

export async function uploadAttachment({
  programId,
  filePath,
  filename,
  accessToken,
}: {
  programId: number;
  filePath: string;
  filename: string;
  accessToken: string;
}) {
  return await getServer()
    .post(`/programs/${programId}/attachments`)
    .set('Cookie', [accessToken])
    .attach('file', filePath)
    .field('filename', filename);
}

export async function getAttachments({
  programId,
  accessToken,
}: {
  programId: number;
  accessToken: string;
}) {
  return await getServer()
    .get(`/programs/${programId}/attachments`)
    .set('Cookie', [accessToken]);
}

export function getAttachment({
  programId,
  attachmentId,
  accessToken,
}: {
  programId: number;
  attachmentId: number;
  accessToken: string;
}) {
  return getServer()
    .get(`/programs/${programId}/attachments/${attachmentId}`)
    .set('Cookie', [accessToken]);
}

export async function deleteAttachment({
  programId,
  attachmentId,
  accessToken,
}: {
  programId: number;
  attachmentId: number;
  accessToken: string;
}) {
  return await getServer()
    .delete(`/programs/${programId}/attachments/${attachmentId}`)
    .set('Cookie', [accessToken]);
}
