export declare class ValueResponse {
    value: string;
    timestamp: string;
}
export declare class EventItemResponse {
    blockNumber: string;
    value: string;
    txHash: string;
}
export declare class PaginatedEventsResponse {
    data: EventItemResponse[];
    total: number;
    fromBlock: number;
    toBlock: number;
    timestamp: string;
}
