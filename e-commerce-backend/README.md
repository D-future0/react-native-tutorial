<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

A NestJS e-commerce REST API backed by Prisma and PostgreSQL. It provides
product and order endpoints, along with email/password registration and JWT
authentication.

## Setup

```bash
pnpm install
cp .env.example .env
```

In PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Configure `.env` before starting the server:

- `DATABASE_URL`: PostgreSQL connection string used by the app. For Neon, use
  the pooled connection URL.
- `DIRECT_URL`: direct PostgreSQL connection string used by Prisma migrations.
- `JWT_SECRET`: a private random secret of at least 32 characters. Keep `.env`
  out of version control and configure a separate secret in production.
- `HOST`: the interface to bind the API to. It defaults to `0.0.0.0` so devices
  on the local network can reach it; do not expose the development server to the
  public internet.
- `CORS_ORIGINS`: comma-separated allowed web app origins. The defaults allow
  Expo Web on localhost and the current development machine's LAN address.

Apply database migrations and optionally load the sample catalog:

```bash
pnpm exec prisma migrate dev
pnpm exec prisma db seed
```

The seed script replaces the current product catalog with 20 sample products,
priced in integer USD cents with 20 units of starting stock each. It does not
seed users or orders.

## Run

```bash
pnpm run start:dev
```

The server listens on port `3000` by default. Set `PORT` to use another port.
For production, build the app and apply existing migrations before starting:

```bash
pnpm run build
pnpm exec prisma migrate deploy
pnpm run start:prod
```

## API

### Products

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/products` | List products |
| `GET` | `/products/:id` | Get a product by ID |

Product records include `id`, `name`, `description`, `priceCents`,
`stockQuantity`, `imageUrl`, `createdAt`, and `updatedAt`.

### Orders

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/orders` | List orders |
| `POST` | `/orders` | Create an order |
| `GET` | `/orders/:id` | Get an order by ID |

All order endpoints require `Authorization: Bearer <accessToken>` and only
return orders belonging to that user. Orders created before user ownership was
added remain unassigned and are not exposed through these endpoints. Create an order by sending product IDs,
positive integer quantities, and the expected total in cents. Product names,
images, and prices are loaded from the database; client-supplied price fields
are rejected. The backend calculates the total in integer cents and atomically
decrements inventory with the order insert. It returns `409 Conflict` if stock
or the expected total changed. Review the refreshed cart and submit again after
a conflict.

```json
{
  "items": [{ "productId": "product-id", "quantity": 1 }],
  "expectedTotalCents": 2999
}
```

### Authentication

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register with email and password |
| `POST` | `/auth/login` | Sign in and receive a JWT |
| `GET` | `/auth/me` | Get the current user (Bearer token required) |

Registration and login accept:

```json
{
  "email": "customer@example.com",
  "password": "at-least-8-characters"
}
```

Passwords must be at least 8 characters and are stored as bcrypt hashes.
Registration normalizes email casing; an existing email returns `409 Conflict`.
Successful registration and login return an `accessToken`. Send it as
`Authorization: Bearer <accessToken>` to access `/auth/me` and the order endpoints.

Product endpoints are public; order endpoints and `/auth/me` require
authentication.

## Tests

```bash
pnpm run test
pnpm run test:e2e
pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It installs `@nestjs/observe`, wires it into `AppModule` and `main.ts`, and writes the app key and secret into `.env`, which every `nest start` script (`start`, `start:dev`, `start:debug`) then loads. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand:

```bash
$ pnpm install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/sdk) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
