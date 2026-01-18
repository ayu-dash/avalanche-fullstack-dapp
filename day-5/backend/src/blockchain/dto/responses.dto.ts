export class ValueResponse {
  value: string;
  timestamp: string;
}

export class EventItemResponse {
  blockNumber: string;
  value: string;
  txHash: string;
}

export class PaginatedEventsResponse {
  data: EventItemResponse[];
  total: number;
  fromBlock: number;
  toBlock: number;
  timestamp: string;
}
