import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { validationExceptionFactory } from './common/pipes/validation.factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '8mb' }));
  app.use(urlencoded({ extended: true, limit: '8mb' }));
  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: validationExceptionFactory
    })
  );

  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT') ?? 3333;
  const expressApp = app.getHttpAdapter().getInstance();

  await app.init();

  expressApp.use((error: { type?: string }, _req: unknown, res: { status: (code: number) => { json: (body: object) => void } }, next: (err?: unknown) => void) => {
    if (error?.type === 'entity.too.large') {
      return res.status(413).json({
        statusCode: 413,
        message: 'Arquivo muito grande. O limite e de 5MB por logo.',
        error: 'Arquivo muito grande'
      });
    }
    next(error);
  });

  await app.listen(port);
}

bootstrap();
