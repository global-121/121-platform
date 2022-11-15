import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class QueryParamService {
  constructor(private activatedRoute: ActivatedRoute) {}

  async getProgramIdsByQueryParam(): Promise<string[]> {
    let programIds = [];
    const paramsSubscription = this.activatedRoute.queryParams.subscribe(
      (params) => {
        if (!params.programs) {
          return;
        }
        programIds = params.programs.split(',');
      },
    );
    paramsSubscription.unsubscribe();
    return programIds;
  }
}
