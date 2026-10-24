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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../common/decorators");
const dto_1 = require("./dto");
const qr_service_1 = require("./qr.service");
let QrController = class QrController {
    qr;
    constructor(qr) {
        this.qr = qr;
    }
    resolve(user, dto) {
        return this.qr.resolve(user, dto.token);
    }
    rotate(user, id) {
        return this.qr.rotate(user, id);
    }
    revoke(user, id) {
        return this.qr.revoke(user, id);
    }
};
exports.QrController = QrController;
__decorate([
    (0, common_1.Post)('qr/resolve'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ResolveQrDto]),
    __metadata("design:returntype", void 0)
], QrController.prototype, "resolve", null);
__decorate([
    (0, common_1.Post)('vehicles/:id/qr/rotate'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QrController.prototype, "rotate", null);
__decorate([
    (0, common_1.Post)('vehicles/:id/qr/revoke'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QrController.prototype, "revoke", null);
exports.QrController = QrController = __decorate([
    (0, swagger_1.ApiTags)('qr'),
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [qr_service_1.QrService])
], QrController);
//# sourceMappingURL=qr.controller.js.map