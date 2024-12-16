export interface NedbankErrorResponse {
  Message: string;
  Code: string;
  Id: string;
  Errors: {
    ErrorCode: string;
    Message: string;
    Path?: string;
    Url?: string;
  }[];
}
