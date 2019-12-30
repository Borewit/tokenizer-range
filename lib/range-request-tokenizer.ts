import * as initDebug from 'debug';
import { AbstractTokenizer } from 'strtok3/lib/AbstractTokenizer';
import { ChunkedFileData } from './chunked-file-data';
import { IContentRangeType, IHeadRequestInfo, IRangeRequestClient } from './types';

const debug = initDebug('range-request-reader');

/**
 * RangeRequestTokenizer is tokenizer which is an adapter for range-request clients.
 * Typically HTTP clients implementing the HTTP Range Requests (https://tools.ietf.org/html/rfc7233)
 *
 * Inspired by "XHR Reader"  written by António Afonso
 * https://github.com/aadsm/jsmediatags/blob/master/src/XhrFileReader.js
 */
export class RangeRequestTokenizer extends AbstractTokenizer {

  private _fileData: ChunkedFileData;

  constructor(private rangeRequestClient: IRangeRequestClient, fileInfo: IHeadRequestInfo, private minimumChunkSize: number) {
    super(fileInfo);
    if (isNaN(minimumChunkSize)) {
      throw new Error('minimumChunkSize must be a number');
    }
    this._fileData = new ChunkedFileData();
  }

  /**
   * Read portion from stream
   * @param {Buffer} buffer: Target buffer
   * @param {number} offset: Offset is the offset in the buffer to start writing at; if not provided, start at 0
   * @param {number} length: The number of bytes to read, of not provided the buffer length will be used
   * @param {number} position: Position where to begin reading from in the file. If position is not defined, data will be read from the current file position.
   * @returns {Promise<number>}
   */
  public async readBuffer(buffer: Buffer, offset: number = 0, length: number = buffer.length, position?: number): Promise<number> {

    if (position) {
      this.position = position;
    }

    debug(`readBuffer position=${this.position} length=${length}`);

    if (length === 0) {
      return 0;
    }

    if (!length) {
      length = buffer.length;
    }

    await this.peekBuffer(buffer, offset, length, this.position);
    this.position += length;
    return length;
  }

  /**
   * Peek (read ahead) buffer from tokenizer
   * @param buffer - Target buffer to fill with data peek from the tokenizer-stream
   * @param offset - The offset in the buffer to start writing at; if not provided, start at 0
   * @param length - is an integer specifying the number of bytes to read
   * @param position is an integer specifying where to begin reading from in the file. If position is null, data will be read from the current file position.
   * @param maybeless - If set, will not throw an EOF error if not all of the requested data could be read
   * @returns Promise with number of bytes read
   */
  public peekBuffer(buffer: Buffer, offset: number = 0, length: number = buffer.length, position: number = this.position): Promise<number> {

    debug(`peekBuffer position=${position} length=${length}`);

    const lastPos = position + length - 1;

    return this.loadRange([position, lastPos]).then(() => {

      this._fileData.readToBuffer(buffer, offset, position, length);

      return length;
    });
  }

  /**
   * Ignore number of bytes, advances the pointer in under tokenizer-stream.
   * @param length - Number of bytes to skip (ignore)
   * @return actual number of bytes ignored
   */
  public async ignore(length: number): Promise<number> {
    const bytesLeft = this.fileInfo.size - this.position;
    if (length <= bytesLeft) {
      this.position += length;
      return length;
    }
    this.position += bytesLeft;
    return bytesLeft;
  }

  private async loadRange(range: [number, number]): Promise<void> {

    if (range[0] > this.fileInfo.size - 1) {
      throw new Error('End-Of-File');
    }

    debug(`request range ${range[0]}..${range[1]}`);
    range[1] = Math.min(this.fileInfo.size - 1, range[1]);

    debug(`adjusted range ${range[0]}..${range[1]}`);
    if (this._fileData.hasDataRange(range[0], range[1])) {
      debug(`Read from cache`);
      return Promise.resolve();
    }

    // Always download in multiples of CHUNK_SIZE. If we're going to make a
    // request might as well get a chunk that makes sense. The big cost is
    // establishing the connection so getting 10bytes or 1K doesn't really
    // make a difference.
    range = roundRange(range, this.minimumChunkSize);

    // Upper range should not be greater than max file size
    range[1] = Math.min(this.fileInfo.size - 1, range[1]);

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
  debug(`_parseContentRang response: contentRange=${contentRange}`);

  if (contentRange) {
    const parsedContentRange = contentRange.match(
      /bytes (\d+)-(\d+)\/(?:(\d+)|\*)/i
    );
    if (!parsedContentRange) {
      throw new Error('FIXME: Unknown Content-Range syntax: ' + contentRange);
    }

    return {
      firstBytePosition: parseInt(parsedContentRange[1], 10),
      lastBytePosition: parseInt(parsedContentRange[2], 10),
      instanceLength: parsedContentRange[3] ? parseInt(parsedContentRange[3], 10) : null
    };
  }
}
