import { IRangeRequestClient, IRangeRequestConfig } from './types';
import { RangeRequestFactory } from './range-request-factory';
import { ITokenizer } from 'strtok3/lib/core';
export { IRangeRequestClient, IRangeRequestResponse, IContentRangeType, IHeadRequestInfo, IRangeRequestConfig } from './types';
export { parseContentRange } from './range-request-tokenizer';

/**
 * Construct range-tokenizer from range-request-client and config
 * @param rangeRequestClient - HTTP range request client
 * @param config - Configuration
 * @return Tokenizer
 */
export function tokenizer(rangeRequestClient: IRangeRequestClient, config?: IRangeRequestConfig): Promise<ITokenizer> {
  const factory = new RangeRequestFactory(rangeRequestClient);
  return factory.initTokenizer(config);
}
