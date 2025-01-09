import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseHelper } from './helpers/database.helper';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Clean database before each test
    await DatabaseHelper.getInstance().cleanDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    // Clean up after each test
    await app.close();
  });

  afterAll(async () => {
    // Disconnect after all tests
    await DatabaseHelper.cleanup();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
