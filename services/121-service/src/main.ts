import {
  BadRequestException,
  HttpException,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import fs, { writeFileSync } from 'fs';
import { SpelunkerModule } from 'nestjs-spelunker';

import { ApplicationModule } from '@121-service/src/app.module';
import {
  APP_FAVICON,
  APP_TITLE,
  APP_VERSION,
  DEBUG,
  EXTERNAL_API,
  PORT,
  SWAGGER_CUSTOM_CSS,
  SWAGGER_CUSTOM_JS,
} from '@121-service/src/config';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

import 'multer'; // This is import is required to prevent typing error on the MulterModule
// eslint-disable-next-line @typescript-eslint/no-require-imports
import appInsights = require('applicationinsights');

/**
 * A visualization of module dependencies is generated using `nestjs-spelunker`
 * The file can be vied with [Mermaid](https://mermaid.live) or the VSCode extention "bierner.markdown-mermaid"
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
    mermaidEdges.join('\n') +
    '\n```\n';

  fs.writeFile('module-dependencies.md', mermaidGraph, 'utf8', (err) => {
    if (err) console.warn(`Writing API-graph failed!`, err);
  });
}

function generateSwaggerSummaryJson(app: INestApplication<any>): void {
  const options = new DocumentBuilder()
    .setTitle(APP_TITLE)
    .setVersion(APP_VERSION)
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, options);

  const minimalDocument: {
    method: string;
    path: string;
    returnType: string;
  }[] = [];

  for (const path in openApiDocument.paths) {
    for (const method in openApiDocument.paths[path]) {
      const methodInfo = openApiDocument.paths[path][method];
      const returnType =
        methodInfo.responses['200']?.content?.['application/json']?.schema?.$ref
          ?.split('/')
          .pop() || 'Not set/ undefined';
      const methodInfoObject = {
        method,
        path,
        returnType,
      };
      minimalDocument.push(methodInfoObject);
    }
  }

  const document = JSON.stringify(minimalDocument, null, 2);
  writeFileSync('swagger.json', document);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApplicationModule);

  if (!process.env.REDIS_PREFIX) {
    throw new Error('REDIS_PREFIX not set');
  }

  const notAllowedRegex = /[\0\n\r :]/;
  if (notAllowedRegex.test(process.env.REDIS_PREFIX)) {
    throw new Error('REDIS_PREFIX contains one or more not allowed characters');
  }

  app.enableCors({
    origin: DEBUG,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  console.log('🚀 ~ bootstrap ~ DEBUG:', DEBUG);

  // Prepare redirects:
  const expressInstance = app.getHttpAdapter().getInstance();

  if (!!process.env.REDIRECT_PORTAL_URL_HOST) {
    expressInstance.get(`/`, (__req: Request, res: Response) => {
      res.redirect(process.env.REDIRECT_PORTAL_URL_HOST!);
    });
    expressInstance.get(`/portal*`, (req: Request, res: Response) => {
      const newPath = req.url.replace(`/portal`, '');
      res.redirect(process.env.REDIRECT_PORTAL_URL_HOST + newPath);
    });
  }

  expressInstance.disable('x-powered-by');

  app.setGlobalPrefix('api');

  const options = new DocumentBuilder()
    .setTitle(APP_TITLE)
    .setVersion(APP_VERSION)
    .addServer(EXTERNAL_API.root)
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/docs', app, document, {
    customSiteTitle: APP_TITLE,
    customfavIcon: APP_FAVICON,
    customCss: SWAGGER_CUSTOM_CSS,
    customJsStr: SWAGGER_CUSTOM_JS,
    swaggerOptions: {
      // See: https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md
      deepLinking: true,
      defaultModelExpandDepth: 10,
      defaultModelsExpandDepth: 1,
      displayOperationId: true,
      displayRequestDuration: true,
      filter: true,
      operationsSorter: 'alpha',
      persistAuthorization: DEBUG,
      queryConfigEnabled: DEBUG,
      showCommonExtensions: true,
      showExtensions: true,
      tagsSorter: 'alpha',
      tryItOutEnabled: DEBUG,
    },
  });

  app.useGlobalPipes(
    // TODO: REFACTOR: Add "whitelist: true" and "forbidNonWhitelisted: true" to the ValidationPipe, to that only properties in the DTOs are allowed.
    // Now it is possible to send any property in the request body, which is not defined in the DTO. To figure out: how to deal with "dynamic attributes" we use in some places.
    new ValidationPipe({
      forbidUnknownValues: true,
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
  app.use(bodyParser.json({ limit: '25mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '25mb',
      extended: true,
    }),
  );
  app.use(cookieParser());

  const server = await app.listen(PORT);
  server.setTimeout(10 * 60 * 1000);

  if (DEBUG) {
    generateModuleDependencyGraph(app);
    generateSwaggerSummaryJson(app);
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

    // Trigger a reboot, as the app is in an unknown state.
    process.exit(1);
  });
}

void bootstrap();

if (!!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
  appInsights.start();
}
