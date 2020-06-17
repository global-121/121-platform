import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-aid-workers',
  templateUrl: './aid-workers.page.html',
  styleUrls: ['./aid-workers.page.scss'],
})
export class AidWorkersPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public userRole = this.authService.getUserRole();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit() {}
}
