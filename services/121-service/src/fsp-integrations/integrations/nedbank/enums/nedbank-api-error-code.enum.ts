// This is non-exhaustive enum of error codes that can be returned by Nedbank API
// It is used to identify the error code and use it for business logic in our code
// Since Nedbank has no documentation of all their error codes, only the error codes that are specifically handled in our code are included
export enum NedbankApiErrorCode {
  NBApimResourceNotFound = 'NB.APIM.Resource.NotFound',
  NBApimTooManyRequestsError = 'NB.APIM.TooManyRequestsError',
}
