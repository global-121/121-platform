import { Observable, Subject } from 'rxjs';

export class SwUpdateMock {
  public available: Observable<any> = new Subject();
  public activated: Observable<any> = new Subject();
  public isEnabled: boolean = false;

  public checkForUpdate(): Promise<void> {
    return new Promise((resolve) => resolve());
  }
  public activateUpdate(): Promise<void> {
    return new Promise((resolve) => resolve());
  }
}
