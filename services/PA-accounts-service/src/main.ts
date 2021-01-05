import { PORT, BASE_PATH, SCHEME } from './config';
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
    .setTitle('PA-Accounts-Service')
    .setVersion(process.env.GLOBAL_121_VERSION)
    .setBasePath(BASE_PATH)
    .setSchemes(SCHEME)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/docs', app, document);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT || PORT);
}
bootstrap();

if (!!process.env.APPLICATION_INSIGHT_IKEY) {
  appInsights.setup(process.env.APPLICATION_INSIGHT_IKEY);
  appInsights.start();
}
