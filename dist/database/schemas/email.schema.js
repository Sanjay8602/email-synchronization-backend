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
exports.EmailSchema = exports.Email = exports.EmailFlag = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var EmailFlag;
(function (EmailFlag) {
    EmailFlag["SEEN"] = "\\Seen";
    EmailFlag["ANSWERED"] = "\\Answered";
    EmailFlag["FLAGGED"] = "\\Flagged";
    EmailFlag["DELETED"] = "\\Deleted";
    EmailFlag["DRAFT"] = "\\Draft";
})(EmailFlag || (exports.EmailFlag = EmailFlag = {}));
let Email = class Email {
    accountId;
    messageId;
    subject;
    from;
    fromName;
    fromEmail;
    to;
    cc;
    bcc;
    date;
    receivedDate;
    timeDelta;
    content;
    htmlContent;
    textContent;
    flags;
    folder;
    uid;
    size;
    sendingDomain;
    espType;
    espName;
    isOpenRelay;
    hasValidTLS;
    tlsVersion;
    certificateIssuer;
    certificateSubject;
    certificateValidFrom;
    certificateValidTo;
    searchableContent;
};
exports.Email = Email;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'EmailAccount' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Email.prototype, "accountId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Email.prototype, "messageId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Email.prototype, "subject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Email.prototype, "from", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Email.prototype, "fromName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Email.prototype, "fromEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Array)
], Email.prototype, "to", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Array)
], Email.prototype, "cc", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Array)
], Email.prototype, "bcc", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Email.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Email.prototype, "receivedDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Email.prototype, "timeDelta", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Email.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Email.prototype, "htmlContent", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Email.prototype, "textContent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], enum: EmailFlag, default: [] }),
    __metadata("design:type", Array)
], Email.prototype, "flags", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Email.prototype, "folder", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Email.prototype, "uid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Email.prototype, "size", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Email.prototype, "sendingDomain", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Email.prototype, "espType", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Email.prototype, "espName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Email.prototype, "isOpenRelay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Email.prototype, "hasValidTLS", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Email.prototype, "tlsVersion", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Email.prototype, "certificateIssuer", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Email.prototype, "certificateSubject", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Email.prototype, "certificateValidFrom", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Email.prototype, "certificateValidTo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: 'text' }),
    __metadata("design:type", String)
], Email.prototype, "searchableContent", void 0);
exports.Email = Email = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Email);
exports.EmailSchema = mongoose_1.SchemaFactory.createForClass(Email);
exports.EmailSchema.index({ accountId: 1, uid: 1 }, { unique: true });
exports.EmailSchema.index({ accountId: 1, folder: 1 });
exports.EmailSchema.index({ fromEmail: 1 });
exports.EmailSchema.index({ sendingDomain: 1 });
exports.EmailSchema.index({ espType: 1 });
exports.EmailSchema.index({ date: -1 });
exports.EmailSchema.index({ receivedDate: -1 });
//# sourceMappingURL=email.schema.js.map