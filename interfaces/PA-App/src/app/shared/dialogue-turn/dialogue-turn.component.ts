import { Component, Input, OnInit } from '@angular/core';
import { InstanceInformation } from 'src/app/models/instance.model';
import { InstanceService } from 'src/app/services/instance.service';
import { Actor } from 'src/app/shared/actor.enum';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'dialogue-turn',
  templateUrl: './dialogue-turn.component.html',
  styleUrls: ['./dialogue-turn.component.scss'],
})
export class DialogueTurnComponent implements OnInit {
  @Input()
  isSpoken = false;

  @Input()
  actor = Actor.system;

  @Input()
  moment: Date;

  @Input()
  isConnected = false;

  isSelf: boolean;
  isSystem: boolean;

  public allActors = Actor;
  public instanceInformation: InstanceInformation;

  animate = environment.useAnimation;

  constructor(private instanceService: InstanceService) {}

  ngOnInit() {
    this.moment = new Date();
    this.getInstanceInformation();
  }

  private async getInstanceInformation() {
    this.instanceInformation = await this.instanceService.getInstanceInformation();
    this.updateActor(this.instanceInformation.name);
  }

  updateActor(newActor: Actor) {
    if (this.actor === Actor.system) {
      this.actor = newActor;
    }
    this.isSelf = this.actor === Actor.self;
    this.isSystem = this.actor === Actor.system;
  }

  show() {
    this.isSpoken = true;
  }
}
