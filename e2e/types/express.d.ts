// Global augmentation for Express types to include Multer
declare global {
  namespace Express {
    namespace Multer {
      type File = {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      };
    }
  }
}

export {};
