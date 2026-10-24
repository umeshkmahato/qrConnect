"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbuseReportsModule = void 0;
const common_1 = require("@nestjs/common");
const abuse_reports_controller_1 = require("./abuse-reports.controller");
const abuse_reports_service_1 = require("./abuse-reports.service");
let AbuseReportsModule = class AbuseReportsModule {
};
exports.AbuseReportsModule = AbuseReportsModule;
exports.AbuseReportsModule = AbuseReportsModule = __decorate([
    (0, common_1.Module)({
        controllers: [abuse_reports_controller_1.AbuseReportsController],
        providers: [abuse_reports_service_1.AbuseReportsService],
        exports: [abuse_reports_service_1.AbuseReportsService],
    })
], AbuseReportsModule);
//# sourceMappingURL=abuse-reports.module.js.map