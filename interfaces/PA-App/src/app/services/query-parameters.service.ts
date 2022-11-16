import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QueryParametersService implements OnDestroy {
  private paramsSubscription: Subscription;
  private programIds: number[] = [];

  constructor(private activatedRoute: ActivatedRoute) {
    this.paramsSubscription = this.activatedRoute.queryParams.subscribe(
      (params: Params) => {
        if (!params.programs) {
          return;
        }
        this.programIds = params.programs
          .split(',')
          .map((id: string) => Number(id));
      },
    );
  }

  ngOnDestroy(): void {
    this.paramsSubscription.unsubscribe();
  }

  public async getProgramIds(): Promise<number[]> {
    return this.programIds;
  }
}
