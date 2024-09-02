import { AbstractTokenizer, type IReadChunkOptions } from 'strtok3';
import { ChunkedFileData } from './chunked-file-data.js';
import type { IContentRangeType, IHeadRequestInfo, IRangeRequestClient } from './types.js';
import initDebug from 'debug';

const debug = initDebug('range-request-reader');

/**
 * RangeRequestTokenizer is tokenizer which is an adapter for range-request clients.
 * Typically, HTTP clients implementing the HTTP Range Requests (https://tools.ietf.org/html/rfc7233)
 *
 * Inspired by "XHR Reader"  written by António Afonso
 * https://github.com/aadsm/jsmediatags/blob/master/src/XhrFileReader.js
 */
export class RangeRequestTokenizer extends AbstractTokenizer {

  private _fileData: ChunkedFileData;

  constructor(private rangeRequestClient: IRangeRequestClient, fileInfo: IHeadRequestInfo, private minimumChunkSize: number, private abortController?: AbortController) {
    super({fileInfo});
    if (isNaN(minimumChunkSize)) {
      throw new Error('minimumChunkSize must be a number');
    }
    this._fileData = new ChunkedFileData();
  }

  /**
   * Read portion from stream
   * @param uint8array - Target `Uint8Array`
   * @param options - Additional read options
   * @returns Promise with number of bytes read
   */
  public async readBuffer(uint8array: Uint8Array, options?: IReadChunkOptions): Promise<number> {

    if (options && options.position) {
      this.position = options.position;
    }

    const length = await this.peekBuffer(uint8array, options);
    this.position += length;
    return length;
  }

  /**
   * Peek (read ahead) buffer from tokenizer
   * @param uint8array - Target `Uint8Array` to fill with data peek from the tokenizer-stream
   * @param options - Additional read options
   * @returns Promise with number of bytes read
   */
  public async peekBuffer(uint8array: Uint8Array, options?: IReadChunkOptions): Promise<number> {

    let length = uint8array.length;
    let offset = 0;
    let position = this.position;

    if (options) {
      if (options.position) {
        position = options.position;
      }
      if (Number.isInteger(options.offset)) {
        offset = options.offset as number;
      }
      if (options.length) {
        length = options.length as number;
      } else {
        length -= offset;
      }
    }

    if (length === 0) {
      return 0;
    }

    debug(`peekBuffer position=${position} length=${length}`);

    if(!this.fileInfo)
      throw new Error('File-info missing');

    const lastPos = Math.min(this.fileInfo.size as number - 1, position + length - 1);

    return this.loadRange([position, lastPos]).then(() => {

      this._fileData.readToBuffer(uint8array, offset, position, Math.min(this.fileInfo.size as number, length));

      return length;
    });
  }

  /**
   * Ignore number of bytes, advances the pointer in under tokenizer-stream.
   * @param length - Number of bytes to skip (ignore)
   * @return actual number of bytes ignored
   */
  public async ignore(length: number): Promise<number> {
    const bytesLeft = this.fileInfo.size as number - this.position;
    if (length <= bytesLeft) {
      this.position += length;
      return length;
    }
    this.position += bytesLeft;
    return bytesLeft;
  }

  public async abort(): Promise<void> {
    this.abortController?.abort();
  }

  private async loadRange(range: [number, number]): Promise<void> {

    if (range[0] > ((this.fileInfo.size as number) - 1)) {
      throw new Error('End-Of-File');
    }

    debug(`request range ${range[0]}..${range[1]}`);

    debug(`adjusted range ${range[0]}..${range[1]}`);
    if (this._fileData.hasDataRange(range[0], range[1])) {
      debug('Read from cache');
      return;
    }

    // Always download in multiples of CHUNK_SIZE. If we're going to make a
    // request might as well get a chunk that makes sense. The big cost is
    // establishing the connection so getting 10bytes or 1K doesn't really
    // make a difference.
    range = roundRange(range, this.minimumChunkSize);

    // Upper range should not be greater than max file size
    range[1] = Math.min(this.fileInfo.size as number - 1, range[1]);

    debug(`blocked range: ${range[0]}..${range[1]}`);

    return this.rangeRequestClient.getResponse('GET', range).then(response => {
      return response.arrayBuffer().then(data => {
        this._fileData.addData(range[0], data);
      });
    });
  }
}

export function roundRange(range: [number, number], minimumChunkSize: number): [number, number] {
  const length = range[1] - range[0] + 1;
  // const newLength = Math.ceil(length / minimum_chunk_size) * minimum_chunk_size;
  const newLength = Math.max(minimumChunkSize, length);
  return [range[0], range[0] + newLength - 1];
}

/**
 * Convert HTTP range header value to IContentRangeType
 * @param contentRange - content range
 */
export function parseContentRange(contentRange: string): IContentRangeType {
  if (!contentRange) {
    throw new Error('Content range must be provided');
  }
  debug(`parseContentRange response: contentRange=${contentRange}`);

  const parsedContentRange = contentRange.match(
    /bytes (\d+)-(\d+)\/(?:(\d+)|\*)/i
  );
  if (!parsedContentRange) {
    throw new Error('FIXME: Unknown Content-Range syntax: ' + contentRange);
  }

  return {
    firstBytePosition: parseInt(parsedContentRange[1], 10),
    lastBytePosition: parseInt(parsedContentRange[2], 10),
    instanceLength: parsedContentRange[3] ? parseInt(parsedContentRange[3], 10) : undefined
  };
}
