"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const notifications_module_1 = require("../notifications/notifications.module");
const contact_requests_controller_1 = require("./contact-requests.controller");
const contact_requests_service_1 = require("./contact-requests.service");
let ContactRequestsModule = class ContactRequestsModule {
};
exports.ContactRequestsModule = ContactRequestsModule;
exports.ContactRequestsModule = ContactRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        controllers: [contact_requests_controller_1.ContactRequestsController],
        providers: [contact_requests_service_1.ContactRequestsService],
    })
], ContactRequestsModule);
//# sourceMappingURL=contact-requests.module.js.map