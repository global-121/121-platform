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
      next: async (value) => {
        console.log('🚀 ~ EntraCallbackComponent ~ next: ~ value:', value);
        await this.authService.processAzureAuthSuccess(false);
      },
      error: (error) => {
        console.error('Error during Azure Entra authentication', error);
      },
    });
  }
}
