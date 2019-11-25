export interface IContentRangeType {
  firstBytePosition?: number;
  lastBytePosition?: number;
  instanceLength?: number;
}

export interface IHeadRequestInfo {
  contentLength?: number;
  contentType?: string;
  contentRange?: IContentRangeType;
}

export interface IRangeRequestResponse extends IHeadRequestInfo {
  arrayBuffer: () => Promise<Buffer>;
}

export interface IRangeRequestClient {

  getHeadInfo?(): Promise<IHeadRequestInfo>;

  getResponse(method: string, range?: [number, number]): Promise<IRangeRequestResponse>;
}
