import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  concat,
  EMPTY,
  Observable,
  throwError,
  TimeoutError,
} from 'rxjs';
import { catchError, map, retry, share, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SyncTask } from '../models/sync-task.model';
import { ApiPath, ApiService } from './api.service';
import { PubSubEvent, PubSubService } from './pub-sub.service';

const HTTP_TIMEOUT_IN_MS = 5000;
const REQUEST_RETRIES = 2;
const STORAGE_KEY = 'syncTasks';

@Injectable({
  providedIn: 'root',
})
export class SyncService implements OnDestroy {
  public forceOffline = false;

  private batchCountSubject = new BehaviorSubject<number>(0);

  constructor(private pubSub: PubSubService, private apiService: ApiService) {
    window.addEventListener('online', () => this.goOnline(), { passive: true });
    window.addEventListener('offline', () => this.goOffline(), {
      passive: true,
    });
  }

  ngOnDestroy() {
    window.removeEventListener('online', () => this.goOnline());
    window.removeEventListener('offline', () => this.goOffline());
  }

  public goOffline() {
    console.log('SyncService: Going off-line. Collecting tasks in queue...');
    this.pubSub.publish(PubSubEvent.didConnectionOffline);
    this.forceOffline = true;
  }

  public goOnline() {
    console.log('SyncService: Going on-line.');
    this.pubSub.publish(PubSubEvent.didConnectionOnline);
    this.forceOffline = false;

    // Don't do this immediately, let the user choose (?)
    this.processQueue();
  }

  public tryPost(
    endpoint: string,
    path: ApiPath | string,
    body: any,
    params?: HttpParams,
  ): Observable<any> {
    if (!navigator.onLine) {
      this.addOrUpdateSyncTask(`${endpoint}${path}`, body, params);
      return EMPTY;
    }

    return this.apiService.post(endpoint, path, body).pipe(
      timeout(HTTP_TIMEOUT_IN_MS),
      retry(REQUEST_RETRIES),
      catchError((err: HttpErrorResponse) => {
        console.log('SyncService: tryPost Error:', err);
        return this.handleError(err, `${endpoint}${path}`, body, params);
      }),
      share(),
    );
  }

  private handleError(
    err: HttpErrorResponse,
    url: ApiPath | string,
    body: any,
    params?: HttpParams,
  ): Observable<any> {
    if (this.offlineOrBadConnection(err)) {
      // A front-end or network error occurred.
      this.addOrUpdateSyncTask(url, body, params);
      return EMPTY;
    } else {
      console.warn('SyncService: Back-end error:', err);
      // The back-end returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      return throwError(err);
    }
  }

  private offlineOrBadConnection(err: HttpErrorResponse): boolean {
    return (
      err instanceof TimeoutError ||
      err.error instanceof ErrorEvent ||
      err.status === 0 ||
      !window.navigator.onLine
    );
  }

  private addOrUpdateSyncTask(
    url: ApiPath | string,
    body: any,
    params?: HttpParams,
  ): void {
    const syncTask = new SyncTask(
      url,
      body,
      params ? params.toString() : undefined,
    );
    const tasks = this.getExistingSyncTasks();

    tasks.push(syncTask);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    this.setBatchCountSubject(tasks);
    console.log(
      `SyncService: Task added to queue. Tasks pending: ${tasks.length}`,
    );
    this.pubSub.publish(PubSubEvent.didAddSyncTask);
  }

  private getExistingSyncTasks(): SyncTask[] {
    const serializedTasks = localStorage.getItem(STORAGE_KEY);

    return serializedTasks ? JSON.parse(serializedTasks) : [];
  }

  private processQueue(): Observable<any> {
    const requests: Observable<any>[] = [];
    const syncTasks = this.getExistingSyncTasks();

    console.log(
      `SyncService: Processing queue... ${syncTasks.length} tasks pending.`,
    );

    syncTasks.forEach((task: SyncTask) => {
      console.log(task);
      const request$ = this.apiService.post(task.url, '', task.body).pipe(
        map((response) => {
          return response;
        }),
        map((_) => task),
      );
      requests.push(request$);
    });

    const allRequests$ = concat(...requests).pipe(share());

    allRequests$.subscribe((task) => {
      const index = syncTasks.findIndex((t) => t === task);
      syncTasks.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncTasks));
      this.setBatchCountSubject(syncTasks);

      // Let the last request signal that "we're done for now"
      if (syncTasks.length === 0) {
        this.pubSub.publish(PubSubEvent.didCompleteSyncQueue);
      }
    });

    return allRequests$;
  }

  private setBatchCountSubject(tasks: SyncTask[]) {
    this.batchCountSubject.next(
      tasks ? this.getCompleteRegistrations(tasks) : 0,
    );
  }

  private getCompleteRegistrations(tasks: SyncTask[]): number {
    return tasks.filter((task) => {
      return (
        task.url === `${environment.url_121_service_api}/user/logout` &&
        task.body.completedRegistration
      );
    }).length;
  }

  public getBatchCount(): Observable<number> {
    return this.batchCountSubject.asObservable();
  }
}
