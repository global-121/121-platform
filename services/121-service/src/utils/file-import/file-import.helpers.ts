/**
 * To create a mock-uploaded CSV file for testing purposes.
 */
export const createCsvFile = (csvContents: string, filename = 'test.csv') => {
  const buffer = Buffer.from(csvContents);
  return {
    buffer,
    originalname: filename,
  } as Express.Multer.File;
};
