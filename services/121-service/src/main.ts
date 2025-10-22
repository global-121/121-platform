import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import fs from 'fs';
import { SpelunkerModule } from 'nestjs-spelunker';

import { ApplicationModule } from '@121-service/src/app.module';
import {
  APP_TITLE,
  APP_VERSION,
  IS_DEVELOPMENT,
} from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { ValidationPipeOptions } from '@121-service/src/validation-pipe-options.const';

import 'multer'; // This is import is required to prevent typing error on the MulterModule
// eslint-disable-next-line @typescript-eslint/no-require-imports
import appInsights = require('applicationinsights');

/**
 * A visualization of module dependencies is generated using `nestjs-spelunker`
 * The file can be vied with [Mermaid](https://mermaid.live) or the VSCode extension "bierner.markdown-mermaid"
 * See: https://github.com/jmcdo29/nestjs-spelunker
 */
function generateModuleDependencyGraph(app: INestApplication): void {
  const tree = SpelunkerModule.explore(app);
  const root = SpelunkerModule.graph(tree);
  const edges = SpelunkerModule.findGraphEdges(root);
  const genericModules = [
    // Sorted alphabetically
    'ActionModule',
    'ApplicationModule',
    'AuthModule',
    'BullModule',
    'HealthModule',
    'HttpModule',
    'MulterModule',
    'PassportModule',
    'ScheduleModule',
    'ScriptsModule',
    'TerminusModule',
    'TypeOrmCoreModule',
    'TypeOrmModule',
    'ThrottlerModule',
  ];
  const mermaidEdges = edges
    .filter(
      ({ from, to }) =>
        !genericModules.includes(from.module.name) &&
        !genericModules.includes(to.module.name),
    )
    .map(({ from, to }) => `  ${from.module.name}-->${to.module.name}`);
  const mermaidGraph =
    '# Module Dependencies Graph\n\n```mermaid\ngraph LR\n' +
    mermaidEdges.sort().join('\n') +
    '\n```\n';

  fs.writeFile('module-dependencies.md', mermaidGraph, 'utf8', (err) => {
    if (err) console.warn(`Writing API-graph failed!`, err);
  });
}

async function bootstrap(): Promise<void> {
  console.warn(`Bootstrapping ${APP_TITLE} - ${APP_VERSION}`);

  const app = await NestFactory.create(ApplicationModule);

  // CORS is only enabled for local development; Because the Azure App Service applies its own CORS settings 'on the outside'
  app.enableCors({
    origin: IS_DEVELOPMENT,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Prepare redirects:
  const expressInstance = app.getHttpAdapter().getInstance();

  if (!!env.REDIRECT_PORTAL_URL_HOST) {
    expressInstance.get(`/`, (__req: Request, res: Response) => {
      res.redirect(env.REDIRECT_PORTAL_URL_HOST);
    });
    expressInstance.get(`/portal{*any}`, (req: Request, res: Response) => {
      const newPath = req.url.replace(`/portal`, '');
      res.redirect(env.REDIRECT_PORTAL_URL_HOST + newPath);
    });
  }

  expressInstance.disable('x-powered-by');

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('121')
    .setDescription('The 121 API description')
    .setVersion('1.0')
    .addTag('121')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/docs',
    apiReference({
      content: document,
    }),
  );

  app.useGlobalPipes(new ValidationPipe(ValidationPipeOptions));
  app.use(bodyParser.json({ limit: '25mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '25mb',
      extended: true,
    }),
  );
  app.use(cookieParser());

  const server = await app.listen(env.PORT_121_SERVICE);
  server.setTimeout(10 * 60 * 1000);

  if (IS_DEVELOPMENT) {
    generateModuleDependencyGraph(app);
  }

  // Set up generic error handling:
  process.on(
    'unhandledRejection',
    (reason: string, promise: Promise<unknown>) => {
      console.warn('Unhandled Rejection:', reason, promise);
      throw reason;
    },
  );

  process.on('uncaughtException', (error: Error) => {
    console.warn('Uncaught Exception:', error);

    const logService = new AzureLogService();
    if (logService) {
      logService.logError(error, true);
      logService.logError(new Error('Uncaught Exception: restarting'), true);
    }

    // eslint-disable-next-line n/no-process-exit -- Trigger a reboot, as the app is in an unknown state.
    process.exit(1);
  });
}

void bootstrap();

if (!!env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(env.APPLICATIONINSIGHTS_CONNECTION_STRING);
  appInsights.start();
}
