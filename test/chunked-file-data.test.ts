/**
 * Code based on: https://github.com/aadsm/jsmediatags/blob/386dc72f6fc96d15138c408956ca501e1b174fbd/src/__tests__/ChunkedFileData-test.js
 */

import { ChunkedFileData, type IChunk, type IChunkRange } from '../lib/chunked-file-data.js';
import { expect } from 'chai';

const NOT_FOUND = -1;


function getByteAt(chunkedFileData: ChunkedFileData | PublicChunkedFileData, offset: number): number {
  const buf = new Uint8Array(1);
  const bytesRead = chunkedFileData.readToBuffer(buf, 0, offset, 1);

  if (bytesRead < 1) {
    throw new Error(`Offset ${offset} hasn't been loaded yet.`);
  }

  return buf[0];
}

interface PublicChunkedFileData {
  _fileData: IChunk[];
  addData(offset: number, data: Uint8Array): void;
  hasDataRange(offsetStart: number, offsetEnd: number): boolean;
  readToBuffer(buffer: Uint8Array, offset: number, position: number, length: number): number;
  _concatData(buffer1: Uint8Array, buffer2: Uint8Array): Uint8Array;
  _getChunkRange(offsetStart: number, offsetEnd: number): IChunkRange;
}

describe('class ChunkedFileData', () => {
  let chunkedFileData: PublicChunkedFileData; // ToDo: currently required to access `._fileData`
  const someData = new Uint8Array(400);

  for (let i = 0; i < someData.byteLength; i++) {
    someData[i] = i;
  }

  function sliceData(offset: number, length: number) {
    return someData.slice(offset, offset + length);
  }

  beforeEach(() => {
    chunkedFileData = new ChunkedFileData() as unknown as PublicChunkedFileData;
  });

  describe('adding data', () => {
    it('should add a chunk when there are no chunks', () => {
      const offset = 100;
      const data = sliceData(offset, 50);
      chunkedFileData.addData(offset, data);

      expect(chunkedFileData._fileData.length).to.eql(1);
      const chunk = chunkedFileData._fileData[0];
      expect(chunk.offset).to.eql(offset);
      expect(chunk.data).to.eql(data);
    });

    it('should add data at the end of the list', () => {
      chunkedFileData.addData(100, sliceData(100, 50));

      const offset = 200;
      const data = sliceData(offset, 50);
      chunkedFileData.addData(offset, data);

      expect(chunkedFileData._fileData.length).to.eql(2);
      const chunk = chunkedFileData._fileData[1];
      expect(chunk.offset).to.eql(offset);
      expect(chunk.data).to.eql(data);
    });

    it('should add data at the start of the list', () => {
      chunkedFileData.addData(100, sliceData(100, 50));

      const offset = 20;
      const data = sliceData(offset, 50);
      chunkedFileData.addData(offset, data);

      expect(chunkedFileData._fileData.length).to.eql(2);
      const chunk = chunkedFileData._fileData[0];
      expect(chunk.offset).to.eql(offset);
      expect(chunk.data).to.eql(data);
    });

    it('should add data in the middle of the list', () => {
      chunkedFileData.addData(100, sliceData(100, 50));
      chunkedFileData.addData(200, sliceData(200, 50));

      const offset = 160;
      const data = sliceData(offset, 20);
      chunkedFileData.addData(offset, data);

      expect(chunkedFileData._fileData.length).to.eql(3);
      const chunk = chunkedFileData._fileData[1];
      expect(chunk.offset).to.eql(offset);
      expect(chunk.data).to.eql(data);
    });

    describe('overlapping and adjacent data', () => {
      beforeEach(() => {
        chunkedFileData.addData(100, someData.slice(100, 150));
        chunkedFileData.addData(200, someData.slice(200, 250));
        chunkedFileData.addData(300, someData.slice(300, 350));
      });

      it('should expand chunk when data has more data at the tail', () => {
        const offset = 120;
        const data = sliceData(offset, 50);
        const chunksCount = chunkedFileData._fileData.length;
        chunkedFileData.addData(offset, data);

        expect(chunkedFileData._fileData.length).to.eql(chunksCount);
        const chunk = chunkedFileData._fileData[0];
        expect(chunk.offset).to.eql(100);
        const expectedData = sliceData(100, 70);
        expect(chunk.data).to.eql(expectedData);
      });

      it('should expand chunk when data coincides exactly with the end of a chunk', () => {
        const offset = 150;
        const data = sliceData(offset, 20);
        const chunksCount = chunkedFileData._fileData.length;

        chunkedFileData.addData(offset, data);
        expect(chunkedFileData._fileData.length).to.eql(chunksCount);
        const chunk = chunkedFileData._fileData[0];
        expect(chunk.data).to.eql(sliceData(100, 70));
      });

      it('should expand chunk when data has more data at the head', () => {
        const offset = 80;
        const data = sliceData(offset, 50);
        const chunksCount = chunkedFileData._fileData.length;
        chunkedFileData.addData(offset, data);

        expect(chunkedFileData._fileData.length).to.eql(chunksCount);
        const chunk = chunkedFileData._fileData[0];
        expect(chunk.offset).to.eql(offset);
        expect(chunk.data).to.eql(sliceData(offset, 70));
      });

      it('should expand chunk when data coincides exactly with the start of a chunk', () => {
        const offset = 180;
        const data = sliceData(offset, 20);
        const chunksCount = chunkedFileData._fileData.length;

        chunkedFileData.addData(offset, data);
        expect(chunkedFileData._fileData.length).to.eql(chunksCount);
        const chunk = chunkedFileData._fileData[1];
        expect(chunk.data).to.eql(sliceData(180, 70));
      });

      it('should expand chunk when data coincides exactly with the start of a chunk', () => {
        const offset = 180;
        const data = sliceData(offset, 20);
        const chunksCount = chunkedFileData._fileData.length;

        chunkedFileData.addData(offset, data);
        expect(chunkedFileData._fileData.length).to.eql(chunksCount);
        const chunk = chunkedFileData._fileData[1];
        expect(chunk.data).to.eql(sliceData(180, 70));
      });

      it('should replace chunks when data overlaps at the head and at the tail', () => {
        const offset = 140;
        const data = sliceData(offset, 70);
        const chunksCount = chunkedFileData._fileData.length;
        chunkedFileData.addData(offset, data);

        expect(chunkedFileData._fileData.length).to.eql(chunksCount - 1);
        const chunk = chunkedFileData._fileData[0];
        expect(chunk.offset).to.eql(100);
        expect(chunk.data).to.eql(sliceData(100, 150));
      });

      it('should not change chunks when data is already stored', () => {
        const offset = 100;
        const data = sliceData(offset, 50);
        const chunksCount = chunkedFileData._fileData.length;

        chunkedFileData.addData(offset, data);
        expect(chunkedFileData._fileData.length).to.eql(chunksCount);
        const chunk = chunkedFileData._fileData[0];
        expect(chunk.data).to.eql(sliceData(offset, 50));
      });

      it('should remove chunks that are covered by new data', () => {
        const offset = 50;
        const data = sliceData(offset, 220);
        const chunksCount = chunkedFileData._fileData.length;

        chunkedFileData.addData(offset, data);
        expect(chunkedFileData._fileData.length).to.eql(chunksCount - 1);
        const chunk = chunkedFileData._fileData[0];
        expect(chunk.data).to.eql(sliceData(offset, 220));
      });

      it('should add data that completely covers an existing chunk', () => {
        const offset = 100;
        const data = sliceData(offset, 70);
        const chunksCount = chunkedFileData._fileData.length;

        chunkedFileData.addData(offset, data);
        expect(chunkedFileData._fileData.length).to.eql(chunksCount);
        const chunk = chunkedFileData._fileData[0];
        expect(chunk.data).to.eql(sliceData(offset, 70));
      });
    });
  });

  describe('range chunks', () => {
    beforeEach(() => {
      chunkedFileData.addData(100, someData.slice(100, 150));
      chunkedFileData.addData(200, someData.slice(200, 250));
      chunkedFileData.addData(300, someData.slice(300, 350));
    });

    it('should find no range when no chunks exist', () => {
      chunkedFileData = new ChunkedFileData() as unknown as PublicChunkedFileData;

      const range = chunkedFileData._getChunkRange(100, 200);
      expect(range.startIx).equals(NOT_FOUND, 'startIx');
      expect(range.endIx).equals(NOT_FOUND, 'endIx');
      expect(range.insertIx).equals(0, 'insertIx');
    });

    it('should find no range when offset is before any chunk', () => {
      const range = chunkedFileData._getChunkRange(50, 70);
      expect(range.startIx).to.eql(NOT_FOUND, 'startIx');
      expect(range.endIx).to.eql(NOT_FOUND, 'endIx');
      expect(range.insertIx).to.eql(0, 'insertIx');
    });

    it('should find no range when offset is after all chunks', () => {
      const range = chunkedFileData._getChunkRange(500, 600);
      expect(range.startIx).to.eql(NOT_FOUND, 'startIx');
      expect(range.endIx).to.eql(NOT_FOUND, 'endIx');
      expect(range.insertIx).to.eql(3, 'insertIx');
    });

    it('should find no range when offset is between chunks', () => {
      const range = chunkedFileData._getChunkRange(170, 190);
      expect(range.startIx).to.eql(NOT_FOUND, 'startIx');
      expect(range.endIx).to.eql(NOT_FOUND, 'endIx');
      expect(range.insertIx).to.eql(1, 'insertIx');
    });

    it('should find a range when offset completly overlaps a chunk', () => {
      const range = chunkedFileData._getChunkRange(170, 270);
      expect(range.startIx).to.eql(1, 'startIx');
      expect(range.endIx).to.eql(1, 'endIx');
    });

    it('should find a range when offset completly overlaps several chunks', () => {
      const range = chunkedFileData._getChunkRange(50, 500);
      expect(range.startIx).to.eql(0, 'startIx');
      expect(range.endIx).to.eql(2, 'endIx');
    });

    it('should find a range when offset is completly overlapped by a chunk', () => {
      const range = chunkedFileData._getChunkRange(210, 240);
      expect(range.startIx).to.eql(1, 'startIx');
      expect(range.endIx).to.eql(1, 'endIx');
    });

    it('should find a range when offset head partially overlapps a chunk', () => {
      const range = chunkedFileData._getChunkRange(210, 270);
      expect(range.startIx).to.eql(1, 'startIx');
      expect(range.endIx).to.eql(1, 'endIx');
    });

    it('should find a range when offset tail partially overlapps a chunk', () => {
      const range = chunkedFileData._getChunkRange(170, 210);
      expect(range.startIx).to.eql(1, 'startIx');
      expect(range.endIx).to.eql(1, 'endIx');
    });

    it('should find a range when offset is left adjacent to a chunk', () => {
      const range = chunkedFileData._getChunkRange(170, 199);
      expect(range.startIx).to.eql(1, 'startIx');
      expect(range.endIx).to.eql(1, 'endIx');
    });

    it('should find a range when offset is right adjacent to a chunk', () => {
      const range = chunkedFileData._getChunkRange(250, 270);
      expect(range.startIx).to.eql(1, 'startIx');
      expect(range.endIx).to.eql(1, 'endIx');
    });
  });

  describe('hasDataRange', () => {
    beforeEach(() => {
      chunkedFileData.addData(100, someData.slice(100, 150));
      chunkedFileData.addData(200, someData.slice(200, 250));
      chunkedFileData.addData(300, someData.slice(300, 350));
    });

    it('should not have data range when offsets are after all chunks', () => {
      const hasRange = chunkedFileData.hasDataRange(400, 500);
      expect(hasRange).to.eql(false);
    });

    it('should not have data range when offsets are in between chunks', () => {
      const hasRange = chunkedFileData.hasDataRange(270, 290);
      expect(hasRange).to.eql(false);
    });

    it('should not have data range when offsets are partially overlapping a chunk', () => {
      const hasRange = chunkedFileData.hasDataRange(230, 270);
      expect(hasRange).to.eql(false);
    });

    it('should have data range when offsets are completely overlapping a chunk', () => {
      const hasRange = chunkedFileData.hasDataRange(210, 240);
      expect(hasRange).to.eql(true);
    });

    it('should have data range when offsets match a chunk', () => {
      const hasRange = chunkedFileData.hasDataRange(200, 249);
      expect(hasRange).to.eql(true);
    });

    it('should not have data range when offsets does not match a chunk by 1', () => {
      const hasRange = chunkedFileData.hasDataRange(200, 250);
      expect(hasRange).to.eql(false);
    });
  });

  it('should read data when offsets match', () => {
    chunkedFileData.addData(0, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));
    const iByte = getByteAt(chunkedFileData, 2);

    expect(iByte).to.eql(0x03);
  });

  it('should read data when offsets are mapped', () => {
    chunkedFileData.addData(100, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));
    const iByte = getByteAt(chunkedFileData, 102);

    expect(iByte).to.eql(0x03);
  });

  it('should read data from the right range', () => {
    chunkedFileData.addData(100, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));
    chunkedFileData.addData(200, new Uint8Array([0x11, 0x12, 0x13, 0x14, 0x15]));
    const iByte = getByteAt(chunkedFileData, 202);

    expect(iByte).to.eql(0x13);
  });

  it('should fail to read when data is not loaded before any chunks', () => {
    chunkedFileData.addData(100, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));

    expect(() => {
      getByteAt(chunkedFileData, 0);
    }).throw();
  });

  it('should fail to read when data is not loaded between chunks', () => {
    chunkedFileData.addData(0, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));
    chunkedFileData.addData(100, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));

    expect(() => {
      getByteAt(chunkedFileData, 50);
    }).throw();
  });

  it('should fail to read when data is not loaded after all chunks', () => {
    chunkedFileData.addData(0, new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));

    expect(() => {
      getByteAt(chunkedFileData, 100);
    }).throw();
  });

  it('should add TypedArrays', () => {
    const intArray = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
    chunkedFileData.addData(5, intArray);

    expect(() => {
      // Append
      chunkedFileData.addData(6, intArray);
      // Prepend
      chunkedFileData.addData(1, intArray);
    }).not.throw();
  });
});
