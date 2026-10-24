"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const env_1 = require("./config/env");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: env_1.env.isProduction ? env_1.env.corsOrigins : true,
        credentials: false,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableShutdownHooks();
    if (!env_1.env.isProduction) {
        const doc = new swagger_1.DocumentBuilder()
            .setTitle('NathConnect API')
            .setVersion('v1')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, doc);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    await app.listen(env_1.env.port);
}
void bootstrap();
//# sourceMappingURL=main.js.map