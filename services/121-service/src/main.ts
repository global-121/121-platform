import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import { SpelunkerModule } from 'nestjs-spelunker';
import fs, { writeFileSync } from 'node:fs';

import { ApplicationModule } from '@121-service/src/app.module';
import {
  APP_FAVICON,
  APP_TITLE,
  APP_VERSION,
  IS_DEVELOPMENT,
  SWAGGER_CUSTOM_CSS,
  SWAGGER_CUSTOM_JS,
} from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { INTERFACE_NAME_HEADER } from '@121-service/src/shared/enum/interface-names.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { ValidationPipeOptions } from '@121-service/src/validation-pipe-options.const';

import 'multer'; // This is import is required to prevent typing error on the MulterModule
// eslint-disable-next-line @typescript-eslint/no-require-imports -- This version of AppInsighst still only works with require
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

interface MethodInfo {
  method: string;
  path: string;
  params: string[];
  returnType?: string;
}

function generateSwaggerSummaryJson(app: INestApplication<any>): void {
  const options = new DocumentBuilder()
    .setTitle(APP_TITLE)
    .setVersion(APP_VERSION)
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, options);

  const summaryDocument: MethodInfo[] = [];

  for (const path in openApiDocument.paths) {
    for (const method in openApiDocument.paths[path]) {
      const methodInfo = openApiDocument.paths[path][method];
      const returnType =
        methodInfo.responses['200']?.content?.['application/json']?.schema?.$ref
          ?.split('/')
          .pop() ||
        methodInfo.responses['201']?.content?.['application/json']?.schema?.$ref
          ?.split('/')
          .pop();

      const params =
        methodInfo.parameters?.map((param: any) => param.name) || [];

      const methodInfoObject: MethodInfo = {
        method,
        path,
        params,
      };

      if (returnType) {
        methodInfoObject.returnType = returnType;
      }

      summaryDocument.push(methodInfoObject);
    }
  }

  const document = JSON.stringify(summaryDocument, null, 2);
  writeFileSync('swagger.json', document);
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

  const options = new DocumentBuilder()
    .setTitle(APP_TITLE)
    .setVersion(APP_VERSION)
    .addServer(env.EXTERNAL_121_SERVICE_URL)
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
    customJsStr: SWAGGER_CUSTOM_JS,
    swaggerOptions: {
      // See: https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md
      deepLinking: true,
      defaultModelExpandDepth: 10,
      defaultModelsExpandDepth: 1,
      displayOperationId: IS_DEVELOPMENT,
      displayRequestDuration: true,
      filter: false,
      operationsSorter: 'alpha',
      persistAuthorization: IS_DEVELOPMENT,
      queryConfigEnabled: IS_DEVELOPMENT,
      showCommonExtensions: true,
      showExtensions: true,
      tagsSorter: 'alpha',
      tryItOutEnabled: IS_DEVELOPMENT,
    },
  });

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

    // eslint-disable-next-line n/no-process-exit -- Trigger a reboot, as the app is in an unknown state.
    process.exit(1);
  });
}

void bootstrap();

if (!!env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(env.APPLICATIONINSIGHTS_CONNECTION_STRING);
  appInsights.start();

  const client = appInsights.defaultClient;

  // Telemetry processor to correlate requests with their origin interface
  client.addTelemetryProcessor((envelope, contextObjects) => {
    const telemetryType = envelope.data?.baseType;
    const baseData = envelope.data?.baseData;

    // Only touch request telemetry
    if (telemetryType === 'RequestData' && baseData) {
      const httpRequest = contextObjects?.http?.request;

      if (httpRequest?.headers) {
        const interfaceName = httpRequest.headers[INTERFACE_NAME_HEADER];

        if (interfaceName) {
          baseData.properties = baseData.properties || {};
          baseData.properties.interface = interfaceName;
        }
      }
    }

    // IMPORTANT: Return `true` in all cases to keep the telemetry
    return true;
  });
}
