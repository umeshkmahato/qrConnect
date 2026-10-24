"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TooManyRequestsException = void 0;
const common_1 = require("@nestjs/common");
class TooManyRequestsException extends common_1.HttpException {
    constructor(body) {
        super(body, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.TooManyRequestsException = TooManyRequestsException;
//# sourceMappingURL=exceptions.js.map