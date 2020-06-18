import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-registration-validation',
  templateUrl: './registration-validation.page.html',
  styleUrls: ['./registration-validation.page.scss'],
})
export class RegistrationValidationPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public userRole = this.authService.getUserRole();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit() {}
}
