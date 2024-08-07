import { assert } from 'chai';
import * as mm from 'music-metadata';
import * as path from 'node:path';
import { fileURLToPath } from 'url';

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

    const {format, common} = await mm.parseFromTokenizer(tokenizer);

    assert.equal(format.container, 'MPEG', 'metadata.format.container');
    assert.equal(format.codec, 'MPEG 1 Layer 3', 'format.codec');
    assert.equal(format.codecProfile, 'V0', 'format.codecProfile');
    assert.deepEqual(format.tagTypes, ['ID3v2.4', 'ID3v1'], 'metadata.format.tagTypes');

    assert.equal(common.artist, 'Poxfil', 'common.artist');
    assert.equal(common.title, 'Solid Ground', 'common.title');
  });

  it('Parse empty PDF file', async () => {
    const fixturePath = path.join(__dirname, 'fixture', 'emptypage.pdf');
    const rangeRequestClient = new FsRangeRequestClient(fixturePath);

    const tokenizer = await rangeRequestTokenizer.tokenizer(rangeRequestClient, config);

    try {
      await mm.parseFromTokenizer(tokenizer);
      assert.fail();
    } catch (err) {
      assert.isDefined((err as Error).message);
      assert.match((err as Error).message, /application\/pdf/);
    }
  });
});
