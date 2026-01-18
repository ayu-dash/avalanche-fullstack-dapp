import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Storage Blockchain API')
    .setDescription(
      'Storage Blockchain API documentation\n\n' +
      'Nama: Adrian Yudhaswara\n\n' +
      'NIM: 231011402457',
    )
    .setVersion('1.0')
    .addTag('blockchain')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentation', app, documentFactory);

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap().catch((err) => console.error(err));
