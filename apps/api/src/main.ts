import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: env.isProduction ? env.corsOrigins : true,
    credentials: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unexpected fields (mass-assignment protection)
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  // OpenAPI only outside production — admin/sensitive surface is not published.
  if (!env.isProduction) {
    const doc = new DocumentBuilder()
      .setTitle('NathConnect API')
      .setVersion('v1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(env.port);
}
void bootstrap();
