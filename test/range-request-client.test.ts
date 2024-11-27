import { assert } from 'chai';
import * as mm from 'music-metadata';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as rangeRequestTokenizer from '../lib/index.js';
import { FsRangeRequestClient } from './FsRangeRequestClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('range-request-client', function() {

  this.timeout(10 * 1000);

  const config = {
    avoidHeadRequests: false
  };

  it('Parse MP3 using range requests', async () => {
    const fixturePath = path.join(__dirname, 'fixture', '02 - Poxfil - Solid Ground.mp3');
    const rangeRequestClient = new FsRangeRequestClient(fixturePath);

    const tokenizer = await rangeRequestTokenizer.tokenizer(rangeRequestClient, config);
    try {
      const {format, common} = await mm.parseFromTokenizer(tokenizer);

      assert.equal(format.container, 'MPEG', 'metadata.format.container');
      assert.equal(format.codec, 'MPEG 1 Layer 3', 'format.codec');
      assert.equal(format.codecProfile, 'V0', 'format.codecProfile');
      assert.deepEqual(format.tagTypes, ['ID3v2.4', 'ID3v1'], 'metadata.format.tagTypes');

      assert.equal(common.artist, 'Poxfil', 'common.artist');
      assert.equal(common.title, 'Solid Ground', 'common.title');
    } finally {
      await tokenizer.close();
    }
  });

  it('Parse empty PDF file', async () => {
    const fixturePath = path.join(__dirname, 'fixture', 'emptypage.pdf');
    const rangeRequestClient = new FsRangeRequestClient(fixturePath);

    const tokenizer = await rangeRequestTokenizer.tokenizer(rangeRequestClient, config);
    try {
      try {
        await mm.parseFromTokenizer(tokenizer);
        assert.fail();
      } catch (err) {
        assert.isDefined((err as Error).message);
        assert.match((err as Error).message, /application\/pdf/);
      }
    } finally {
      await tokenizer.close();
    }

  });

  it('Support random-access-read', async () => {
    const fixturePath = path.join(__dirname, 'fixture', '02 - Poxfil - Solid Ground.mp3');
    const rangeRequestClient = new FsRangeRequestClient(fixturePath);
    const tokenizer = await rangeRequestTokenizer.tokenizer(rangeRequestClient, config);

    const textDecoder = new TextDecoder('utf-8');

    try {
      assert.strictEqual(tokenizer.position, 0, 'tokenizer.position');
      assert.isTrue(tokenizer.supportsRandomAccess());
      // Read ID3v1 header at the end of the file
      const id3v1HeaderSize = 128;
      const id3v1Header = new Uint8Array(id3v1HeaderSize);
      await tokenizer.readBuffer(id3v1Header,{position: tokenizer.fileInfo.size - id3v1HeaderSize});
      const id3v1Tag = textDecoder.decode(id3v1Header.subarray(0, 3));
      assert.strictEqual(id3v1Tag, 'TAG');
      assert.strictEqual(tokenizer.position, tokenizer.fileInfo.size, 'Tokenizer position should be at the end of the file');
      tokenizer.setPosition(0);
      assert.strictEqual(tokenizer.position, 0, 'Tokenizer position should be at the beginning of the file');

      // Read ID3v2 header at the beginning of the file
      const id3v2Header = new Uint8Array(3);
      await tokenizer.readBuffer(id3v2Header);
      const id3v2Tag = textDecoder.decode(id3v2Header);
      assert.strictEqual(id3v2Tag, "ID3", 'Read start tag of ID3v2 header at the beginning of the file');
    } finally {
      await tokenizer.close();
    }

  });
});
