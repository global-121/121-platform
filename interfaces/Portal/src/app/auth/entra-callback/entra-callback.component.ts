import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-entra-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entra-callback.component.html',
})
export class EntraCallbackComponent implements OnInit {
  constructor(
    private readonly authService: AuthService,
    private readonly msalService: MsalService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.msalService.handleRedirectObservable().subscribe({
      next: async () => {
        await this.authService.processAzureAuthSuccess();
      },
      error: (error) => {
        console.error('Error during Azure Entra authentication', error);
      },
    });
  }
}
