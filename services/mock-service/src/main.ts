import {
  BadRequestException,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { Response } from 'express';

import { ApplicationModule } from '@mock-service/src/app.module';
import {
  APP_FAVICON,
  APP_TITLE,
  APP_VERSION,
  IS_DEVELOPMENT,
  SWAGGER_CUSTOM_CSS,
} from '@mock-service/src/config';
import { env } from '@mock-service/src/env';

declare global {
  // To define the global queue-collection without namespace, we need to define it using `var`.
  // See: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-typescript-eslintno-namespace-andor-no-var-rules-about-declaring-global-variables
  var queueCallbacks: Record<string, string>;
}

global.queueCallbacks = {};

async function bootstrap(): Promise<void> {
  console.log(`Bootstrapping ${APP_TITLE} - ${APP_VERSION}`);

  const app = await NestFactory.create(ApplicationModule);

  const expressInstance = app.getHttpAdapter().getInstance();

  expressInstance.disable('x-powered-by');
  expressInstance.set('strict routing', true);

  app.setGlobalPrefix('api');

  const options = new DocumentBuilder()
    .setTitle(APP_TITLE)
    .setVersion(APP_VERSION)
    .build();
  const document = SwaggerModule.createDocument(app, options);
  // Add redirect for convenience and to keep 'legacy'-URL `/docs` working
  expressInstance.use(/^\/docs$/, (_req: unknown, res: Response) =>
    res.redirect('/docs/'),
  );
  SwaggerModule.setup('/docs/', app, document, {
    customSiteTitle: APP_TITLE,
    customfavIcon: APP_FAVICON,
    customCss: SWAGGER_CUSTOM_CSS,
    swaggerOptions: {
      // See: https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md
      deepLinking: true,
      defaultModelExpandDepth: 10,
      defaultModelsExpandDepth: 1,
      displayOperationId: IS_DEVELOPMENT,
      displayRequestDuration: true,
      filter: false,
      operationsSorter: 'alpha',
      queryConfigEnabled: IS_DEVELOPMENT,
      showCommonExtensions: true,
      showExtensions: true,
      tagsSorter: 'alpha',
      tryItOutEnabled: IS_DEVELOPMENT,
    },
  });
  // Use root as easy-default entry-point
  expressInstance.use(/^\/$/, (_req: unknown, res: Response) =>
    res.redirect('/docs/'),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: false,
      exceptionFactory: (errors) => {
        for (const e of errors) {
          if (e.constraints && e.constraints['unknownValue']) {
            console.log('e: ', e);
            throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
          }
        }
        throw new BadRequestException(errors);
      },
    }),
  );

  app.use(bodyParser.text({ type: 'text/xml' })); // Add middleware to handle raw XML body
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );
  await app.listen(env.PORT_MOCK_SERVICE);
}
void bootstrap();
