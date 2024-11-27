import type { IRangeRequestConfig, IHeadRequestInfo, IRangeRequestClient } from './types.js';
import { RangeRequestTokenizer, roundRange } from './range-request-tokenizer.js';
import initDebug from 'debug';

const debug = initDebug('range-request-reader');

interface IInternalRangeRequestConfig extends IRangeRequestConfig {
  avoidHeadRequests: boolean;
  initialChunkSize: number;
  minimumChunkSize: number;
}

export class RangeRequestFactory {

  public config: IInternalRangeRequestConfig = {
    avoidHeadRequests: false,
    initialChunkSize: 4 * 1024,
    minimumChunkSize: 1024
  };

  constructor(private rangeRequestClient: IRangeRequestClient) {
  }

  public async initTokenizer(config?: IRangeRequestConfig): Promise<RangeRequestTokenizer> {
    if (config) {
      this.config = {...this.config, ...config};
    }
    const headRequestInfo = await this.getHeadRequestInfo();
    if (!headRequestInfo.acceptPartialRequests) {
      throw new Error('Server does not accept partial requests');
    }
    return new RangeRequestTokenizer(this.rangeRequestClient, {
      fileInfo: headRequestInfo,
      minimumChunkSize: this.config.minimumChunkSize,
      abortSignal: config?.abortSignal
    });
  }

  /**
   * Get file information, an HTTP-client may implement this doing a HEAD request
   * @return Promise with head-request-info, extending tokenizer file-info.
   */
  public getHeadRequestInfo(): Promise<IHeadRequestInfo> {
    return this.config.avoidHeadRequests ?
      this.fetchFileInfoWithGetRequest() :
      this.fetchFileInfoWithHeadRequest();
  }

  private async fetchFileInfoWithHeadRequest(): Promise<IHeadRequestInfo> {

    debug('_fetchSizeWithHeadRequest()');
    if (this.rangeRequestClient.getHeadInfo) {
      const info = await this.rangeRequestClient.getHeadInfo();
      if (info.size) {
        debug(`MIME-type=${info.mimeType}, content-length=${info.size}, accept-partial-requests=${info.acceptPartialRequests}`);
        return info;
      }
    }
    // Content-Length not provided by the server, fallback to
    // GET requests.
    debug('Content-Length not provided by the server, fallback to GET requests');
    return this.fetchFileInfoWithGetRequest();
  }

  private async fetchFileInfoWithGetRequest(): Promise<IHeadRequestInfo> {
    const range = roundRange([0, this.config.initialChunkSize], this.config.minimumChunkSize);

    const response = await this.rangeRequestClient.getResponse('GET', range);
    debug(`_fetchSizeWithGetRequest response: contentRange=[${response.contentRange?.firstBytePosition}-${response.contentRange?.lastBytePosition}/${response.contentRange?.instanceLength}]`);

    if (!response.contentRange) {
      throw new Error('Failed to resolve content range (file size)');
    }
    return response;
  }
}
