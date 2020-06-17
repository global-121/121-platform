import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input()
  public title: string;

  public programId: number;

  public showManageAidworkers: boolean;

  constructor(private route: ActivatedRoute, private authService: AuthService) {
    this.programId = this.route.snapshot.params.id;

    this.showManageAidworkers = this.canManageAidWorkers();
  }

  ngOnInit() {}

  private canManageAidWorkers(): boolean {
    return this.authService.getUserRole() === UserRole.ProgramManager;
  }
}
