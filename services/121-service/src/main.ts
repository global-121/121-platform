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
import fs from 'fs';
import { SpelunkerModule } from 'nestjs-spelunker';
import { ApplicationModule } from './app.module';
import {
  APP_FAVICON,
  APP_TITLE,
  APP_VERSION,
  DEBUG,
  EXTERNAL_API,
  PORT,
  SWAGGER_CUSTOM_CSS,
  SWAGGER_CUSTOM_JS,
} from './config';
import { AzureLogService } from './shared/services/azure-log.service';
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
    'BullModule',
    'HealthModule',
    'HttpModule',
    'MulterModule',
    'ScheduleModule',
    'ScriptsModule',
    'TerminusModule',
    'TypeOrmCoreModule',
    'TypeOrmModule',
    'UserModule',
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

  if (DEBUG) {
    generateModuleDependencyGraph(app);
  }

  // Prepare redirects:
  const expressInstance = app.getHttpAdapter().getInstance();

  if (!!process.env.REDIRECT_PORTAL_URL_HOST) {
    expressInstance.get(`/`, (__req: Request, res: Response) => {
      res.redirect(process.env.REDIRECT_PORTAL_URL_HOST);
    });
    expressInstance.get(`/portal*`, (req: Request, res: Response) => {
      const newPath = req.url.replace(`/portal`, '');
      res.redirect(process.env.REDIRECT_PORTAL_URL_HOST + newPath);
    });
  }

  if (!!process.env.REDIRECT_REGISTER_URL_HOST) {
    expressInstance.get(`/register`, (_req: Request, res: Response) => {
      res.redirect(process.env.REDIRECT_REGISTER_URL_HOST);
    });
    expressInstance.get(`/app*`, (req: Request, res: Response) => {
      const newPath = req.url.replace(`/app`, '');
      res.redirect(process.env.REDIRECT_REGISTER_URL_HOST + newPath);
    });
  }

  if (!!process.env.REDIRECT_VERIFY_URL_HOST) {
    expressInstance.get(`/verify`, (_req: Request, res: Response) => {
      res.redirect(process.env.REDIRECT_VERIFY_URL_HOST);
    });
    expressInstance.get(`/AW-app*`, (req: Request, res: Response) => {
      const newPath = req.url.replace(`/AW-app`, '');
      res.redirect(process.env.REDIRECT_VERIFY_URL_HOST + newPath);
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
    customJs: `data:text/javascript;base64,${Buffer.from(
      SWAGGER_CUSTOM_JS,
    ).toString('base64url')}`,
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      defaultModelExpandDepth: 10,
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

  // Set up generic error handling:
  process.on('unhandledRejection', (reason: string, promise: Promise<any>) => {
    console.warn('Unhandled Rejection:', reason, promise);
    throw reason;
  });

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

if (!!process.env.APPLICATION_INSIGHT_IKEY) {
  appInsights.setup(process.env.APPLICATION_INSIGHT_IKEY);
  appInsights.start();
}
