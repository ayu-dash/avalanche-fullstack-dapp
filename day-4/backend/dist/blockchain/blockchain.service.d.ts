import { ValueResponse, PaginatedEventsResponse } from './dto/responses.dto';
export declare class BlockchainService {
    private client;
    private contractAddress;
    constructor();
    getLatestValue(): Promise<ValueResponse>;
    getValueUpdatedEvents(fromBlock: number, toBlock: number): Promise<PaginatedEventsResponse>;
    private handleRpcError;
}
