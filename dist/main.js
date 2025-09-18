"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const app_config_1 = require("./config/app.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.enableCors({
        origin: configService.get('CORS_ORIGIN', app_config_1.appConfig.cors.origin),
        credentials: configService.get('CORS_CREDENTIALS', app_config_1.appConfig.cors.credentials),
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const apiPrefix = configService.get('API_PREFIX', app_config_1.appConfig.server.apiPrefix);
    app.setGlobalPrefix(apiPrefix);
    const port = configService.get('PORT', app_config_1.appConfig.server.port);
    await app.listen(port);
    console.log(`🚀 Backend server running on port ${port}`);
    console.log(`📡 API available at http://localhost:${port}/${apiPrefix}`);
    console.log(`🌍 Environment: ${app_config_1.appConfig.server.nodeEnv}`);
}
bootstrap();
//# sourceMappingURL=main.js.map