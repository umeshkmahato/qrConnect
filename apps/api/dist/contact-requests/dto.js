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
exports.RespondContactRequestDto = exports.CreateContactRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateContactRequestDto {
    vehicleId;
    qrToken;
    category;
    message;
    idempotencyKey;
}
exports.CreateContactRequestDto = CreateContactRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "vehicleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "qrToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ContactCategory }),
    (0, class_validator_1.IsEnum)(client_1.ContactCategory),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 500),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 80),
    __metadata("design:type", String)
], CreateContactRequestDto.prototype, "idempotencyKey", void 0);
class RespondContactRequestDto {
    action;
    responseMessage;
}
exports.RespondContactRequestDto = RespondContactRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ACCEPTED', 'DECLINED', 'RESPONDED', 'CLOSED', 'REPORTED'] }),
    (0, class_validator_1.IsEnum)(['ACCEPTED', 'DECLINED', 'RESPONDED', 'CLOSED', 'REPORTED']),
    __metadata("design:type", String)
], RespondContactRequestDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 500),
    __metadata("design:type", String)
], RespondContactRequestDto.prototype, "responseMessage", void 0);
//# sourceMappingURL=dto.js.map