import { ApiPath } from '../services/api.service';

export class SyncTask {
  constructor(
    public url: ApiPath | string,
    public body: any,
    public params?: string,
  ) {}
}
