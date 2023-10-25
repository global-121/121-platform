import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-warning-label',
  templateUrl: './warning-label.component.html',
  styleUrls: ['./warning-label.component.scss'],
  imports: [CommonModule, IonicModule],
  standalone: true,
})
export class WarningLabelComponent {
  @Input() public warningText: string;
}
