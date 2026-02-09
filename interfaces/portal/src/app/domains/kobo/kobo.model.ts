import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';

import { Dto } from '~/utils/dto-type';

export type KoboIntegration = Dto<Omit<KoboEntity, 'program'>>;
