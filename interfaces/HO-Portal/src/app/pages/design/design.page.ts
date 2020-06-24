import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramPhase } from 'src/app/models/program.model';

@Component({
  selector: 'app-design',
  templateUrl: './design.page.html',
  styleUrls: ['./design.page.scss'],
})
export class DesignPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public thisPhase = ProgramPhase.design;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {}
}
