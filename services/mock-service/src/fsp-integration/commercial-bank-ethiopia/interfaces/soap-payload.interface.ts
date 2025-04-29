export interface SoapPayload<T> {
  'soapenv:Envelope': {
    'soapenv:Body': T;
  };
}
