import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import {
  APP_TITLE,
  APP_VERSION,
  APP_FAVICON,
  SWAGGER_CUSTOM_CSS,
  BASE_PATH,
  PORT,
  SCHEME,
} from './config';
import * as bodyParser from 'body-parser';
import appInsights = require('applicationinsights');
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApplicationModule);
  app.setGlobalPrefix('api');

  app
    .getHttpAdapter()
    .getInstance()
    .disable('x-powered-by');

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const options = new DocumentBuilder()
    .setTitle(APP_TITLE)
    .setVersion(APP_VERSION)
    .setBasePath(BASE_PATH)
    .setSchemes(SCHEME)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/docs', app, document, {
    customSiteTitle: APP_TITLE,
    customfavIcon: APP_FAVICON,
    customCss: SWAGGER_CUSTOM_CSS,
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '5mb',
      extended: true,
    }),
  );
  app.use(cookieParser());
  const server = await app.listen(PORT);
  server.setTimeout(10 * 60 * 1000);
}
bootstrap();

if (!!process.env.APPLICATION_INSIGHT_IKEY) {
  appInsights.setup(process.env.APPLICATION_INSIGHT_IKEY);
  appInsights.start();
}
