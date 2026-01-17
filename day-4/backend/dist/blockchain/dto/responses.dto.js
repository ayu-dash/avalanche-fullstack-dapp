"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedEventsResponse = exports.EventItemResponse = exports.ValueResponse = void 0;
class ValueResponse {
    value;
    timestamp;
}
exports.ValueResponse = ValueResponse;
class EventItemResponse {
    blockNumber;
    value;
    txHash;
}
exports.EventItemResponse = EventItemResponse;
class PaginatedEventsResponse {
    data;
    total;
    fromBlock;
    toBlock;
    timestamp;
}
exports.PaginatedEventsResponse = PaginatedEventsResponse;
//# sourceMappingURL=responses.dto.js.map