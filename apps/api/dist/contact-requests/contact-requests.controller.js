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
exports.ContactRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../common/decorators");
const pagination_1 = require("../common/pagination");
const contact_requests_service_1 = require("./contact-requests.service");
const dto_1 = require("./dto");
let ContactRequestsController = class ContactRequestsController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(user, dto) {
        return this.service.create(user, dto);
    }
    list(user, q, direction) {
        return this.service.list(user, q, direction ?? 'sent');
    }
    get(user, id) {
        return this.service.get(user, id);
    }
    respond(user, id, dto) {
        return this.service.respond(user, id, dto);
    }
};
exports.ContactRequestsController = ContactRequestsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateContactRequestDto]),
    __metadata("design:returntype", void 0)
], ContactRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('direction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_1.PaginationQuery, String]),
    __metadata("design:returntype", void 0)
], ContactRequestsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ContactRequestsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(':id/respond'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.RespondContactRequestDto]),
    __metadata("design:returntype", void 0)
], ContactRequestsController.prototype, "respond", null);
exports.ContactRequestsController = ContactRequestsController = __decorate([
    (0, swagger_1.ApiTags)('contact-requests'),
    (0, common_1.Controller)('api/v1/contact-requests'),
    __metadata("design:paramtypes", [contact_requests_service_1.ContactRequestsService])
], ContactRequestsController);
//# sourceMappingURL=contact-requests.controller.js.map