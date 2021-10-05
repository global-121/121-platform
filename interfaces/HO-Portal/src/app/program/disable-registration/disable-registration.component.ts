import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-disable-registration',
  templateUrl: './disable-registration.component.html',
  styleUrls: ['./disable-registration.component.scss'],
})
export class DisableRegistrationComponent implements OnInit {
  @Input()
  public program: any;
  constructor() {}

  ngOnInit() {}

  public async updateRegistrationStatus() {}
}
