import * as path from 'node:path';
import * as assert from 'node:assert';
import * as file from 'node:fs/promises';
import { IHeadRequestInfo, IRangeRequestClient, IRangeRequestResponse } from '../lib/types.js';

/**
 * RangeRequest client mockup
 */
export class FsRangeRequestClient implements IRangeRequestClient {

  public constructor(private fixturePath: string) {
  }

  public async getHeadInfo(): Promise<IHeadRequestInfo> {
    const stat = await file.stat(this.fixturePath);
    return {
      size: stat.size,
      mimeType: this.getContentType(),
      path: this.fixturePath
    };
  }

  public async getResponse(method: string, range?: [number, number]): Promise<IRangeRequestResponse> {
    const stat = await file.stat(this.fixturePath);
    range = range ? range : [0, stat.size - 1];
    return {
      size: stat.size,
      mimeType: this.getContentType(),
      arrayBuffer: () => this.getData(range),
      path: this.fixturePath
    };
  }

  private async getData(range?: [number, number]): Promise<Uint8Array> {
    const reqLength = 1 + range[1] - range[0];

    const fileHandle = await file.open(this.fixturePath, 'r');
    try {
      const buffer = new Uint8Array(reqLength);
      const res = await fileHandle.read(buffer, 0, reqLength, range[0]);
      assert.equal(res.bytesRead, reqLength);
      return buffer;
    } finally {
      await fileHandle.close();
    }
  }

  private getContentType() {
    const extension = path.extname(this.fixturePath);
    switch (extension) {
      case '.mp3': return 'audio/mpeg';
      case '.m4a': return 'audio/m4a';
      case '.flac': return 'audio/flac';
      default: return null;
    }
  }

}
