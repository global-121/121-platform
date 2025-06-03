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
  DEVELOPMENT,
  PORT,
  SWAGGER_CUSTOM_CSS,
} from '@mock-service/src/config';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace NodeJS {
    interface Global {
      queueCallbacks: Record<string, string>;
    }
  }
}

global.queueCallbacks = {};

async function bootstrap(): Promise<void> {
  console.log(`Bootstrapping ${APP_TITLE} - ${APP_VERSION}`);

  const app = await NestFactory.create(ApplicationModule);

  const expressInstance = app.getHttpAdapter().getInstance();

  expressInstance.disable('x-powered-by');
  expressInstance.set('strict routing', true); // Required to prevent Petstore-Inception-bug

  app.setGlobalPrefix('api');

  const options = new DocumentBuilder()
    .setTitle(APP_TITLE)
    .setVersion(APP_VERSION)
    .build();
  const document = SwaggerModule.createDocument(app, options);
  // To prevent Petstore-Inception-bug the trailing slash is required!
  SwaggerModule.setup('/docs/', app, document, {
    customSiteTitle: APP_TITLE,
    customfavIcon: APP_FAVICON,
    customCss: SWAGGER_CUSTOM_CSS,
    swaggerOptions: {
      // See: https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md
      deepLinking: true,
      defaultModelExpandDepth: 10,
      defaultModelsExpandDepth: 1,
      displayOperationId: DEVELOPMENT,
      displayRequestDuration: true,
      filter: false,
      operationsSorter: 'alpha',
      queryConfigEnabled: DEVELOPMENT,
      showCommonExtensions: true,
      showExtensions: true,
      tagsSorter: 'alpha',
      tryItOutEnabled: DEVELOPMENT,
    },
  });
  // Use root as easy-default entrypoint
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
  await app.listen(PORT);
}
void bootstrap();
