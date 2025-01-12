import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/AllExceptionsFilter';
import { Logger } from '@nestjs/common';
import { LoggerService } from './config/Logger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerService);
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Config
  const config = new DocumentBuilder()
    .setTitle('Store API')
    .setDescription('API for managing stores and shipping info')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = 3000;
  await app.listen(port); 
  logger.log('Application is running 🎉🎉');
  logger.log(`Swagger is running on http://localhost:${port}/api-docs`);
}
bootstrap();

