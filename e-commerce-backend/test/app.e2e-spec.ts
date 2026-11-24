import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(20);
        expect(body[0].priceCents).toEqual(expect.any(Number));
        expect(body[0].stockQuantity).toBe(20);
      });
  });

  it('protects order endpoints with authentication', async () => {
    await request(app.getHttpServer())
      .get('/orders')
      .expect(401);
    await request(app.getHttpServer())
      .post('/orders')
      .send({ items: [], expectedTotalCents: 0 })
      .expect(401);
    await request(app.getHttpServer())
      .get('/orders/order-id')
      .expect(401);

    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `orders-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        password: 'correct-horse-battery-staple',
      })
      .expect(201);
    const authorization = `Bearer ${registration.body.accessToken}`;

    await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
      });
    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', authorization)
      .send({ items: [], expectedTotalCents: 0 })
      .expect(400);
  });

  it('registers, logs in, and protects the profile endpoint', async () => {
    const email = `auth-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const password = 'correct-horse-battery-staple';

    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);

    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: ` ${email.toUpperCase()} `, password })
      .expect(201);

    expect(registration.body.user.email).toBe(email);
    expect(registration.body.passwordHash).toBeUndefined();
    expect(registration.body.accessToken).toEqual(expect.any(String));
    expect(registration.body.refreshToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(409);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe(email);
        expect(body.passwordHash).toBeUndefined();
      });

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(401);
  }, 20_000);

  it('rejects invalid order ids for authenticated users', async () => {
    const email = `orders-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'correct-horse-battery-staple' })
      .expect(201);

    return request(app.getHttpServer())
      .get('/orders/not-an-id')
      .set('Authorization', `Bearer ${registration.body.accessToken}`)
      .expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
