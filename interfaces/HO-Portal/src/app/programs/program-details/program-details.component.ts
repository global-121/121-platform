import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-program-details',
  templateUrl: './program-details.component.html',
  styleUrls: ['./program-details.component.scss'],
})
export class ProgramDetailsComponent implements OnInit {
  public program: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private programsService: ProgramsServiceApiService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.programsService.getProgramById(id).subscribe((response) => {
      this.program = this.generateArray(response);
      console.log(this.program);
    });
  }

  public generateArray(obj) {
    return Object.keys(obj).map((key) => ({ key, value: obj[key] }));
  }

}
