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
exports.PrivacyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../common/decorators");
const dto_1 = require("./dto");
const privacy_service_1 = require("./privacy.service");
let PrivacyController = class PrivacyController {
    privacy;
    constructor(privacy) {
        this.privacy = privacy;
    }
    get(user, vehicleId) {
        return this.privacy.getPreferences(user, vehicleId);
    }
    update(user, dto) {
        return this.privacy.updatePreferences(user, dto);
    }
    consent(user, dto) {
        return this.privacy.recordConsent(user, dto);
    }
    consents(user) {
        return this.privacy.myConsents(user);
    }
    exportData(user) {
        return this.privacy.exportMyData(user);
    }
    deleteAccount(user) {
        return this.privacy.deleteAccount(user);
    }
};
exports.PrivacyController = PrivacyController;
__decorate([
    (0, common_1.Get)('preferences'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('vehicleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)('preferences'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UpdateSharingPreferencesDto]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('consents'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ConsentDto]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "consent", null);
__decorate([
    (0, common_1.Get)('consents'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "consents", null);
__decorate([
    (0, common_1.Get)('data-export'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "exportData", null);
__decorate([
    (0, common_1.Post)('account/delete'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "deleteAccount", null);
exports.PrivacyController = PrivacyController = __decorate([
    (0, swagger_1.ApiTags)('privacy'),
    (0, common_1.Controller)('api/v1/privacy'),
    __metadata("design:paramtypes", [privacy_service_1.PrivacyService])
], PrivacyController);
//# sourceMappingURL=privacy.controller.js.map