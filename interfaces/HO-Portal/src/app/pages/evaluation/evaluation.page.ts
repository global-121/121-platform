import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Permission from 'src/app/auth/permission.enum';
import { ProgramPhase } from 'src/app/models/program.model';

@Component({
  selector: 'app-evaluation',
  templateUrl: './evaluation.page.html',
  styleUrls: ['./evaluation.page.scss'],
})
export class EvaluationPage implements OnInit {
  public Permission = Permission;

  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramPhase.evaluation;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {}
}
