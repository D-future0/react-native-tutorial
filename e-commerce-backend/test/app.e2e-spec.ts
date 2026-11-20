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
        expect(body[0].imageUrl).toContain('media.istockphoto.com');
      });
  });

  it('/orders (GET and POST)', async () => {
    const products = await request(app.getHttpServer())
      .get('/products')
      .expect(200);
    const product = products.body[0];
    const orderInput = {
      items: [{ productId: product.id, quantity: 2 }],
      expectedTotal: Math.round(product.price * 200) / 100,
    };

    await request(app.getHttpServer())
      .get('/orders')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
      });

    await request(app.getHttpServer())
      .post('/orders')
      .send(orderInput)
      .expect(201)
      .expect(({ body }) => {
        expect(typeof body.id).toBe('string');
        expect(body.items).toEqual([
          {
            productId: product.id,
            name: product.name,
            price: Math.round(product.price * 100) / 100,
            imageUrl: product.imageUrl,
            quantity: 2,
          },
        ]);
        expect(body.total).toBe(orderInput.expectedTotal);
      });

    const created = await request(app.getHttpServer())
      .post('/orders')
      .send(orderInput)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/orders/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(created.body.id);
        expect(body.items).toEqual(created.body.items);
        expect(body.total).toBe(created.body.total);
      });
  });

  it('rejects client-supplied prices and invalid quantities', async () => {
    const products = await request(app.getHttpServer())
      .get('/products')
      .expect(200);
    const product = products.body[0];

    await request(app.getHttpServer())
      .post('/orders')
      .send({
        items: [{ productId: product.id, quantity: 1, price: 0.01 }],
        expectedTotal: 0.01,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/orders')
      .send({
        items: [{ productId: product.id, quantity: 0 }],
        expectedTotal: 0,
      })
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
  }, 20_000);

  it('rejects invalid order ids', () => {
    return request(app.getHttpServer())
      .get('/orders/not-an-id')
      .expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
