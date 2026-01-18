"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Storage Blockchain API')
        .setDescription('Storage Blockchain API documentation\n\n' +
        'Nama: Adrian Yudhaswara\n\n' +
        'NIM: 231011402457')
        .setVersion('1.0')
        .addTag('blockchain')
        .build();
    const documentFactory = () => swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('documentation', app, documentFactory);
    await app.listen(process.env.PORT ?? 4000);
}
bootstrap().catch((err) => console.error(err));
//# sourceMappingURL=main.js.map