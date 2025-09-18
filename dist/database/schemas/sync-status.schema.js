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
exports.SyncStatusSchema = exports.SyncStatus = exports.SyncStatusType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var SyncStatusType;
(function (SyncStatusType) {
    SyncStatusType["RUNNING"] = "RUNNING";
    SyncStatusType["PAUSED"] = "PAUSED";
    SyncStatusType["COMPLETED"] = "COMPLETED";
    SyncStatusType["ERROR"] = "ERROR";
})(SyncStatusType || (exports.SyncStatusType = SyncStatusType = {}));
let SyncStatus = class SyncStatus {
    accountId;
    status;
    totalEmails;
    processedEmails;
    newEmails;
    updatedEmails;
    currentFolder;
    lastProcessedUid;
    errorMessage;
    startedAt;
    completedAt;
    lastActivity;
};
exports.SyncStatus = SyncStatus;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'EmailAccount' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SyncStatus.prototype, "accountId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: SyncStatusType }),
    __metadata("design:type", String)
], SyncStatus.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], SyncStatus.prototype, "totalEmails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], SyncStatus.prototype, "processedEmails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], SyncStatus.prototype, "newEmails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], SyncStatus.prototype, "updatedEmails", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SyncStatus.prototype, "currentFolder", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], SyncStatus.prototype, "lastProcessedUid", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SyncStatus.prototype, "errorMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], SyncStatus.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], SyncStatus.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], SyncStatus.prototype, "lastActivity", void 0);
exports.SyncStatus = SyncStatus = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], SyncStatus);
exports.SyncStatusSchema = mongoose_1.SchemaFactory.createForClass(SyncStatus);
//# sourceMappingURL=sync-status.schema.js.map