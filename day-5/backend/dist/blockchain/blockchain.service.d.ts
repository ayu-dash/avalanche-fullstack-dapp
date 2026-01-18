import { ValueResponse, EventItemResponse, PaginatedEventsResponse } from './dto/responses.dto';
export declare class BlockchainService {
    private client;
    private contractAddress;
    constructor();
    getLatestValue(): Promise<ValueResponse>;
    getRecentEvents(): Promise<{
        events: EventItemResponse[];
        timestamp: string;
    }>;
    getValueUpdatedEvents(fromBlock: number, toBlock: number): Promise<PaginatedEventsResponse>;
    private handleRpcError;
}
