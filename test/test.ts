import {assert} from 'chai';
import * as mm from 'music-metadata';
import * as path from 'path';

import { RangeRequestTokenizer } from '../lib/range-request-tokenizer';
import { FsRangeRequestClient } from './FsRangeRequestClient';

describe('range-request-client', function() {

  this.timeout(10 * 1000);

  const config = {
    avoidHeadRequests: false
  };

  it('Parse MP3 using range requests', async () => {
    const fixturePath = path.join(__dirname, 'fixture', '02 - Poxfil - Solid Ground.mp3');
    const rangeRequestClient = new FsRangeRequestClient(fixturePath);

    const rangeRequestTokenizer = new RangeRequestTokenizer(rangeRequestClient, config);
    await rangeRequestTokenizer.init();
    const metadata = await mm.parseFromTokenizer(rangeRequestTokenizer, rangeRequestTokenizer.contentType, {});
    assert.equal(metadata.format.container, 'MPEG', 'metadata.format.container');
    assert.deepEqual(metadata.format.tagTypes, ['ID3v2.4'], 'metadata.format.tagTypes');

  });

});
