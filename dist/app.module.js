"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const email_account_controller_1 = require("./modules/email/email-account.controller");
const email_account_service_1 = require("./modules/email/email-account.service");
const email_sync_controller_1 = require("./modules/email/email-sync.controller");
const email_sync_service_1 = require("./modules/email/email-sync.service");
const email_processing_service_1 = require("./modules/email/email-processing.service");
const imap_connection_service_1 = require("./modules/imap/imap-connection.service");
const analytics_controller_1 = require("./modules/analytics/analytics.controller");
const analytics_service_1 = require("./modules/analytics/analytics.service");
const search_module_1 = require("./modules/search/search.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            search_module_1.SearchModule,
        ],
        controllers: [
            app_controller_1.AppController,
            email_account_controller_1.EmailAccountController,
            email_sync_controller_1.EmailSyncController,
            analytics_controller_1.AnalyticsController,
        ],
        providers: [
            app_service_1.AppService,
            email_account_service_1.EmailAccountService,
            email_sync_service_1.EmailSyncService,
            email_processing_service_1.EmailProcessingService,
            imap_connection_service_1.ImapConnectionService,
            analytics_service_1.AnalyticsService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map