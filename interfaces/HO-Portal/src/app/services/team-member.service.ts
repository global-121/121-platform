import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeamMemberService {
  private teamMemberAddedSource = new Subject<void>();

  public teamMemberAdded$ = this.teamMemberAddedSource.asObservable();

  public notifyTeamMemberAdded(): void {
    this.teamMemberAddedSource.next();
  }
}
