[![Node.js CI](https://github.com/Borewit/tokenizer-range/actions/workflows/nodejs-ci.yml/badge.svg?branch=master)](https://github.com/Borewit/tokenizer-range/actions/workflows/nodejs-ci.yml)
[![CodeQL](https://github.com/Borewit/tokenizer-range/actions/workflows/codeql.yml/badge.svg?branch=master)](https://github.com/Borewit/tokenizer-range/actions/workflows/codeql.yml)
[![NPM version](https://badge.fury.io/js/%40tokenizer%2Frange.svg)](https://badge.fury.io/js/%40tokenizer%2Frange)
[![npm downloads](http://img.shields.io/npm/dm/@tokenizer/range.svg)](https://npmcharts.com/compare/@tokenizer/range?interval=30)
[![Known Vulnerabilities](https://snyk.io/test/github/Borewit/tokenizer-range/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Borewit/tokenizer-range?targetFile=package.json)

# @tokenizer/range

Adapter to designed to convert [strtok3 _tokenizer_](https://github.com/Borewit/strtok3#tokenizer) to [RFC-7233](https://tools.ietf.org/html/rfc7233#section-2.3) [range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests).

It is an **abstract** module which implements the range request mechanism which can be used by different implementations, like:
* [@tokenizer/http](https://github.com/Borewit/tokenizer-http): An HTTP(S) client
* [@tokenizer/s3](https://github.com/Borewit/tokenizer-s3): An Amazon S3 client

## Compatibility
This module can be used both in the browser and in [Node.js](https://nodejs.org).

## Installation

Install using [npm](https://www.npmjs.com/get-npm):
```shell script
npm install @tokenizer/range
```

or using [yarn](https://yarnpkg.com/):
```shell script
yarn add @tokenizer/range
```

## Usage

```js
(async () => {
  const config = {
    avoidHeadRequests: false
  };

  let rangeRequestClient; // HTTP implementation, or HTTP cloud access adaptor

  const tokenizer = await rangeRequestTokenizer.tokenizer(rangeRequestClient, config);
})();
```

## Range-request-client

The `IRangeRequestClient` defines the interface to map, presumably an HTTP client, to the range request mechanism.

```ts
/**
 * Implementation of the range-request-client
 */
export interface IRangeRequestClient {

  /**
   * Head request to determine the size and MIME-type of the file
   * @return HEAD-request information
   */
  getHeadInfo?(): Promise<IHeadRequestInfo>;

  /**
   *
   * @param method - HTTP method
   * @param range - Array of 2 numbers: The range-start and range-end. An integer indicating the beginning and the end of range request in bytes.
   * @return Range request response
   */
  getResponse(method: string, range?: [number, number]): Promise<IRangeRequestResponse>;
}
```

For further details of the interface see: [lib/types.ts](lib/types.ts)

Example implementations of the `IRangeRequestClient` interface:
* [@tokenizer/s3](https://github.com/Borewit/tokenizer-s3/blob/master/lib/s3-request.ts)
* [@tokenizer/http](https://github.com/Borewit/tokenizer-http/blob/master/lib/http-client.ts)

## Licence

(The MIT License)

Copyright (c) 2018 Borewit

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
git pull
THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
