import { Component } from '@angular/core';
import { NoConnectionService } from 'src/app/services/no-connection.service';

@Component({
  selector: 'connection-indicator',
  templateUrl: './connection-indicator.component.html',
  styleUrls: ['./connection-indicator.component.scss'],
})
export class ConnectionIndicatorComponent {
  public noConnection = this.noConnectionService.noConnection$;

  constructor(private noConnectionService: NoConnectionService) {}
}
