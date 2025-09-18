"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailAccountSchema = exports.EmailAccount = exports.AuthMethod = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var AuthMethod;
(function (AuthMethod) {
    AuthMethod["PLAIN"] = "PLAIN";
    AuthMethod["LOGIN"] = "LOGIN";
    AuthMethod["OAUTH2"] = "OAUTH2";
})(AuthMethod || (exports.AuthMethod = AuthMethod = {}));
let EmailAccount = class EmailAccount {
    userId;
    name;
    email;
    imapHost;
    imapPort;
    useSSL;
    authMethod;
    username;
    password;
    oauth2Token;
    isActive;
    isConnected;
    lastSync;
    totalEmails;
    syncedEmails;
    lastError;
};
exports.EmailAccount = EmailAccount;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmailAccount.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EmailAccount.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EmailAccount.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EmailAccount.prototype, "imapHost", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], EmailAccount.prototype, "imapPort", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], EmailAccount.prototype, "useSSL", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: AuthMethod }),
    __metadata("design:type", String)
], EmailAccount.prototype, "authMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EmailAccount.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], EmailAccount.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], EmailAccount.prototype, "oauth2Token", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], EmailAccount.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], EmailAccount.prototype, "isConnected", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], EmailAccount.prototype, "lastSync", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmailAccount.prototype, "totalEmails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmailAccount.prototype, "syncedEmails", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], EmailAccount.prototype, "lastError", void 0);
exports.EmailAccount = EmailAccount = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], EmailAccount);
exports.EmailAccountSchema = mongoose_1.SchemaFactory.createForClass(EmailAccount);
//# sourceMappingURL=email-account.schema.js.map