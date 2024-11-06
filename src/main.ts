import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { winstonLogger, HttpExceptionFilter } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: winstonLogger,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const validationErrors = errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
          value: err.value,
        }));
        return new BadRequestException(validationErrors);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Concert 예약 시스템')
    .setDescription('Concert 예약 시스템 API 문서')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(3000);
}
bootstrap();
