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
    const {format, common} = await mm.parseFromTokenizer(rangeRequestTokenizer, rangeRequestTokenizer.contentType, {});

    assert.equal(format.container, 'MPEG', 'metadata.format.container');
    assert.equal(format.codec, 'MP3', 'format.codec');
    assert.equal(format.codecProfile, 'V0', 'format.codecProfile');
    assert.deepEqual(format.tagTypes, ['ID3v2.4', 'ID3v1'], 'metadata.format.tagTypes');

    assert.equal(common.artist, 'Poxfil', 'common.artist');
    assert.equal(common.title, 'Solid Ground', 'common.title');
  });

});
