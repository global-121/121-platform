import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FooterComponent } from '~/components/footer/footer.component';
import { HeaderComponent } from '~/components/header/header.component';
import { ToastService } from '~/services/toast.service';

const variableOutsideAngular = $localize`I am a variable outside of an angular class.`;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastModule,
    DatePipe,
  ],
  providers: [
    MessageService, // Needed by the ToastModule
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  toastKey = ToastService.TOAST_KEY;

  componentVariable = $localize`I am a component variable.`;
  variableOutsideAngular = variableOutsideAngular;
  date = new Date();
}
