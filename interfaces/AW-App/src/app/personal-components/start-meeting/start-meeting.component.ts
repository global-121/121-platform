import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-start-meeting',
  templateUrl: './start-meeting.component.html',
  styleUrls: ['./start-meeting.component.scss'],
})
export class StartMeetingComponent implements OnInit {

  public data: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParams.subscribe(params => {
      if (params && params.did) {
        this.data = JSON.parse(params.did);
      }
    });
  }

  ngOnInit() {
  }

}
