import {
  APP_TITLE,
  APP_VERSION,
  APP_FAVICON,
  SWAGGER_CUSTOM_CSS,
  PORT,
  SCHEME,
  BASE_PATH,
} from './config';
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
const appInsights = require('applicationinsights');


async function bootstrap(): Promise<void> {
  const appOptions = { cors: true };
  const app = await NestFactory.create(ApplicationModule, appOptions);
  app.setGlobalPrefix('api');

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
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT || PORT);
}
bootstrap();

if (!!process.env.APPLICATION_INSIGHT_IKEY) {
  appInsights.setup(process.env.APPLICATION_INSIGHT_IKEY);
  appInsights.start();
}
