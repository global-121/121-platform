import { of } from 'rxjs';
import { InstanceInformation, MonitoringInfo } from '../models/instance.model';
import { Actor } from '../shared/actor.enum';

const mockMonitoringInfo: MonitoringInfo = {
  intro: 'test',
  options: [
    {
      option: 'test',
      label: 'test',
    },
  ],
  conclusion: 'test',
};

const mockInstanceInformation: InstanceInformation = {
  name: Actor.system,
  displayName: 'test',
  aboutProgram: 'test',
  dataPolicy: 'test',
  contactDetails: 'test',
  monitoringQuestion: mockMonitoringInfo,
};

export const MockInstanceService = {
  instanceInformation: of(mockInstanceInformation),
};
