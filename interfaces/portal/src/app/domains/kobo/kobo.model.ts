import { KoboEntity } from '@121-service/src/programs/kobo/enitities/kobo.entity';

import { Dto } from '~/utils/dto-type';

export type KoboIntegration = Dto<Omit<KoboEntity, 'program'>>;
