import * as fs from 'fs-extra';
import * as path from 'path';
import * as assert from 'assert';
import { IHeadRequestInfo, IRangeRequestClient, IRangeRequestResponse } from '../lib/types';

/**
 * RangeRequest client mockup
 */
export class FsRangeRequestClient implements IRangeRequestClient {

  public constructor(private fixturePath: string) {
  }

  public async getHeadInfo(): Promise<IHeadRequestInfo> {
    const stat = await fs.stat(this.fixturePath);
    return {
      contentLength: stat.size,
      contentType: this.getContentType()
    };
  }

  public async getResponse(method: string, range?: [number, number]): Promise<IRangeRequestResponse> {
    const stat = await fs.stat(this.fixturePath);
    range = range ? range : [0, stat.size - 1];
    return {
      contentLength: stat.size,
      contentType: this.getContentType(),
      arrayBuffer: () => this.getData(range)
    };
  }

  private async getData(range?: [number, number]): Promise<Buffer> {
    const reqLength = 1 + range[1] - range[0];

    const fd = await fs.open(this.fixturePath, 'r');
    try {
      const buffer = Buffer.alloc(reqLength);
      const res = await fs.read(fd, buffer, 0, reqLength, range[0]);
      assert.equal(res.bytesRead, reqLength);
      return buffer;
    } finally {
      await fs.close(fd);
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
