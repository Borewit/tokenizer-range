import type { IFileInfo } from 'strtok3';

export interface IRangeRequestConfig {
  timeoutInSec?: number;
  avoidHeadRequests?: boolean;
  initialChunkSize?: number;
  minimumChunkSize?: number;
}

export interface IContentRangeType {
  /**
   * Offset in fil, integer, indicating the first byte of the range
   */
  firstBytePosition?: number;
  /**
   * Offset in fil, integer, indicating the last byte of the range
   */
  lastBytePosition?: number;
  /**
   * Total file length
   */
  instanceLength?: number;
}

/**
 * Abstract interface to HTTP response information
 */
export interface IHeadRequestInfo extends IFileInfo {
  /**
   * Range and file size specification
   */
  contentRange?: IContentRangeType;
}

export interface IRangeRequestResponse extends IHeadRequestInfo {
  arrayBuffer: () => Promise<Uint8Array>;
}

/**
 * Implementation of the range-request-client
 */
export interface IRangeRequestClient {

  /**
   * Head request to determine the size and MIME-type of the file
   * @return HEAD-request information
   */
  getHeadInfo?(): Promise<IHeadRequestInfo>;

  /**
   *
   * @param method - HTTP method
   * @param range - Array of 2 numbers: The range-start and range-end. An integer indicating the beginning and the end of range request in bytes.
   * @return Range request response
   */
  getResponse(method: string, range?: [number, number]): Promise<IRangeRequestResponse>;
}
