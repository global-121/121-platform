import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspsService } from '@121-service/src/fsp-management/fsp.service';

const mockFspModes: Record<string, string> = {};

jest.mock(
  '@121-service/src/fsp-integrations/settings/fsp-env-variable-settings.const',
  () => ({
    get FSP_MODES() {
      return mockFspModes;
    },
  }),
);

describe('Listing enabled FSPs', () => {
  let service: FspsService;

  beforeEach(() => {
    for (const key of Object.keys(mockFspModes)) {
      delete mockFspModes[key];
    }
    service = new FspsService();
  });

  it('should return all FSPs when none are disabled', async () => {
    const result = await service.getEnabledFsps();

    expect(result).toHaveLength(Object.values(FSP_SETTINGS).length);
  });

  it('should exclude FSPs that are disabled on this instance', async () => {
    mockFspModes[Fsps.intersolveVisa] = FspMode.disabled;

    const result = await service.getEnabledFsps();

    expect(result.some((fsp) => fsp.name === Fsps.intersolveVisa)).toBe(
      false,
    );
    expect(result).toHaveLength(Object.values(FSP_SETTINGS).length - 1);
  });
});
