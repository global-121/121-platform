import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-entra-callback',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './entra-callback.component.html',
})
export class EntraCallbackComponent implements OnInit, OnDestroy {
  private msalSubscription: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly msalService: MsalService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.msalSubscription = this.msalService
      .handleRedirectObservable()
      .subscribe({
        next: async () => {
          await this.authService.processAzureAuthSuccess();
        },
        error: (error) => {
          console.error('Error during Azure Entra authentication', error);
        },
      });
  }

  ngOnDestroy(): void {
    if (this.msalSubscription) {
      this.msalSubscription.unsubscribe();
    }
  }
}
