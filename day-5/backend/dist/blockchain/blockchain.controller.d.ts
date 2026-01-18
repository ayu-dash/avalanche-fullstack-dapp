import { BlockchainService } from './blockchain.service';
import { GetEventsDto } from './dto/events.dto';
export declare class BlockchainController {
    private readonly blockchainService;
    constructor(blockchainService: BlockchainService);
    getValue(): Promise<import("./dto/responses.dto").ValueResponse>;
    getRecentEvents(): Promise<{
        events: import("./dto/responses.dto").EventItemResponse[];
        timestamp: string;
    }>;
    getEvents(body: GetEventsDto): Promise<import("./dto/responses.dto").PaginatedEventsResponse>;
}
