import {
  Body,
  Controller,
  INestApplication,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IsString } from 'class-validator';
import * as request from 'supertest';

import { AnyValidBody } from '@121-service/src/registration/validators/any-valid-body.validator';
import { ValidationPipeOptions } from '@121-service/src/validation-pipe-options.const';

class TestDto {
  @IsString()
  known: string;
}

@Controller('test')
class TestController {
  @Post('any-valid-body')
  testAnyValidBody(@AnyValidBody() body: TestDto) {
    return body;
  }

  @Post('normal-body')
  testBody(@Body() body: TestDto) {
    return body;
  }
}

function getTestServer(app: INestApplication): request.SuperAgentTest {
  return request.agent(app.getHttpServer());
}

describe('Whitelist dto properties', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(ValidationPipeOptions));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Any Body Decorator should accept unknown properties in the body', async () => {
    const payload = { known: 'value', unknown: 'extra' };
    const response = await getTestServer(app)
      .post('/test/any-valid-body')
      .send(payload)
      .expect(201);

    expect(response.body).toEqual(payload);
  });

  // A test to ensure that the normal body decorator correctly uses the 'whitelist' setting
  // This test also validates that the AnyValidBody test works properly
  it('Body decorator should strip unknown properties from the body', async () => {
    const payload = { known: 'value', unknown: 'extra' };
    const response = await getTestServer(app)
      .post('/test/normal-body')
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({ known: 'value' });
  });
});
