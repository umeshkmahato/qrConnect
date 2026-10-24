"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canTransition = void 0;
const client_1 = require("@prisma/client");
const TRANSITIONS = {
    PENDING: [
        client_1.ContactRequestStatus.ACCEPTED,
        client_1.ContactRequestStatus.DECLINED,
        client_1.ContactRequestStatus.REPORTED,
        client_1.ContactRequestStatus.CLOSED,
    ],
    ACCEPTED: [client_1.ContactRequestStatus.RESPONDED, client_1.ContactRequestStatus.CLOSED, client_1.ContactRequestStatus.REPORTED],
    RESPONDED: [client_1.ContactRequestStatus.CLOSED, client_1.ContactRequestStatus.REPORTED],
    DECLINED: [client_1.ContactRequestStatus.CLOSED],
    REPORTED: [client_1.ContactRequestStatus.CLOSED],
    CLOSED: [],
};
const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false;
exports.canTransition = canTransition;
//# sourceMappingURL=state-machine.js.map