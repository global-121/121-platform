import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { PhysicalCard } from 'src/app/models/physical-card.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { RegistrationPageTableComponent } from '../registration-page-table/registration-page-table.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RegistrationPageTableComponent,
  ],
  selector: 'app-registration-physical-card-overview',
  templateUrl: './registration-physical-card-overview.component.html',
  styleUrls: ['./registration-physical-card-overview.component.css'],
})
export class RegistrationPhysicalCardOverviewComponent implements OnInit {
  @Input()
  private programId: number;

  @Input()
  private referenceId: Person['referenceId'];

  public physicalCards: PhysicalCard[];

  constructor(private programsService: ProgramsServiceApiService) {}

  public async ngOnInit() {
    this.physicalCards = await this.programsService.getPhysicalCards(
      this.programId,
      this.referenceId,
    );
  }

  public openCardDetails(card: PhysicalCard) {
    window.alert(`Card details for ${card.tokenCode}`);
  }
}
