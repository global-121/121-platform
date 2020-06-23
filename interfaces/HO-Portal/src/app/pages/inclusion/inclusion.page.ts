import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-inclusion',
  templateUrl: './inclusion.page.html',
  styleUrls: ['./inclusion.page.scss'],
})
export class InclusionPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public userRole = this.authService.getUserRole();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit() {}
}
