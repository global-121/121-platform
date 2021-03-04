import { of } from 'rxjs';
import { InstanceInformation, MonitoringInfo } from '../models/instance.model';

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
  name: 'system',
  displayName: 'test',
  logoUrl: 'test.svg',
  aboutProgram: 'test',
  dataPolicy: 'test',
  contactDetails: 'test',
  monitoringQuestion: mockMonitoringInfo,
};

export const MockInstanceService = {
  instanceInformation: of(mockInstanceInformation),
};
