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
exports.UpdateEmailAccountDto = exports.CreateEmailAccountDto = void 0;
const class_validator_1 = require("class-validator");
const email_account_schema_1 = require("../../../database/schemas/email-account.schema");
class CreateEmailAccountDto {
    name;
    email;
    imapHost;
    imapPort;
    useSSL = true;
    authMethod;
    username;
    password;
    oauth2Token;
}
exports.CreateEmailAccountDto = CreateEmailAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmailAccountDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateEmailAccountDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmailAccountDto.prototype, "imapHost", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], CreateEmailAccountDto.prototype, "imapPort", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateEmailAccountDto.prototype, "useSSL", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(email_account_schema_1.AuthMethod),
    __metadata("design:type", String)
], CreateEmailAccountDto.prototype, "authMethod", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmailAccountDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEmailAccountDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEmailAccountDto.prototype, "oauth2Token", void 0);
class UpdateEmailAccountDto {
    name;
    imapHost;
    imapPort;
    useSSL;
    authMethod;
    username;
    password;
    oauth2Token;
    isActive;
}
exports.UpdateEmailAccountDto = UpdateEmailAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailAccountDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailAccountDto.prototype, "imapHost", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateEmailAccountDto.prototype, "imapPort", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateEmailAccountDto.prototype, "useSSL", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(email_account_schema_1.AuthMethod),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailAccountDto.prototype, "authMethod", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailAccountDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailAccountDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailAccountDto.prototype, "oauth2Token", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateEmailAccountDto.prototype, "isActive", void 0);
//# sourceMappingURL=email-account.dto.js.map