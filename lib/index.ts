import type { IRangeRequestClient, IRangeRequestConfig } from './types.js';
import { RangeRequestFactory } from './range-request-factory.js';
import type { IRandomAccessTokenizer } from 'strtok3';
export type { IRangeRequestClient, IRangeRequestResponse, IContentRangeType, IHeadRequestInfo, IRangeRequestConfig } from './types.js';
export { parseContentRange } from './range-request-tokenizer.js';

/**
 * Construct range-tokenizer from range-request-client and config
 * @param rangeRequestClient - HTTP range request client
 * @param abortController - AbortController
 * @param config - Configuration
 * @return Tokenizer
 */
export function tokenizer(rangeRequestClient: IRangeRequestClient, config?: IRangeRequestConfig): Promise<IRandomAccessTokenizer> {
  const factory = new RangeRequestFactory(rangeRequestClient);
  return factory.initTokenizer(config);
}
