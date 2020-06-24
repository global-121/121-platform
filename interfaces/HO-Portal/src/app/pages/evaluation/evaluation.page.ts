import { Component, OnInit } from '@angular/core';
import { ProgramPhase } from 'src/app/models/program.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-evaluation',
  templateUrl: './evaluation.page.html',
  styleUrls: ['./evaluation.page.scss'],
})
export class EvaluationPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramPhase.evaluation;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {}
}
