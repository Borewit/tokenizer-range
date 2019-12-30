import { IFileInfo } from 'strtok3/lib/core';

export interface IRangeRequestConfig {
  timeoutInSec?: number;
  avoidHeadRequests?: boolean;
  initialChunkSize?: number;
  minimumChunkSize?: number;
}

export interface IContentRangeType {
  firstBytePosition?: number;
  lastBytePosition?: number;
  instanceLength?: number;
}

export interface IHeadRequestInfo extends IFileInfo {
  contentRange?: IContentRangeType;
}

export interface IRangeRequestResponse extends IHeadRequestInfo {
  arrayBuffer: () => Promise<Buffer>;
}

export interface IRangeRequestClient {

  getHeadInfo?(): Promise<IHeadRequestInfo>;

  getResponse(method: string, range?: [number, number]): Promise<IRangeRequestResponse>;
}
