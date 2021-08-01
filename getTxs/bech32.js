(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],4:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":2,"buffer":4,"ieee754":6}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

},{}],6:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],8:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],9:[function(require,module,exports){
(function (process){(function (){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this)}).call(this,require('_process'))
},{"_process":10}],10:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],11:[function(require,module,exports){
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype)

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":4}],12:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/lib/_stream_readable.js');
Stream.Writable = require('readable-stream/lib/_stream_writable.js');
Stream.Duplex = require('readable-stream/lib/_stream_duplex.js');
Stream.Transform = require('readable-stream/lib/_stream_transform.js');
Stream.PassThrough = require('readable-stream/lib/_stream_passthrough.js');
Stream.finished = require('readable-stream/lib/internal/streams/end-of-stream.js')
Stream.pipeline = require('readable-stream/lib/internal/streams/pipeline.js')

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":5,"inherits":7,"readable-stream/lib/_stream_duplex.js":14,"readable-stream/lib/_stream_passthrough.js":15,"readable-stream/lib/_stream_readable.js":16,"readable-stream/lib/_stream_transform.js":17,"readable-stream/lib/_stream_writable.js":18,"readable-stream/lib/internal/streams/end-of-stream.js":22,"readable-stream/lib/internal/streams/pipeline.js":24}],13:[function(require,module,exports){
'use strict';

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var codes = {};

function createErrorType(code, message, Base) {
  if (!Base) {
    Base = Error;
  }

  function getMessage(arg1, arg2, arg3) {
    if (typeof message === 'string') {
      return message;
    } else {
      return message(arg1, arg2, arg3);
    }
  }

  var NodeError =
  /*#__PURE__*/
  function (_Base) {
    _inheritsLoose(NodeError, _Base);

    function NodeError(arg1, arg2, arg3) {
      return _Base.call(this, getMessage(arg1, arg2, arg3)) || this;
    }

    return NodeError;
  }(Base);

  NodeError.prototype.name = Base.name;
  NodeError.prototype.code = code;
  codes[code] = NodeError;
} // https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js


function oneOf(expected, thing) {
  if (Array.isArray(expected)) {
    var len = expected.length;
    expected = expected.map(function (i) {
      return String(i);
    });

    if (len > 2) {
      return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(', '), ", or ") + expected[len - 1];
    } else if (len === 2) {
      return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
    } else {
      return "of ".concat(thing, " ").concat(expected[0]);
    }
  } else {
    return "of ".concat(thing, " ").concat(String(expected));
  }
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith


function startsWith(str, search, pos) {
  return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith


function endsWith(str, search, this_len) {
  if (this_len === undefined || this_len > str.length) {
    this_len = str.length;
  }

  return str.substring(this_len - search.length, this_len) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes


function includes(str, search, start) {
  if (typeof start !== 'number') {
    start = 0;
  }

  if (start + search.length > str.length) {
    return false;
  } else {
    return str.indexOf(search, start) !== -1;
  }
}

createErrorType('ERR_INVALID_OPT_VALUE', function (name, value) {
  return 'The value "' + value + '" is invalid for option "' + name + '"';
}, TypeError);
createErrorType('ERR_INVALID_ARG_TYPE', function (name, expected, actual) {
  // determiner: 'must be' or 'must not be'
  var determiner;

  if (typeof expected === 'string' && startsWith(expected, 'not ')) {
    determiner = 'must not be';
    expected = expected.replace(/^not /, '');
  } else {
    determiner = 'must be';
  }

  var msg;

  if (endsWith(name, ' argument')) {
    // For cases like 'first argument'
    msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  } else {
    var type = includes(name, '.') ? 'property' : 'argument';
    msg = "The \"".concat(name, "\" ").concat(type, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  }

  msg += ". Received type ".concat(typeof actual);
  return msg;
}, TypeError);
createErrorType('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF');
createErrorType('ERR_METHOD_NOT_IMPLEMENTED', function (name) {
  return 'The ' + name + ' method is not implemented';
});
createErrorType('ERR_STREAM_PREMATURE_CLOSE', 'Premature close');
createErrorType('ERR_STREAM_DESTROYED', function (name) {
  return 'Cannot call ' + name + ' after a stream was destroyed';
});
createErrorType('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times');
createErrorType('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable');
createErrorType('ERR_STREAM_WRITE_AFTER_END', 'write after end');
createErrorType('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError);
createErrorType('ERR_UNKNOWN_ENCODING', function (arg) {
  return 'Unknown encoding: ' + arg;
}, TypeError);
createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event');
module.exports.codes = codes;

},{}],14:[function(require,module,exports){
(function (process){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.
'use strict';
/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];

  for (var key in obj) {
    keys.push(key);
  }

  return keys;
};
/*</replacement>*/


module.exports = Duplex;

var Readable = require('./_stream_readable');

var Writable = require('./_stream_writable');

require('inherits')(Duplex, Readable);

{
  // Allow the keys array to be GC'ed.
  var keys = objectKeys(Writable.prototype);

  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);
  Readable.call(this, options);
  Writable.call(this, options);
  this.allowHalfOpen = true;

  if (options) {
    if (options.readable === false) this.readable = false;
    if (options.writable === false) this.writable = false;

    if (options.allowHalfOpen === false) {
      this.allowHalfOpen = false;
      this.once('end', onend);
    }
  }
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});
Object.defineProperty(Duplex.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
Object.defineProperty(Duplex.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
}); // the no-half-open enforcer

function onend() {
  // If the writable side ended, then we're ok.
  if (this._writableState.ended) return; // no more data can be written.
  // But allow more writes to happen in this tick.

  process.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }

    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});
}).call(this)}).call(this,require('_process'))
},{"./_stream_readable":16,"./_stream_writable":18,"_process":10,"inherits":7}],15:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.
'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

require('inherits')(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);
  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":17,"inherits":7}],16:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';

module.exports = Readable;
/*<replacement>*/

var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;
/*<replacement>*/

var EE = require('events').EventEmitter;

var EElistenerCount = function EElistenerCount(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/


var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*<replacement>*/


var debugUtil = require('util');

var debug;

if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function debug() {};
}
/*</replacement>*/


var BufferList = require('./internal/streams/buffer_list');

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT; // Lazy loaded to improve the startup performance.


var StringDecoder;
var createReadableStreamAsyncIterator;
var from;

require('inherits')(Readable, Stream);

var errorOrDestroy = destroyImpl.errorOrDestroy;
var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn); // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.

  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode; // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"

  this.highWaterMark = getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex); // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()

  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false; // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.

  this.sync = true; // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.

  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;
  this.paused = true; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'end' (and potentially 'finish')

  this.autoDestroy = !!options.autoDestroy; // has it been destroyed

  this.destroyed = false; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // the number of writers that are awaiting a drain event in .pipe()s

  this.awaitDrain = 0; // if true, a maybeReadMore has been scheduled

  this.readingMore = false;
  this.decoder = null;
  this.encoding = null;

  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');
  if (!(this instanceof Readable)) return new Readable(options); // Checking for a Stream.Duplex instance is faster here instead of inside
  // the ReadableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  this._readableState = new ReadableState(options, this, isDuplex); // legacy

  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined) {
      return false;
    }

    return this._readableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
  }
});
Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;

Readable.prototype._destroy = function (err, cb) {
  cb(err);
}; // Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.


Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;

      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }

      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
}; // Unshift should *always* be something directly out of read()


Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  debug('readableAddChunk', chunk);
  var state = stream._readableState;

  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);

    if (er) {
      errorOrDestroy(stream, er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
      } else if (state.destroyed) {
        return false;
      } else {
        state.reading = false;

        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
      maybeReadMore(stream, state);
    }
  } // We can push more data if we are below the highWaterMark.
  // Also, if we have no data yet, we can stand some more bytes.
  // This is to work around cases where hwm=0, such as the repl.


  return !state.ended && (state.length < state.highWaterMark || state.length === 0);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    state.awaitDrain = 0;
    stream.emit('data', chunk);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
    if (state.needReadable) emitReadable(stream);
  }

  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;

  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk);
  }

  return er;
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
}; // backwards compatibility.


Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  var decoder = new StringDecoder(enc);
  this._readableState.decoder = decoder; // If setEncoding(null), decoder.encoding equals utf8

  this._readableState.encoding = this._readableState.decoder.encoding; // Iterate over current buffer to convert already stored Buffers:

  var p = this._readableState.buffer.head;
  var content = '';

  while (p !== null) {
    content += decoder.write(p.data);
    p = p.next;
  }

  this._readableState.buffer.clear();

  if (content !== '') this._readableState.buffer.push(content);
  this._readableState.length = content.length;
  return this;
}; // Don't raise the hwm > 1GB


var MAX_HWM = 0x40000000;

function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    // TODO(ronag): Throw ERR_VALUE_OUT_OF_RANGE.
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }

  return n;
} // This function is designed to be inlinable, so please take care when making
// changes to the function body.


function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;

  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  } // If we're asking for more than the current hwm, then raise the hwm.


  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n; // Don't have enough

  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }

  return state.length;
} // you can override either this method, or the async _read(n) below.


Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;
  if (n !== 0) state.emittedReadable = false; // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.

  if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state); // if we've ended, and we're now clear, then finish it up.

  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  } // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.
  // if we need a readable event, then we need to do some reading.


  var doRead = state.needReadable;
  debug('need readable', doRead); // if we currently have less than the highWaterMark, then also read some

  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  } // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.


  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true; // if the length is currently zero, then we *need* a readable event.

    if (state.length === 0) state.needReadable = true; // call internal read method

    this._read(state.highWaterMark);

    state.sync = false; // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.

    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = state.length <= state.highWaterMark;
    n = 0;
  } else {
    state.length -= n;
    state.awaitDrain = 0;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true; // If we tried to read() past the EOF, then emit end on the next tick.

    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);
  return ret;
};

function onEofChunk(stream, state) {
  debug('onEofChunk');
  if (state.ended) return;

  if (state.decoder) {
    var chunk = state.decoder.end();

    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }

  state.ended = true;

  if (state.sync) {
    // if we are sync, wait until next tick to emit the data.
    // Otherwise we risk emitting data in the flow()
    // the readable code triggers during a read() call
    emitReadable(stream);
  } else {
    // emit 'readable' now to make sure it gets picked up.
    state.needReadable = false;

    if (!state.emittedReadable) {
      state.emittedReadable = true;
      emitReadable_(stream);
    }
  }
} // Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.


function emitReadable(stream) {
  var state = stream._readableState;
  debug('emitReadable', state.needReadable, state.emittedReadable);
  state.needReadable = false;

  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    process.nextTick(emitReadable_, stream);
  }
}

function emitReadable_(stream) {
  var state = stream._readableState;
  debug('emitReadable_', state.destroyed, state.length, state.ended);

  if (!state.destroyed && (state.length || state.ended)) {
    stream.emit('readable');
    state.emittedReadable = false;
  } // The stream needs another readable event if
  // 1. It is not flowing, as the flow mechanism will take
  //    care of it.
  // 2. It is not ended.
  // 3. It is below the highWaterMark, so we can schedule
  //    another readable later.


  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
  flow(stream);
} // at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.


function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  // Attempt to read more data if we should.
  //
  // The conditions for reading more data are (one of):
  // - Not enough data buffered (state.length < state.highWaterMark). The loop
  //   is responsible for filling the buffer with enough data if such data
  //   is available. If highWaterMark is 0 and we are not in the flowing mode
  //   we should _not_ attempt to buffer any extra data. We'll get more data
  //   when the stream consumer calls read() instead.
  // - No data in the buffer, and the stream is in flowing mode. In this mode
  //   the loop below is responsible for ensuring read() is called. Failing to
  //   call read here would abort the flow and there's no other mechanism for
  //   continuing the flow if the stream consumer has just subscribed to the
  //   'data' event.
  //
  // In addition to the above conditions to keep reading data, the following
  // conditions prevent the data from being read:
  // - The stream has ended (state.ended).
  // - There is already a pending 'read' operation (state.reading). This is a
  //   case where the the stream has called the implementation defined _read()
  //   method, but they are processing the call asynchronously and have _not_
  //   called push() with new data. In this case we skip performing more
  //   read()s. The execution ends in this method again after the _read() ends
  //   up calling push() with more data.
  while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
    var len = state.length;
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length) // didn't get any data, stop spinning.
      break;
  }

  state.readingMore = false;
} // abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.


Readable.prototype._read = function (n) {
  errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED('_read()'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;

    case 1:
      state.pipes = [state.pipes, dest];
      break;

    default:
      state.pipes.push(dest);
      break;
  }

  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) process.nextTick(endFn);else src.once('end', endFn);
  dest.on('unpipe', onunpipe);

  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');

    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  } // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.


  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);
  var cleanedUp = false;

  function cleanup() {
    debug('cleanup'); // cleanup event handlers once the pipe is broken

    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);
    cleanedUp = true; // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.

    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);

  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    debug('dest.write', ret);

    if (ret === false) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', state.awaitDrain);
        state.awaitDrain++;
      }

      src.pause();
    }
  } // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.


  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) errorOrDestroy(dest, er);
  } // Make sure our error handler is attached before userland ones.


  prependListener(dest, 'error', onerror); // Both close and finish should trigger unpipe, but only once.

  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }

  dest.once('close', onclose);

  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }

  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  } // tell the dest that it's being piped to


  dest.emit('pipe', src); // start the flow if it hasn't been started already.

  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function pipeOnDrainFunctionResult() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;

    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = {
    hasUnpiped: false
  }; // if we're not piping anywhere, then do nothing.

  if (state.pipesCount === 0) return this; // just one destination.  most common case.

  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;
    if (!dest) dest = state.pipes; // got a match.

    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  } // slow case. multiple pipe destinations.


  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, {
        hasUnpiped: false
      });
    }

    return this;
  } // try to find the right one.


  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;
  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];
  dest.emit('unpipe', this, unpipeInfo);
  return this;
}; // set up data events if they are asked for
// Ensure readable listeners eventually get something


Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);
  var state = this._readableState;

  if (ev === 'data') {
    // update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0; // Try start flowing on next tick if stream isn't explicitly paused

    if (state.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.flowing = false;
      state.emittedReadable = false;
      debug('on readable', state.length, state.reading);

      if (state.length) {
        emitReadable(this);
      } else if (!state.reading) {
        process.nextTick(nReadingNextTick, this);
      }
    }
  }

  return res;
};

Readable.prototype.addListener = Readable.prototype.on;

Readable.prototype.removeListener = function (ev, fn) {
  var res = Stream.prototype.removeListener.call(this, ev, fn);

  if (ev === 'readable') {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

Readable.prototype.removeAllListeners = function (ev) {
  var res = Stream.prototype.removeAllListeners.apply(this, arguments);

  if (ev === 'readable' || ev === undefined) {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

function updateReadableListening(self) {
  var state = self._readableState;
  state.readableListening = self.listenerCount('readable') > 0;

  if (state.resumeScheduled && !state.paused) {
    // flowing needs to be set to true now, otherwise
    // the upcoming resume will not flow.
    state.flowing = true; // crude way to check if we should resume
  } else if (self.listenerCount('data') > 0) {
    self.resume();
  }
}

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
} // pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.


Readable.prototype.resume = function () {
  var state = this._readableState;

  if (!state.flowing) {
    debug('resume'); // we flow only if there is no one listening
    // for readable, but we still have to call
    // resume()

    state.flowing = !state.readableListening;
    resume(this, state);
  }

  state.paused = false;
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  debug('resume', state.reading);

  if (!state.reading) {
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);

  if (this._readableState.flowing !== false) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }

  this._readableState.paused = true;
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);

  while (state.flowing && stream.read() !== null) {
    ;
  }
} // wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.


Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;
  stream.on('end', function () {
    debug('wrapped end');

    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });
  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk); // don't skip over falsy values in objectMode

    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);

    if (!ret) {
      paused = true;
      stream.pause();
    }
  }); // proxy all the other methods.
  // important when wrapping filters and duplexes.

  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function methodWrap(method) {
        return function methodWrapReturnFunction() {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  } // proxy certain important events.


  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  } // when we try to consume some more bytes, simply unpause the
  // underlying stream.


  this._read = function (n) {
    debug('wrapped _read', n);

    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

if (typeof Symbol === 'function') {
  Readable.prototype[Symbol.asyncIterator] = function () {
    if (createReadableStreamAsyncIterator === undefined) {
      createReadableStreamAsyncIterator = require('./internal/streams/async_iterator');
    }

    return createReadableStreamAsyncIterator(this);
  };
}

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.highWaterMark;
  }
});
Object.defineProperty(Readable.prototype, 'readableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState && this._readableState.buffer;
  }
});
Object.defineProperty(Readable.prototype, 'readableFlowing', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.flowing;
  },
  set: function set(state) {
    if (this._readableState) {
      this._readableState.flowing = state;
    }
  }
}); // exposed for testing purposes only.

Readable._fromList = fromList;
Object.defineProperty(Readable.prototype, 'readableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.length;
  }
}); // Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.

function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;
  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.first();else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = state.buffer.consume(n, state.decoder);
  }
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;
  debug('endReadable', state.endEmitted);

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  debug('endReadableNT', state.endEmitted, state.length); // Check that we didn't get one last unshift.

  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');

    if (state.autoDestroy) {
      // In case of duplex streams we need a way to detect
      // if the writable side is ready for autoDestroy as well
      var wState = stream._writableState;

      if (!wState || wState.autoDestroy && wState.finished) {
        stream.destroy();
      }
    }
  }
}

if (typeof Symbol === 'function') {
  Readable.from = function (iterable, opts) {
    if (from === undefined) {
      from = require('./internal/streams/from');
    }

    return from(Readable, iterable, opts);
  };
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }

  return -1;
}
}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../errors":13,"./_stream_duplex":14,"./internal/streams/async_iterator":19,"./internal/streams/buffer_list":20,"./internal/streams/destroy":21,"./internal/streams/from":23,"./internal/streams/state":25,"./internal/streams/stream":26,"_process":10,"buffer":4,"events":5,"inherits":7,"string_decoder/":27,"util":3}],17:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.
'use strict';

module.exports = Transform;

var _require$codes = require('../errors').codes,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
    ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;

var Duplex = require('./_stream_duplex');

require('inherits')(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;
  var cb = ts.writecb;

  if (cb === null) {
    return this.emit('error', new ERR_MULTIPLE_CALLBACK());
  }

  ts.writechunk = null;
  ts.writecb = null;
  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);
  cb(er);
  var rs = this._readableState;
  rs.reading = false;

  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);
  Duplex.call(this, options);
  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  }; // start out asking for a readable event once data is transformed.

  this._readableState.needReadable = true; // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.

  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;
    if (typeof options.flush === 'function') this._flush = options.flush;
  } // When the writable side finishes, then flush out anything remaining.


  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function' && !this._readableState.destroyed) {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
}; // This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.


Transform.prototype._transform = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_transform()'));
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;

  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
}; // Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.


Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && !ts.transforming) {
    ts.transforming = true;

    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);
  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data); // TODO(BridgeAR): Write a test for these two error cases
  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided

  if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
  if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
  return stream.push(null);
}
},{"../errors":13,"./_stream_duplex":14,"inherits":7}],18:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.
'use strict';

module.exports = Writable;
/* <replacement> */

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
} // It seems a linked list but it is not
// there will be only 2 of these for each stream


function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/


var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;
/*<replacement>*/

var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/

var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
    ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
    ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
    ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;

var errorOrDestroy = destroyImpl.errorOrDestroy;

require('inherits')(Writable, Stream);

function nop() {}

function WritableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream,
  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag to indicate whether or not this stream
  // contains buffers or objects.

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()

  this.highWaterMark = getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex); // if _final has been called

  this.finalCalled = false; // drain event flag.

  this.needDrain = false; // at the start of calling end()

  this.ending = false; // when end() has been called, and returned

  this.ended = false; // when 'finish' is emitted

  this.finished = false; // has it been destroyed

  this.destroyed = false; // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.

  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.

  this.length = 0; // a flag to see when we're in the middle of a write.

  this.writing = false; // when true all writes will be buffered until .uncork() call

  this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.

  this.sync = true; // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.

  this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)

  this.onwrite = function (er) {
    onwrite(stream, er);
  }; // the callback that the user supplies to write(chunk,encoding,cb)


  this.writecb = null; // the amount that is being written when _write is called.

  this.writelen = 0;
  this.bufferedRequest = null;
  this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted

  this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams

  this.prefinished = false; // True if the error was already emitted and should not be thrown again

  this.errorEmitted = false; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'finish' (and potentially 'end')

  this.autoDestroy = !!options.autoDestroy; // count buffered requests

  this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two

  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];

  while (current) {
    out.push(current);
    current = current.next;
  }

  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function writableStateBufferGetter() {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})(); // Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.


var realHasInstance;

if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function value(object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;
      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function realHasInstance(object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex'); // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.
  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the WritableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
  this._writableState = new WritableState(options, this, isDuplex); // legacy.

  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;
    if (typeof options.writev === 'function') this._writev = options.writev;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
} // Otherwise people can pipe Writable streams, which is just wrong.


Writable.prototype.pipe = function () {
  errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
};

function writeAfterEnd(stream, cb) {
  var er = new ERR_STREAM_WRITE_AFTER_END(); // TODO: defer error events consistently everywhere, not just the cb

  errorOrDestroy(stream, er);
  process.nextTick(cb, er);
} // Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.


function validChunk(stream, state, chunk, cb) {
  var er;

  if (chunk === null) {
    er = new ERR_STREAM_NULL_VALUES();
  } else if (typeof chunk !== 'string' && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer'], chunk);
  }

  if (er) {
    errorOrDestroy(stream, er);
    process.nextTick(cb, er);
    return false;
  }

  return true;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
  if (typeof cb !== 'function') cb = nop;
  if (state.ending) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }
  return ret;
};

Writable.prototype.cork = function () {
  this._writableState.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

Object.defineProperty(Writable.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }

  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
}); // if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.

function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);

    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }

  var len = state.objectMode ? 1 : chunk.length;
  state.length += len;
  var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.

  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };

    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }

    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'));else if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    process.nextTick(cb, er); // this can emit finish, and it will always happen
    // after error

    process.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er); // this can emit finish, but finish must
    // always follow error

    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;
  if (typeof cb !== 'function') throw new ERR_MULTIPLE_CALLBACK();
  onwriteStateUpdate(state);
  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state) || stream.destroyed;

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
} // Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.


function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
} // if there's something in the buffer waiting, then process it


function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;
    var count = 0;
    var allBuffers = true;

    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }

    buffer.allBuffers = allBuffers;
    doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite

    state.pendingcb++;
    state.lastBufferedRequest = null;

    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }

    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;
      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--; // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.

      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks

  if (state.corked) {
    state.corked = 1;
    this.uncork();
  } // ignore unnecessary end() calls.


  if (!state.ending) endWritable(this, state, cb);
  return this;
};

Object.defineProperty(Writable.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;

    if (err) {
      errorOrDestroy(stream, err);
    }

    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}

function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function' && !state.destroyed) {
      state.pendingcb++;
      state.finalCalled = true;
      process.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);

  if (need) {
    prefinish(stream, state);

    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');

      if (state.autoDestroy) {
        // In case of duplex streams we need a way to detect
        // if the readable side is ready for autoDestroy as well
        var rState = stream._readableState;

        if (!rState || rState.autoDestroy && rState.endEmitted) {
          stream.destroy();
        }
      }
    }
  }

  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);

  if (cb) {
    if (state.finished) process.nextTick(cb);else stream.once('finish', cb);
  }

  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;

  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  } // reuse the free corkReq.


  state.corkedRequestsFree.next = corkReq;
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._writableState === undefined) {
      return false;
    }

    return this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._writableState.destroyed = value;
  }
});
Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;

Writable.prototype._destroy = function (err, cb) {
  cb(err);
};
}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../errors":13,"./_stream_duplex":14,"./internal/streams/destroy":21,"./internal/streams/state":25,"./internal/streams/stream":26,"_process":10,"buffer":4,"inherits":7,"util-deprecate":29}],19:[function(require,module,exports){
(function (process){(function (){
'use strict';

var _Object$setPrototypeO;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var finished = require('./end-of-stream');

var kLastResolve = Symbol('lastResolve');
var kLastReject = Symbol('lastReject');
var kError = Symbol('error');
var kEnded = Symbol('ended');
var kLastPromise = Symbol('lastPromise');
var kHandlePromise = Symbol('handlePromise');
var kStream = Symbol('stream');

function createIterResult(value, done) {
  return {
    value: value,
    done: done
  };
}

function readAndResolve(iter) {
  var resolve = iter[kLastResolve];

  if (resolve !== null) {
    var data = iter[kStream].read(); // we defer if data is null
    // we can be expecting either 'end' or
    // 'error'

    if (data !== null) {
      iter[kLastPromise] = null;
      iter[kLastResolve] = null;
      iter[kLastReject] = null;
      resolve(createIterResult(data, false));
    }
  }
}

function onReadable(iter) {
  // we wait for the next tick, because it might
  // emit an error with process.nextTick
  process.nextTick(readAndResolve, iter);
}

function wrapForNext(lastPromise, iter) {
  return function (resolve, reject) {
    lastPromise.then(function () {
      if (iter[kEnded]) {
        resolve(createIterResult(undefined, true));
        return;
      }

      iter[kHandlePromise](resolve, reject);
    }, reject);
  };
}

var AsyncIteratorPrototype = Object.getPrototypeOf(function () {});
var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
  get stream() {
    return this[kStream];
  },

  next: function next() {
    var _this = this;

    // if we have detected an error in the meanwhile
    // reject straight away
    var error = this[kError];

    if (error !== null) {
      return Promise.reject(error);
    }

    if (this[kEnded]) {
      return Promise.resolve(createIterResult(undefined, true));
    }

    if (this[kStream].destroyed) {
      // We need to defer via nextTick because if .destroy(err) is
      // called, the error will be emitted via nextTick, and
      // we cannot guarantee that there is no error lingering around
      // waiting to be emitted.
      return new Promise(function (resolve, reject) {
        process.nextTick(function () {
          if (_this[kError]) {
            reject(_this[kError]);
          } else {
            resolve(createIterResult(undefined, true));
          }
        });
      });
    } // if we have multiple next() calls
    // we will wait for the previous Promise to finish
    // this logic is optimized to support for await loops,
    // where next() is only called once at a time


    var lastPromise = this[kLastPromise];
    var promise;

    if (lastPromise) {
      promise = new Promise(wrapForNext(lastPromise, this));
    } else {
      // fast path needed to support multiple this.push()
      // without triggering the next() queue
      var data = this[kStream].read();

      if (data !== null) {
        return Promise.resolve(createIterResult(data, false));
      }

      promise = new Promise(this[kHandlePromise]);
    }

    this[kLastPromise] = promise;
    return promise;
  }
}, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function () {
  return this;
}), _defineProperty(_Object$setPrototypeO, "return", function _return() {
  var _this2 = this;

  // destroy(err, cb) is a private API
  // we can guarantee we have that here, because we control the
  // Readable class this is attached to
  return new Promise(function (resolve, reject) {
    _this2[kStream].destroy(null, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(createIterResult(undefined, true));
    });
  });
}), _Object$setPrototypeO), AsyncIteratorPrototype);

var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator(stream) {
  var _Object$create;

  var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
    value: stream,
    writable: true
  }), _defineProperty(_Object$create, kLastResolve, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kLastReject, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kError, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kEnded, {
    value: stream._readableState.endEmitted,
    writable: true
  }), _defineProperty(_Object$create, kHandlePromise, {
    value: function value(resolve, reject) {
      var data = iterator[kStream].read();

      if (data) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        resolve(createIterResult(data, false));
      } else {
        iterator[kLastResolve] = resolve;
        iterator[kLastReject] = reject;
      }
    },
    writable: true
  }), _Object$create));
  iterator[kLastPromise] = null;
  finished(stream, function (err) {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      var reject = iterator[kLastReject]; // reject if we are waiting for data in the Promise
      // returned by next() and store the error

      if (reject !== null) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        reject(err);
      }

      iterator[kError] = err;
      return;
    }

    var resolve = iterator[kLastResolve];

    if (resolve !== null) {
      iterator[kLastPromise] = null;
      iterator[kLastResolve] = null;
      iterator[kLastReject] = null;
      resolve(createIterResult(undefined, true));
    }

    iterator[kEnded] = true;
  });
  stream.on('readable', onReadable.bind(null, iterator));
  return iterator;
};

module.exports = createReadableStreamAsyncIterator;
}).call(this)}).call(this,require('_process'))
},{"./end-of-stream":22,"_process":10}],20:[function(require,module,exports){
'use strict';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require('buffer'),
    Buffer = _require.Buffer;

var _require2 = require('util'),
    inspect = _require2.inspect;

var custom = inspect && inspect.custom || 'inspect';

function copyBuffer(src, target, offset) {
  Buffer.prototype.copy.call(src, target, offset);
}

module.exports =
/*#__PURE__*/
function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  _createClass(BufferList, [{
    key: "push",
    value: function push(v) {
      var entry = {
        data: v,
        next: null
      };
      if (this.length > 0) this.tail.next = entry;else this.head = entry;
      this.tail = entry;
      ++this.length;
    }
  }, {
    key: "unshift",
    value: function unshift(v) {
      var entry = {
        data: v,
        next: this.head
      };
      if (this.length === 0) this.tail = entry;
      this.head = entry;
      ++this.length;
    }
  }, {
    key: "shift",
    value: function shift() {
      if (this.length === 0) return;
      var ret = this.head.data;
      if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
      --this.length;
      return ret;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.head = this.tail = null;
      this.length = 0;
    }
  }, {
    key: "join",
    value: function join(s) {
      if (this.length === 0) return '';
      var p = this.head;
      var ret = '' + p.data;

      while (p = p.next) {
        ret += s + p.data;
      }

      return ret;
    }
  }, {
    key: "concat",
    value: function concat(n) {
      if (this.length === 0) return Buffer.alloc(0);
      var ret = Buffer.allocUnsafe(n >>> 0);
      var p = this.head;
      var i = 0;

      while (p) {
        copyBuffer(p.data, ret, i);
        i += p.data.length;
        p = p.next;
      }

      return ret;
    } // Consumes a specified amount of bytes or characters from the buffered data.

  }, {
    key: "consume",
    value: function consume(n, hasStrings) {
      var ret;

      if (n < this.head.data.length) {
        // `slice` is the same for buffers and strings.
        ret = this.head.data.slice(0, n);
        this.head.data = this.head.data.slice(n);
      } else if (n === this.head.data.length) {
        // First chunk is a perfect match.
        ret = this.shift();
      } else {
        // Result spans more than one buffer.
        ret = hasStrings ? this._getString(n) : this._getBuffer(n);
      }

      return ret;
    }
  }, {
    key: "first",
    value: function first() {
      return this.head.data;
    } // Consumes a specified amount of characters from the buffered data.

  }, {
    key: "_getString",
    value: function _getString(n) {
      var p = this.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;

      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;else ret += str.slice(0, n);
        n -= nb;

        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = str.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Consumes a specified amount of bytes from the buffered data.

  }, {
    key: "_getBuffer",
    value: function _getBuffer(n) {
      var ret = Buffer.allocUnsafe(n);
      var p = this.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;

      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;

        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = buf.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Make sure the linked list only shows the minimal necessary information.

  }, {
    key: custom,
    value: function value(_, options) {
      return inspect(this, _objectSpread({}, options, {
        // Only inspect one level.
        depth: 0,
        // It should not recurse.
        customInspect: false
      }));
    }
  }]);

  return BufferList;
}();
},{"buffer":4,"util":3}],21:[function(require,module,exports){
(function (process){(function (){
'use strict'; // undocumented cb() API, needed for core, not for public API

function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err) {
      if (!this._writableState) {
        process.nextTick(emitErrorNT, this, err);
      } else if (!this._writableState.errorEmitted) {
        this._writableState.errorEmitted = true;
        process.nextTick(emitErrorNT, this, err);
      }
    }

    return this;
  } // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks


  if (this._readableState) {
    this._readableState.destroyed = true;
  } // if this is a duplex stream mark the writable part as destroyed as well


  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      if (!_this._writableState) {
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else if (!_this._writableState.errorEmitted) {
        _this._writableState.errorEmitted = true;
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else {
        process.nextTick(emitCloseNT, _this);
      }
    } else if (cb) {
      process.nextTick(emitCloseNT, _this);
      cb(err);
    } else {
      process.nextTick(emitCloseNT, _this);
    }
  });

  return this;
}

function emitErrorAndCloseNT(self, err) {
  emitErrorNT(self, err);
  emitCloseNT(self);
}

function emitCloseNT(self) {
  if (self._writableState && !self._writableState.emitClose) return;
  if (self._readableState && !self._readableState.emitClose) return;
  self.emit('close');
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finalCalled = false;
    this._writableState.prefinished = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

function errorOrDestroy(stream, err) {
  // We have tests that rely on errors being emitted
  // in the same tick, so changing this is semver major.
  // For now when you opt-in to autoDestroy we allow
  // the error to be emitted nextTick. In a future
  // semver major update we should change the default to this.
  var rState = stream._readableState;
  var wState = stream._writableState;
  if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);else stream.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy,
  errorOrDestroy: errorOrDestroy
};
}).call(this)}).call(this,require('_process'))
},{"_process":10}],22:[function(require,module,exports){
// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var ERR_STREAM_PREMATURE_CLOSE = require('../../../errors').codes.ERR_STREAM_PREMATURE_CLOSE;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    callback.apply(this, args);
  };
}

function noop() {}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function eos(stream, opts, callback) {
  if (typeof opts === 'function') return eos(stream, null, opts);
  if (!opts) opts = {};
  callback = once(callback || noop);
  var readable = opts.readable || opts.readable !== false && stream.readable;
  var writable = opts.writable || opts.writable !== false && stream.writable;

  var onlegacyfinish = function onlegacyfinish() {
    if (!stream.writable) onfinish();
  };

  var writableEnded = stream._writableState && stream._writableState.finished;

  var onfinish = function onfinish() {
    writable = false;
    writableEnded = true;
    if (!readable) callback.call(stream);
  };

  var readableEnded = stream._readableState && stream._readableState.endEmitted;

  var onend = function onend() {
    readable = false;
    readableEnded = true;
    if (!writable) callback.call(stream);
  };

  var onerror = function onerror(err) {
    callback.call(stream, err);
  };

  var onclose = function onclose() {
    var err;

    if (readable && !readableEnded) {
      if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }

    if (writable && !writableEnded) {
      if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
  };

  var onrequest = function onrequest() {
    stream.req.on('finish', onfinish);
  };

  if (isRequest(stream)) {
    stream.on('complete', onfinish);
    stream.on('abort', onclose);
    if (stream.req) onrequest();else stream.on('request', onrequest);
  } else if (writable && !stream._writableState) {
    // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }

  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (opts.error !== false) stream.on('error', onerror);
  stream.on('close', onclose);
  return function () {
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
}

module.exports = eos;
},{"../../../errors":13}],23:[function(require,module,exports){
module.exports = function () {
  throw new Error('Readable.from is not available in the browser')
};

},{}],24:[function(require,module,exports){
// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var eos;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    callback.apply(void 0, arguments);
  };
}

var _require$codes = require('../../../errors').codes,
    ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;

function noop(err) {
  // Rethrow the error if it exists to avoid swallowing it
  if (err) throw err;
}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function destroyer(stream, reading, writing, callback) {
  callback = once(callback);
  var closed = false;
  stream.on('close', function () {
    closed = true;
  });
  if (eos === undefined) eos = require('./end-of-stream');
  eos(stream, {
    readable: reading,
    writable: writing
  }, function (err) {
    if (err) return callback(err);
    closed = true;
    callback();
  });
  var destroyed = false;
  return function (err) {
    if (closed) return;
    if (destroyed) return;
    destroyed = true; // request.destroy just do .end - .abort is what we want

    if (isRequest(stream)) return stream.abort();
    if (typeof stream.destroy === 'function') return stream.destroy();
    callback(err || new ERR_STREAM_DESTROYED('pipe'));
  };
}

function call(fn) {
  fn();
}

function pipe(from, to) {
  return from.pipe(to);
}

function popCallback(streams) {
  if (!streams.length) return noop;
  if (typeof streams[streams.length - 1] !== 'function') return noop;
  return streams.pop();
}

function pipeline() {
  for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
    streams[_key] = arguments[_key];
  }

  var callback = popCallback(streams);
  if (Array.isArray(streams[0])) streams = streams[0];

  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS('streams');
  }

  var error;
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1;
    var writing = i > 0;
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err;
      if (err) destroys.forEach(call);
      if (reading) return;
      destroys.forEach(call);
      callback(error);
    });
  });
  return streams.reduce(pipe);
}

module.exports = pipeline;
},{"../../../errors":13,"./end-of-stream":22}],25:[function(require,module,exports){
'use strict';

var ERR_INVALID_OPT_VALUE = require('../../../errors').codes.ERR_INVALID_OPT_VALUE;

function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
}

function getHighWaterMark(state, options, duplexKey, isDuplex) {
  var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);

  if (hwm != null) {
    if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
      var name = isDuplex ? duplexKey : 'highWaterMark';
      throw new ERR_INVALID_OPT_VALUE(name, hwm);
    }

    return Math.floor(hwm);
  } // Default value


  return state.objectMode ? 16 : 16 * 1024;
}

module.exports = {
  getHighWaterMark: getHighWaterMark
};
},{"../../../errors":13}],26:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":5}],27:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":11}],28:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":10,"timers":28}],29:[function(require,module,exports){
(function (global){(function (){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],30:[function(require,module,exports){
(function (global){(function (){
var lib = require('cardano-crypto.js')
var Buffer = require('buffer');
console.log(Buffer);
global.window.Buffer=Buffer
global.window.lib=lib

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"buffer":4,"cardano-crypto.js":58}],31:[function(require,module,exports){
;(function (globalObject) {
  'use strict';

/*
 *      bignumber.js v9.0.1
 *      A JavaScript library for arbitrary-precision arithmetic.
 *      https://github.com/MikeMcl/bignumber.js
 *      Copyright (c) 2020 Michael Mclaughlin <M8ch88l@gmail.com>
 *      MIT Licensed.
 *
 *      BigNumber.prototype methods     |  BigNumber methods
 *                                      |
 *      absoluteValue            abs    |  clone
 *      comparedTo                      |  config               set
 *      decimalPlaces            dp     |      DECIMAL_PLACES
 *      dividedBy                div    |      ROUNDING_MODE
 *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
 *      exponentiatedBy          pow    |      RANGE
 *      integerValue                    |      CRYPTO
 *      isEqualTo                eq     |      MODULO_MODE
 *      isFinite                        |      POW_PRECISION
 *      isGreaterThan            gt     |      FORMAT
 *      isGreaterThanOrEqualTo   gte    |      ALPHABET
 *      isInteger                       |  isBigNumber
 *      isLessThan               lt     |  maximum              max
 *      isLessThanOrEqualTo      lte    |  minimum              min
 *      isNaN                           |  random
 *      isNegative                      |  sum
 *      isPositive                      |
 *      isZero                          |
 *      minus                           |
 *      modulo                   mod    |
 *      multipliedBy             times  |
 *      negated                         |
 *      plus                            |
 *      precision                sd     |
 *      shiftedBy                       |
 *      squareRoot               sqrt   |
 *      toExponential                   |
 *      toFixed                         |
 *      toFormat                        |
 *      toFraction                      |
 *      toJSON                          |
 *      toNumber                        |
 *      toPrecision                     |
 *      toString                        |
 *      valueOf                         |
 *
 */


  var BigNumber,
    isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
    mathceil = Math.ceil,
    mathfloor = Math.floor,

    bignumberError = '[BigNumber Error] ',
    tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

    BASE = 1e14,
    LOG_BASE = 14,
    MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
    // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
    POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    SQRT_BASE = 1e7,

    // EDITABLE
    // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
    // the arguments to toExponential, toFixed, toFormat, and toPrecision.
    MAX = 1E9;                                   // 0 to MAX_INT32


  /*
   * Create and return a BigNumber constructor.
   */
  function clone(configObject) {
    var div, convertBase, parseNumeric,
      P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
      ONE = new BigNumber(1),


      //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


      // The default values below must be integers within the inclusive ranges stated.
      // The values can also be changed at run-time using BigNumber.set.

      // The maximum number of decimal places for operations involving division.
      DECIMAL_PLACES = 20,                     // 0 to MAX

      // The rounding mode used when rounding to the above decimal places, and when using
      // toExponential, toFixed, toFormat and toPrecision, and round (default value).
      // UP         0 Away from zero.
      // DOWN       1 Towards zero.
      // CEIL       2 Towards +Infinity.
      // FLOOR      3 Towards -Infinity.
      // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
      // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
      // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
      // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
      // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
      ROUNDING_MODE = 4,                       // 0 to 8

      // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

      // The exponent value at and beneath which toString returns exponential notation.
      // Number type: -7
      TO_EXP_NEG = -7,                         // 0 to -MAX

      // The exponent value at and above which toString returns exponential notation.
      // Number type: 21
      TO_EXP_POS = 21,                         // 0 to MAX

      // RANGE : [MIN_EXP, MAX_EXP]

      // The minimum exponent value, beneath which underflow to zero occurs.
      // Number type: -324  (5e-324)
      MIN_EXP = -1e7,                          // -1 to -MAX

      // The maximum exponent value, above which overflow to Infinity occurs.
      // Number type:  308  (1.7976931348623157e+308)
      // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
      MAX_EXP = 1e7,                           // 1 to MAX

      // Whether to use cryptographically-secure random number generation, if available.
      CRYPTO = false,                          // true or false

      // The modulo mode used when calculating the modulus: a mod n.
      // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
      // The remainder (r) is calculated as: r = a - n * q.
      //
      // UP        0 The remainder is positive if the dividend is negative, else is negative.
      // DOWN      1 The remainder has the same sign as the dividend.
      //             This modulo mode is commonly known as 'truncated division' and is
      //             equivalent to (a % n) in JavaScript.
      // FLOOR     3 The remainder has the same sign as the divisor (Python %).
      // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
      // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
      //             The remainder is always positive.
      //
      // The truncated division, floored division, Euclidian division and IEEE 754 remainder
      // modes are commonly used for the modulus operation.
      // Although the other rounding modes can also be used, they may not give useful results.
      MODULO_MODE = 1,                         // 0 to 9

      // The maximum number of significant digits of the result of the exponentiatedBy operation.
      // If POW_PRECISION is 0, there will be unlimited significant digits.
      POW_PRECISION = 0,                    // 0 to MAX

      // The format specification used by the BigNumber.prototype.toFormat method.
      FORMAT = {
        prefix: '',
        groupSize: 3,
        secondaryGroupSize: 0,
        groupSeparator: ',',
        decimalSeparator: '.',
        fractionGroupSize: 0,
        fractionGroupSeparator: '\xA0',      // non-breaking space
        suffix: ''
      },

      // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
      // '-', '.', whitespace, or repeated character.
      // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
      ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';


    //------------------------------------------------------------------------------------------


    // CONSTRUCTOR


    /*
     * The BigNumber constructor and exported function.
     * Create and return a new instance of a BigNumber object.
     *
     * v {number|string|BigNumber} A numeric value.
     * [b] {number} The base of v. Integer, 2 to ALPHABET.length inclusive.
     */
    function BigNumber(v, b) {
      var alphabet, c, caseChanged, e, i, isNum, len, str,
        x = this;

      // Enable constructor call without `new`.
      if (!(x instanceof BigNumber)) return new BigNumber(v, b);

      if (b == null) {

        if (v && v._isBigNumber === true) {
          x.s = v.s;

          if (!v.c || v.e > MAX_EXP) {
            x.c = x.e = null;
          } else if (v.e < MIN_EXP) {
            x.c = [x.e = 0];
          } else {
            x.e = v.e;
            x.c = v.c.slice();
          }

          return;
        }

        if ((isNum = typeof v == 'number') && v * 0 == 0) {

          // Use `1 / n` to handle minus zero also.
          x.s = 1 / v < 0 ? (v = -v, -1) : 1;

          // Fast path for integers, where n < 2147483648 (2**31).
          if (v === ~~v) {
            for (e = 0, i = v; i >= 10; i /= 10, e++);

            if (e > MAX_EXP) {
              x.c = x.e = null;
            } else {
              x.e = e;
              x.c = [v];
            }

            return;
          }

          str = String(v);
        } else {

          if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);

          x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
        }

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +str.slice(i + 1);
          str = str.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = str.length;
        }

      } else {

        // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
        intCheck(b, 2, ALPHABET.length, 'Base');

        // Allow exponential notation to be used with base 10 argument, while
        // also rounding to DECIMAL_PLACES as with other bases.
        if (b == 10) {
          x = new BigNumber(v);
          return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
        }

        str = String(v);

        if (isNum = typeof v == 'number') {

          // Avoid potential interpretation of Infinity and NaN as base 44+ values.
          if (v * 0 != 0) return parseNumeric(x, str, isNum, b);

          x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;

          // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
          if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
            throw Error
             (tooManyDigits + v);
          }
        } else {
          x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
        }

        alphabet = ALPHABET.slice(0, b);
        e = i = 0;

        // Check that str is a valid base b number.
        // Don't use RegExp, so alphabet can contain special characters.
        for (len = str.length; i < len; i++) {
          if (alphabet.indexOf(c = str.charAt(i)) < 0) {
            if (c == '.') {

              // If '.' is not the first character and it has not be found before.
              if (i > e) {
                e = len;
                continue;
              }
            } else if (!caseChanged) {

              // Allow e.g. hexadecimal 'FF' as well as 'ff'.
              if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                  str == str.toLowerCase() && (str = str.toUpperCase())) {
                caseChanged = true;
                i = -1;
                e = 0;
                continue;
              }
            }

            return parseNumeric(x, String(v), isNum, b);
          }
        }

        // Prevent later check for length on converted number.
        isNum = false;
        str = convertBase(str, b, 10, x.s);

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
        else e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(--len) === 48;);

      if (str = str.slice(i, ++len)) {
        len -= i;

        // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
        if (isNum && BigNumber.DEBUG &&
          len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
            throw Error
             (tooManyDigits + (x.s * v));
        }

         // Overflow?
        if ((e = e - i - 1) > MAX_EXP) {

          // Infinity.
          x.c = x.e = null;

        // Underflow?
        } else if (e < MIN_EXP) {

          // Zero.
          x.c = [x.e = 0];
        } else {
          x.e = e;
          x.c = [];

          // Transform base

          // e is the base 10 exponent.
          // i is where to slice str to get the first element of the coefficient array.
          i = (e + 1) % LOG_BASE;
          if (e < 0) i += LOG_BASE;  // i < 1

          if (i < len) {
            if (i) x.c.push(+str.slice(0, i));

            for (len -= LOG_BASE; i < len;) {
              x.c.push(+str.slice(i, i += LOG_BASE));
            }

            i = LOG_BASE - (str = str.slice(i)).length;
          } else {
            i -= len;
          }

          for (; i--; str += '0');
          x.c.push(+str);
        }
      } else {

        // Zero.
        x.c = [x.e = 0];
      }
    }


    // CONSTRUCTOR PROPERTIES


    BigNumber.clone = clone;

    BigNumber.ROUND_UP = 0;
    BigNumber.ROUND_DOWN = 1;
    BigNumber.ROUND_CEIL = 2;
    BigNumber.ROUND_FLOOR = 3;
    BigNumber.ROUND_HALF_UP = 4;
    BigNumber.ROUND_HALF_DOWN = 5;
    BigNumber.ROUND_HALF_EVEN = 6;
    BigNumber.ROUND_HALF_CEIL = 7;
    BigNumber.ROUND_HALF_FLOOR = 8;
    BigNumber.EUCLID = 9;


    /*
     * Configure infrequently-changing library-wide settings.
     *
     * Accept an object with the following optional properties (if the value of a property is
     * a number, it must be an integer within the inclusive range stated):
     *
     *   DECIMAL_PLACES   {number}           0 to MAX
     *   ROUNDING_MODE    {number}           0 to 8
     *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
     *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
     *   CRYPTO           {boolean}          true or false
     *   MODULO_MODE      {number}           0 to 9
     *   POW_PRECISION       {number}           0 to MAX
     *   ALPHABET         {string}           A string of two or more unique characters which does
     *                                       not contain '.'.
     *   FORMAT           {object}           An object with some of the following properties:
     *     prefix                 {string}
     *     groupSize              {number}
     *     secondaryGroupSize     {number}
     *     groupSeparator         {string}
     *     decimalSeparator       {string}
     *     fractionGroupSize      {number}
     *     fractionGroupSeparator {string}
     *     suffix                 {string}
     *
     * (The values assigned to the above FORMAT object properties are not checked for validity.)
     *
     * E.g.
     * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
     *
     * Ignore properties/parameters set to null or undefined, except for ALPHABET.
     *
     * Return an object with the properties current values.
     */
    BigNumber.config = BigNumber.set = function (obj) {
      var p, v;

      if (obj != null) {

        if (typeof obj == 'object') {

          // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            DECIMAL_PLACES = v;
          }

          // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
          // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
            v = obj[p];
            intCheck(v, 0, 8, p);
            ROUNDING_MODE = v;
          }

          // EXPONENTIAL_AT {number|number[]}
          // Integer, -MAX to MAX inclusive or
          // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
          // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, 0, p);
              intCheck(v[1], 0, MAX, p);
              TO_EXP_NEG = v[0];
              TO_EXP_POS = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
            }
          }

          // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
          // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
          // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
          if (obj.hasOwnProperty(p = 'RANGE')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, -1, p);
              intCheck(v[1], 1, MAX, p);
              MIN_EXP = v[0];
              MAX_EXP = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              if (v) {
                MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
              } else {
                throw Error
                 (bignumberError + p + ' cannot be zero: ' + v);
              }
            }
          }

          // CRYPTO {boolean} true or false.
          // '[BigNumber Error] CRYPTO not true or false: {v}'
          // '[BigNumber Error] crypto unavailable'
          if (obj.hasOwnProperty(p = 'CRYPTO')) {
            v = obj[p];
            if (v === !!v) {
              if (v) {
                if (typeof crypto != 'undefined' && crypto &&
                 (crypto.getRandomValues || crypto.randomBytes)) {
                  CRYPTO = v;
                } else {
                  CRYPTO = !v;
                  throw Error
                   (bignumberError + 'crypto unavailable');
                }
              } else {
                CRYPTO = v;
              }
            } else {
              throw Error
               (bignumberError + p + ' not true or false: ' + v);
            }
          }

          // MODULO_MODE {number} Integer, 0 to 9 inclusive.
          // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
            v = obj[p];
            intCheck(v, 0, 9, p);
            MODULO_MODE = v;
          }

          // POW_PRECISION {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            POW_PRECISION = v;
          }

          // FORMAT {object}
          // '[BigNumber Error] FORMAT not an object: {v}'
          if (obj.hasOwnProperty(p = 'FORMAT')) {
            v = obj[p];
            if (typeof v == 'object') FORMAT = v;
            else throw Error
             (bignumberError + p + ' not an object: ' + v);
          }

          // ALPHABET {string}
          // '[BigNumber Error] ALPHABET invalid: {v}'
          if (obj.hasOwnProperty(p = 'ALPHABET')) {
            v = obj[p];

            // Disallow if less than two characters,
            // or if it contains '+', '-', '.', whitespace, or a repeated character.
            if (typeof v == 'string' && !/^.?$|[+\-.\s]|(.).*\1/.test(v)) {
              ALPHABET = v;
            } else {
              throw Error
               (bignumberError + p + ' invalid: ' + v);
            }
          }

        } else {

          // '[BigNumber Error] Object expected: {v}'
          throw Error
           (bignumberError + 'Object expected: ' + obj);
        }
      }

      return {
        DECIMAL_PLACES: DECIMAL_PLACES,
        ROUNDING_MODE: ROUNDING_MODE,
        EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
        RANGE: [MIN_EXP, MAX_EXP],
        CRYPTO: CRYPTO,
        MODULO_MODE: MODULO_MODE,
        POW_PRECISION: POW_PRECISION,
        FORMAT: FORMAT,
        ALPHABET: ALPHABET
      };
    };


    /*
     * Return true if v is a BigNumber instance, otherwise return false.
     *
     * If BigNumber.DEBUG is true, throw if a BigNumber instance is not well-formed.
     *
     * v {any}
     *
     * '[BigNumber Error] Invalid BigNumber: {v}'
     */
    BigNumber.isBigNumber = function (v) {
      if (!v || v._isBigNumber !== true) return false;
      if (!BigNumber.DEBUG) return true;

      var i, n,
        c = v.c,
        e = v.e,
        s = v.s;

      out: if ({}.toString.call(c) == '[object Array]') {

        if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {

          // If the first element is zero, the BigNumber value must be zero.
          if (c[0] === 0) {
            if (e === 0 && c.length === 1) return true;
            break out;
          }

          // Calculate number of digits that c[0] should have, based on the exponent.
          i = (e + 1) % LOG_BASE;
          if (i < 1) i += LOG_BASE;

          // Calculate number of digits of c[0].
          //if (Math.ceil(Math.log(c[0] + 1) / Math.LN10) == i) {
          if (String(c[0]).length == i) {

            for (i = 0; i < c.length; i++) {
              n = c[i];
              if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
            }

            // Last element cannot be zero, unless it is the only element.
            if (n !== 0) return true;
          }
        }

      // Infinity/NaN
      } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
        return true;
      }

      throw Error
        (bignumberError + 'Invalid BigNumber: ' + v);
    };


    /*
     * Return a new BigNumber whose value is the maximum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.maximum = BigNumber.max = function () {
      return maxOrMin(arguments, P.lt);
    };


    /*
     * Return a new BigNumber whose value is the minimum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.minimum = BigNumber.min = function () {
      return maxOrMin(arguments, P.gt);
    };


    /*
     * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
     * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
     * zeros are produced).
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
     * '[BigNumber Error] crypto unavailable'
     */
    BigNumber.random = (function () {
      var pow2_53 = 0x20000000000000;

      // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
      // Check if Math.random() produces more than 32 bits of randomness.
      // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
      // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
      var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
       ? function () { return mathfloor(Math.random() * pow2_53); }
       : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
         (Math.random() * 0x800000 | 0); };

      return function (dp) {
        var a, b, e, k, v,
          i = 0,
          c = [],
          rand = new BigNumber(ONE);

        if (dp == null) dp = DECIMAL_PLACES;
        else intCheck(dp, 0, MAX);

        k = mathceil(dp / LOG_BASE);

        if (CRYPTO) {

          // Browsers supporting crypto.getRandomValues.
          if (crypto.getRandomValues) {

            a = crypto.getRandomValues(new Uint32Array(k *= 2));

            for (; i < k;) {

              // 53 bits:
              // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
              // 11111 11111111 11111111 11111111 11100000 00000000 00000000
              // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
              //                                     11111 11111111 11111111
              // 0x20000 is 2^21.
              v = a[i] * 0x20000 + (a[i + 1] >>> 11);

              // Rejection sampling:
              // 0 <= v < 9007199254740992
              // Probability that v >= 9e15, is
              // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
              if (v >= 9e15) {
                b = crypto.getRandomValues(new Uint32Array(2));
                a[i] = b[0];
                a[i + 1] = b[1];
              } else {

                // 0 <= v <= 8999999999999999
                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 2;
              }
            }
            i = k / 2;

          // Node.js supporting crypto.randomBytes.
          } else if (crypto.randomBytes) {

            // buffer
            a = crypto.randomBytes(k *= 7);

            for (; i < k;) {

              // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
              // 0x100000000 is 2^32, 0x1000000 is 2^24
              // 11111 11111111 11111111 11111111 11111111 11111111 11111111
              // 0 <= v < 9007199254740992
              v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                 (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                 (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

              if (v >= 9e15) {
                crypto.randomBytes(7).copy(a, i);
              } else {

                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 7;
              }
            }
            i = k / 7;
          } else {
            CRYPTO = false;
            throw Error
             (bignumberError + 'crypto unavailable');
          }
        }

        // Use Math.random.
        if (!CRYPTO) {

          for (; i < k;) {
            v = random53bitInt();
            if (v < 9e15) c[i++] = v % 1e14;
          }
        }

        k = c[--i];
        dp %= LOG_BASE;

        // Convert trailing digits to zeros according to dp.
        if (k && dp) {
          v = POWS_TEN[LOG_BASE - dp];
          c[i] = mathfloor(k / v) * v;
        }

        // Remove trailing elements which are zero.
        for (; c[i] === 0; c.pop(), i--);

        // Zero?
        if (i < 0) {
          c = [e = 0];
        } else {

          // Remove leading elements which are zero and adjust exponent accordingly.
          for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

          // Count the digits of the first element of c to determine leading zeros, and...
          for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

          // adjust the exponent accordingly.
          if (i < LOG_BASE) e -= LOG_BASE - i;
        }

        rand.e = e;
        rand.c = c;
        return rand;
      };
    })();


    /*
     * Return a BigNumber whose value is the sum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.sum = function () {
      var i = 1,
        args = arguments,
        sum = new BigNumber(args[0]);
      for (; i < args.length;) sum = sum.plus(args[i++]);
      return sum;
    };


    // PRIVATE FUNCTIONS


    // Called by BigNumber and BigNumber.prototype.toString.
    convertBase = (function () {
      var decimal = '0123456789';

      /*
       * Convert string of baseIn to an array of numbers of baseOut.
       * Eg. toBaseOut('255', 10, 16) returns [15, 15].
       * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
       */
      function toBaseOut(str, baseIn, baseOut, alphabet) {
        var j,
          arr = [0],
          arrL,
          i = 0,
          len = str.length;

        for (; i < len;) {
          for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

          arr[0] += alphabet.indexOf(str.charAt(i++));

          for (j = 0; j < arr.length; j++) {

            if (arr[j] > baseOut - 1) {
              if (arr[j + 1] == null) arr[j + 1] = 0;
              arr[j + 1] += arr[j] / baseOut | 0;
              arr[j] %= baseOut;
            }
          }
        }

        return arr.reverse();
      }

      // Convert a numeric string of baseIn to a numeric string of baseOut.
      // If the caller is toString, we are converting from base 10 to baseOut.
      // If the caller is BigNumber, we are converting from baseIn to base 10.
      return function (str, baseIn, baseOut, sign, callerIsToString) {
        var alphabet, d, e, k, r, x, xc, y,
          i = str.indexOf('.'),
          dp = DECIMAL_PLACES,
          rm = ROUNDING_MODE;

        // Non-integer.
        if (i >= 0) {
          k = POW_PRECISION;

          // Unlimited precision.
          POW_PRECISION = 0;
          str = str.replace('.', '');
          y = new BigNumber(baseIn);
          x = y.pow(str.length - i);
          POW_PRECISION = k;

          // Convert str as if an integer, then restore the fraction part by dividing the
          // result by its base raised to a power.

          y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
           10, baseOut, decimal);
          y.e = y.c.length;
        }

        // Convert the number as integer.

        xc = toBaseOut(str, baseIn, baseOut, callerIsToString
         ? (alphabet = ALPHABET, decimal)
         : (alphabet = decimal, ALPHABET));

        // xc now represents str as an integer and converted to baseOut. e is the exponent.
        e = k = xc.length;

        // Remove trailing zeros.
        for (; xc[--k] == 0; xc.pop());

        // Zero?
        if (!xc[0]) return alphabet.charAt(0);

        // Does str represent an integer? If so, no need for the division.
        if (i < 0) {
          --e;
        } else {
          x.c = xc;
          x.e = e;

          // The sign is needed for correct rounding.
          x.s = sign;
          x = div(x, y, dp, rm, baseOut);
          xc = x.c;
          r = x.r;
          e = x.e;
        }

        // xc now represents str converted to baseOut.

        // THe index of the rounding digit.
        d = e + dp + 1;

        // The rounding digit: the digit to the right of the digit that may be rounded up.
        i = xc[d];

        // Look at the rounding digits and mode to determine whether to round up.

        k = baseOut / 2;
        r = r || d < 0 || xc[d + 1] != null;

        r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
              : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
               rm == (x.s < 0 ? 8 : 7));

        // If the index of the rounding digit is not greater than zero, or xc represents
        // zero, then the result of the base conversion is zero or, if rounding up, a value
        // such as 0.00001.
        if (d < 1 || !xc[0]) {

          // 1^-dp or 0
          str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
        } else {

          // Truncate xc to the required number of decimal places.
          xc.length = d;

          // Round up?
          if (r) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (--baseOut; ++xc[--d] > baseOut;) {
              xc[d] = 0;

              if (!d) {
                ++e;
                xc = [1].concat(xc);
              }
            }
          }

          // Determine trailing zeros.
          for (k = xc.length; !xc[--k];);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

          // Add leading zeros, decimal point and trailing zeros as required.
          str = toFixedPoint(str, e, alphabet.charAt(0));
        }

        // The caller will add the sign.
        return str;
      };
    })();


    // Perform division in the specified base. Called by div and convertBase.
    div = (function () {

      // Assume non-zero x and k.
      function multiply(x, k, base) {
        var m, temp, xlo, xhi,
          carry = 0,
          i = x.length,
          klo = k % SQRT_BASE,
          khi = k / SQRT_BASE | 0;

        for (x = x.slice(); i--;) {
          xlo = x[i] % SQRT_BASE;
          xhi = x[i] / SQRT_BASE | 0;
          m = khi * xlo + xhi * klo;
          temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
          carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
          x[i] = temp % base;
        }

        if (carry) x = [carry].concat(x);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, cmp;

        if (aL != bL) {
          cmp = aL > bL ? 1 : -1;
        } else {

          for (i = cmp = 0; i < aL; i++) {

            if (a[i] != b[i]) {
              cmp = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return cmp;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1; a.splice(0, 1));
      }

      // x: dividend, y: divisor.
      return function (x, y, dp, rm, base) {
        var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
          yL, yz,
          s = x.s == y.s ? 1 : -1,
          xc = x.c,
          yc = y.c;

        // Either NaN, Infinity or 0?
        if (!xc || !xc[0] || !yc || !yc[0]) {

          return new BigNumber(

           // Return NaN if either NaN, or both Infinity or 0.
           !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

            // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
            xc && xc[0] == 0 || !yc ? s * 0 : s / 0
         );
        }

        q = new BigNumber(s);
        qc = q.c = [];
        e = x.e - y.e;
        s = dp + e + 1;

        if (!base) {
          base = BASE;
          e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
          s = s / LOG_BASE | 0;
        }

        // Result exponent may be one less then the current value of e.
        // The coefficients of the BigNumbers from convertBase may have trailing zeros.
        for (i = 0; yc[i] == (xc[i] || 0); i++);

        if (yc[i] > (xc[i] || 0)) e--;

        if (s < 0) {
          qc.push(1);
          more = true;
        } else {
          xL = xc.length;
          yL = yc.length;
          i = 0;
          s += 2;

          // Normalise xc and yc so highest order digit of yc is >= base / 2.

          n = mathfloor(base / (yc[0] + 1));

          // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
          // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
          if (n > 1) {
            yc = multiply(yc, n, base);
            xc = multiply(xc, n, base);
            yL = yc.length;
            xL = xc.length;
          }

          xi = yL;
          rem = xc.slice(0, yL);
          remL = rem.length;

          // Add zeros to make remainder as long as divisor.
          for (; remL < yL; rem[remL++] = 0);
          yz = yc.slice();
          yz = [0].concat(yz);
          yc0 = yc[0];
          if (yc[1] >= base / 2) yc0++;
          // Not necessary, but to prevent trial digit n > base, when using base 3.
          // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

          do {
            n = 0;

            // Compare divisor and remainder.
            cmp = compare(yc, rem, yL, remL);

            // If divisor < remainder.
            if (cmp < 0) {

              // Calculate trial digit, n.

              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

              // n is how many times the divisor goes into the current remainder.
              n = mathfloor(rem0 / yc0);

              //  Algorithm:
              //  product = divisor multiplied by trial digit (n).
              //  Compare product and remainder.
              //  If product is greater than remainder:
              //    Subtract divisor from product, decrement trial digit.
              //  Subtract product from remainder.
              //  If product was less than remainder at the last compare:
              //    Compare new remainder and divisor.
              //    If remainder is greater than divisor:
              //      Subtract divisor from remainder, increment trial digit.

              if (n > 1) {

                // n may be > base only when base is 3.
                if (n >= base) n = base - 1;

                // product = divisor * trial digit.
                prod = multiply(yc, n, base);
                prodL = prod.length;
                remL = rem.length;

                // Compare product and remainder.
                // If product > remainder then trial digit n too high.
                // n is 1 too high about 5% of the time, and is not known to have
                // ever been more than 1 too high.
                while (compare(prod, rem, prodL, remL) == 1) {
                  n--;

                  // Subtract divisor from product.
                  subtract(prod, yL < prodL ? yz : yc, prodL, base);
                  prodL = prod.length;
                  cmp = 1;
                }
              } else {

                // n is 0 or 1, cmp is -1.
                // If n is 0, there is no need to compare yc and rem again below,
                // so change cmp to 1 to avoid it.
                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                if (n == 0) {

                  // divisor < remainder, so n must be at least 1.
                  cmp = n = 1;
                }

                // product = divisor
                prod = yc.slice();
                prodL = prod.length;
              }

              if (prodL < remL) prod = [0].concat(prod);

              // Subtract product from remainder.
              subtract(rem, prod, remL, base);
              remL = rem.length;

               // If product was < remainder.
              if (cmp == -1) {

                // Compare divisor and new remainder.
                // If divisor < new remainder, subtract divisor from remainder.
                // Trial digit n too low.
                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                while (compare(yc, rem, yL, remL) < 1) {
                  n++;

                  // Subtract divisor from remainder.
                  subtract(rem, yL < remL ? yz : yc, remL, base);
                  remL = rem.length;
                }
              }
            } else if (cmp === 0) {
              n++;
              rem = [0];
            } // else cmp === 1 and n will be 0

            // Add the next digit, n, to the result array.
            qc[i++] = n;

            // Update the remainder.
            if (rem[0]) {
              rem[remL++] = xc[xi] || 0;
            } else {
              rem = [xc[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] != null) && s--);

          more = rem[0] != null;

          // Leading zero?
          if (!qc[0]) qc.splice(0, 1);
        }

        if (base == BASE) {

          // To calculate q.e, first get the number of digits of qc[0].
          for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

          round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

        // Caller is convertBase.
        } else {
          q.e = e;
          q.r = +more;
        }

        return q;
      };
    })();


    /*
     * Return a string representing the value of BigNumber n in fixed-point or exponential
     * notation rounded to the specified decimal places or significant digits.
     *
     * n: a BigNumber.
     * i: the index of the last digit required (i.e. the digit that may be rounded up).
     * rm: the rounding mode.
     * id: 1 (toExponential) or 2 (toPrecision).
     */
    function format(n, i, rm, id) {
      var c0, e, ne, len, str;

      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);

      if (!n.c) return n.toString();

      c0 = n.c[0];
      ne = n.e;

      if (i == null) {
        str = coeffToString(n.c);
        str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS)
         ? toExponential(str, ne)
         : toFixedPoint(str, ne, '0');
      } else {
        n = round(new BigNumber(n), i, rm);

        // n.e may have changed if the value was rounded up.
        e = n.e;

        str = coeffToString(n.c);
        len = str.length;

        // toPrecision returns exponential notation if the number of significant digits
        // specified is less than the number of digits necessary to represent the integer
        // part of the value in fixed-point notation.

        // Exponential notation.
        if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

          // Append zeros?
          for (; len < i; str += '0', len++);
          str = toExponential(str, e);

        // Fixed-point notation.
        } else {
          i -= ne;
          str = toFixedPoint(str, e, '0');

          // Append zeros?
          if (e + 1 > len) {
            if (--i > 0) for (str += '.'; i--; str += '0');
          } else {
            i += e - len;
            if (i > 0) {
              if (e + 1 == len) str += '.';
              for (; i--; str += '0');
            }
          }
        }
      }

      return n.s < 0 && c0 ? '-' + str : str;
    }


    // Handle BigNumber.max and BigNumber.min.
    function maxOrMin(args, method) {
      var n,
        i = 1,
        m = new BigNumber(args[0]);

      for (; i < args.length; i++) {
        n = new BigNumber(args[i]);

        // If any number is NaN, return NaN.
        if (!n.s) {
          m = n;
          break;
        } else if (method.call(m, n)) {
          m = n;
        }
      }

      return m;
    }


    /*
     * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
     * Called by minus, plus and times.
     */
    function normalise(n, c, e) {
      var i = 1,
        j = c.length;

       // Remove trailing zeros.
      for (; !c[--j]; c.pop());

      // Calculate the base 10 exponent. First get the number of digits of c[0].
      for (j = c[0]; j >= 10; j /= 10, i++);

      // Overflow?
      if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

        // Infinity.
        n.c = n.e = null;

      // Underflow?
      } else if (e < MIN_EXP) {

        // Zero.
        n.c = [n.e = 0];
      } else {
        n.e = e;
        n.c = c;
      }

      return n;
    }


    // Handle values that fail the validity test in BigNumber.
    parseNumeric = (function () {
      var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
        dotAfter = /^([^.]+)\.$/,
        dotBefore = /^\.([^.]+)$/,
        isInfinityOrNaN = /^-?(Infinity|NaN)$/,
        whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

      return function (x, str, isNum, b) {
        var base,
          s = isNum ? str : str.replace(whitespaceOrPlus, '');

        // No exception on ±Infinity or NaN.
        if (isInfinityOrNaN.test(s)) {
          x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
        } else {
          if (!isNum) {

            // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
            s = s.replace(basePrefix, function (m, p1, p2) {
              base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
              return !b || b == base ? p1 : m;
            });

            if (b) {
              base = b;

              // E.g. '1.' to '1', '.1' to '0.1'
              s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
            }

            if (str != s) return new BigNumber(s, base);
          }

          // '[BigNumber Error] Not a number: {n}'
          // '[BigNumber Error] Not a base {b} number: {n}'
          if (BigNumber.DEBUG) {
            throw Error
              (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
          }

          // NaN
          x.s = null;
        }

        x.c = x.e = null;
      }
    })();


    /*
     * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
     * If r is truthy, it is known that there are more digits after the rounding digit.
     */
    function round(x, sd, rm, r) {
      var d, i, j, k, n, ni, rd,
        xc = x.c,
        pows10 = POWS_TEN;

      // if x is not Infinity or NaN...
      if (xc) {

        // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
        // n is a base 1e14 number, the value of the element of array x.c containing rd.
        // ni is the index of n within x.c.
        // d is the number of digits of n.
        // i is the index of rd within n including leading zeros.
        // j is the actual index of rd within n (if < 0, rd is a leading zero).
        out: {

          // Get the number of digits of the first element of xc.
          for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
          i = sd - d;

          // If the rounding digit is in the first element of xc...
          if (i < 0) {
            i += LOG_BASE;
            j = sd;
            n = xc[ni = 0];

            // Get the rounding digit at index j of n.
            rd = n / pows10[d - j - 1] % 10 | 0;
          } else {
            ni = mathceil((i + 1) / LOG_BASE);

            if (ni >= xc.length) {

              if (r) {

                // Needed by sqrt.
                for (; xc.length <= ni; xc.push(0));
                n = rd = 0;
                d = 1;
                i %= LOG_BASE;
                j = i - LOG_BASE + 1;
              } else {
                break out;
              }
            } else {
              n = k = xc[ni];

              // Get the number of digits of n.
              for (d = 1; k >= 10; k /= 10, d++);

              // Get the index of rd within n.
              i %= LOG_BASE;

              // Get the index of rd within n, adjusted for leading zeros.
              // The number of leading zeros of n is given by LOG_BASE - d.
              j = i - LOG_BASE + d;

              // Get the rounding digit at index j of n.
              rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
            }
          }

          r = r || sd < 0 ||

          // Are there any non-zero digits after the rounding digit?
          // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
          // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
           xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

          r = rm < 4
           ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
           : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
             rm == (x.s < 0 ? 8 : 7));

          if (sd < 1 || !xc[0]) {
            xc.length = 0;

            if (r) {

              // Convert sd to decimal places.
              sd -= x.e + 1;

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
              x.e = -sd || 0;
            } else {

              // Zero.
              xc[0] = x.e = 0;
            }

            return x;
          }

          // Remove excess digits.
          if (i == 0) {
            xc.length = ni;
            k = 1;
            ni--;
          } else {
            xc.length = ni + 1;
            k = pows10[LOG_BASE - i];

            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of n.
            xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
          }

          // Round up?
          if (r) {

            for (; ;) {

              // If the digit to be rounded up is in the first element of xc...
              if (ni == 0) {

                // i will be the length of xc[0] before k is added.
                for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                j = xc[0] += k;
                for (k = 1; j >= 10; j /= 10, k++);

                // if i != k the length has increased.
                if (i != k) {
                  x.e++;
                  if (xc[0] == BASE) xc[0] = 1;
                }

                break;
              } else {
                xc[ni] += k;
                if (xc[ni] != BASE) break;
                xc[ni--] = 0;
                k = 1;
              }
            }
          }

          // Remove trailing zeros.
          for (i = xc.length; xc[--i] === 0; xc.pop());
        }

        // Overflow? Infinity.
        if (x.e > MAX_EXP) {
          x.c = x.e = null;

        // Underflow? Zero.
        } else if (x.e < MIN_EXP) {
          x.c = [x.e = 0];
        }
      }

      return x;
    }


    function valueOf(n) {
      var str,
        e = n.e;

      if (e === null) return n.toString();

      str = coeffToString(n.c);

      str = e <= TO_EXP_NEG || e >= TO_EXP_POS
        ? toExponential(str, e)
        : toFixedPoint(str, e, '0');

      return n.s < 0 ? '-' + str : str;
    }


    // PROTOTYPE/INSTANCE METHODS


    /*
     * Return a new BigNumber whose value is the absolute value of this BigNumber.
     */
    P.absoluteValue = P.abs = function () {
      var x = new BigNumber(this);
      if (x.s < 0) x.s = 1;
      return x;
    };


    /*
     * Return
     *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
     *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
     *   0 if they have the same value,
     *   or null if the value of either is NaN.
     */
    P.comparedTo = function (y, b) {
      return compare(this, new BigNumber(y, b));
    };


    /*
     * If dp is undefined or null or true or false, return the number of decimal places of the
     * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     *
     * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.decimalPlaces = P.dp = function (dp, rm) {
      var c, n, v,
        x = this;

      if (dp != null) {
        intCheck(dp, 0, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), dp + x.e + 1, rm);
      }

      if (!(c = x.c)) return null;
      n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

      // Subtract the number of trailing zeros of the last number.
      if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
      if (n < 0) n = 0;

      return n;
    };


    /*
     *  n / 0 = I
     *  n / N = N
     *  n / I = 0
     *  0 / n = 0
     *  0 / 0 = N
     *  0 / N = N
     *  0 / I = 0
     *  N / n = N
     *  N / 0 = N
     *  N / N = N
     *  N / I = N
     *  I / n = I
     *  I / 0 = I
     *  I / N = N
     *  I / I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
     * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.dividedBy = P.div = function (y, b) {
      return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
    };


    /*
     * Return a new BigNumber whose value is the integer part of dividing the value of this
     * BigNumber by the value of BigNumber(y, b).
     */
    P.dividedToIntegerBy = P.idiv = function (y, b) {
      return div(this, new BigNumber(y, b), 0, 1);
    };


    /*
     * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
     *
     * If m is present, return the result modulo m.
     * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
     * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
     *
     * The modular power operation works efficiently when x, n, and m are integers, otherwise it
     * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
     *
     * n {number|string|BigNumber} The exponent. An integer.
     * [m] {number|string|BigNumber} The modulus.
     *
     * '[BigNumber Error] Exponent not an integer: {n}'
     */
    P.exponentiatedBy = P.pow = function (n, m) {
      var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
        x = this;

      n = new BigNumber(n);

      // Allow NaN and ±Infinity, but not other non-integers.
      if (n.c && !n.isInteger()) {
        throw Error
          (bignumberError + 'Exponent not an integer: ' + valueOf(n));
      }

      if (m != null) m = new BigNumber(m);

      // Exponent of MAX_SAFE_INTEGER is 15.
      nIsBig = n.e > 14;

      // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
      if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

        // The sign of the result of pow when x is negative depends on the evenness of n.
        // If +n overflows to ±Infinity, the evenness of n would be not be known.
        y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
        return m ? y.mod(m) : y;
      }

      nIsNeg = n.s < 0;

      if (m) {

        // x % m returns NaN if abs(m) is zero, or m is NaN.
        if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

        isModExp = !nIsNeg && x.isInteger() && m.isInteger();

        if (isModExp) x = x.mod(m);

      // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
      // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
      } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
        // [1, 240000000]
        ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
        // [80000000000000]  [99999750000000]
        : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

        // If x is negative and n is odd, k = -0, else k = 0.
        k = x.s < 0 && isOdd(n) ? -0 : 0;

        // If x >= 1, k = ±Infinity.
        if (x.e > -1) k = 1 / k;

        // If n is negative return ±0, else return ±Infinity.
        return new BigNumber(nIsNeg ? 1 / k : k);

      } else if (POW_PRECISION) {

        // Truncating each coefficient array to a length of k after each multiplication
        // equates to truncating significant digits to POW_PRECISION + [28, 41],
        // i.e. there will be a minimum of 28 guard digits retained.
        k = mathceil(POW_PRECISION / LOG_BASE + 2);
      }

      if (nIsBig) {
        half = new BigNumber(0.5);
        if (nIsNeg) n.s = 1;
        nIsOdd = isOdd(n);
      } else {
        i = Math.abs(+valueOf(n));
        nIsOdd = i % 2;
      }

      y = new BigNumber(ONE);

      // Performs 54 loop iterations for n of 9007199254740991.
      for (; ;) {

        if (nIsOdd) {
          y = y.times(x);
          if (!y.c) break;

          if (k) {
            if (y.c.length > k) y.c.length = k;
          } else if (isModExp) {
            y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
          }
        }

        if (i) {
          i = mathfloor(i / 2);
          if (i === 0) break;
          nIsOdd = i % 2;
        } else {
          n = n.times(half);
          round(n, n.e + 1, 1);

          if (n.e > 14) {
            nIsOdd = isOdd(n);
          } else {
            i = +valueOf(n);
            if (i === 0) break;
            nIsOdd = i % 2;
          }
        }

        x = x.times(x);

        if (k) {
          if (x.c && x.c.length > k) x.c.length = k;
        } else if (isModExp) {
          x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
        }
      }

      if (isModExp) return y;
      if (nIsNeg) y = ONE.div(y);

      return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
     * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
     */
    P.integerValue = function (rm) {
      var n = new BigNumber(this);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(n, n.e + 1, rm);
    };


    /*
     * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isEqualTo = P.eq = function (y, b) {
      return compare(this, new BigNumber(y, b)) === 0;
    };


    /*
     * Return true if the value of this BigNumber is a finite number, otherwise return false.
     */
    P.isFinite = function () {
      return !!this.c;
    };


    /*
     * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isGreaterThan = P.gt = function (y, b) {
      return compare(this, new BigNumber(y, b)) > 0;
    };


    /*
     * Return true if the value of this BigNumber is greater than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

    };


    /*
     * Return true if the value of this BigNumber is an integer, otherwise return false.
     */
    P.isInteger = function () {
      return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
    };


    /*
     * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isLessThan = P.lt = function (y, b) {
      return compare(this, new BigNumber(y, b)) < 0;
    };


    /*
     * Return true if the value of this BigNumber is less than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isLessThanOrEqualTo = P.lte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
    };


    /*
     * Return true if the value of this BigNumber is NaN, otherwise return false.
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this BigNumber is negative, otherwise return false.
     */
    P.isNegative = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this BigNumber is positive, otherwise return false.
     */
    P.isPositive = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
     */
    P.isZero = function () {
      return !!this.c && this.c[0] == 0;
    };


    /*
     *  n - 0 = n
     *  n - N = N
     *  n - I = -I
     *  0 - n = -n
     *  0 - 0 = 0
     *  0 - N = N
     *  0 - I = -I
     *  N - n = N
     *  N - 0 = N
     *  N - N = N
     *  N - I = N
     *  I - n = I
     *  I - 0 = I
     *  I - N = N
     *  I - I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber minus the value of
     * BigNumber(y, b).
     */
    P.minus = function (y, b) {
      var i, j, t, xLTy,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
      if (a != b) {
        y.s = -b;
        return x.plus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Either Infinity?
        if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

        // Either zero?
        if (!xc[0] || !yc[0]) {

          // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
          return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

           // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
           ROUNDING_MODE == 3 ? -0 : 0);
        }
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Determine which is the bigger number.
      if (a = xe - ye) {

        if (xLTy = a < 0) {
          a = -a;
          t = xc;
        } else {
          ye = xe;
          t = yc;
        }

        t.reverse();

        // Prepend zeros to equalise exponents.
        for (b = a; b--; t.push(0));
        t.reverse();
      } else {

        // Exponents equal. Check digit by digit.
        j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

        for (a = b = 0; b < j; b++) {

          if (xc[b] != yc[b]) {
            xLTy = xc[b] < yc[b];
            break;
          }
        }
      }

      // x < y? Point xc to the array of the bigger number.
      if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

      b = (j = yc.length) - (i = xc.length);

      // Append zeros to xc if shorter.
      // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
      if (b > 0) for (; b--; xc[i++] = 0);
      b = BASE - 1;

      // Subtract yc from xc.
      for (; j > a;) {

        if (xc[--j] < yc[j]) {
          for (i = j; i && !xc[--i]; xc[i] = b);
          --xc[i];
          xc[j] += BASE;
        }

        xc[j] -= yc[j];
      }

      // Remove leading zeros and adjust exponent accordingly.
      for (; xc[0] == 0; xc.splice(0, 1), --ye);

      // Zero?
      if (!xc[0]) {

        // Following IEEE 754 (2008) 6.3,
        // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
        y.s = ROUNDING_MODE == 3 ? -1 : 1;
        y.c = [y.e = 0];
        return y;
      }

      // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
      // for finite x and y.
      return normalise(y, xc, ye);
    };


    /*
     *   n % 0 =  N
     *   n % N =  N
     *   n % I =  n
     *   0 % n =  0
     *  -0 % n = -0
     *   0 % 0 =  N
     *   0 % N =  N
     *   0 % I =  0
     *   N % n =  N
     *   N % 0 =  N
     *   N % N =  N
     *   N % I =  N
     *   I % n =  N
     *   I % 0 =  N
     *   I % N =  N
     *   I % I =  N
     *
     * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
     * BigNumber(y, b). The result depends on the value of MODULO_MODE.
     */
    P.modulo = P.mod = function (y, b) {
      var q, s,
        x = this;

      y = new BigNumber(y, b);

      // Return NaN if x is Infinity or NaN, or y is NaN or zero.
      if (!x.c || !y.s || y.c && !y.c[0]) {
        return new BigNumber(NaN);

      // Return x if y is Infinity or x is zero.
      } else if (!y.c || x.c && !x.c[0]) {
        return new BigNumber(x);
      }

      if (MODULO_MODE == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // r = x - qy    where  0 <= r < abs(y)
        s = y.s;
        y.s = 1;
        q = div(x, y, 0, 3);
        y.s = s;
        q.s *= s;
      } else {
        q = div(x, y, 0, MODULO_MODE);
      }

      y = x.minus(q.times(y));

      // To match JavaScript %, ensure sign of zero is sign of dividend.
      if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

      return y;
    };


    /*
     *  n * 0 = 0
     *  n * N = N
     *  n * I = I
     *  0 * n = 0
     *  0 * 0 = 0
     *  0 * N = N
     *  0 * I = N
     *  N * n = N
     *  N * 0 = N
     *  N * N = N
     *  N * I = N
     *  I * n = I
     *  I * 0 = N
     *  I * N = N
     *  I * I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
     * of BigNumber(y, b).
     */
    P.multipliedBy = P.times = function (y, b) {
      var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
        base, sqrtBase,
        x = this,
        xc = x.c,
        yc = (y = new BigNumber(y, b)).c;

      // Either NaN, ±Infinity or ±0?
      if (!xc || !yc || !xc[0] || !yc[0]) {

        // Return NaN if either is NaN, or one is 0 and the other is Infinity.
        if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
          y.c = y.e = y.s = null;
        } else {
          y.s *= x.s;

          // Return ±Infinity if either is ±Infinity.
          if (!xc || !yc) {
            y.c = y.e = null;

          // Return ±0 if either is ±0.
          } else {
            y.c = [0];
            y.e = 0;
          }
        }

        return y;
      }

      e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
      y.s *= x.s;
      xcL = xc.length;
      ycL = yc.length;

      // Ensure xc points to longer array and xcL to its length.
      if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

      // Initialise the result array with zeros.
      for (i = xcL + ycL, zc = []; i--; zc.push(0));

      base = BASE;
      sqrtBase = SQRT_BASE;

      for (i = ycL; --i >= 0;) {
        c = 0;
        ylo = yc[i] % sqrtBase;
        yhi = yc[i] / sqrtBase | 0;

        for (k = xcL, j = i + k; j > i;) {
          xlo = xc[--k] % sqrtBase;
          xhi = xc[k] / sqrtBase | 0;
          m = yhi * xlo + xhi * ylo;
          xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
          c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
          zc[j--] = xlo % base;
        }

        zc[j] = c;
      }

      if (c) {
        ++e;
      } else {
        zc.splice(0, 1);
      }

      return normalise(y, zc, e);
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber negated,
     * i.e. multiplied by -1.
     */
    P.negated = function () {
      var x = new BigNumber(this);
      x.s = -x.s || null;
      return x;
    };


    /*
     *  n + 0 = n
     *  n + N = N
     *  n + I = I
     *  0 + n = n
     *  0 + 0 = 0
     *  0 + N = N
     *  0 + I = I
     *  N + n = N
     *  N + 0 = N
     *  N + N = N
     *  N + I = N
     *  I + n = I
     *  I + 0 = I
     *  I + N = N
     *  I + I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber plus the value of
     * BigNumber(y, b).
     */
    P.plus = function (y, b) {
      var t,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
       if (a != b) {
        y.s = -b;
        return x.minus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Return ±Infinity if either ±Infinity.
        if (!xc || !yc) return new BigNumber(a / 0);

        // Either zero?
        // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
        if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
      if (a = xe - ye) {
        if (a > 0) {
          ye = xe;
          t = yc;
        } else {
          a = -a;
          t = xc;
        }

        t.reverse();
        for (; a--; t.push(0));
        t.reverse();
      }

      a = xc.length;
      b = yc.length;

      // Point xc to the longer array, and b to the shorter length.
      if (a - b < 0) t = yc, yc = xc, xc = t, b = a;

      // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
      for (a = 0; b;) {
        a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
        xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
      }

      if (a) {
        xc = [a].concat(xc);
        ++ye;
      }

      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      // ye = MAX_EXP + 1 possible
      return normalise(y, xc, ye);
    };


    /*
     * If sd is undefined or null or true or false, return the number of significant digits of
     * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     * If sd is true include integer-part trailing zeros in the count.
     *
     * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
     *                     boolean: whether to count integer-part trailing zeros: true or false.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.precision = P.sd = function (sd, rm) {
      var c, n, v,
        x = this;

      if (sd != null && sd !== !!sd) {
        intCheck(sd, 1, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), sd, rm);
      }

      if (!(c = x.c)) return null;
      v = c.length - 1;
      n = v * LOG_BASE + 1;

      if (v = c[v]) {

        // Subtract the number of trailing zeros of the last element.
        for (; v % 10 == 0; v /= 10, n--);

        // Add the number of digits of the first element.
        for (v = c[0]; v >= 10; v /= 10, n++);
      }

      if (sd && x.e + 1 > n) n = x.e + 1;

      return n;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
     * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
     *
     * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
     */
    P.shiftedBy = function (k) {
      intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
      return this.times('1e' + k);
    };


    /*
     *  sqrt(-n) =  N
     *  sqrt(N) =  N
     *  sqrt(-I) =  N
     *  sqrt(I) =  I
     *  sqrt(0) =  0
     *  sqrt(-0) = -0
     *
     * Return a new BigNumber whose value is the square root of the value of this BigNumber,
     * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.squareRoot = P.sqrt = function () {
      var m, n, r, rep, t,
        x = this,
        c = x.c,
        s = x.s,
        e = x.e,
        dp = DECIMAL_PLACES + 4,
        half = new BigNumber('0.5');

      // Negative/NaN/Infinity/zero?
      if (s !== 1 || !c || !c[0]) {
        return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
      }

      // Initial estimate.
      s = Math.sqrt(+valueOf(x));

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = coeffToString(c);
        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(+n);
        e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '5e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new BigNumber(n);
      } else {
        r = new BigNumber(s + '');
      }

      // Check for zero.
      // r could be zero if MIN_EXP is changed after the this value was created.
      // This would cause a division by zero (x/t) and hence Infinity below, which would cause
      // coeffToString to throw.
      if (r.c[0]) {
        e = r.e;
        s = e + dp;
        if (s < 3) s = 0;

        // Newton-Raphson iteration.
        for (; ;) {
          t = r;
          r = half.times(t.plus(div(x, t, dp, 1)));

          if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

            // The exponent of r may here be one less than the final result exponent,
            // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
            // are indexed correctly.
            if (r.e < e) --s;
            n = n.slice(s - 3, s + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
            // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
            // iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the
              // exact result as the nines may infinitely repeat.
              if (!rep) {
                round(t, t.e + DECIMAL_PLACES + 2, 0);

                if (t.times(t).eq(x)) {
                  r = t;
                  break;
                }
              }

              dp += 4;
              s += 4;
              rep = 1;
            } else {

              // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
              // result. If not, then there are further digits and m will be truthy.
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                round(r, r.e + DECIMAL_PLACES + 2, 1);
                m = !r.times(r).eq(x);
              }

              break;
            }
          }
        }
      }

      return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
    };


    /*
     * Return a string representing the value of this BigNumber in exponential notation and
     * rounded using ROUNDING_MODE to dp fixed decimal places.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toExponential = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp++;
      }
      return format(this, dp, rm, 1);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounding
     * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
     * but e.g. (-0.00001).toFixed(0) is '-0'.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toFixed = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp = dp + this.e + 1;
      }
      return format(this, dp, rm);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounded
     * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
     * of the format or FORMAT object (see BigNumber.set).
     *
     * The formatting object may contain some or all of the properties shown below.
     *
     * FORMAT = {
     *   prefix: '',
     *   groupSize: 3,
     *   secondaryGroupSize: 0,
     *   groupSeparator: ',',
     *   decimalSeparator: '.',
     *   fractionGroupSize: 0,
     *   fractionGroupSeparator: '\xA0',      // non-breaking space
     *   suffix: ''
     * };
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     * [format] {object} Formatting options. See FORMAT pbject above.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     * '[BigNumber Error] Argument not an object: {format}'
     */
    P.toFormat = function (dp, rm, format) {
      var str,
        x = this;

      if (format == null) {
        if (dp != null && rm && typeof rm == 'object') {
          format = rm;
          rm = null;
        } else if (dp && typeof dp == 'object') {
          format = dp;
          dp = rm = null;
        } else {
          format = FORMAT;
        }
      } else if (typeof format != 'object') {
        throw Error
          (bignumberError + 'Argument not an object: ' + format);
      }

      str = x.toFixed(dp, rm);

      if (x.c) {
        var i,
          arr = str.split('.'),
          g1 = +format.groupSize,
          g2 = +format.secondaryGroupSize,
          groupSeparator = format.groupSeparator || '',
          intPart = arr[0],
          fractionPart = arr[1],
          isNeg = x.s < 0,
          intDigits = isNeg ? intPart.slice(1) : intPart,
          len = intDigits.length;

        if (g2) i = g1, g1 = g2, g2 = i, len -= i;

        if (g1 > 0 && len > 0) {
          i = len % g1 || g1;
          intPart = intDigits.substr(0, i);
          for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
          if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
          if (isNeg) intPart = '-' + intPart;
        }

        str = fractionPart
         ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
          ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
           '$&' + (format.fractionGroupSeparator || ''))
          : fractionPart)
         : intPart;
      }

      return (format.prefix || '') + str + (format.suffix || '');
    };


    /*
     * Return an array of two BigNumbers representing the value of this BigNumber as a simple
     * fraction with an integer numerator and an integer denominator.
     * The denominator will be a positive non-zero value less than or equal to the specified
     * maximum denominator. If a maximum denominator is not specified, the denominator will be
     * the lowest value necessary to represent the number exactly.
     *
     * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
     *
     * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
     */
    P.toFraction = function (md) {
      var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
        x = this,
        xc = x.c;

      if (md != null) {
        n = new BigNumber(md);

        // Throw if md is less than one or is not an integer, unless it is Infinity.
        if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
          throw Error
            (bignumberError + 'Argument ' +
              (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
        }
      }

      if (!xc) return new BigNumber(x);

      d = new BigNumber(ONE);
      n1 = d0 = new BigNumber(ONE);
      d1 = n0 = new BigNumber(ONE);
      s = coeffToString(xc);

      // Determine initial denominator.
      // d is a power of 10 and the minimum max denominator that specifies the value exactly.
      e = d.e = s.length - x.e - 1;
      d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
      md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

      exp = MAX_EXP;
      MAX_EXP = 1 / 0;
      n = new BigNumber(s);

      // n0 = d1 = 0
      n0.c[0] = 0;

      for (; ;)  {
        q = div(n, d, 0, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.comparedTo(md) == 1) break;
        d0 = d1;
        d1 = d2;
        n1 = n0.plus(q.times(d2 = n1));
        n0 = d2;
        d = n.minus(q.times(d2 = d));
        n = d2;
      }

      d2 = div(md.minus(d0), d1, 0, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;
      e = e * 2;

      // Determine which fraction is closer to x, n0/d0 or n1/d1
      r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
          div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

      MAX_EXP = exp;

      return r;
    };


    /*
     * Return the value of this BigNumber converted to a number primitive.
     */
    P.toNumber = function () {
      return +valueOf(this);
    };


    /*
     * Return a string representing the value of this BigNumber rounded to sd significant digits
     * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
     * necessary to represent the integer part of the value in fixed-point notation, then use
     * exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.toPrecision = function (sd, rm) {
      if (sd != null) intCheck(sd, 1, MAX);
      return format(this, sd, rm, 2);
    };


    /*
     * Return a string representing the value of this BigNumber in base b, or base 10 if b is
     * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
     * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
     * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
     * TO_EXP_NEG, return exponential notation.
     *
     * [b] {number} Integer, 2 to ALPHABET.length inclusive.
     *
     * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
     */
    P.toString = function (b) {
      var str,
        n = this,
        s = n.s,
        e = n.e;

      // Infinity or NaN?
      if (e === null) {
        if (s) {
          str = 'Infinity';
          if (s < 0) str = '-' + str;
        } else {
          str = 'NaN';
        }
      } else {
        if (b == null) {
          str = e <= TO_EXP_NEG || e >= TO_EXP_POS
           ? toExponential(coeffToString(n.c), e)
           : toFixedPoint(coeffToString(n.c), e, '0');
        } else if (b === 10) {
          n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
          str = toFixedPoint(coeffToString(n.c), n.e, '0');
        } else {
          intCheck(b, 2, ALPHABET.length, 'Base');
          str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
        }

        if (s < 0 && n.c[0]) str = '-' + str;
      }

      return str;
    };


    /*
     * Return as toString, but do not accept a base argument, and include the minus sign for
     * negative zero.
     */
    P.valueOf = P.toJSON = function () {
      return valueOf(this);
    };


    P._isBigNumber = true;

    if (configObject != null) BigNumber.set(configObject);

    return BigNumber;
  }


  // PRIVATE HELPER FUNCTIONS

  // These functions don't need access to variables,
  // e.g. DECIMAL_PLACES, in the scope of the `clone` function above.


  function bitFloor(n) {
    var i = n | 0;
    return n > 0 || n === i ? i : i - 1;
  }


  // Return a coefficient array as a string of base 10 digits.
  function coeffToString(a) {
    var s, z,
      i = 1,
      j = a.length,
      r = a[0] + '';

    for (; i < j;) {
      s = a[i++] + '';
      z = LOG_BASE - s.length;
      for (; z--; s = '0' + s);
      r += s;
    }

    // Determine trailing zeros.
    for (j = r.length; r.charCodeAt(--j) === 48;);

    return r.slice(0, j + 1 || 1);
  }


  // Compare the value of BigNumbers x and y.
  function compare(x, y) {
    var a, b,
      xc = x.c,
      yc = y.c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either NaN?
    if (!i || !j) return null;

    a = xc && !xc[0];
    b = yc && !yc[0];

    // Either zero?
    if (a || b) return a ? b ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    a = i < 0;
    b = k == l;

    // Either Infinity?
    if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

    // Compare exponents.
    if (!b) return k > l ^ a ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
  }


  /*
   * Check that n is a primitive number, an integer, and in range, otherwise throw.
   */
  function intCheck(n, min, max, name) {
    if (n < min || n > max || n !== mathfloor(n)) {
      throw Error
       (bignumberError + (name || 'Argument') + (typeof n == 'number'
         ? n < min || n > max ? ' out of range: ' : ' not an integer: '
         : ' not a primitive number: ') + String(n));
    }
  }


  // Assumes finite n.
  function isOdd(n) {
    var k = n.c.length - 1;
    return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
  }


  function toExponential(str, e) {
    return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
     (e < 0 ? 'e' : 'e+') + e;
  }


  function toFixedPoint(str, e, z) {
    var len, zs;

    // Negative exponent?
    if (e < 0) {

      // Prepend zeros.
      for (zs = z + '.'; ++e; zs += z);
      str = zs + str;

    // Positive exponent
    } else {
      len = str.length;

      // Append zeros.
      if (++e > len) {
        for (zs = z, e -= len; --e; zs += z);
        str += zs;
      } else if (e < len) {
        str = str.slice(0, e) + '.' + str.slice(e);
      }
    }

    return str;
  }


  // EXPORT


  BigNumber = clone();
  BigNumber['default'] = BigNumber.BigNumber = BigNumber;

  // AMD.
  if (typeof define == 'function' && define.amd) {
    define(function () { return BigNumber; });

  // Node.js and other environments that support module.exports.
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = BigNumber;

  // Browser.
  } else {
    if (!globalObject) {
      globalObject = typeof self != 'undefined' && self ? self : window;
    }

    globalObject.BigNumber = BigNumber;
  }
})(this);

},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// browserify by default only pulls in files that are hard coded in requires
// In order of last to first in this file, the default wordlist will be chosen
// based on what is present. (Bundles may remove wordlists they don't need)
const wordlists = {};
exports.wordlists = wordlists;
let _default;
exports._default = _default;
try {
    exports._default = _default = require('./wordlists/czech.json');
    wordlists.czech = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/chinese_simplified.json');
    wordlists.chinese_simplified = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/chinese_traditional.json');
    wordlists.chinese_traditional = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/korean.json');
    wordlists.korean = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/french.json');
    wordlists.french = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/italian.json');
    wordlists.italian = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/spanish.json');
    wordlists.spanish = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/japanese.json');
    wordlists.japanese = _default;
    wordlists.JA = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/portuguese.json');
    wordlists.portuguese = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/english.json');
    wordlists.english = _default;
    wordlists.EN = _default;
}
catch (err) { }

},{"./wordlists/chinese_simplified.json":34,"./wordlists/chinese_traditional.json":35,"./wordlists/czech.json":36,"./wordlists/english.json":37,"./wordlists/french.json":38,"./wordlists/italian.json":39,"./wordlists/japanese.json":40,"./wordlists/korean.json":41,"./wordlists/portuguese.json":42,"./wordlists/spanish.json":43}],33:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createHash = require("create-hash");
const pbkdf2_1 = require("pbkdf2");
const randomBytes = require("randombytes");
const _wordlists_1 = require("./_wordlists");
let DEFAULT_WORDLIST = _wordlists_1._default;
const INVALID_MNEMONIC = 'Invalid mnemonic';
const INVALID_ENTROPY = 'Invalid entropy';
const INVALID_CHECKSUM = 'Invalid mnemonic checksum';
const WORDLIST_REQUIRED = 'A wordlist is required but a default could not be found.\n' +
    'Please pass a 2048 word array explicitly.';
function pbkdf2Promise(password, saltMixin, iterations, keylen, digest) {
    return Promise.resolve().then(() => new Promise((resolve, reject) => {
        const callback = (err, derivedKey) => {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(derivedKey);
            }
        };
        pbkdf2_1.pbkdf2(password, saltMixin, iterations, keylen, digest, callback);
    }));
}
function normalize(str) {
    return (str || '').normalize('NFKD');
}
function lpad(str, padString, length) {
    while (str.length < length) {
        str = padString + str;
    }
    return str;
}
function binaryToByte(bin) {
    return parseInt(bin, 2);
}
function bytesToBinary(bytes) {
    return bytes.map((x) => lpad(x.toString(2), '0', 8)).join('');
}
function deriveChecksumBits(entropyBuffer) {
    const ENT = entropyBuffer.length * 8;
    const CS = ENT / 32;
    const hash = createHash('sha256')
        .update(entropyBuffer)
        .digest();
    return bytesToBinary(Array.from(hash)).slice(0, CS);
}
function salt(password) {
    return 'mnemonic' + (password || '');
}
function mnemonicToSeedSync(mnemonic, password) {
    const mnemonicBuffer = Buffer.from(normalize(mnemonic), 'utf8');
    const saltBuffer = Buffer.from(salt(normalize(password)), 'utf8');
    return pbkdf2_1.pbkdf2Sync(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512');
}
exports.mnemonicToSeedSync = mnemonicToSeedSync;
function mnemonicToSeed(mnemonic, password) {
    return Promise.resolve().then(() => {
        const mnemonicBuffer = Buffer.from(normalize(mnemonic), 'utf8');
        const saltBuffer = Buffer.from(salt(normalize(password)), 'utf8');
        return pbkdf2Promise(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512');
    });
}
exports.mnemonicToSeed = mnemonicToSeed;
function mnemonicToEntropy(mnemonic, wordlist) {
    wordlist = wordlist || DEFAULT_WORDLIST;
    if (!wordlist) {
        throw new Error(WORDLIST_REQUIRED);
    }
    const words = normalize(mnemonic).split(' ');
    if (words.length % 3 !== 0) {
        throw new Error(INVALID_MNEMONIC);
    }
    // convert word indices to 11 bit binary strings
    const bits = words
        .map((word) => {
        const index = wordlist.indexOf(word);
        if (index === -1) {
            throw new Error(INVALID_MNEMONIC);
        }
        return lpad(index.toString(2), '0', 11);
    })
        .join('');
    // split the binary string into ENT/CS
    const dividerIndex = Math.floor(bits.length / 33) * 32;
    const entropyBits = bits.slice(0, dividerIndex);
    const checksumBits = bits.slice(dividerIndex);
    // calculate the checksum and compare
    const entropyBytes = entropyBits.match(/(.{1,8})/g).map(binaryToByte);
    if (entropyBytes.length < 16) {
        throw new Error(INVALID_ENTROPY);
    }
    if (entropyBytes.length > 32) {
        throw new Error(INVALID_ENTROPY);
    }
    if (entropyBytes.length % 4 !== 0) {
        throw new Error(INVALID_ENTROPY);
    }
    const entropy = Buffer.from(entropyBytes);
    const newChecksum = deriveChecksumBits(entropy);
    if (newChecksum !== checksumBits) {
        throw new Error(INVALID_CHECKSUM);
    }
    return entropy.toString('hex');
}
exports.mnemonicToEntropy = mnemonicToEntropy;
function entropyToMnemonic(entropy, wordlist) {
    if (!Buffer.isBuffer(entropy)) {
        entropy = Buffer.from(entropy, 'hex');
    }
    wordlist = wordlist || DEFAULT_WORDLIST;
    if (!wordlist) {
        throw new Error(WORDLIST_REQUIRED);
    }
    // 128 <= ENT <= 256
    if (entropy.length < 16) {
        throw new TypeError(INVALID_ENTROPY);
    }
    if (entropy.length > 32) {
        throw new TypeError(INVALID_ENTROPY);
    }
    if (entropy.length % 4 !== 0) {
        throw new TypeError(INVALID_ENTROPY);
    }
    const entropyBits = bytesToBinary(Array.from(entropy));
    const checksumBits = deriveChecksumBits(entropy);
    const bits = entropyBits + checksumBits;
    const chunks = bits.match(/(.{1,11})/g);
    const words = chunks.map((binary) => {
        const index = binaryToByte(binary);
        return wordlist[index];
    });
    return wordlist[0] === '\u3042\u3044\u3053\u304f\u3057\u3093' // Japanese wordlist
        ? words.join('\u3000')
        : words.join(' ');
}
exports.entropyToMnemonic = entropyToMnemonic;
function generateMnemonic(strength, rng, wordlist) {
    strength = strength || 128;
    if (strength % 32 !== 0) {
        throw new TypeError(INVALID_ENTROPY);
    }
    rng = rng || randomBytes;
    return entropyToMnemonic(rng(strength / 8), wordlist);
}
exports.generateMnemonic = generateMnemonic;
function validateMnemonic(mnemonic, wordlist) {
    try {
        mnemonicToEntropy(mnemonic, wordlist);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.validateMnemonic = validateMnemonic;
function setDefaultWordlist(language) {
    const result = _wordlists_1.wordlists[language];
    if (result) {
        DEFAULT_WORDLIST = result;
    }
    else {
        throw new Error('Could not find wordlist for language "' + language + '"');
    }
}
exports.setDefaultWordlist = setDefaultWordlist;
function getDefaultWordlist() {
    if (!DEFAULT_WORDLIST) {
        throw new Error('No Default Wordlist set');
    }
    return Object.keys(_wordlists_1.wordlists).filter((lang) => {
        if (lang === 'JA' || lang === 'EN') {
            return false;
        }
        return _wordlists_1.wordlists[lang].every((word, index) => word === DEFAULT_WORDLIST[index]);
    })[0];
}
exports.getDefaultWordlist = getDefaultWordlist;
var _wordlists_2 = require("./_wordlists");
exports.wordlists = _wordlists_2.wordlists;

}).call(this)}).call(this,require("buffer").Buffer)
},{"./_wordlists":32,"buffer":4,"create-hash":71,"pbkdf2":80,"randombytes":86}],34:[function(require,module,exports){
module.exports=[
    "的",
    "一",
    "是",
    "在",
    "不",
    "了",
    "有",
    "和",
    "人",
    "这",
    "中",
    "大",
    "为",
    "上",
    "个",
    "国",
    "我",
    "以",
    "要",
    "他",
    "时",
    "来",
    "用",
    "们",
    "生",
    "到",
    "作",
    "地",
    "于",
    "出",
    "就",
    "分",
    "对",
    "成",
    "会",
    "可",
    "主",
    "发",
    "年",
    "动",
    "同",
    "工",
    "也",
    "能",
    "下",
    "过",
    "子",
    "说",
    "产",
    "种",
    "面",
    "而",
    "方",
    "后",
    "多",
    "定",
    "行",
    "学",
    "法",
    "所",
    "民",
    "得",
    "经",
    "十",
    "三",
    "之",
    "进",
    "着",
    "等",
    "部",
    "度",
    "家",
    "电",
    "力",
    "里",
    "如",
    "水",
    "化",
    "高",
    "自",
    "二",
    "理",
    "起",
    "小",
    "物",
    "现",
    "实",
    "加",
    "量",
    "都",
    "两",
    "体",
    "制",
    "机",
    "当",
    "使",
    "点",
    "从",
    "业",
    "本",
    "去",
    "把",
    "性",
    "好",
    "应",
    "开",
    "它",
    "合",
    "还",
    "因",
    "由",
    "其",
    "些",
    "然",
    "前",
    "外",
    "天",
    "政",
    "四",
    "日",
    "那",
    "社",
    "义",
    "事",
    "平",
    "形",
    "相",
    "全",
    "表",
    "间",
    "样",
    "与",
    "关",
    "各",
    "重",
    "新",
    "线",
    "内",
    "数",
    "正",
    "心",
    "反",
    "你",
    "明",
    "看",
    "原",
    "又",
    "么",
    "利",
    "比",
    "或",
    "但",
    "质",
    "气",
    "第",
    "向",
    "道",
    "命",
    "此",
    "变",
    "条",
    "只",
    "没",
    "结",
    "解",
    "问",
    "意",
    "建",
    "月",
    "公",
    "无",
    "系",
    "军",
    "很",
    "情",
    "者",
    "最",
    "立",
    "代",
    "想",
    "已",
    "通",
    "并",
    "提",
    "直",
    "题",
    "党",
    "程",
    "展",
    "五",
    "果",
    "料",
    "象",
    "员",
    "革",
    "位",
    "入",
    "常",
    "文",
    "总",
    "次",
    "品",
    "式",
    "活",
    "设",
    "及",
    "管",
    "特",
    "件",
    "长",
    "求",
    "老",
    "头",
    "基",
    "资",
    "边",
    "流",
    "路",
    "级",
    "少",
    "图",
    "山",
    "统",
    "接",
    "知",
    "较",
    "将",
    "组",
    "见",
    "计",
    "别",
    "她",
    "手",
    "角",
    "期",
    "根",
    "论",
    "运",
    "农",
    "指",
    "几",
    "九",
    "区",
    "强",
    "放",
    "决",
    "西",
    "被",
    "干",
    "做",
    "必",
    "战",
    "先",
    "回",
    "则",
    "任",
    "取",
    "据",
    "处",
    "队",
    "南",
    "给",
    "色",
    "光",
    "门",
    "即",
    "保",
    "治",
    "北",
    "造",
    "百",
    "规",
    "热",
    "领",
    "七",
    "海",
    "口",
    "东",
    "导",
    "器",
    "压",
    "志",
    "世",
    "金",
    "增",
    "争",
    "济",
    "阶",
    "油",
    "思",
    "术",
    "极",
    "交",
    "受",
    "联",
    "什",
    "认",
    "六",
    "共",
    "权",
    "收",
    "证",
    "改",
    "清",
    "美",
    "再",
    "采",
    "转",
    "更",
    "单",
    "风",
    "切",
    "打",
    "白",
    "教",
    "速",
    "花",
    "带",
    "安",
    "场",
    "身",
    "车",
    "例",
    "真",
    "务",
    "具",
    "万",
    "每",
    "目",
    "至",
    "达",
    "走",
    "积",
    "示",
    "议",
    "声",
    "报",
    "斗",
    "完",
    "类",
    "八",
    "离",
    "华",
    "名",
    "确",
    "才",
    "科",
    "张",
    "信",
    "马",
    "节",
    "话",
    "米",
    "整",
    "空",
    "元",
    "况",
    "今",
    "集",
    "温",
    "传",
    "土",
    "许",
    "步",
    "群",
    "广",
    "石",
    "记",
    "需",
    "段",
    "研",
    "界",
    "拉",
    "林",
    "律",
    "叫",
    "且",
    "究",
    "观",
    "越",
    "织",
    "装",
    "影",
    "算",
    "低",
    "持",
    "音",
    "众",
    "书",
    "布",
    "复",
    "容",
    "儿",
    "须",
    "际",
    "商",
    "非",
    "验",
    "连",
    "断",
    "深",
    "难",
    "近",
    "矿",
    "千",
    "周",
    "委",
    "素",
    "技",
    "备",
    "半",
    "办",
    "青",
    "省",
    "列",
    "习",
    "响",
    "约",
    "支",
    "般",
    "史",
    "感",
    "劳",
    "便",
    "团",
    "往",
    "酸",
    "历",
    "市",
    "克",
    "何",
    "除",
    "消",
    "构",
    "府",
    "称",
    "太",
    "准",
    "精",
    "值",
    "号",
    "率",
    "族",
    "维",
    "划",
    "选",
    "标",
    "写",
    "存",
    "候",
    "毛",
    "亲",
    "快",
    "效",
    "斯",
    "院",
    "查",
    "江",
    "型",
    "眼",
    "王",
    "按",
    "格",
    "养",
    "易",
    "置",
    "派",
    "层",
    "片",
    "始",
    "却",
    "专",
    "状",
    "育",
    "厂",
    "京",
    "识",
    "适",
    "属",
    "圆",
    "包",
    "火",
    "住",
    "调",
    "满",
    "县",
    "局",
    "照",
    "参",
    "红",
    "细",
    "引",
    "听",
    "该",
    "铁",
    "价",
    "严",
    "首",
    "底",
    "液",
    "官",
    "德",
    "随",
    "病",
    "苏",
    "失",
    "尔",
    "死",
    "讲",
    "配",
    "女",
    "黄",
    "推",
    "显",
    "谈",
    "罪",
    "神",
    "艺",
    "呢",
    "席",
    "含",
    "企",
    "望",
    "密",
    "批",
    "营",
    "项",
    "防",
    "举",
    "球",
    "英",
    "氧",
    "势",
    "告",
    "李",
    "台",
    "落",
    "木",
    "帮",
    "轮",
    "破",
    "亚",
    "师",
    "围",
    "注",
    "远",
    "字",
    "材",
    "排",
    "供",
    "河",
    "态",
    "封",
    "另",
    "施",
    "减",
    "树",
    "溶",
    "怎",
    "止",
    "案",
    "言",
    "士",
    "均",
    "武",
    "固",
    "叶",
    "鱼",
    "波",
    "视",
    "仅",
    "费",
    "紧",
    "爱",
    "左",
    "章",
    "早",
    "朝",
    "害",
    "续",
    "轻",
    "服",
    "试",
    "食",
    "充",
    "兵",
    "源",
    "判",
    "护",
    "司",
    "足",
    "某",
    "练",
    "差",
    "致",
    "板",
    "田",
    "降",
    "黑",
    "犯",
    "负",
    "击",
    "范",
    "继",
    "兴",
    "似",
    "余",
    "坚",
    "曲",
    "输",
    "修",
    "故",
    "城",
    "夫",
    "够",
    "送",
    "笔",
    "船",
    "占",
    "右",
    "财",
    "吃",
    "富",
    "春",
    "职",
    "觉",
    "汉",
    "画",
    "功",
    "巴",
    "跟",
    "虽",
    "杂",
    "飞",
    "检",
    "吸",
    "助",
    "升",
    "阳",
    "互",
    "初",
    "创",
    "抗",
    "考",
    "投",
    "坏",
    "策",
    "古",
    "径",
    "换",
    "未",
    "跑",
    "留",
    "钢",
    "曾",
    "端",
    "责",
    "站",
    "简",
    "述",
    "钱",
    "副",
    "尽",
    "帝",
    "射",
    "草",
    "冲",
    "承",
    "独",
    "令",
    "限",
    "阿",
    "宣",
    "环",
    "双",
    "请",
    "超",
    "微",
    "让",
    "控",
    "州",
    "良",
    "轴",
    "找",
    "否",
    "纪",
    "益",
    "依",
    "优",
    "顶",
    "础",
    "载",
    "倒",
    "房",
    "突",
    "坐",
    "粉",
    "敌",
    "略",
    "客",
    "袁",
    "冷",
    "胜",
    "绝",
    "析",
    "块",
    "剂",
    "测",
    "丝",
    "协",
    "诉",
    "念",
    "陈",
    "仍",
    "罗",
    "盐",
    "友",
    "洋",
    "错",
    "苦",
    "夜",
    "刑",
    "移",
    "频",
    "逐",
    "靠",
    "混",
    "母",
    "短",
    "皮",
    "终",
    "聚",
    "汽",
    "村",
    "云",
    "哪",
    "既",
    "距",
    "卫",
    "停",
    "烈",
    "央",
    "察",
    "烧",
    "迅",
    "境",
    "若",
    "印",
    "洲",
    "刻",
    "括",
    "激",
    "孔",
    "搞",
    "甚",
    "室",
    "待",
    "核",
    "校",
    "散",
    "侵",
    "吧",
    "甲",
    "游",
    "久",
    "菜",
    "味",
    "旧",
    "模",
    "湖",
    "货",
    "损",
    "预",
    "阻",
    "毫",
    "普",
    "稳",
    "乙",
    "妈",
    "植",
    "息",
    "扩",
    "银",
    "语",
    "挥",
    "酒",
    "守",
    "拿",
    "序",
    "纸",
    "医",
    "缺",
    "雨",
    "吗",
    "针",
    "刘",
    "啊",
    "急",
    "唱",
    "误",
    "训",
    "愿",
    "审",
    "附",
    "获",
    "茶",
    "鲜",
    "粮",
    "斤",
    "孩",
    "脱",
    "硫",
    "肥",
    "善",
    "龙",
    "演",
    "父",
    "渐",
    "血",
    "欢",
    "械",
    "掌",
    "歌",
    "沙",
    "刚",
    "攻",
    "谓",
    "盾",
    "讨",
    "晚",
    "粒",
    "乱",
    "燃",
    "矛",
    "乎",
    "杀",
    "药",
    "宁",
    "鲁",
    "贵",
    "钟",
    "煤",
    "读",
    "班",
    "伯",
    "香",
    "介",
    "迫",
    "句",
    "丰",
    "培",
    "握",
    "兰",
    "担",
    "弦",
    "蛋",
    "沉",
    "假",
    "穿",
    "执",
    "答",
    "乐",
    "谁",
    "顺",
    "烟",
    "缩",
    "征",
    "脸",
    "喜",
    "松",
    "脚",
    "困",
    "异",
    "免",
    "背",
    "星",
    "福",
    "买",
    "染",
    "井",
    "概",
    "慢",
    "怕",
    "磁",
    "倍",
    "祖",
    "皇",
    "促",
    "静",
    "补",
    "评",
    "翻",
    "肉",
    "践",
    "尼",
    "衣",
    "宽",
    "扬",
    "棉",
    "希",
    "伤",
    "操",
    "垂",
    "秋",
    "宜",
    "氢",
    "套",
    "督",
    "振",
    "架",
    "亮",
    "末",
    "宪",
    "庆",
    "编",
    "牛",
    "触",
    "映",
    "雷",
    "销",
    "诗",
    "座",
    "居",
    "抓",
    "裂",
    "胞",
    "呼",
    "娘",
    "景",
    "威",
    "绿",
    "晶",
    "厚",
    "盟",
    "衡",
    "鸡",
    "孙",
    "延",
    "危",
    "胶",
    "屋",
    "乡",
    "临",
    "陆",
    "顾",
    "掉",
    "呀",
    "灯",
    "岁",
    "措",
    "束",
    "耐",
    "剧",
    "玉",
    "赵",
    "跳",
    "哥",
    "季",
    "课",
    "凯",
    "胡",
    "额",
    "款",
    "绍",
    "卷",
    "齐",
    "伟",
    "蒸",
    "殖",
    "永",
    "宗",
    "苗",
    "川",
    "炉",
    "岩",
    "弱",
    "零",
    "杨",
    "奏",
    "沿",
    "露",
    "杆",
    "探",
    "滑",
    "镇",
    "饭",
    "浓",
    "航",
    "怀",
    "赶",
    "库",
    "夺",
    "伊",
    "灵",
    "税",
    "途",
    "灭",
    "赛",
    "归",
    "召",
    "鼓",
    "播",
    "盘",
    "裁",
    "险",
    "康",
    "唯",
    "录",
    "菌",
    "纯",
    "借",
    "糖",
    "盖",
    "横",
    "符",
    "私",
    "努",
    "堂",
    "域",
    "枪",
    "润",
    "幅",
    "哈",
    "竟",
    "熟",
    "虫",
    "泽",
    "脑",
    "壤",
    "碳",
    "欧",
    "遍",
    "侧",
    "寨",
    "敢",
    "彻",
    "虑",
    "斜",
    "薄",
    "庭",
    "纳",
    "弹",
    "饲",
    "伸",
    "折",
    "麦",
    "湿",
    "暗",
    "荷",
    "瓦",
    "塞",
    "床",
    "筑",
    "恶",
    "户",
    "访",
    "塔",
    "奇",
    "透",
    "梁",
    "刀",
    "旋",
    "迹",
    "卡",
    "氯",
    "遇",
    "份",
    "毒",
    "泥",
    "退",
    "洗",
    "摆",
    "灰",
    "彩",
    "卖",
    "耗",
    "夏",
    "择",
    "忙",
    "铜",
    "献",
    "硬",
    "予",
    "繁",
    "圈",
    "雪",
    "函",
    "亦",
    "抽",
    "篇",
    "阵",
    "阴",
    "丁",
    "尺",
    "追",
    "堆",
    "雄",
    "迎",
    "泛",
    "爸",
    "楼",
    "避",
    "谋",
    "吨",
    "野",
    "猪",
    "旗",
    "累",
    "偏",
    "典",
    "馆",
    "索",
    "秦",
    "脂",
    "潮",
    "爷",
    "豆",
    "忽",
    "托",
    "惊",
    "塑",
    "遗",
    "愈",
    "朱",
    "替",
    "纤",
    "粗",
    "倾",
    "尚",
    "痛",
    "楚",
    "谢",
    "奋",
    "购",
    "磨",
    "君",
    "池",
    "旁",
    "碎",
    "骨",
    "监",
    "捕",
    "弟",
    "暴",
    "割",
    "贯",
    "殊",
    "释",
    "词",
    "亡",
    "壁",
    "顿",
    "宝",
    "午",
    "尘",
    "闻",
    "揭",
    "炮",
    "残",
    "冬",
    "桥",
    "妇",
    "警",
    "综",
    "招",
    "吴",
    "付",
    "浮",
    "遭",
    "徐",
    "您",
    "摇",
    "谷",
    "赞",
    "箱",
    "隔",
    "订",
    "男",
    "吹",
    "园",
    "纷",
    "唐",
    "败",
    "宋",
    "玻",
    "巨",
    "耕",
    "坦",
    "荣",
    "闭",
    "湾",
    "键",
    "凡",
    "驻",
    "锅",
    "救",
    "恩",
    "剥",
    "凝",
    "碱",
    "齿",
    "截",
    "炼",
    "麻",
    "纺",
    "禁",
    "废",
    "盛",
    "版",
    "缓",
    "净",
    "睛",
    "昌",
    "婚",
    "涉",
    "筒",
    "嘴",
    "插",
    "岸",
    "朗",
    "庄",
    "街",
    "藏",
    "姑",
    "贸",
    "腐",
    "奴",
    "啦",
    "惯",
    "乘",
    "伙",
    "恢",
    "匀",
    "纱",
    "扎",
    "辩",
    "耳",
    "彪",
    "臣",
    "亿",
    "璃",
    "抵",
    "脉",
    "秀",
    "萨",
    "俄",
    "网",
    "舞",
    "店",
    "喷",
    "纵",
    "寸",
    "汗",
    "挂",
    "洪",
    "贺",
    "闪",
    "柬",
    "爆",
    "烯",
    "津",
    "稻",
    "墙",
    "软",
    "勇",
    "像",
    "滚",
    "厘",
    "蒙",
    "芳",
    "肯",
    "坡",
    "柱",
    "荡",
    "腿",
    "仪",
    "旅",
    "尾",
    "轧",
    "冰",
    "贡",
    "登",
    "黎",
    "削",
    "钻",
    "勒",
    "逃",
    "障",
    "氨",
    "郭",
    "峰",
    "币",
    "港",
    "伏",
    "轨",
    "亩",
    "毕",
    "擦",
    "莫",
    "刺",
    "浪",
    "秘",
    "援",
    "株",
    "健",
    "售",
    "股",
    "岛",
    "甘",
    "泡",
    "睡",
    "童",
    "铸",
    "汤",
    "阀",
    "休",
    "汇",
    "舍",
    "牧",
    "绕",
    "炸",
    "哲",
    "磷",
    "绩",
    "朋",
    "淡",
    "尖",
    "启",
    "陷",
    "柴",
    "呈",
    "徒",
    "颜",
    "泪",
    "稍",
    "忘",
    "泵",
    "蓝",
    "拖",
    "洞",
    "授",
    "镜",
    "辛",
    "壮",
    "锋",
    "贫",
    "虚",
    "弯",
    "摩",
    "泰",
    "幼",
    "廷",
    "尊",
    "窗",
    "纲",
    "弄",
    "隶",
    "疑",
    "氏",
    "宫",
    "姐",
    "震",
    "瑞",
    "怪",
    "尤",
    "琴",
    "循",
    "描",
    "膜",
    "违",
    "夹",
    "腰",
    "缘",
    "珠",
    "穷",
    "森",
    "枝",
    "竹",
    "沟",
    "催",
    "绳",
    "忆",
    "邦",
    "剩",
    "幸",
    "浆",
    "栏",
    "拥",
    "牙",
    "贮",
    "礼",
    "滤",
    "钠",
    "纹",
    "罢",
    "拍",
    "咱",
    "喊",
    "袖",
    "埃",
    "勤",
    "罚",
    "焦",
    "潜",
    "伍",
    "墨",
    "欲",
    "缝",
    "姓",
    "刊",
    "饱",
    "仿",
    "奖",
    "铝",
    "鬼",
    "丽",
    "跨",
    "默",
    "挖",
    "链",
    "扫",
    "喝",
    "袋",
    "炭",
    "污",
    "幕",
    "诸",
    "弧",
    "励",
    "梅",
    "奶",
    "洁",
    "灾",
    "舟",
    "鉴",
    "苯",
    "讼",
    "抱",
    "毁",
    "懂",
    "寒",
    "智",
    "埔",
    "寄",
    "届",
    "跃",
    "渡",
    "挑",
    "丹",
    "艰",
    "贝",
    "碰",
    "拔",
    "爹",
    "戴",
    "码",
    "梦",
    "芽",
    "熔",
    "赤",
    "渔",
    "哭",
    "敬",
    "颗",
    "奔",
    "铅",
    "仲",
    "虎",
    "稀",
    "妹",
    "乏",
    "珍",
    "申",
    "桌",
    "遵",
    "允",
    "隆",
    "螺",
    "仓",
    "魏",
    "锐",
    "晓",
    "氮",
    "兼",
    "隐",
    "碍",
    "赫",
    "拨",
    "忠",
    "肃",
    "缸",
    "牵",
    "抢",
    "博",
    "巧",
    "壳",
    "兄",
    "杜",
    "讯",
    "诚",
    "碧",
    "祥",
    "柯",
    "页",
    "巡",
    "矩",
    "悲",
    "灌",
    "龄",
    "伦",
    "票",
    "寻",
    "桂",
    "铺",
    "圣",
    "恐",
    "恰",
    "郑",
    "趣",
    "抬",
    "荒",
    "腾",
    "贴",
    "柔",
    "滴",
    "猛",
    "阔",
    "辆",
    "妻",
    "填",
    "撤",
    "储",
    "签",
    "闹",
    "扰",
    "紫",
    "砂",
    "递",
    "戏",
    "吊",
    "陶",
    "伐",
    "喂",
    "疗",
    "瓶",
    "婆",
    "抚",
    "臂",
    "摸",
    "忍",
    "虾",
    "蜡",
    "邻",
    "胸",
    "巩",
    "挤",
    "偶",
    "弃",
    "槽",
    "劲",
    "乳",
    "邓",
    "吉",
    "仁",
    "烂",
    "砖",
    "租",
    "乌",
    "舰",
    "伴",
    "瓜",
    "浅",
    "丙",
    "暂",
    "燥",
    "橡",
    "柳",
    "迷",
    "暖",
    "牌",
    "秧",
    "胆",
    "详",
    "簧",
    "踏",
    "瓷",
    "谱",
    "呆",
    "宾",
    "糊",
    "洛",
    "辉",
    "愤",
    "竞",
    "隙",
    "怒",
    "粘",
    "乃",
    "绪",
    "肩",
    "籍",
    "敏",
    "涂",
    "熙",
    "皆",
    "侦",
    "悬",
    "掘",
    "享",
    "纠",
    "醒",
    "狂",
    "锁",
    "淀",
    "恨",
    "牲",
    "霸",
    "爬",
    "赏",
    "逆",
    "玩",
    "陵",
    "祝",
    "秒",
    "浙",
    "貌",
    "役",
    "彼",
    "悉",
    "鸭",
    "趋",
    "凤",
    "晨",
    "畜",
    "辈",
    "秩",
    "卵",
    "署",
    "梯",
    "炎",
    "滩",
    "棋",
    "驱",
    "筛",
    "峡",
    "冒",
    "啥",
    "寿",
    "译",
    "浸",
    "泉",
    "帽",
    "迟",
    "硅",
    "疆",
    "贷",
    "漏",
    "稿",
    "冠",
    "嫩",
    "胁",
    "芯",
    "牢",
    "叛",
    "蚀",
    "奥",
    "鸣",
    "岭",
    "羊",
    "凭",
    "串",
    "塘",
    "绘",
    "酵",
    "融",
    "盆",
    "锡",
    "庙",
    "筹",
    "冻",
    "辅",
    "摄",
    "袭",
    "筋",
    "拒",
    "僚",
    "旱",
    "钾",
    "鸟",
    "漆",
    "沈",
    "眉",
    "疏",
    "添",
    "棒",
    "穗",
    "硝",
    "韩",
    "逼",
    "扭",
    "侨",
    "凉",
    "挺",
    "碗",
    "栽",
    "炒",
    "杯",
    "患",
    "馏",
    "劝",
    "豪",
    "辽",
    "勃",
    "鸿",
    "旦",
    "吏",
    "拜",
    "狗",
    "埋",
    "辊",
    "掩",
    "饮",
    "搬",
    "骂",
    "辞",
    "勾",
    "扣",
    "估",
    "蒋",
    "绒",
    "雾",
    "丈",
    "朵",
    "姆",
    "拟",
    "宇",
    "辑",
    "陕",
    "雕",
    "偿",
    "蓄",
    "崇",
    "剪",
    "倡",
    "厅",
    "咬",
    "驶",
    "薯",
    "刷",
    "斥",
    "番",
    "赋",
    "奉",
    "佛",
    "浇",
    "漫",
    "曼",
    "扇",
    "钙",
    "桃",
    "扶",
    "仔",
    "返",
    "俗",
    "亏",
    "腔",
    "鞋",
    "棱",
    "覆",
    "框",
    "悄",
    "叔",
    "撞",
    "骗",
    "勘",
    "旺",
    "沸",
    "孤",
    "吐",
    "孟",
    "渠",
    "屈",
    "疾",
    "妙",
    "惜",
    "仰",
    "狠",
    "胀",
    "谐",
    "抛",
    "霉",
    "桑",
    "岗",
    "嘛",
    "衰",
    "盗",
    "渗",
    "脏",
    "赖",
    "涌",
    "甜",
    "曹",
    "阅",
    "肌",
    "哩",
    "厉",
    "烃",
    "纬",
    "毅",
    "昨",
    "伪",
    "症",
    "煮",
    "叹",
    "钉",
    "搭",
    "茎",
    "笼",
    "酷",
    "偷",
    "弓",
    "锥",
    "恒",
    "杰",
    "坑",
    "鼻",
    "翼",
    "纶",
    "叙",
    "狱",
    "逮",
    "罐",
    "络",
    "棚",
    "抑",
    "膨",
    "蔬",
    "寺",
    "骤",
    "穆",
    "冶",
    "枯",
    "册",
    "尸",
    "凸",
    "绅",
    "坯",
    "牺",
    "焰",
    "轰",
    "欣",
    "晋",
    "瘦",
    "御",
    "锭",
    "锦",
    "丧",
    "旬",
    "锻",
    "垄",
    "搜",
    "扑",
    "邀",
    "亭",
    "酯",
    "迈",
    "舒",
    "脆",
    "酶",
    "闲",
    "忧",
    "酚",
    "顽",
    "羽",
    "涨",
    "卸",
    "仗",
    "陪",
    "辟",
    "惩",
    "杭",
    "姚",
    "肚",
    "捉",
    "飘",
    "漂",
    "昆",
    "欺",
    "吾",
    "郎",
    "烷",
    "汁",
    "呵",
    "饰",
    "萧",
    "雅",
    "邮",
    "迁",
    "燕",
    "撒",
    "姻",
    "赴",
    "宴",
    "烦",
    "债",
    "帐",
    "斑",
    "铃",
    "旨",
    "醇",
    "董",
    "饼",
    "雏",
    "姿",
    "拌",
    "傅",
    "腹",
    "妥",
    "揉",
    "贤",
    "拆",
    "歪",
    "葡",
    "胺",
    "丢",
    "浩",
    "徽",
    "昂",
    "垫",
    "挡",
    "览",
    "贪",
    "慰",
    "缴",
    "汪",
    "慌",
    "冯",
    "诺",
    "姜",
    "谊",
    "凶",
    "劣",
    "诬",
    "耀",
    "昏",
    "躺",
    "盈",
    "骑",
    "乔",
    "溪",
    "丛",
    "卢",
    "抹",
    "闷",
    "咨",
    "刮",
    "驾",
    "缆",
    "悟",
    "摘",
    "铒",
    "掷",
    "颇",
    "幻",
    "柄",
    "惠",
    "惨",
    "佳",
    "仇",
    "腊",
    "窝",
    "涤",
    "剑",
    "瞧",
    "堡",
    "泼",
    "葱",
    "罩",
    "霍",
    "捞",
    "胎",
    "苍",
    "滨",
    "俩",
    "捅",
    "湘",
    "砍",
    "霞",
    "邵",
    "萄",
    "疯",
    "淮",
    "遂",
    "熊",
    "粪",
    "烘",
    "宿",
    "档",
    "戈",
    "驳",
    "嫂",
    "裕",
    "徙",
    "箭",
    "捐",
    "肠",
    "撑",
    "晒",
    "辨",
    "殿",
    "莲",
    "摊",
    "搅",
    "酱",
    "屏",
    "疫",
    "哀",
    "蔡",
    "堵",
    "沫",
    "皱",
    "畅",
    "叠",
    "阁",
    "莱",
    "敲",
    "辖",
    "钩",
    "痕",
    "坝",
    "巷",
    "饿",
    "祸",
    "丘",
    "玄",
    "溜",
    "曰",
    "逻",
    "彭",
    "尝",
    "卿",
    "妨",
    "艇",
    "吞",
    "韦",
    "怨",
    "矮",
    "歇"
]

},{}],35:[function(require,module,exports){
module.exports=[
    "的",
    "一",
    "是",
    "在",
    "不",
    "了",
    "有",
    "和",
    "人",
    "這",
    "中",
    "大",
    "為",
    "上",
    "個",
    "國",
    "我",
    "以",
    "要",
    "他",
    "時",
    "來",
    "用",
    "們",
    "生",
    "到",
    "作",
    "地",
    "於",
    "出",
    "就",
    "分",
    "對",
    "成",
    "會",
    "可",
    "主",
    "發",
    "年",
    "動",
    "同",
    "工",
    "也",
    "能",
    "下",
    "過",
    "子",
    "說",
    "產",
    "種",
    "面",
    "而",
    "方",
    "後",
    "多",
    "定",
    "行",
    "學",
    "法",
    "所",
    "民",
    "得",
    "經",
    "十",
    "三",
    "之",
    "進",
    "著",
    "等",
    "部",
    "度",
    "家",
    "電",
    "力",
    "裡",
    "如",
    "水",
    "化",
    "高",
    "自",
    "二",
    "理",
    "起",
    "小",
    "物",
    "現",
    "實",
    "加",
    "量",
    "都",
    "兩",
    "體",
    "制",
    "機",
    "當",
    "使",
    "點",
    "從",
    "業",
    "本",
    "去",
    "把",
    "性",
    "好",
    "應",
    "開",
    "它",
    "合",
    "還",
    "因",
    "由",
    "其",
    "些",
    "然",
    "前",
    "外",
    "天",
    "政",
    "四",
    "日",
    "那",
    "社",
    "義",
    "事",
    "平",
    "形",
    "相",
    "全",
    "表",
    "間",
    "樣",
    "與",
    "關",
    "各",
    "重",
    "新",
    "線",
    "內",
    "數",
    "正",
    "心",
    "反",
    "你",
    "明",
    "看",
    "原",
    "又",
    "麼",
    "利",
    "比",
    "或",
    "但",
    "質",
    "氣",
    "第",
    "向",
    "道",
    "命",
    "此",
    "變",
    "條",
    "只",
    "沒",
    "結",
    "解",
    "問",
    "意",
    "建",
    "月",
    "公",
    "無",
    "系",
    "軍",
    "很",
    "情",
    "者",
    "最",
    "立",
    "代",
    "想",
    "已",
    "通",
    "並",
    "提",
    "直",
    "題",
    "黨",
    "程",
    "展",
    "五",
    "果",
    "料",
    "象",
    "員",
    "革",
    "位",
    "入",
    "常",
    "文",
    "總",
    "次",
    "品",
    "式",
    "活",
    "設",
    "及",
    "管",
    "特",
    "件",
    "長",
    "求",
    "老",
    "頭",
    "基",
    "資",
    "邊",
    "流",
    "路",
    "級",
    "少",
    "圖",
    "山",
    "統",
    "接",
    "知",
    "較",
    "將",
    "組",
    "見",
    "計",
    "別",
    "她",
    "手",
    "角",
    "期",
    "根",
    "論",
    "運",
    "農",
    "指",
    "幾",
    "九",
    "區",
    "強",
    "放",
    "決",
    "西",
    "被",
    "幹",
    "做",
    "必",
    "戰",
    "先",
    "回",
    "則",
    "任",
    "取",
    "據",
    "處",
    "隊",
    "南",
    "給",
    "色",
    "光",
    "門",
    "即",
    "保",
    "治",
    "北",
    "造",
    "百",
    "規",
    "熱",
    "領",
    "七",
    "海",
    "口",
    "東",
    "導",
    "器",
    "壓",
    "志",
    "世",
    "金",
    "增",
    "爭",
    "濟",
    "階",
    "油",
    "思",
    "術",
    "極",
    "交",
    "受",
    "聯",
    "什",
    "認",
    "六",
    "共",
    "權",
    "收",
    "證",
    "改",
    "清",
    "美",
    "再",
    "採",
    "轉",
    "更",
    "單",
    "風",
    "切",
    "打",
    "白",
    "教",
    "速",
    "花",
    "帶",
    "安",
    "場",
    "身",
    "車",
    "例",
    "真",
    "務",
    "具",
    "萬",
    "每",
    "目",
    "至",
    "達",
    "走",
    "積",
    "示",
    "議",
    "聲",
    "報",
    "鬥",
    "完",
    "類",
    "八",
    "離",
    "華",
    "名",
    "確",
    "才",
    "科",
    "張",
    "信",
    "馬",
    "節",
    "話",
    "米",
    "整",
    "空",
    "元",
    "況",
    "今",
    "集",
    "溫",
    "傳",
    "土",
    "許",
    "步",
    "群",
    "廣",
    "石",
    "記",
    "需",
    "段",
    "研",
    "界",
    "拉",
    "林",
    "律",
    "叫",
    "且",
    "究",
    "觀",
    "越",
    "織",
    "裝",
    "影",
    "算",
    "低",
    "持",
    "音",
    "眾",
    "書",
    "布",
    "复",
    "容",
    "兒",
    "須",
    "際",
    "商",
    "非",
    "驗",
    "連",
    "斷",
    "深",
    "難",
    "近",
    "礦",
    "千",
    "週",
    "委",
    "素",
    "技",
    "備",
    "半",
    "辦",
    "青",
    "省",
    "列",
    "習",
    "響",
    "約",
    "支",
    "般",
    "史",
    "感",
    "勞",
    "便",
    "團",
    "往",
    "酸",
    "歷",
    "市",
    "克",
    "何",
    "除",
    "消",
    "構",
    "府",
    "稱",
    "太",
    "準",
    "精",
    "值",
    "號",
    "率",
    "族",
    "維",
    "劃",
    "選",
    "標",
    "寫",
    "存",
    "候",
    "毛",
    "親",
    "快",
    "效",
    "斯",
    "院",
    "查",
    "江",
    "型",
    "眼",
    "王",
    "按",
    "格",
    "養",
    "易",
    "置",
    "派",
    "層",
    "片",
    "始",
    "卻",
    "專",
    "狀",
    "育",
    "廠",
    "京",
    "識",
    "適",
    "屬",
    "圓",
    "包",
    "火",
    "住",
    "調",
    "滿",
    "縣",
    "局",
    "照",
    "參",
    "紅",
    "細",
    "引",
    "聽",
    "該",
    "鐵",
    "價",
    "嚴",
    "首",
    "底",
    "液",
    "官",
    "德",
    "隨",
    "病",
    "蘇",
    "失",
    "爾",
    "死",
    "講",
    "配",
    "女",
    "黃",
    "推",
    "顯",
    "談",
    "罪",
    "神",
    "藝",
    "呢",
    "席",
    "含",
    "企",
    "望",
    "密",
    "批",
    "營",
    "項",
    "防",
    "舉",
    "球",
    "英",
    "氧",
    "勢",
    "告",
    "李",
    "台",
    "落",
    "木",
    "幫",
    "輪",
    "破",
    "亞",
    "師",
    "圍",
    "注",
    "遠",
    "字",
    "材",
    "排",
    "供",
    "河",
    "態",
    "封",
    "另",
    "施",
    "減",
    "樹",
    "溶",
    "怎",
    "止",
    "案",
    "言",
    "士",
    "均",
    "武",
    "固",
    "葉",
    "魚",
    "波",
    "視",
    "僅",
    "費",
    "緊",
    "愛",
    "左",
    "章",
    "早",
    "朝",
    "害",
    "續",
    "輕",
    "服",
    "試",
    "食",
    "充",
    "兵",
    "源",
    "判",
    "護",
    "司",
    "足",
    "某",
    "練",
    "差",
    "致",
    "板",
    "田",
    "降",
    "黑",
    "犯",
    "負",
    "擊",
    "范",
    "繼",
    "興",
    "似",
    "餘",
    "堅",
    "曲",
    "輸",
    "修",
    "故",
    "城",
    "夫",
    "夠",
    "送",
    "筆",
    "船",
    "佔",
    "右",
    "財",
    "吃",
    "富",
    "春",
    "職",
    "覺",
    "漢",
    "畫",
    "功",
    "巴",
    "跟",
    "雖",
    "雜",
    "飛",
    "檢",
    "吸",
    "助",
    "昇",
    "陽",
    "互",
    "初",
    "創",
    "抗",
    "考",
    "投",
    "壞",
    "策",
    "古",
    "徑",
    "換",
    "未",
    "跑",
    "留",
    "鋼",
    "曾",
    "端",
    "責",
    "站",
    "簡",
    "述",
    "錢",
    "副",
    "盡",
    "帝",
    "射",
    "草",
    "衝",
    "承",
    "獨",
    "令",
    "限",
    "阿",
    "宣",
    "環",
    "雙",
    "請",
    "超",
    "微",
    "讓",
    "控",
    "州",
    "良",
    "軸",
    "找",
    "否",
    "紀",
    "益",
    "依",
    "優",
    "頂",
    "礎",
    "載",
    "倒",
    "房",
    "突",
    "坐",
    "粉",
    "敵",
    "略",
    "客",
    "袁",
    "冷",
    "勝",
    "絕",
    "析",
    "塊",
    "劑",
    "測",
    "絲",
    "協",
    "訴",
    "念",
    "陳",
    "仍",
    "羅",
    "鹽",
    "友",
    "洋",
    "錯",
    "苦",
    "夜",
    "刑",
    "移",
    "頻",
    "逐",
    "靠",
    "混",
    "母",
    "短",
    "皮",
    "終",
    "聚",
    "汽",
    "村",
    "雲",
    "哪",
    "既",
    "距",
    "衛",
    "停",
    "烈",
    "央",
    "察",
    "燒",
    "迅",
    "境",
    "若",
    "印",
    "洲",
    "刻",
    "括",
    "激",
    "孔",
    "搞",
    "甚",
    "室",
    "待",
    "核",
    "校",
    "散",
    "侵",
    "吧",
    "甲",
    "遊",
    "久",
    "菜",
    "味",
    "舊",
    "模",
    "湖",
    "貨",
    "損",
    "預",
    "阻",
    "毫",
    "普",
    "穩",
    "乙",
    "媽",
    "植",
    "息",
    "擴",
    "銀",
    "語",
    "揮",
    "酒",
    "守",
    "拿",
    "序",
    "紙",
    "醫",
    "缺",
    "雨",
    "嗎",
    "針",
    "劉",
    "啊",
    "急",
    "唱",
    "誤",
    "訓",
    "願",
    "審",
    "附",
    "獲",
    "茶",
    "鮮",
    "糧",
    "斤",
    "孩",
    "脫",
    "硫",
    "肥",
    "善",
    "龍",
    "演",
    "父",
    "漸",
    "血",
    "歡",
    "械",
    "掌",
    "歌",
    "沙",
    "剛",
    "攻",
    "謂",
    "盾",
    "討",
    "晚",
    "粒",
    "亂",
    "燃",
    "矛",
    "乎",
    "殺",
    "藥",
    "寧",
    "魯",
    "貴",
    "鐘",
    "煤",
    "讀",
    "班",
    "伯",
    "香",
    "介",
    "迫",
    "句",
    "豐",
    "培",
    "握",
    "蘭",
    "擔",
    "弦",
    "蛋",
    "沉",
    "假",
    "穿",
    "執",
    "答",
    "樂",
    "誰",
    "順",
    "煙",
    "縮",
    "徵",
    "臉",
    "喜",
    "松",
    "腳",
    "困",
    "異",
    "免",
    "背",
    "星",
    "福",
    "買",
    "染",
    "井",
    "概",
    "慢",
    "怕",
    "磁",
    "倍",
    "祖",
    "皇",
    "促",
    "靜",
    "補",
    "評",
    "翻",
    "肉",
    "踐",
    "尼",
    "衣",
    "寬",
    "揚",
    "棉",
    "希",
    "傷",
    "操",
    "垂",
    "秋",
    "宜",
    "氫",
    "套",
    "督",
    "振",
    "架",
    "亮",
    "末",
    "憲",
    "慶",
    "編",
    "牛",
    "觸",
    "映",
    "雷",
    "銷",
    "詩",
    "座",
    "居",
    "抓",
    "裂",
    "胞",
    "呼",
    "娘",
    "景",
    "威",
    "綠",
    "晶",
    "厚",
    "盟",
    "衡",
    "雞",
    "孫",
    "延",
    "危",
    "膠",
    "屋",
    "鄉",
    "臨",
    "陸",
    "顧",
    "掉",
    "呀",
    "燈",
    "歲",
    "措",
    "束",
    "耐",
    "劇",
    "玉",
    "趙",
    "跳",
    "哥",
    "季",
    "課",
    "凱",
    "胡",
    "額",
    "款",
    "紹",
    "卷",
    "齊",
    "偉",
    "蒸",
    "殖",
    "永",
    "宗",
    "苗",
    "川",
    "爐",
    "岩",
    "弱",
    "零",
    "楊",
    "奏",
    "沿",
    "露",
    "桿",
    "探",
    "滑",
    "鎮",
    "飯",
    "濃",
    "航",
    "懷",
    "趕",
    "庫",
    "奪",
    "伊",
    "靈",
    "稅",
    "途",
    "滅",
    "賽",
    "歸",
    "召",
    "鼓",
    "播",
    "盤",
    "裁",
    "險",
    "康",
    "唯",
    "錄",
    "菌",
    "純",
    "借",
    "糖",
    "蓋",
    "橫",
    "符",
    "私",
    "努",
    "堂",
    "域",
    "槍",
    "潤",
    "幅",
    "哈",
    "竟",
    "熟",
    "蟲",
    "澤",
    "腦",
    "壤",
    "碳",
    "歐",
    "遍",
    "側",
    "寨",
    "敢",
    "徹",
    "慮",
    "斜",
    "薄",
    "庭",
    "納",
    "彈",
    "飼",
    "伸",
    "折",
    "麥",
    "濕",
    "暗",
    "荷",
    "瓦",
    "塞",
    "床",
    "築",
    "惡",
    "戶",
    "訪",
    "塔",
    "奇",
    "透",
    "梁",
    "刀",
    "旋",
    "跡",
    "卡",
    "氯",
    "遇",
    "份",
    "毒",
    "泥",
    "退",
    "洗",
    "擺",
    "灰",
    "彩",
    "賣",
    "耗",
    "夏",
    "擇",
    "忙",
    "銅",
    "獻",
    "硬",
    "予",
    "繁",
    "圈",
    "雪",
    "函",
    "亦",
    "抽",
    "篇",
    "陣",
    "陰",
    "丁",
    "尺",
    "追",
    "堆",
    "雄",
    "迎",
    "泛",
    "爸",
    "樓",
    "避",
    "謀",
    "噸",
    "野",
    "豬",
    "旗",
    "累",
    "偏",
    "典",
    "館",
    "索",
    "秦",
    "脂",
    "潮",
    "爺",
    "豆",
    "忽",
    "托",
    "驚",
    "塑",
    "遺",
    "愈",
    "朱",
    "替",
    "纖",
    "粗",
    "傾",
    "尚",
    "痛",
    "楚",
    "謝",
    "奮",
    "購",
    "磨",
    "君",
    "池",
    "旁",
    "碎",
    "骨",
    "監",
    "捕",
    "弟",
    "暴",
    "割",
    "貫",
    "殊",
    "釋",
    "詞",
    "亡",
    "壁",
    "頓",
    "寶",
    "午",
    "塵",
    "聞",
    "揭",
    "炮",
    "殘",
    "冬",
    "橋",
    "婦",
    "警",
    "綜",
    "招",
    "吳",
    "付",
    "浮",
    "遭",
    "徐",
    "您",
    "搖",
    "谷",
    "贊",
    "箱",
    "隔",
    "訂",
    "男",
    "吹",
    "園",
    "紛",
    "唐",
    "敗",
    "宋",
    "玻",
    "巨",
    "耕",
    "坦",
    "榮",
    "閉",
    "灣",
    "鍵",
    "凡",
    "駐",
    "鍋",
    "救",
    "恩",
    "剝",
    "凝",
    "鹼",
    "齒",
    "截",
    "煉",
    "麻",
    "紡",
    "禁",
    "廢",
    "盛",
    "版",
    "緩",
    "淨",
    "睛",
    "昌",
    "婚",
    "涉",
    "筒",
    "嘴",
    "插",
    "岸",
    "朗",
    "莊",
    "街",
    "藏",
    "姑",
    "貿",
    "腐",
    "奴",
    "啦",
    "慣",
    "乘",
    "夥",
    "恢",
    "勻",
    "紗",
    "扎",
    "辯",
    "耳",
    "彪",
    "臣",
    "億",
    "璃",
    "抵",
    "脈",
    "秀",
    "薩",
    "俄",
    "網",
    "舞",
    "店",
    "噴",
    "縱",
    "寸",
    "汗",
    "掛",
    "洪",
    "賀",
    "閃",
    "柬",
    "爆",
    "烯",
    "津",
    "稻",
    "牆",
    "軟",
    "勇",
    "像",
    "滾",
    "厘",
    "蒙",
    "芳",
    "肯",
    "坡",
    "柱",
    "盪",
    "腿",
    "儀",
    "旅",
    "尾",
    "軋",
    "冰",
    "貢",
    "登",
    "黎",
    "削",
    "鑽",
    "勒",
    "逃",
    "障",
    "氨",
    "郭",
    "峰",
    "幣",
    "港",
    "伏",
    "軌",
    "畝",
    "畢",
    "擦",
    "莫",
    "刺",
    "浪",
    "秘",
    "援",
    "株",
    "健",
    "售",
    "股",
    "島",
    "甘",
    "泡",
    "睡",
    "童",
    "鑄",
    "湯",
    "閥",
    "休",
    "匯",
    "舍",
    "牧",
    "繞",
    "炸",
    "哲",
    "磷",
    "績",
    "朋",
    "淡",
    "尖",
    "啟",
    "陷",
    "柴",
    "呈",
    "徒",
    "顏",
    "淚",
    "稍",
    "忘",
    "泵",
    "藍",
    "拖",
    "洞",
    "授",
    "鏡",
    "辛",
    "壯",
    "鋒",
    "貧",
    "虛",
    "彎",
    "摩",
    "泰",
    "幼",
    "廷",
    "尊",
    "窗",
    "綱",
    "弄",
    "隸",
    "疑",
    "氏",
    "宮",
    "姐",
    "震",
    "瑞",
    "怪",
    "尤",
    "琴",
    "循",
    "描",
    "膜",
    "違",
    "夾",
    "腰",
    "緣",
    "珠",
    "窮",
    "森",
    "枝",
    "竹",
    "溝",
    "催",
    "繩",
    "憶",
    "邦",
    "剩",
    "幸",
    "漿",
    "欄",
    "擁",
    "牙",
    "貯",
    "禮",
    "濾",
    "鈉",
    "紋",
    "罷",
    "拍",
    "咱",
    "喊",
    "袖",
    "埃",
    "勤",
    "罰",
    "焦",
    "潛",
    "伍",
    "墨",
    "欲",
    "縫",
    "姓",
    "刊",
    "飽",
    "仿",
    "獎",
    "鋁",
    "鬼",
    "麗",
    "跨",
    "默",
    "挖",
    "鏈",
    "掃",
    "喝",
    "袋",
    "炭",
    "污",
    "幕",
    "諸",
    "弧",
    "勵",
    "梅",
    "奶",
    "潔",
    "災",
    "舟",
    "鑑",
    "苯",
    "訟",
    "抱",
    "毀",
    "懂",
    "寒",
    "智",
    "埔",
    "寄",
    "屆",
    "躍",
    "渡",
    "挑",
    "丹",
    "艱",
    "貝",
    "碰",
    "拔",
    "爹",
    "戴",
    "碼",
    "夢",
    "芽",
    "熔",
    "赤",
    "漁",
    "哭",
    "敬",
    "顆",
    "奔",
    "鉛",
    "仲",
    "虎",
    "稀",
    "妹",
    "乏",
    "珍",
    "申",
    "桌",
    "遵",
    "允",
    "隆",
    "螺",
    "倉",
    "魏",
    "銳",
    "曉",
    "氮",
    "兼",
    "隱",
    "礙",
    "赫",
    "撥",
    "忠",
    "肅",
    "缸",
    "牽",
    "搶",
    "博",
    "巧",
    "殼",
    "兄",
    "杜",
    "訊",
    "誠",
    "碧",
    "祥",
    "柯",
    "頁",
    "巡",
    "矩",
    "悲",
    "灌",
    "齡",
    "倫",
    "票",
    "尋",
    "桂",
    "鋪",
    "聖",
    "恐",
    "恰",
    "鄭",
    "趣",
    "抬",
    "荒",
    "騰",
    "貼",
    "柔",
    "滴",
    "猛",
    "闊",
    "輛",
    "妻",
    "填",
    "撤",
    "儲",
    "簽",
    "鬧",
    "擾",
    "紫",
    "砂",
    "遞",
    "戲",
    "吊",
    "陶",
    "伐",
    "餵",
    "療",
    "瓶",
    "婆",
    "撫",
    "臂",
    "摸",
    "忍",
    "蝦",
    "蠟",
    "鄰",
    "胸",
    "鞏",
    "擠",
    "偶",
    "棄",
    "槽",
    "勁",
    "乳",
    "鄧",
    "吉",
    "仁",
    "爛",
    "磚",
    "租",
    "烏",
    "艦",
    "伴",
    "瓜",
    "淺",
    "丙",
    "暫",
    "燥",
    "橡",
    "柳",
    "迷",
    "暖",
    "牌",
    "秧",
    "膽",
    "詳",
    "簧",
    "踏",
    "瓷",
    "譜",
    "呆",
    "賓",
    "糊",
    "洛",
    "輝",
    "憤",
    "競",
    "隙",
    "怒",
    "粘",
    "乃",
    "緒",
    "肩",
    "籍",
    "敏",
    "塗",
    "熙",
    "皆",
    "偵",
    "懸",
    "掘",
    "享",
    "糾",
    "醒",
    "狂",
    "鎖",
    "淀",
    "恨",
    "牲",
    "霸",
    "爬",
    "賞",
    "逆",
    "玩",
    "陵",
    "祝",
    "秒",
    "浙",
    "貌",
    "役",
    "彼",
    "悉",
    "鴨",
    "趨",
    "鳳",
    "晨",
    "畜",
    "輩",
    "秩",
    "卵",
    "署",
    "梯",
    "炎",
    "灘",
    "棋",
    "驅",
    "篩",
    "峽",
    "冒",
    "啥",
    "壽",
    "譯",
    "浸",
    "泉",
    "帽",
    "遲",
    "矽",
    "疆",
    "貸",
    "漏",
    "稿",
    "冠",
    "嫩",
    "脅",
    "芯",
    "牢",
    "叛",
    "蝕",
    "奧",
    "鳴",
    "嶺",
    "羊",
    "憑",
    "串",
    "塘",
    "繪",
    "酵",
    "融",
    "盆",
    "錫",
    "廟",
    "籌",
    "凍",
    "輔",
    "攝",
    "襲",
    "筋",
    "拒",
    "僚",
    "旱",
    "鉀",
    "鳥",
    "漆",
    "沈",
    "眉",
    "疏",
    "添",
    "棒",
    "穗",
    "硝",
    "韓",
    "逼",
    "扭",
    "僑",
    "涼",
    "挺",
    "碗",
    "栽",
    "炒",
    "杯",
    "患",
    "餾",
    "勸",
    "豪",
    "遼",
    "勃",
    "鴻",
    "旦",
    "吏",
    "拜",
    "狗",
    "埋",
    "輥",
    "掩",
    "飲",
    "搬",
    "罵",
    "辭",
    "勾",
    "扣",
    "估",
    "蔣",
    "絨",
    "霧",
    "丈",
    "朵",
    "姆",
    "擬",
    "宇",
    "輯",
    "陝",
    "雕",
    "償",
    "蓄",
    "崇",
    "剪",
    "倡",
    "廳",
    "咬",
    "駛",
    "薯",
    "刷",
    "斥",
    "番",
    "賦",
    "奉",
    "佛",
    "澆",
    "漫",
    "曼",
    "扇",
    "鈣",
    "桃",
    "扶",
    "仔",
    "返",
    "俗",
    "虧",
    "腔",
    "鞋",
    "棱",
    "覆",
    "框",
    "悄",
    "叔",
    "撞",
    "騙",
    "勘",
    "旺",
    "沸",
    "孤",
    "吐",
    "孟",
    "渠",
    "屈",
    "疾",
    "妙",
    "惜",
    "仰",
    "狠",
    "脹",
    "諧",
    "拋",
    "黴",
    "桑",
    "崗",
    "嘛",
    "衰",
    "盜",
    "滲",
    "臟",
    "賴",
    "湧",
    "甜",
    "曹",
    "閱",
    "肌",
    "哩",
    "厲",
    "烴",
    "緯",
    "毅",
    "昨",
    "偽",
    "症",
    "煮",
    "嘆",
    "釘",
    "搭",
    "莖",
    "籠",
    "酷",
    "偷",
    "弓",
    "錐",
    "恆",
    "傑",
    "坑",
    "鼻",
    "翼",
    "綸",
    "敘",
    "獄",
    "逮",
    "罐",
    "絡",
    "棚",
    "抑",
    "膨",
    "蔬",
    "寺",
    "驟",
    "穆",
    "冶",
    "枯",
    "冊",
    "屍",
    "凸",
    "紳",
    "坯",
    "犧",
    "焰",
    "轟",
    "欣",
    "晉",
    "瘦",
    "禦",
    "錠",
    "錦",
    "喪",
    "旬",
    "鍛",
    "壟",
    "搜",
    "撲",
    "邀",
    "亭",
    "酯",
    "邁",
    "舒",
    "脆",
    "酶",
    "閒",
    "憂",
    "酚",
    "頑",
    "羽",
    "漲",
    "卸",
    "仗",
    "陪",
    "闢",
    "懲",
    "杭",
    "姚",
    "肚",
    "捉",
    "飄",
    "漂",
    "昆",
    "欺",
    "吾",
    "郎",
    "烷",
    "汁",
    "呵",
    "飾",
    "蕭",
    "雅",
    "郵",
    "遷",
    "燕",
    "撒",
    "姻",
    "赴",
    "宴",
    "煩",
    "債",
    "帳",
    "斑",
    "鈴",
    "旨",
    "醇",
    "董",
    "餅",
    "雛",
    "姿",
    "拌",
    "傅",
    "腹",
    "妥",
    "揉",
    "賢",
    "拆",
    "歪",
    "葡",
    "胺",
    "丟",
    "浩",
    "徽",
    "昂",
    "墊",
    "擋",
    "覽",
    "貪",
    "慰",
    "繳",
    "汪",
    "慌",
    "馮",
    "諾",
    "姜",
    "誼",
    "兇",
    "劣",
    "誣",
    "耀",
    "昏",
    "躺",
    "盈",
    "騎",
    "喬",
    "溪",
    "叢",
    "盧",
    "抹",
    "悶",
    "諮",
    "刮",
    "駕",
    "纜",
    "悟",
    "摘",
    "鉺",
    "擲",
    "頗",
    "幻",
    "柄",
    "惠",
    "慘",
    "佳",
    "仇",
    "臘",
    "窩",
    "滌",
    "劍",
    "瞧",
    "堡",
    "潑",
    "蔥",
    "罩",
    "霍",
    "撈",
    "胎",
    "蒼",
    "濱",
    "倆",
    "捅",
    "湘",
    "砍",
    "霞",
    "邵",
    "萄",
    "瘋",
    "淮",
    "遂",
    "熊",
    "糞",
    "烘",
    "宿",
    "檔",
    "戈",
    "駁",
    "嫂",
    "裕",
    "徙",
    "箭",
    "捐",
    "腸",
    "撐",
    "曬",
    "辨",
    "殿",
    "蓮",
    "攤",
    "攪",
    "醬",
    "屏",
    "疫",
    "哀",
    "蔡",
    "堵",
    "沫",
    "皺",
    "暢",
    "疊",
    "閣",
    "萊",
    "敲",
    "轄",
    "鉤",
    "痕",
    "壩",
    "巷",
    "餓",
    "禍",
    "丘",
    "玄",
    "溜",
    "曰",
    "邏",
    "彭",
    "嘗",
    "卿",
    "妨",
    "艇",
    "吞",
    "韋",
    "怨",
    "矮",
    "歇"
]

},{}],36:[function(require,module,exports){
module.exports=[
    "abdikace",
    "abeceda",
    "adresa",
    "agrese",
    "akce",
    "aktovka",
    "alej",
    "alkohol",
    "amputace",
    "ananas",
    "andulka",
    "anekdota",
    "anketa",
    "antika",
    "anulovat",
    "archa",
    "arogance",
    "asfalt",
    "asistent",
    "aspirace",
    "astma",
    "astronom",
    "atlas",
    "atletika",
    "atol",
    "autobus",
    "azyl",
    "babka",
    "bachor",
    "bacil",
    "baculka",
    "badatel",
    "bageta",
    "bagr",
    "bahno",
    "bakterie",
    "balada",
    "baletka",
    "balkon",
    "balonek",
    "balvan",
    "balza",
    "bambus",
    "bankomat",
    "barbar",
    "baret",
    "barman",
    "baroko",
    "barva",
    "baterka",
    "batoh",
    "bavlna",
    "bazalka",
    "bazilika",
    "bazuka",
    "bedna",
    "beran",
    "beseda",
    "bestie",
    "beton",
    "bezinka",
    "bezmoc",
    "beztak",
    "bicykl",
    "bidlo",
    "biftek",
    "bikiny",
    "bilance",
    "biograf",
    "biolog",
    "bitva",
    "bizon",
    "blahobyt",
    "blatouch",
    "blecha",
    "bledule",
    "blesk",
    "blikat",
    "blizna",
    "blokovat",
    "bloudit",
    "blud",
    "bobek",
    "bobr",
    "bodlina",
    "bodnout",
    "bohatost",
    "bojkot",
    "bojovat",
    "bokorys",
    "bolest",
    "borec",
    "borovice",
    "bota",
    "boubel",
    "bouchat",
    "bouda",
    "boule",
    "bourat",
    "boxer",
    "bradavka",
    "brambora",
    "branka",
    "bratr",
    "brepta",
    "briketa",
    "brko",
    "brloh",
    "bronz",
    "broskev",
    "brunetka",
    "brusinka",
    "brzda",
    "brzy",
    "bublina",
    "bubnovat",
    "buchta",
    "buditel",
    "budka",
    "budova",
    "bufet",
    "bujarost",
    "bukvice",
    "buldok",
    "bulva",
    "bunda",
    "bunkr",
    "burza",
    "butik",
    "buvol",
    "buzola",
    "bydlet",
    "bylina",
    "bytovka",
    "bzukot",
    "capart",
    "carevna",
    "cedr",
    "cedule",
    "cejch",
    "cejn",
    "cela",
    "celer",
    "celkem",
    "celnice",
    "cenina",
    "cennost",
    "cenovka",
    "centrum",
    "cenzor",
    "cestopis",
    "cetka",
    "chalupa",
    "chapadlo",
    "charita",
    "chata",
    "chechtat",
    "chemie",
    "chichot",
    "chirurg",
    "chlad",
    "chleba",
    "chlubit",
    "chmel",
    "chmura",
    "chobot",
    "chochol",
    "chodba",
    "cholera",
    "chomout",
    "chopit",
    "choroba",
    "chov",
    "chrapot",
    "chrlit",
    "chrt",
    "chrup",
    "chtivost",
    "chudina",
    "chutnat",
    "chvat",
    "chvilka",
    "chvost",
    "chyba",
    "chystat",
    "chytit",
    "cibule",
    "cigareta",
    "cihelna",
    "cihla",
    "cinkot",
    "cirkus",
    "cisterna",
    "citace",
    "citrus",
    "cizinec",
    "cizost",
    "clona",
    "cokoliv",
    "couvat",
    "ctitel",
    "ctnost",
    "cudnost",
    "cuketa",
    "cukr",
    "cupot",
    "cvaknout",
    "cval",
    "cvik",
    "cvrkot",
    "cyklista",
    "daleko",
    "dareba",
    "datel",
    "datum",
    "dcera",
    "debata",
    "dechovka",
    "decibel",
    "deficit",
    "deflace",
    "dekl",
    "dekret",
    "demokrat",
    "deprese",
    "derby",
    "deska",
    "detektiv",
    "dikobraz",
    "diktovat",
    "dioda",
    "diplom",
    "disk",
    "displej",
    "divadlo",
    "divoch",
    "dlaha",
    "dlouho",
    "dluhopis",
    "dnes",
    "dobro",
    "dobytek",
    "docent",
    "dochutit",
    "dodnes",
    "dohled",
    "dohoda",
    "dohra",
    "dojem",
    "dojnice",
    "doklad",
    "dokola",
    "doktor",
    "dokument",
    "dolar",
    "doleva",
    "dolina",
    "doma",
    "dominant",
    "domluvit",
    "domov",
    "donutit",
    "dopad",
    "dopis",
    "doplnit",
    "doposud",
    "doprovod",
    "dopustit",
    "dorazit",
    "dorost",
    "dort",
    "dosah",
    "doslov",
    "dostatek",
    "dosud",
    "dosyta",
    "dotaz",
    "dotek",
    "dotknout",
    "doufat",
    "doutnat",
    "dovozce",
    "dozadu",
    "doznat",
    "dozorce",
    "drahota",
    "drak",
    "dramatik",
    "dravec",
    "draze",
    "drdol",
    "drobnost",
    "drogerie",
    "drozd",
    "drsnost",
    "drtit",
    "drzost",
    "duben",
    "duchovno",
    "dudek",
    "duha",
    "duhovka",
    "dusit",
    "dusno",
    "dutost",
    "dvojice",
    "dvorec",
    "dynamit",
    "ekolog",
    "ekonomie",
    "elektron",
    "elipsa",
    "email",
    "emise",
    "emoce",
    "empatie",
    "epizoda",
    "epocha",
    "epopej",
    "epos",
    "esej",
    "esence",
    "eskorta",
    "eskymo",
    "etiketa",
    "euforie",
    "evoluce",
    "exekuce",
    "exkurze",
    "expedice",
    "exploze",
    "export",
    "extrakt",
    "facka",
    "fajfka",
    "fakulta",
    "fanatik",
    "fantazie",
    "farmacie",
    "favorit",
    "fazole",
    "federace",
    "fejeton",
    "fenka",
    "fialka",
    "figurant",
    "filozof",
    "filtr",
    "finance",
    "finta",
    "fixace",
    "fjord",
    "flanel",
    "flirt",
    "flotila",
    "fond",
    "fosfor",
    "fotbal",
    "fotka",
    "foton",
    "frakce",
    "freska",
    "fronta",
    "fukar",
    "funkce",
    "fyzika",
    "galeje",
    "garant",
    "genetika",
    "geolog",
    "gilotina",
    "glazura",
    "glejt",
    "golem",
    "golfista",
    "gotika",
    "graf",
    "gramofon",
    "granule",
    "grep",
    "gril",
    "grog",
    "groteska",
    "guma",
    "hadice",
    "hadr",
    "hala",
    "halenka",
    "hanba",
    "hanopis",
    "harfa",
    "harpuna",
    "havran",
    "hebkost",
    "hejkal",
    "hejno",
    "hejtman",
    "hektar",
    "helma",
    "hematom",
    "herec",
    "herna",
    "heslo",
    "hezky",
    "historik",
    "hladovka",
    "hlasivky",
    "hlava",
    "hledat",
    "hlen",
    "hlodavec",
    "hloh",
    "hloupost",
    "hltat",
    "hlubina",
    "hluchota",
    "hmat",
    "hmota",
    "hmyz",
    "hnis",
    "hnojivo",
    "hnout",
    "hoblina",
    "hoboj",
    "hoch",
    "hodiny",
    "hodlat",
    "hodnota",
    "hodovat",
    "hojnost",
    "hokej",
    "holinka",
    "holka",
    "holub",
    "homole",
    "honitba",
    "honorace",
    "horal",
    "horda",
    "horizont",
    "horko",
    "horlivec",
    "hormon",
    "hornina",
    "horoskop",
    "horstvo",
    "hospoda",
    "hostina",
    "hotovost",
    "houba",
    "houf",
    "houpat",
    "houska",
    "hovor",
    "hradba",
    "hranice",
    "hravost",
    "hrazda",
    "hrbolek",
    "hrdina",
    "hrdlo",
    "hrdost",
    "hrnek",
    "hrobka",
    "hromada",
    "hrot",
    "hrouda",
    "hrozen",
    "hrstka",
    "hrubost",
    "hryzat",
    "hubenost",
    "hubnout",
    "hudba",
    "hukot",
    "humr",
    "husita",
    "hustota",
    "hvozd",
    "hybnost",
    "hydrant",
    "hygiena",
    "hymna",
    "hysterik",
    "idylka",
    "ihned",
    "ikona",
    "iluze",
    "imunita",
    "infekce",
    "inflace",
    "inkaso",
    "inovace",
    "inspekce",
    "internet",
    "invalida",
    "investor",
    "inzerce",
    "ironie",
    "jablko",
    "jachta",
    "jahoda",
    "jakmile",
    "jakost",
    "jalovec",
    "jantar",
    "jarmark",
    "jaro",
    "jasan",
    "jasno",
    "jatka",
    "javor",
    "jazyk",
    "jedinec",
    "jedle",
    "jednatel",
    "jehlan",
    "jekot",
    "jelen",
    "jelito",
    "jemnost",
    "jenom",
    "jepice",
    "jeseter",
    "jevit",
    "jezdec",
    "jezero",
    "jinak",
    "jindy",
    "jinoch",
    "jiskra",
    "jistota",
    "jitrnice",
    "jizva",
    "jmenovat",
    "jogurt",
    "jurta",
    "kabaret",
    "kabel",
    "kabinet",
    "kachna",
    "kadet",
    "kadidlo",
    "kahan",
    "kajak",
    "kajuta",
    "kakao",
    "kaktus",
    "kalamita",
    "kalhoty",
    "kalibr",
    "kalnost",
    "kamera",
    "kamkoliv",
    "kamna",
    "kanibal",
    "kanoe",
    "kantor",
    "kapalina",
    "kapela",
    "kapitola",
    "kapka",
    "kaple",
    "kapota",
    "kapr",
    "kapusta",
    "kapybara",
    "karamel",
    "karotka",
    "karton",
    "kasa",
    "katalog",
    "katedra",
    "kauce",
    "kauza",
    "kavalec",
    "kazajka",
    "kazeta",
    "kazivost",
    "kdekoliv",
    "kdesi",
    "kedluben",
    "kemp",
    "keramika",
    "kino",
    "klacek",
    "kladivo",
    "klam",
    "klapot",
    "klasika",
    "klaun",
    "klec",
    "klenba",
    "klepat",
    "klesnout",
    "klid",
    "klima",
    "klisna",
    "klobouk",
    "klokan",
    "klopa",
    "kloub",
    "klubovna",
    "klusat",
    "kluzkost",
    "kmen",
    "kmitat",
    "kmotr",
    "kniha",
    "knot",
    "koalice",
    "koberec",
    "kobka",
    "kobliha",
    "kobyla",
    "kocour",
    "kohout",
    "kojenec",
    "kokos",
    "koktejl",
    "kolaps",
    "koleda",
    "kolize",
    "kolo",
    "komando",
    "kometa",
    "komik",
    "komnata",
    "komora",
    "kompas",
    "komunita",
    "konat",
    "koncept",
    "kondice",
    "konec",
    "konfese",
    "kongres",
    "konina",
    "konkurs",
    "kontakt",
    "konzerva",
    "kopanec",
    "kopie",
    "kopnout",
    "koprovka",
    "korbel",
    "korektor",
    "kormidlo",
    "koroptev",
    "korpus",
    "koruna",
    "koryto",
    "korzet",
    "kosatec",
    "kostka",
    "kotel",
    "kotleta",
    "kotoul",
    "koukat",
    "koupelna",
    "kousek",
    "kouzlo",
    "kovboj",
    "koza",
    "kozoroh",
    "krabice",
    "krach",
    "krajina",
    "kralovat",
    "krasopis",
    "kravata",
    "kredit",
    "krejcar",
    "kresba",
    "kreveta",
    "kriket",
    "kritik",
    "krize",
    "krkavec",
    "krmelec",
    "krmivo",
    "krocan",
    "krok",
    "kronika",
    "kropit",
    "kroupa",
    "krovka",
    "krtek",
    "kruhadlo",
    "krupice",
    "krutost",
    "krvinka",
    "krychle",
    "krypta",
    "krystal",
    "kryt",
    "kudlanka",
    "kufr",
    "kujnost",
    "kukla",
    "kulajda",
    "kulich",
    "kulka",
    "kulomet",
    "kultura",
    "kuna",
    "kupodivu",
    "kurt",
    "kurzor",
    "kutil",
    "kvalita",
    "kvasinka",
    "kvestor",
    "kynolog",
    "kyselina",
    "kytara",
    "kytice",
    "kytka",
    "kytovec",
    "kyvadlo",
    "labrador",
    "lachtan",
    "ladnost",
    "laik",
    "lakomec",
    "lamela",
    "lampa",
    "lanovka",
    "lasice",
    "laso",
    "lastura",
    "latinka",
    "lavina",
    "lebka",
    "leckdy",
    "leden",
    "lednice",
    "ledovka",
    "ledvina",
    "legenda",
    "legie",
    "legrace",
    "lehce",
    "lehkost",
    "lehnout",
    "lektvar",
    "lenochod",
    "lentilka",
    "lepenka",
    "lepidlo",
    "letadlo",
    "letec",
    "letmo",
    "letokruh",
    "levhart",
    "levitace",
    "levobok",
    "libra",
    "lichotka",
    "lidojed",
    "lidskost",
    "lihovina",
    "lijavec",
    "lilek",
    "limetka",
    "linie",
    "linka",
    "linoleum",
    "listopad",
    "litina",
    "litovat",
    "lobista",
    "lodivod",
    "logika",
    "logoped",
    "lokalita",
    "loket",
    "lomcovat",
    "lopata",
    "lopuch",
    "lord",
    "losos",
    "lotr",
    "loudal",
    "louh",
    "louka",
    "louskat",
    "lovec",
    "lstivost",
    "lucerna",
    "lucifer",
    "lump",
    "lusk",
    "lustrace",
    "lvice",
    "lyra",
    "lyrika",
    "lysina",
    "madam",
    "madlo",
    "magistr",
    "mahagon",
    "majetek",
    "majitel",
    "majorita",
    "makak",
    "makovice",
    "makrela",
    "malba",
    "malina",
    "malovat",
    "malvice",
    "maminka",
    "mandle",
    "manko",
    "marnost",
    "masakr",
    "maskot",
    "masopust",
    "matice",
    "matrika",
    "maturita",
    "mazanec",
    "mazivo",
    "mazlit",
    "mazurka",
    "mdloba",
    "mechanik",
    "meditace",
    "medovina",
    "melasa",
    "meloun",
    "mentolka",
    "metla",
    "metoda",
    "metr",
    "mezera",
    "migrace",
    "mihnout",
    "mihule",
    "mikina",
    "mikrofon",
    "milenec",
    "milimetr",
    "milost",
    "mimika",
    "mincovna",
    "minibar",
    "minomet",
    "minulost",
    "miska",
    "mistr",
    "mixovat",
    "mladost",
    "mlha",
    "mlhovina",
    "mlok",
    "mlsat",
    "mluvit",
    "mnich",
    "mnohem",
    "mobil",
    "mocnost",
    "modelka",
    "modlitba",
    "mohyla",
    "mokro",
    "molekula",
    "momentka",
    "monarcha",
    "monokl",
    "monstrum",
    "montovat",
    "monzun",
    "mosaz",
    "moskyt",
    "most",
    "motivace",
    "motorka",
    "motyka",
    "moucha",
    "moudrost",
    "mozaika",
    "mozek",
    "mozol",
    "mramor",
    "mravenec",
    "mrkev",
    "mrtvola",
    "mrzet",
    "mrzutost",
    "mstitel",
    "mudrc",
    "muflon",
    "mulat",
    "mumie",
    "munice",
    "muset",
    "mutace",
    "muzeum",
    "muzikant",
    "myslivec",
    "mzda",
    "nabourat",
    "nachytat",
    "nadace",
    "nadbytek",
    "nadhoz",
    "nadobro",
    "nadpis",
    "nahlas",
    "nahnat",
    "nahodile",
    "nahradit",
    "naivita",
    "najednou",
    "najisto",
    "najmout",
    "naklonit",
    "nakonec",
    "nakrmit",
    "nalevo",
    "namazat",
    "namluvit",
    "nanometr",
    "naoko",
    "naopak",
    "naostro",
    "napadat",
    "napevno",
    "naplnit",
    "napnout",
    "naposled",
    "naprosto",
    "narodit",
    "naruby",
    "narychlo",
    "nasadit",
    "nasekat",
    "naslepo",
    "nastat",
    "natolik",
    "navenek",
    "navrch",
    "navzdory",
    "nazvat",
    "nebe",
    "nechat",
    "necky",
    "nedaleko",
    "nedbat",
    "neduh",
    "negace",
    "nehet",
    "nehoda",
    "nejen",
    "nejprve",
    "neklid",
    "nelibost",
    "nemilost",
    "nemoc",
    "neochota",
    "neonka",
    "nepokoj",
    "nerost",
    "nerv",
    "nesmysl",
    "nesoulad",
    "netvor",
    "neuron",
    "nevina",
    "nezvykle",
    "nicota",
    "nijak",
    "nikam",
    "nikdy",
    "nikl",
    "nikterak",
    "nitro",
    "nocleh",
    "nohavice",
    "nominace",
    "nora",
    "norek",
    "nositel",
    "nosnost",
    "nouze",
    "noviny",
    "novota",
    "nozdra",
    "nuda",
    "nudle",
    "nuget",
    "nutit",
    "nutnost",
    "nutrie",
    "nymfa",
    "obal",
    "obarvit",
    "obava",
    "obdiv",
    "obec",
    "obehnat",
    "obejmout",
    "obezita",
    "obhajoba",
    "obilnice",
    "objasnit",
    "objekt",
    "obklopit",
    "oblast",
    "oblek",
    "obliba",
    "obloha",
    "obluda",
    "obnos",
    "obohatit",
    "obojek",
    "obout",
    "obrazec",
    "obrna",
    "obruba",
    "obrys",
    "obsah",
    "obsluha",
    "obstarat",
    "obuv",
    "obvaz",
    "obvinit",
    "obvod",
    "obvykle",
    "obyvatel",
    "obzor",
    "ocas",
    "ocel",
    "ocenit",
    "ochladit",
    "ochota",
    "ochrana",
    "ocitnout",
    "odboj",
    "odbyt",
    "odchod",
    "odcizit",
    "odebrat",
    "odeslat",
    "odevzdat",
    "odezva",
    "odhadce",
    "odhodit",
    "odjet",
    "odjinud",
    "odkaz",
    "odkoupit",
    "odliv",
    "odluka",
    "odmlka",
    "odolnost",
    "odpad",
    "odpis",
    "odplout",
    "odpor",
    "odpustit",
    "odpykat",
    "odrazka",
    "odsoudit",
    "odstup",
    "odsun",
    "odtok",
    "odtud",
    "odvaha",
    "odveta",
    "odvolat",
    "odvracet",
    "odznak",
    "ofina",
    "ofsajd",
    "ohlas",
    "ohnisko",
    "ohrada",
    "ohrozit",
    "ohryzek",
    "okap",
    "okenice",
    "oklika",
    "okno",
    "okouzlit",
    "okovy",
    "okrasa",
    "okres",
    "okrsek",
    "okruh",
    "okupant",
    "okurka",
    "okusit",
    "olejnina",
    "olizovat",
    "omak",
    "omeleta",
    "omezit",
    "omladina",
    "omlouvat",
    "omluva",
    "omyl",
    "onehdy",
    "opakovat",
    "opasek",
    "operace",
    "opice",
    "opilost",
    "opisovat",
    "opora",
    "opozice",
    "opravdu",
    "oproti",
    "orbital",
    "orchestr",
    "orgie",
    "orlice",
    "orloj",
    "ortel",
    "osada",
    "oschnout",
    "osika",
    "osivo",
    "oslava",
    "oslepit",
    "oslnit",
    "oslovit",
    "osnova",
    "osoba",
    "osolit",
    "ospalec",
    "osten",
    "ostraha",
    "ostuda",
    "ostych",
    "osvojit",
    "oteplit",
    "otisk",
    "otop",
    "otrhat",
    "otrlost",
    "otrok",
    "otruby",
    "otvor",
    "ovanout",
    "ovar",
    "oves",
    "ovlivnit",
    "ovoce",
    "oxid",
    "ozdoba",
    "pachatel",
    "pacient",
    "padouch",
    "pahorek",
    "pakt",
    "palanda",
    "palec",
    "palivo",
    "paluba",
    "pamflet",
    "pamlsek",
    "panenka",
    "panika",
    "panna",
    "panovat",
    "panstvo",
    "pantofle",
    "paprika",
    "parketa",
    "parodie",
    "parta",
    "paruka",
    "paryba",
    "paseka",
    "pasivita",
    "pastelka",
    "patent",
    "patrona",
    "pavouk",
    "pazneht",
    "pazourek",
    "pecka",
    "pedagog",
    "pejsek",
    "peklo",
    "peloton",
    "penalta",
    "pendrek",
    "penze",
    "periskop",
    "pero",
    "pestrost",
    "petarda",
    "petice",
    "petrolej",
    "pevnina",
    "pexeso",
    "pianista",
    "piha",
    "pijavice",
    "pikle",
    "piknik",
    "pilina",
    "pilnost",
    "pilulka",
    "pinzeta",
    "pipeta",
    "pisatel",
    "pistole",
    "pitevna",
    "pivnice",
    "pivovar",
    "placenta",
    "plakat",
    "plamen",
    "planeta",
    "plastika",
    "platit",
    "plavidlo",
    "plaz",
    "plech",
    "plemeno",
    "plenta",
    "ples",
    "pletivo",
    "plevel",
    "plivat",
    "plnit",
    "plno",
    "plocha",
    "plodina",
    "plomba",
    "plout",
    "pluk",
    "plyn",
    "pobavit",
    "pobyt",
    "pochod",
    "pocit",
    "poctivec",
    "podat",
    "podcenit",
    "podepsat",
    "podhled",
    "podivit",
    "podklad",
    "podmanit",
    "podnik",
    "podoba",
    "podpora",
    "podraz",
    "podstata",
    "podvod",
    "podzim",
    "poezie",
    "pohanka",
    "pohnutka",
    "pohovor",
    "pohroma",
    "pohyb",
    "pointa",
    "pojistka",
    "pojmout",
    "pokazit",
    "pokles",
    "pokoj",
    "pokrok",
    "pokuta",
    "pokyn",
    "poledne",
    "polibek",
    "polknout",
    "poloha",
    "polynom",
    "pomalu",
    "pominout",
    "pomlka",
    "pomoc",
    "pomsta",
    "pomyslet",
    "ponechat",
    "ponorka",
    "ponurost",
    "popadat",
    "popel",
    "popisek",
    "poplach",
    "poprosit",
    "popsat",
    "popud",
    "poradce",
    "porce",
    "porod",
    "porucha",
    "poryv",
    "posadit",
    "posed",
    "posila",
    "poskok",
    "poslanec",
    "posoudit",
    "pospolu",
    "postava",
    "posudek",
    "posyp",
    "potah",
    "potkan",
    "potlesk",
    "potomek",
    "potrava",
    "potupa",
    "potvora",
    "poukaz",
    "pouto",
    "pouzdro",
    "povaha",
    "povidla",
    "povlak",
    "povoz",
    "povrch",
    "povstat",
    "povyk",
    "povzdech",
    "pozdrav",
    "pozemek",
    "poznatek",
    "pozor",
    "pozvat",
    "pracovat",
    "prahory",
    "praktika",
    "prales",
    "praotec",
    "praporek",
    "prase",
    "pravda",
    "princip",
    "prkno",
    "probudit",
    "procento",
    "prodej",
    "profese",
    "prohra",
    "projekt",
    "prolomit",
    "promile",
    "pronikat",
    "propad",
    "prorok",
    "prosba",
    "proton",
    "proutek",
    "provaz",
    "prskavka",
    "prsten",
    "prudkost",
    "prut",
    "prvek",
    "prvohory",
    "psanec",
    "psovod",
    "pstruh",
    "ptactvo",
    "puberta",
    "puch",
    "pudl",
    "pukavec",
    "puklina",
    "pukrle",
    "pult",
    "pumpa",
    "punc",
    "pupen",
    "pusa",
    "pusinka",
    "pustina",
    "putovat",
    "putyka",
    "pyramida",
    "pysk",
    "pytel",
    "racek",
    "rachot",
    "radiace",
    "radnice",
    "radon",
    "raft",
    "ragby",
    "raketa",
    "rakovina",
    "rameno",
    "rampouch",
    "rande",
    "rarach",
    "rarita",
    "rasovna",
    "rastr",
    "ratolest",
    "razance",
    "razidlo",
    "reagovat",
    "reakce",
    "recept",
    "redaktor",
    "referent",
    "reflex",
    "rejnok",
    "reklama",
    "rekord",
    "rekrut",
    "rektor",
    "reputace",
    "revize",
    "revma",
    "revolver",
    "rezerva",
    "riskovat",
    "riziko",
    "robotika",
    "rodokmen",
    "rohovka",
    "rokle",
    "rokoko",
    "romaneto",
    "ropovod",
    "ropucha",
    "rorejs",
    "rosol",
    "rostlina",
    "rotmistr",
    "rotoped",
    "rotunda",
    "roubenka",
    "roucho",
    "roup",
    "roura",
    "rovina",
    "rovnice",
    "rozbor",
    "rozchod",
    "rozdat",
    "rozeznat",
    "rozhodce",
    "rozinka",
    "rozjezd",
    "rozkaz",
    "rozloha",
    "rozmar",
    "rozpad",
    "rozruch",
    "rozsah",
    "roztok",
    "rozum",
    "rozvod",
    "rubrika",
    "ruchadlo",
    "rukavice",
    "rukopis",
    "ryba",
    "rybolov",
    "rychlost",
    "rydlo",
    "rypadlo",
    "rytina",
    "ryzost",
    "sadista",
    "sahat",
    "sako",
    "samec",
    "samizdat",
    "samota",
    "sanitka",
    "sardinka",
    "sasanka",
    "satelit",
    "sazba",
    "sazenice",
    "sbor",
    "schovat",
    "sebranka",
    "secese",
    "sedadlo",
    "sediment",
    "sedlo",
    "sehnat",
    "sejmout",
    "sekera",
    "sekta",
    "sekunda",
    "sekvoje",
    "semeno",
    "seno",
    "servis",
    "sesadit",
    "seshora",
    "seskok",
    "seslat",
    "sestra",
    "sesuv",
    "sesypat",
    "setba",
    "setina",
    "setkat",
    "setnout",
    "setrvat",
    "sever",
    "seznam",
    "shoda",
    "shrnout",
    "sifon",
    "silnice",
    "sirka",
    "sirotek",
    "sirup",
    "situace",
    "skafandr",
    "skalisko",
    "skanzen",
    "skaut",
    "skeptik",
    "skica",
    "skladba",
    "sklenice",
    "sklo",
    "skluz",
    "skoba",
    "skokan",
    "skoro",
    "skripta",
    "skrz",
    "skupina",
    "skvost",
    "skvrna",
    "slabika",
    "sladidlo",
    "slanina",
    "slast",
    "slavnost",
    "sledovat",
    "slepec",
    "sleva",
    "slezina",
    "slib",
    "slina",
    "sliznice",
    "slon",
    "sloupek",
    "slovo",
    "sluch",
    "sluha",
    "slunce",
    "slupka",
    "slza",
    "smaragd",
    "smetana",
    "smilstvo",
    "smlouva",
    "smog",
    "smrad",
    "smrk",
    "smrtka",
    "smutek",
    "smysl",
    "snad",
    "snaha",
    "snob",
    "sobota",
    "socha",
    "sodovka",
    "sokol",
    "sopka",
    "sotva",
    "souboj",
    "soucit",
    "soudce",
    "souhlas",
    "soulad",
    "soumrak",
    "souprava",
    "soused",
    "soutok",
    "souviset",
    "spalovna",
    "spasitel",
    "spis",
    "splav",
    "spodek",
    "spojenec",
    "spolu",
    "sponzor",
    "spornost",
    "spousta",
    "sprcha",
    "spustit",
    "sranda",
    "sraz",
    "srdce",
    "srna",
    "srnec",
    "srovnat",
    "srpen",
    "srst",
    "srub",
    "stanice",
    "starosta",
    "statika",
    "stavba",
    "stehno",
    "stezka",
    "stodola",
    "stolek",
    "stopa",
    "storno",
    "stoupat",
    "strach",
    "stres",
    "strhnout",
    "strom",
    "struna",
    "studna",
    "stupnice",
    "stvol",
    "styk",
    "subjekt",
    "subtropy",
    "suchar",
    "sudost",
    "sukno",
    "sundat",
    "sunout",
    "surikata",
    "surovina",
    "svah",
    "svalstvo",
    "svetr",
    "svatba",
    "svazek",
    "svisle",
    "svitek",
    "svoboda",
    "svodidlo",
    "svorka",
    "svrab",
    "sykavka",
    "sykot",
    "synek",
    "synovec",
    "sypat",
    "sypkost",
    "syrovost",
    "sysel",
    "sytost",
    "tabletka",
    "tabule",
    "tahoun",
    "tajemno",
    "tajfun",
    "tajga",
    "tajit",
    "tajnost",
    "taktika",
    "tamhle",
    "tampon",
    "tancovat",
    "tanec",
    "tanker",
    "tapeta",
    "tavenina",
    "tazatel",
    "technika",
    "tehdy",
    "tekutina",
    "telefon",
    "temnota",
    "tendence",
    "tenista",
    "tenor",
    "teplota",
    "tepna",
    "teprve",
    "terapie",
    "termoska",
    "textil",
    "ticho",
    "tiskopis",
    "titulek",
    "tkadlec",
    "tkanina",
    "tlapka",
    "tleskat",
    "tlukot",
    "tlupa",
    "tmel",
    "toaleta",
    "topinka",
    "topol",
    "torzo",
    "touha",
    "toulec",
    "tradice",
    "traktor",
    "tramp",
    "trasa",
    "traverza",
    "trefit",
    "trest",
    "trezor",
    "trhavina",
    "trhlina",
    "trochu",
    "trojice",
    "troska",
    "trouba",
    "trpce",
    "trpitel",
    "trpkost",
    "trubec",
    "truchlit",
    "truhlice",
    "trus",
    "trvat",
    "tudy",
    "tuhnout",
    "tuhost",
    "tundra",
    "turista",
    "turnaj",
    "tuzemsko",
    "tvaroh",
    "tvorba",
    "tvrdost",
    "tvrz",
    "tygr",
    "tykev",
    "ubohost",
    "uboze",
    "ubrat",
    "ubrousek",
    "ubrus",
    "ubytovna",
    "ucho",
    "uctivost",
    "udivit",
    "uhradit",
    "ujednat",
    "ujistit",
    "ujmout",
    "ukazatel",
    "uklidnit",
    "uklonit",
    "ukotvit",
    "ukrojit",
    "ulice",
    "ulita",
    "ulovit",
    "umyvadlo",
    "unavit",
    "uniforma",
    "uniknout",
    "upadnout",
    "uplatnit",
    "uplynout",
    "upoutat",
    "upravit",
    "uran",
    "urazit",
    "usednout",
    "usilovat",
    "usmrtit",
    "usnadnit",
    "usnout",
    "usoudit",
    "ustlat",
    "ustrnout",
    "utahovat",
    "utkat",
    "utlumit",
    "utonout",
    "utopenec",
    "utrousit",
    "uvalit",
    "uvolnit",
    "uvozovka",
    "uzdravit",
    "uzel",
    "uzenina",
    "uzlina",
    "uznat",
    "vagon",
    "valcha",
    "valoun",
    "vana",
    "vandal",
    "vanilka",
    "varan",
    "varhany",
    "varovat",
    "vcelku",
    "vchod",
    "vdova",
    "vedro",
    "vegetace",
    "vejce",
    "velbloud",
    "veletrh",
    "velitel",
    "velmoc",
    "velryba",
    "venkov",
    "veranda",
    "verze",
    "veselka",
    "veskrze",
    "vesnice",
    "vespodu",
    "vesta",
    "veterina",
    "veverka",
    "vibrace",
    "vichr",
    "videohra",
    "vidina",
    "vidle",
    "vila",
    "vinice",
    "viset",
    "vitalita",
    "vize",
    "vizitka",
    "vjezd",
    "vklad",
    "vkus",
    "vlajka",
    "vlak",
    "vlasec",
    "vlevo",
    "vlhkost",
    "vliv",
    "vlnovka",
    "vloupat",
    "vnucovat",
    "vnuk",
    "voda",
    "vodivost",
    "vodoznak",
    "vodstvo",
    "vojensky",
    "vojna",
    "vojsko",
    "volant",
    "volba",
    "volit",
    "volno",
    "voskovka",
    "vozidlo",
    "vozovna",
    "vpravo",
    "vrabec",
    "vracet",
    "vrah",
    "vrata",
    "vrba",
    "vrcholek",
    "vrhat",
    "vrstva",
    "vrtule",
    "vsadit",
    "vstoupit",
    "vstup",
    "vtip",
    "vybavit",
    "vybrat",
    "vychovat",
    "vydat",
    "vydra",
    "vyfotit",
    "vyhledat",
    "vyhnout",
    "vyhodit",
    "vyhradit",
    "vyhubit",
    "vyjasnit",
    "vyjet",
    "vyjmout",
    "vyklopit",
    "vykonat",
    "vylekat",
    "vymazat",
    "vymezit",
    "vymizet",
    "vymyslet",
    "vynechat",
    "vynikat",
    "vynutit",
    "vypadat",
    "vyplatit",
    "vypravit",
    "vypustit",
    "vyrazit",
    "vyrovnat",
    "vyrvat",
    "vyslovit",
    "vysoko",
    "vystavit",
    "vysunout",
    "vysypat",
    "vytasit",
    "vytesat",
    "vytratit",
    "vyvinout",
    "vyvolat",
    "vyvrhel",
    "vyzdobit",
    "vyznat",
    "vzadu",
    "vzbudit",
    "vzchopit",
    "vzdor",
    "vzduch",
    "vzdychat",
    "vzestup",
    "vzhledem",
    "vzkaz",
    "vzlykat",
    "vznik",
    "vzorek",
    "vzpoura",
    "vztah",
    "vztek",
    "xylofon",
    "zabrat",
    "zabydlet",
    "zachovat",
    "zadarmo",
    "zadusit",
    "zafoukat",
    "zahltit",
    "zahodit",
    "zahrada",
    "zahynout",
    "zajatec",
    "zajet",
    "zajistit",
    "zaklepat",
    "zakoupit",
    "zalepit",
    "zamezit",
    "zamotat",
    "zamyslet",
    "zanechat",
    "zanikat",
    "zaplatit",
    "zapojit",
    "zapsat",
    "zarazit",
    "zastavit",
    "zasunout",
    "zatajit",
    "zatemnit",
    "zatknout",
    "zaujmout",
    "zavalit",
    "zavelet",
    "zavinit",
    "zavolat",
    "zavrtat",
    "zazvonit",
    "zbavit",
    "zbrusu",
    "zbudovat",
    "zbytek",
    "zdaleka",
    "zdarma",
    "zdatnost",
    "zdivo",
    "zdobit",
    "zdroj",
    "zdvih",
    "zdymadlo",
    "zelenina",
    "zeman",
    "zemina",
    "zeptat",
    "zezadu",
    "zezdola",
    "zhatit",
    "zhltnout",
    "zhluboka",
    "zhotovit",
    "zhruba",
    "zima",
    "zimnice",
    "zjemnit",
    "zklamat",
    "zkoumat",
    "zkratka",
    "zkumavka",
    "zlato",
    "zlehka",
    "zloba",
    "zlom",
    "zlost",
    "zlozvyk",
    "zmapovat",
    "zmar",
    "zmatek",
    "zmije",
    "zmizet",
    "zmocnit",
    "zmodrat",
    "zmrzlina",
    "zmutovat",
    "znak",
    "znalost",
    "znamenat",
    "znovu",
    "zobrazit",
    "zotavit",
    "zoubek",
    "zoufale",
    "zplodit",
    "zpomalit",
    "zprava",
    "zprostit",
    "zprudka",
    "zprvu",
    "zrada",
    "zranit",
    "zrcadlo",
    "zrnitost",
    "zrno",
    "zrovna",
    "zrychlit",
    "zrzavost",
    "zticha",
    "ztratit",
    "zubovina",
    "zubr",
    "zvednout",
    "zvenku",
    "zvesela",
    "zvon",
    "zvrat",
    "zvukovod",
    "zvyk"
]

},{}],37:[function(require,module,exports){
module.exports=[
    "abandon",
    "ability",
    "able",
    "about",
    "above",
    "absent",
    "absorb",
    "abstract",
    "absurd",
    "abuse",
    "access",
    "accident",
    "account",
    "accuse",
    "achieve",
    "acid",
    "acoustic",
    "acquire",
    "across",
    "act",
    "action",
    "actor",
    "actress",
    "actual",
    "adapt",
    "add",
    "addict",
    "address",
    "adjust",
    "admit",
    "adult",
    "advance",
    "advice",
    "aerobic",
    "affair",
    "afford",
    "afraid",
    "again",
    "age",
    "agent",
    "agree",
    "ahead",
    "aim",
    "air",
    "airport",
    "aisle",
    "alarm",
    "album",
    "alcohol",
    "alert",
    "alien",
    "all",
    "alley",
    "allow",
    "almost",
    "alone",
    "alpha",
    "already",
    "also",
    "alter",
    "always",
    "amateur",
    "amazing",
    "among",
    "amount",
    "amused",
    "analyst",
    "anchor",
    "ancient",
    "anger",
    "angle",
    "angry",
    "animal",
    "ankle",
    "announce",
    "annual",
    "another",
    "answer",
    "antenna",
    "antique",
    "anxiety",
    "any",
    "apart",
    "apology",
    "appear",
    "apple",
    "approve",
    "april",
    "arch",
    "arctic",
    "area",
    "arena",
    "argue",
    "arm",
    "armed",
    "armor",
    "army",
    "around",
    "arrange",
    "arrest",
    "arrive",
    "arrow",
    "art",
    "artefact",
    "artist",
    "artwork",
    "ask",
    "aspect",
    "assault",
    "asset",
    "assist",
    "assume",
    "asthma",
    "athlete",
    "atom",
    "attack",
    "attend",
    "attitude",
    "attract",
    "auction",
    "audit",
    "august",
    "aunt",
    "author",
    "auto",
    "autumn",
    "average",
    "avocado",
    "avoid",
    "awake",
    "aware",
    "away",
    "awesome",
    "awful",
    "awkward",
    "axis",
    "baby",
    "bachelor",
    "bacon",
    "badge",
    "bag",
    "balance",
    "balcony",
    "ball",
    "bamboo",
    "banana",
    "banner",
    "bar",
    "barely",
    "bargain",
    "barrel",
    "base",
    "basic",
    "basket",
    "battle",
    "beach",
    "bean",
    "beauty",
    "because",
    "become",
    "beef",
    "before",
    "begin",
    "behave",
    "behind",
    "believe",
    "below",
    "belt",
    "bench",
    "benefit",
    "best",
    "betray",
    "better",
    "between",
    "beyond",
    "bicycle",
    "bid",
    "bike",
    "bind",
    "biology",
    "bird",
    "birth",
    "bitter",
    "black",
    "blade",
    "blame",
    "blanket",
    "blast",
    "bleak",
    "bless",
    "blind",
    "blood",
    "blossom",
    "blouse",
    "blue",
    "blur",
    "blush",
    "board",
    "boat",
    "body",
    "boil",
    "bomb",
    "bone",
    "bonus",
    "book",
    "boost",
    "border",
    "boring",
    "borrow",
    "boss",
    "bottom",
    "bounce",
    "box",
    "boy",
    "bracket",
    "brain",
    "brand",
    "brass",
    "brave",
    "bread",
    "breeze",
    "brick",
    "bridge",
    "brief",
    "bright",
    "bring",
    "brisk",
    "broccoli",
    "broken",
    "bronze",
    "broom",
    "brother",
    "brown",
    "brush",
    "bubble",
    "buddy",
    "budget",
    "buffalo",
    "build",
    "bulb",
    "bulk",
    "bullet",
    "bundle",
    "bunker",
    "burden",
    "burger",
    "burst",
    "bus",
    "business",
    "busy",
    "butter",
    "buyer",
    "buzz",
    "cabbage",
    "cabin",
    "cable",
    "cactus",
    "cage",
    "cake",
    "call",
    "calm",
    "camera",
    "camp",
    "can",
    "canal",
    "cancel",
    "candy",
    "cannon",
    "canoe",
    "canvas",
    "canyon",
    "capable",
    "capital",
    "captain",
    "car",
    "carbon",
    "card",
    "cargo",
    "carpet",
    "carry",
    "cart",
    "case",
    "cash",
    "casino",
    "castle",
    "casual",
    "cat",
    "catalog",
    "catch",
    "category",
    "cattle",
    "caught",
    "cause",
    "caution",
    "cave",
    "ceiling",
    "celery",
    "cement",
    "census",
    "century",
    "cereal",
    "certain",
    "chair",
    "chalk",
    "champion",
    "change",
    "chaos",
    "chapter",
    "charge",
    "chase",
    "chat",
    "cheap",
    "check",
    "cheese",
    "chef",
    "cherry",
    "chest",
    "chicken",
    "chief",
    "child",
    "chimney",
    "choice",
    "choose",
    "chronic",
    "chuckle",
    "chunk",
    "churn",
    "cigar",
    "cinnamon",
    "circle",
    "citizen",
    "city",
    "civil",
    "claim",
    "clap",
    "clarify",
    "claw",
    "clay",
    "clean",
    "clerk",
    "clever",
    "click",
    "client",
    "cliff",
    "climb",
    "clinic",
    "clip",
    "clock",
    "clog",
    "close",
    "cloth",
    "cloud",
    "clown",
    "club",
    "clump",
    "cluster",
    "clutch",
    "coach",
    "coast",
    "coconut",
    "code",
    "coffee",
    "coil",
    "coin",
    "collect",
    "color",
    "column",
    "combine",
    "come",
    "comfort",
    "comic",
    "common",
    "company",
    "concert",
    "conduct",
    "confirm",
    "congress",
    "connect",
    "consider",
    "control",
    "convince",
    "cook",
    "cool",
    "copper",
    "copy",
    "coral",
    "core",
    "corn",
    "correct",
    "cost",
    "cotton",
    "couch",
    "country",
    "couple",
    "course",
    "cousin",
    "cover",
    "coyote",
    "crack",
    "cradle",
    "craft",
    "cram",
    "crane",
    "crash",
    "crater",
    "crawl",
    "crazy",
    "cream",
    "credit",
    "creek",
    "crew",
    "cricket",
    "crime",
    "crisp",
    "critic",
    "crop",
    "cross",
    "crouch",
    "crowd",
    "crucial",
    "cruel",
    "cruise",
    "crumble",
    "crunch",
    "crush",
    "cry",
    "crystal",
    "cube",
    "culture",
    "cup",
    "cupboard",
    "curious",
    "current",
    "curtain",
    "curve",
    "cushion",
    "custom",
    "cute",
    "cycle",
    "dad",
    "damage",
    "damp",
    "dance",
    "danger",
    "daring",
    "dash",
    "daughter",
    "dawn",
    "day",
    "deal",
    "debate",
    "debris",
    "decade",
    "december",
    "decide",
    "decline",
    "decorate",
    "decrease",
    "deer",
    "defense",
    "define",
    "defy",
    "degree",
    "delay",
    "deliver",
    "demand",
    "demise",
    "denial",
    "dentist",
    "deny",
    "depart",
    "depend",
    "deposit",
    "depth",
    "deputy",
    "derive",
    "describe",
    "desert",
    "design",
    "desk",
    "despair",
    "destroy",
    "detail",
    "detect",
    "develop",
    "device",
    "devote",
    "diagram",
    "dial",
    "diamond",
    "diary",
    "dice",
    "diesel",
    "diet",
    "differ",
    "digital",
    "dignity",
    "dilemma",
    "dinner",
    "dinosaur",
    "direct",
    "dirt",
    "disagree",
    "discover",
    "disease",
    "dish",
    "dismiss",
    "disorder",
    "display",
    "distance",
    "divert",
    "divide",
    "divorce",
    "dizzy",
    "doctor",
    "document",
    "dog",
    "doll",
    "dolphin",
    "domain",
    "donate",
    "donkey",
    "donor",
    "door",
    "dose",
    "double",
    "dove",
    "draft",
    "dragon",
    "drama",
    "drastic",
    "draw",
    "dream",
    "dress",
    "drift",
    "drill",
    "drink",
    "drip",
    "drive",
    "drop",
    "drum",
    "dry",
    "duck",
    "dumb",
    "dune",
    "during",
    "dust",
    "dutch",
    "duty",
    "dwarf",
    "dynamic",
    "eager",
    "eagle",
    "early",
    "earn",
    "earth",
    "easily",
    "east",
    "easy",
    "echo",
    "ecology",
    "economy",
    "edge",
    "edit",
    "educate",
    "effort",
    "egg",
    "eight",
    "either",
    "elbow",
    "elder",
    "electric",
    "elegant",
    "element",
    "elephant",
    "elevator",
    "elite",
    "else",
    "embark",
    "embody",
    "embrace",
    "emerge",
    "emotion",
    "employ",
    "empower",
    "empty",
    "enable",
    "enact",
    "end",
    "endless",
    "endorse",
    "enemy",
    "energy",
    "enforce",
    "engage",
    "engine",
    "enhance",
    "enjoy",
    "enlist",
    "enough",
    "enrich",
    "enroll",
    "ensure",
    "enter",
    "entire",
    "entry",
    "envelope",
    "episode",
    "equal",
    "equip",
    "era",
    "erase",
    "erode",
    "erosion",
    "error",
    "erupt",
    "escape",
    "essay",
    "essence",
    "estate",
    "eternal",
    "ethics",
    "evidence",
    "evil",
    "evoke",
    "evolve",
    "exact",
    "example",
    "excess",
    "exchange",
    "excite",
    "exclude",
    "excuse",
    "execute",
    "exercise",
    "exhaust",
    "exhibit",
    "exile",
    "exist",
    "exit",
    "exotic",
    "expand",
    "expect",
    "expire",
    "explain",
    "expose",
    "express",
    "extend",
    "extra",
    "eye",
    "eyebrow",
    "fabric",
    "face",
    "faculty",
    "fade",
    "faint",
    "faith",
    "fall",
    "false",
    "fame",
    "family",
    "famous",
    "fan",
    "fancy",
    "fantasy",
    "farm",
    "fashion",
    "fat",
    "fatal",
    "father",
    "fatigue",
    "fault",
    "favorite",
    "feature",
    "february",
    "federal",
    "fee",
    "feed",
    "feel",
    "female",
    "fence",
    "festival",
    "fetch",
    "fever",
    "few",
    "fiber",
    "fiction",
    "field",
    "figure",
    "file",
    "film",
    "filter",
    "final",
    "find",
    "fine",
    "finger",
    "finish",
    "fire",
    "firm",
    "first",
    "fiscal",
    "fish",
    "fit",
    "fitness",
    "fix",
    "flag",
    "flame",
    "flash",
    "flat",
    "flavor",
    "flee",
    "flight",
    "flip",
    "float",
    "flock",
    "floor",
    "flower",
    "fluid",
    "flush",
    "fly",
    "foam",
    "focus",
    "fog",
    "foil",
    "fold",
    "follow",
    "food",
    "foot",
    "force",
    "forest",
    "forget",
    "fork",
    "fortune",
    "forum",
    "forward",
    "fossil",
    "foster",
    "found",
    "fox",
    "fragile",
    "frame",
    "frequent",
    "fresh",
    "friend",
    "fringe",
    "frog",
    "front",
    "frost",
    "frown",
    "frozen",
    "fruit",
    "fuel",
    "fun",
    "funny",
    "furnace",
    "fury",
    "future",
    "gadget",
    "gain",
    "galaxy",
    "gallery",
    "game",
    "gap",
    "garage",
    "garbage",
    "garden",
    "garlic",
    "garment",
    "gas",
    "gasp",
    "gate",
    "gather",
    "gauge",
    "gaze",
    "general",
    "genius",
    "genre",
    "gentle",
    "genuine",
    "gesture",
    "ghost",
    "giant",
    "gift",
    "giggle",
    "ginger",
    "giraffe",
    "girl",
    "give",
    "glad",
    "glance",
    "glare",
    "glass",
    "glide",
    "glimpse",
    "globe",
    "gloom",
    "glory",
    "glove",
    "glow",
    "glue",
    "goat",
    "goddess",
    "gold",
    "good",
    "goose",
    "gorilla",
    "gospel",
    "gossip",
    "govern",
    "gown",
    "grab",
    "grace",
    "grain",
    "grant",
    "grape",
    "grass",
    "gravity",
    "great",
    "green",
    "grid",
    "grief",
    "grit",
    "grocery",
    "group",
    "grow",
    "grunt",
    "guard",
    "guess",
    "guide",
    "guilt",
    "guitar",
    "gun",
    "gym",
    "habit",
    "hair",
    "half",
    "hammer",
    "hamster",
    "hand",
    "happy",
    "harbor",
    "hard",
    "harsh",
    "harvest",
    "hat",
    "have",
    "hawk",
    "hazard",
    "head",
    "health",
    "heart",
    "heavy",
    "hedgehog",
    "height",
    "hello",
    "helmet",
    "help",
    "hen",
    "hero",
    "hidden",
    "high",
    "hill",
    "hint",
    "hip",
    "hire",
    "history",
    "hobby",
    "hockey",
    "hold",
    "hole",
    "holiday",
    "hollow",
    "home",
    "honey",
    "hood",
    "hope",
    "horn",
    "horror",
    "horse",
    "hospital",
    "host",
    "hotel",
    "hour",
    "hover",
    "hub",
    "huge",
    "human",
    "humble",
    "humor",
    "hundred",
    "hungry",
    "hunt",
    "hurdle",
    "hurry",
    "hurt",
    "husband",
    "hybrid",
    "ice",
    "icon",
    "idea",
    "identify",
    "idle",
    "ignore",
    "ill",
    "illegal",
    "illness",
    "image",
    "imitate",
    "immense",
    "immune",
    "impact",
    "impose",
    "improve",
    "impulse",
    "inch",
    "include",
    "income",
    "increase",
    "index",
    "indicate",
    "indoor",
    "industry",
    "infant",
    "inflict",
    "inform",
    "inhale",
    "inherit",
    "initial",
    "inject",
    "injury",
    "inmate",
    "inner",
    "innocent",
    "input",
    "inquiry",
    "insane",
    "insect",
    "inside",
    "inspire",
    "install",
    "intact",
    "interest",
    "into",
    "invest",
    "invite",
    "involve",
    "iron",
    "island",
    "isolate",
    "issue",
    "item",
    "ivory",
    "jacket",
    "jaguar",
    "jar",
    "jazz",
    "jealous",
    "jeans",
    "jelly",
    "jewel",
    "job",
    "join",
    "joke",
    "journey",
    "joy",
    "judge",
    "juice",
    "jump",
    "jungle",
    "junior",
    "junk",
    "just",
    "kangaroo",
    "keen",
    "keep",
    "ketchup",
    "key",
    "kick",
    "kid",
    "kidney",
    "kind",
    "kingdom",
    "kiss",
    "kit",
    "kitchen",
    "kite",
    "kitten",
    "kiwi",
    "knee",
    "knife",
    "knock",
    "know",
    "lab",
    "label",
    "labor",
    "ladder",
    "lady",
    "lake",
    "lamp",
    "language",
    "laptop",
    "large",
    "later",
    "latin",
    "laugh",
    "laundry",
    "lava",
    "law",
    "lawn",
    "lawsuit",
    "layer",
    "lazy",
    "leader",
    "leaf",
    "learn",
    "leave",
    "lecture",
    "left",
    "leg",
    "legal",
    "legend",
    "leisure",
    "lemon",
    "lend",
    "length",
    "lens",
    "leopard",
    "lesson",
    "letter",
    "level",
    "liar",
    "liberty",
    "library",
    "license",
    "life",
    "lift",
    "light",
    "like",
    "limb",
    "limit",
    "link",
    "lion",
    "liquid",
    "list",
    "little",
    "live",
    "lizard",
    "load",
    "loan",
    "lobster",
    "local",
    "lock",
    "logic",
    "lonely",
    "long",
    "loop",
    "lottery",
    "loud",
    "lounge",
    "love",
    "loyal",
    "lucky",
    "luggage",
    "lumber",
    "lunar",
    "lunch",
    "luxury",
    "lyrics",
    "machine",
    "mad",
    "magic",
    "magnet",
    "maid",
    "mail",
    "main",
    "major",
    "make",
    "mammal",
    "man",
    "manage",
    "mandate",
    "mango",
    "mansion",
    "manual",
    "maple",
    "marble",
    "march",
    "margin",
    "marine",
    "market",
    "marriage",
    "mask",
    "mass",
    "master",
    "match",
    "material",
    "math",
    "matrix",
    "matter",
    "maximum",
    "maze",
    "meadow",
    "mean",
    "measure",
    "meat",
    "mechanic",
    "medal",
    "media",
    "melody",
    "melt",
    "member",
    "memory",
    "mention",
    "menu",
    "mercy",
    "merge",
    "merit",
    "merry",
    "mesh",
    "message",
    "metal",
    "method",
    "middle",
    "midnight",
    "milk",
    "million",
    "mimic",
    "mind",
    "minimum",
    "minor",
    "minute",
    "miracle",
    "mirror",
    "misery",
    "miss",
    "mistake",
    "mix",
    "mixed",
    "mixture",
    "mobile",
    "model",
    "modify",
    "mom",
    "moment",
    "monitor",
    "monkey",
    "monster",
    "month",
    "moon",
    "moral",
    "more",
    "morning",
    "mosquito",
    "mother",
    "motion",
    "motor",
    "mountain",
    "mouse",
    "move",
    "movie",
    "much",
    "muffin",
    "mule",
    "multiply",
    "muscle",
    "museum",
    "mushroom",
    "music",
    "must",
    "mutual",
    "myself",
    "mystery",
    "myth",
    "naive",
    "name",
    "napkin",
    "narrow",
    "nasty",
    "nation",
    "nature",
    "near",
    "neck",
    "need",
    "negative",
    "neglect",
    "neither",
    "nephew",
    "nerve",
    "nest",
    "net",
    "network",
    "neutral",
    "never",
    "news",
    "next",
    "nice",
    "night",
    "noble",
    "noise",
    "nominee",
    "noodle",
    "normal",
    "north",
    "nose",
    "notable",
    "note",
    "nothing",
    "notice",
    "novel",
    "now",
    "nuclear",
    "number",
    "nurse",
    "nut",
    "oak",
    "obey",
    "object",
    "oblige",
    "obscure",
    "observe",
    "obtain",
    "obvious",
    "occur",
    "ocean",
    "october",
    "odor",
    "off",
    "offer",
    "office",
    "often",
    "oil",
    "okay",
    "old",
    "olive",
    "olympic",
    "omit",
    "once",
    "one",
    "onion",
    "online",
    "only",
    "open",
    "opera",
    "opinion",
    "oppose",
    "option",
    "orange",
    "orbit",
    "orchard",
    "order",
    "ordinary",
    "organ",
    "orient",
    "original",
    "orphan",
    "ostrich",
    "other",
    "outdoor",
    "outer",
    "output",
    "outside",
    "oval",
    "oven",
    "over",
    "own",
    "owner",
    "oxygen",
    "oyster",
    "ozone",
    "pact",
    "paddle",
    "page",
    "pair",
    "palace",
    "palm",
    "panda",
    "panel",
    "panic",
    "panther",
    "paper",
    "parade",
    "parent",
    "park",
    "parrot",
    "party",
    "pass",
    "patch",
    "path",
    "patient",
    "patrol",
    "pattern",
    "pause",
    "pave",
    "payment",
    "peace",
    "peanut",
    "pear",
    "peasant",
    "pelican",
    "pen",
    "penalty",
    "pencil",
    "people",
    "pepper",
    "perfect",
    "permit",
    "person",
    "pet",
    "phone",
    "photo",
    "phrase",
    "physical",
    "piano",
    "picnic",
    "picture",
    "piece",
    "pig",
    "pigeon",
    "pill",
    "pilot",
    "pink",
    "pioneer",
    "pipe",
    "pistol",
    "pitch",
    "pizza",
    "place",
    "planet",
    "plastic",
    "plate",
    "play",
    "please",
    "pledge",
    "pluck",
    "plug",
    "plunge",
    "poem",
    "poet",
    "point",
    "polar",
    "pole",
    "police",
    "pond",
    "pony",
    "pool",
    "popular",
    "portion",
    "position",
    "possible",
    "post",
    "potato",
    "pottery",
    "poverty",
    "powder",
    "power",
    "practice",
    "praise",
    "predict",
    "prefer",
    "prepare",
    "present",
    "pretty",
    "prevent",
    "price",
    "pride",
    "primary",
    "print",
    "priority",
    "prison",
    "private",
    "prize",
    "problem",
    "process",
    "produce",
    "profit",
    "program",
    "project",
    "promote",
    "proof",
    "property",
    "prosper",
    "protect",
    "proud",
    "provide",
    "public",
    "pudding",
    "pull",
    "pulp",
    "pulse",
    "pumpkin",
    "punch",
    "pupil",
    "puppy",
    "purchase",
    "purity",
    "purpose",
    "purse",
    "push",
    "put",
    "puzzle",
    "pyramid",
    "quality",
    "quantum",
    "quarter",
    "question",
    "quick",
    "quit",
    "quiz",
    "quote",
    "rabbit",
    "raccoon",
    "race",
    "rack",
    "radar",
    "radio",
    "rail",
    "rain",
    "raise",
    "rally",
    "ramp",
    "ranch",
    "random",
    "range",
    "rapid",
    "rare",
    "rate",
    "rather",
    "raven",
    "raw",
    "razor",
    "ready",
    "real",
    "reason",
    "rebel",
    "rebuild",
    "recall",
    "receive",
    "recipe",
    "record",
    "recycle",
    "reduce",
    "reflect",
    "reform",
    "refuse",
    "region",
    "regret",
    "regular",
    "reject",
    "relax",
    "release",
    "relief",
    "rely",
    "remain",
    "remember",
    "remind",
    "remove",
    "render",
    "renew",
    "rent",
    "reopen",
    "repair",
    "repeat",
    "replace",
    "report",
    "require",
    "rescue",
    "resemble",
    "resist",
    "resource",
    "response",
    "result",
    "retire",
    "retreat",
    "return",
    "reunion",
    "reveal",
    "review",
    "reward",
    "rhythm",
    "rib",
    "ribbon",
    "rice",
    "rich",
    "ride",
    "ridge",
    "rifle",
    "right",
    "rigid",
    "ring",
    "riot",
    "ripple",
    "risk",
    "ritual",
    "rival",
    "river",
    "road",
    "roast",
    "robot",
    "robust",
    "rocket",
    "romance",
    "roof",
    "rookie",
    "room",
    "rose",
    "rotate",
    "rough",
    "round",
    "route",
    "royal",
    "rubber",
    "rude",
    "rug",
    "rule",
    "run",
    "runway",
    "rural",
    "sad",
    "saddle",
    "sadness",
    "safe",
    "sail",
    "salad",
    "salmon",
    "salon",
    "salt",
    "salute",
    "same",
    "sample",
    "sand",
    "satisfy",
    "satoshi",
    "sauce",
    "sausage",
    "save",
    "say",
    "scale",
    "scan",
    "scare",
    "scatter",
    "scene",
    "scheme",
    "school",
    "science",
    "scissors",
    "scorpion",
    "scout",
    "scrap",
    "screen",
    "script",
    "scrub",
    "sea",
    "search",
    "season",
    "seat",
    "second",
    "secret",
    "section",
    "security",
    "seed",
    "seek",
    "segment",
    "select",
    "sell",
    "seminar",
    "senior",
    "sense",
    "sentence",
    "series",
    "service",
    "session",
    "settle",
    "setup",
    "seven",
    "shadow",
    "shaft",
    "shallow",
    "share",
    "shed",
    "shell",
    "sheriff",
    "shield",
    "shift",
    "shine",
    "ship",
    "shiver",
    "shock",
    "shoe",
    "shoot",
    "shop",
    "short",
    "shoulder",
    "shove",
    "shrimp",
    "shrug",
    "shuffle",
    "shy",
    "sibling",
    "sick",
    "side",
    "siege",
    "sight",
    "sign",
    "silent",
    "silk",
    "silly",
    "silver",
    "similar",
    "simple",
    "since",
    "sing",
    "siren",
    "sister",
    "situate",
    "six",
    "size",
    "skate",
    "sketch",
    "ski",
    "skill",
    "skin",
    "skirt",
    "skull",
    "slab",
    "slam",
    "sleep",
    "slender",
    "slice",
    "slide",
    "slight",
    "slim",
    "slogan",
    "slot",
    "slow",
    "slush",
    "small",
    "smart",
    "smile",
    "smoke",
    "smooth",
    "snack",
    "snake",
    "snap",
    "sniff",
    "snow",
    "soap",
    "soccer",
    "social",
    "sock",
    "soda",
    "soft",
    "solar",
    "soldier",
    "solid",
    "solution",
    "solve",
    "someone",
    "song",
    "soon",
    "sorry",
    "sort",
    "soul",
    "sound",
    "soup",
    "source",
    "south",
    "space",
    "spare",
    "spatial",
    "spawn",
    "speak",
    "special",
    "speed",
    "spell",
    "spend",
    "sphere",
    "spice",
    "spider",
    "spike",
    "spin",
    "spirit",
    "split",
    "spoil",
    "sponsor",
    "spoon",
    "sport",
    "spot",
    "spray",
    "spread",
    "spring",
    "spy",
    "square",
    "squeeze",
    "squirrel",
    "stable",
    "stadium",
    "staff",
    "stage",
    "stairs",
    "stamp",
    "stand",
    "start",
    "state",
    "stay",
    "steak",
    "steel",
    "stem",
    "step",
    "stereo",
    "stick",
    "still",
    "sting",
    "stock",
    "stomach",
    "stone",
    "stool",
    "story",
    "stove",
    "strategy",
    "street",
    "strike",
    "strong",
    "struggle",
    "student",
    "stuff",
    "stumble",
    "style",
    "subject",
    "submit",
    "subway",
    "success",
    "such",
    "sudden",
    "suffer",
    "sugar",
    "suggest",
    "suit",
    "summer",
    "sun",
    "sunny",
    "sunset",
    "super",
    "supply",
    "supreme",
    "sure",
    "surface",
    "surge",
    "surprise",
    "surround",
    "survey",
    "suspect",
    "sustain",
    "swallow",
    "swamp",
    "swap",
    "swarm",
    "swear",
    "sweet",
    "swift",
    "swim",
    "swing",
    "switch",
    "sword",
    "symbol",
    "symptom",
    "syrup",
    "system",
    "table",
    "tackle",
    "tag",
    "tail",
    "talent",
    "talk",
    "tank",
    "tape",
    "target",
    "task",
    "taste",
    "tattoo",
    "taxi",
    "teach",
    "team",
    "tell",
    "ten",
    "tenant",
    "tennis",
    "tent",
    "term",
    "test",
    "text",
    "thank",
    "that",
    "theme",
    "then",
    "theory",
    "there",
    "they",
    "thing",
    "this",
    "thought",
    "three",
    "thrive",
    "throw",
    "thumb",
    "thunder",
    "ticket",
    "tide",
    "tiger",
    "tilt",
    "timber",
    "time",
    "tiny",
    "tip",
    "tired",
    "tissue",
    "title",
    "toast",
    "tobacco",
    "today",
    "toddler",
    "toe",
    "together",
    "toilet",
    "token",
    "tomato",
    "tomorrow",
    "tone",
    "tongue",
    "tonight",
    "tool",
    "tooth",
    "top",
    "topic",
    "topple",
    "torch",
    "tornado",
    "tortoise",
    "toss",
    "total",
    "tourist",
    "toward",
    "tower",
    "town",
    "toy",
    "track",
    "trade",
    "traffic",
    "tragic",
    "train",
    "transfer",
    "trap",
    "trash",
    "travel",
    "tray",
    "treat",
    "tree",
    "trend",
    "trial",
    "tribe",
    "trick",
    "trigger",
    "trim",
    "trip",
    "trophy",
    "trouble",
    "truck",
    "true",
    "truly",
    "trumpet",
    "trust",
    "truth",
    "try",
    "tube",
    "tuition",
    "tumble",
    "tuna",
    "tunnel",
    "turkey",
    "turn",
    "turtle",
    "twelve",
    "twenty",
    "twice",
    "twin",
    "twist",
    "two",
    "type",
    "typical",
    "ugly",
    "umbrella",
    "unable",
    "unaware",
    "uncle",
    "uncover",
    "under",
    "undo",
    "unfair",
    "unfold",
    "unhappy",
    "uniform",
    "unique",
    "unit",
    "universe",
    "unknown",
    "unlock",
    "until",
    "unusual",
    "unveil",
    "update",
    "upgrade",
    "uphold",
    "upon",
    "upper",
    "upset",
    "urban",
    "urge",
    "usage",
    "use",
    "used",
    "useful",
    "useless",
    "usual",
    "utility",
    "vacant",
    "vacuum",
    "vague",
    "valid",
    "valley",
    "valve",
    "van",
    "vanish",
    "vapor",
    "various",
    "vast",
    "vault",
    "vehicle",
    "velvet",
    "vendor",
    "venture",
    "venue",
    "verb",
    "verify",
    "version",
    "very",
    "vessel",
    "veteran",
    "viable",
    "vibrant",
    "vicious",
    "victory",
    "video",
    "view",
    "village",
    "vintage",
    "violin",
    "virtual",
    "virus",
    "visa",
    "visit",
    "visual",
    "vital",
    "vivid",
    "vocal",
    "voice",
    "void",
    "volcano",
    "volume",
    "vote",
    "voyage",
    "wage",
    "wagon",
    "wait",
    "walk",
    "wall",
    "walnut",
    "want",
    "warfare",
    "warm",
    "warrior",
    "wash",
    "wasp",
    "waste",
    "water",
    "wave",
    "way",
    "wealth",
    "weapon",
    "wear",
    "weasel",
    "weather",
    "web",
    "wedding",
    "weekend",
    "weird",
    "welcome",
    "west",
    "wet",
    "whale",
    "what",
    "wheat",
    "wheel",
    "when",
    "where",
    "whip",
    "whisper",
    "wide",
    "width",
    "wife",
    "wild",
    "will",
    "win",
    "window",
    "wine",
    "wing",
    "wink",
    "winner",
    "winter",
    "wire",
    "wisdom",
    "wise",
    "wish",
    "witness",
    "wolf",
    "woman",
    "wonder",
    "wood",
    "wool",
    "word",
    "work",
    "world",
    "worry",
    "worth",
    "wrap",
    "wreck",
    "wrestle",
    "wrist",
    "write",
    "wrong",
    "yard",
    "year",
    "yellow",
    "you",
    "young",
    "youth",
    "zebra",
    "zero",
    "zone",
    "zoo"
]

},{}],38:[function(require,module,exports){
module.exports=[
    "abaisser",
    "abandon",
    "abdiquer",
    "abeille",
    "abolir",
    "aborder",
    "aboutir",
    "aboyer",
    "abrasif",
    "abreuver",
    "abriter",
    "abroger",
    "abrupt",
    "absence",
    "absolu",
    "absurde",
    "abusif",
    "abyssal",
    "académie",
    "acajou",
    "acarien",
    "accabler",
    "accepter",
    "acclamer",
    "accolade",
    "accroche",
    "accuser",
    "acerbe",
    "achat",
    "acheter",
    "aciduler",
    "acier",
    "acompte",
    "acquérir",
    "acronyme",
    "acteur",
    "actif",
    "actuel",
    "adepte",
    "adéquat",
    "adhésif",
    "adjectif",
    "adjuger",
    "admettre",
    "admirer",
    "adopter",
    "adorer",
    "adoucir",
    "adresse",
    "adroit",
    "adulte",
    "adverbe",
    "aérer",
    "aéronef",
    "affaire",
    "affecter",
    "affiche",
    "affreux",
    "affubler",
    "agacer",
    "agencer",
    "agile",
    "agiter",
    "agrafer",
    "agréable",
    "agrume",
    "aider",
    "aiguille",
    "ailier",
    "aimable",
    "aisance",
    "ajouter",
    "ajuster",
    "alarmer",
    "alchimie",
    "alerte",
    "algèbre",
    "algue",
    "aliéner",
    "aliment",
    "alléger",
    "alliage",
    "allouer",
    "allumer",
    "alourdir",
    "alpaga",
    "altesse",
    "alvéole",
    "amateur",
    "ambigu",
    "ambre",
    "aménager",
    "amertume",
    "amidon",
    "amiral",
    "amorcer",
    "amour",
    "amovible",
    "amphibie",
    "ampleur",
    "amusant",
    "analyse",
    "anaphore",
    "anarchie",
    "anatomie",
    "ancien",
    "anéantir",
    "angle",
    "angoisse",
    "anguleux",
    "animal",
    "annexer",
    "annonce",
    "annuel",
    "anodin",
    "anomalie",
    "anonyme",
    "anormal",
    "antenne",
    "antidote",
    "anxieux",
    "apaiser",
    "apéritif",
    "aplanir",
    "apologie",
    "appareil",
    "appeler",
    "apporter",
    "appuyer",
    "aquarium",
    "aqueduc",
    "arbitre",
    "arbuste",
    "ardeur",
    "ardoise",
    "argent",
    "arlequin",
    "armature",
    "armement",
    "armoire",
    "armure",
    "arpenter",
    "arracher",
    "arriver",
    "arroser",
    "arsenic",
    "artériel",
    "article",
    "aspect",
    "asphalte",
    "aspirer",
    "assaut",
    "asservir",
    "assiette",
    "associer",
    "assurer",
    "asticot",
    "astre",
    "astuce",
    "atelier",
    "atome",
    "atrium",
    "atroce",
    "attaque",
    "attentif",
    "attirer",
    "attraper",
    "aubaine",
    "auberge",
    "audace",
    "audible",
    "augurer",
    "aurore",
    "automne",
    "autruche",
    "avaler",
    "avancer",
    "avarice",
    "avenir",
    "averse",
    "aveugle",
    "aviateur",
    "avide",
    "avion",
    "aviser",
    "avoine",
    "avouer",
    "avril",
    "axial",
    "axiome",
    "badge",
    "bafouer",
    "bagage",
    "baguette",
    "baignade",
    "balancer",
    "balcon",
    "baleine",
    "balisage",
    "bambin",
    "bancaire",
    "bandage",
    "banlieue",
    "bannière",
    "banquier",
    "barbier",
    "baril",
    "baron",
    "barque",
    "barrage",
    "bassin",
    "bastion",
    "bataille",
    "bateau",
    "batterie",
    "baudrier",
    "bavarder",
    "belette",
    "bélier",
    "belote",
    "bénéfice",
    "berceau",
    "berger",
    "berline",
    "bermuda",
    "besace",
    "besogne",
    "bétail",
    "beurre",
    "biberon",
    "bicycle",
    "bidule",
    "bijou",
    "bilan",
    "bilingue",
    "billard",
    "binaire",
    "biologie",
    "biopsie",
    "biotype",
    "biscuit",
    "bison",
    "bistouri",
    "bitume",
    "bizarre",
    "blafard",
    "blague",
    "blanchir",
    "blessant",
    "blinder",
    "blond",
    "bloquer",
    "blouson",
    "bobard",
    "bobine",
    "boire",
    "boiser",
    "bolide",
    "bonbon",
    "bondir",
    "bonheur",
    "bonifier",
    "bonus",
    "bordure",
    "borne",
    "botte",
    "boucle",
    "boueux",
    "bougie",
    "boulon",
    "bouquin",
    "bourse",
    "boussole",
    "boutique",
    "boxeur",
    "branche",
    "brasier",
    "brave",
    "brebis",
    "brèche",
    "breuvage",
    "bricoler",
    "brigade",
    "brillant",
    "brioche",
    "brique",
    "brochure",
    "broder",
    "bronzer",
    "brousse",
    "broyeur",
    "brume",
    "brusque",
    "brutal",
    "bruyant",
    "buffle",
    "buisson",
    "bulletin",
    "bureau",
    "burin",
    "bustier",
    "butiner",
    "butoir",
    "buvable",
    "buvette",
    "cabanon",
    "cabine",
    "cachette",
    "cadeau",
    "cadre",
    "caféine",
    "caillou",
    "caisson",
    "calculer",
    "calepin",
    "calibre",
    "calmer",
    "calomnie",
    "calvaire",
    "camarade",
    "caméra",
    "camion",
    "campagne",
    "canal",
    "caneton",
    "canon",
    "cantine",
    "canular",
    "capable",
    "caporal",
    "caprice",
    "capsule",
    "capter",
    "capuche",
    "carabine",
    "carbone",
    "caresser",
    "caribou",
    "carnage",
    "carotte",
    "carreau",
    "carton",
    "cascade",
    "casier",
    "casque",
    "cassure",
    "causer",
    "caution",
    "cavalier",
    "caverne",
    "caviar",
    "cédille",
    "ceinture",
    "céleste",
    "cellule",
    "cendrier",
    "censurer",
    "central",
    "cercle",
    "cérébral",
    "cerise",
    "cerner",
    "cerveau",
    "cesser",
    "chagrin",
    "chaise",
    "chaleur",
    "chambre",
    "chance",
    "chapitre",
    "charbon",
    "chasseur",
    "chaton",
    "chausson",
    "chavirer",
    "chemise",
    "chenille",
    "chéquier",
    "chercher",
    "cheval",
    "chien",
    "chiffre",
    "chignon",
    "chimère",
    "chiot",
    "chlorure",
    "chocolat",
    "choisir",
    "chose",
    "chouette",
    "chrome",
    "chute",
    "cigare",
    "cigogne",
    "cimenter",
    "cinéma",
    "cintrer",
    "circuler",
    "cirer",
    "cirque",
    "citerne",
    "citoyen",
    "citron",
    "civil",
    "clairon",
    "clameur",
    "claquer",
    "classe",
    "clavier",
    "client",
    "cligner",
    "climat",
    "clivage",
    "cloche",
    "clonage",
    "cloporte",
    "cobalt",
    "cobra",
    "cocasse",
    "cocotier",
    "coder",
    "codifier",
    "coffre",
    "cogner",
    "cohésion",
    "coiffer",
    "coincer",
    "colère",
    "colibri",
    "colline",
    "colmater",
    "colonel",
    "combat",
    "comédie",
    "commande",
    "compact",
    "concert",
    "conduire",
    "confier",
    "congeler",
    "connoter",
    "consonne",
    "contact",
    "convexe",
    "copain",
    "copie",
    "corail",
    "corbeau",
    "cordage",
    "corniche",
    "corpus",
    "correct",
    "cortège",
    "cosmique",
    "costume",
    "coton",
    "coude",
    "coupure",
    "courage",
    "couteau",
    "couvrir",
    "coyote",
    "crabe",
    "crainte",
    "cravate",
    "crayon",
    "créature",
    "créditer",
    "crémeux",
    "creuser",
    "crevette",
    "cribler",
    "crier",
    "cristal",
    "critère",
    "croire",
    "croquer",
    "crotale",
    "crucial",
    "cruel",
    "crypter",
    "cubique",
    "cueillir",
    "cuillère",
    "cuisine",
    "cuivre",
    "culminer",
    "cultiver",
    "cumuler",
    "cupide",
    "curatif",
    "curseur",
    "cyanure",
    "cycle",
    "cylindre",
    "cynique",
    "daigner",
    "damier",
    "danger",
    "danseur",
    "dauphin",
    "débattre",
    "débiter",
    "déborder",
    "débrider",
    "débutant",
    "décaler",
    "décembre",
    "déchirer",
    "décider",
    "déclarer",
    "décorer",
    "décrire",
    "décupler",
    "dédale",
    "déductif",
    "déesse",
    "défensif",
    "défiler",
    "défrayer",
    "dégager",
    "dégivrer",
    "déglutir",
    "dégrafer",
    "déjeuner",
    "délice",
    "déloger",
    "demander",
    "demeurer",
    "démolir",
    "dénicher",
    "dénouer",
    "dentelle",
    "dénuder",
    "départ",
    "dépenser",
    "déphaser",
    "déplacer",
    "déposer",
    "déranger",
    "dérober",
    "désastre",
    "descente",
    "désert",
    "désigner",
    "désobéir",
    "dessiner",
    "destrier",
    "détacher",
    "détester",
    "détourer",
    "détresse",
    "devancer",
    "devenir",
    "deviner",
    "devoir",
    "diable",
    "dialogue",
    "diamant",
    "dicter",
    "différer",
    "digérer",
    "digital",
    "digne",
    "diluer",
    "dimanche",
    "diminuer",
    "dioxyde",
    "directif",
    "diriger",
    "discuter",
    "disposer",
    "dissiper",
    "distance",
    "divertir",
    "diviser",
    "docile",
    "docteur",
    "dogme",
    "doigt",
    "domaine",
    "domicile",
    "dompter",
    "donateur",
    "donjon",
    "donner",
    "dopamine",
    "dortoir",
    "dorure",
    "dosage",
    "doseur",
    "dossier",
    "dotation",
    "douanier",
    "double",
    "douceur",
    "douter",
    "doyen",
    "dragon",
    "draper",
    "dresser",
    "dribbler",
    "droiture",
    "duperie",
    "duplexe",
    "durable",
    "durcir",
    "dynastie",
    "éblouir",
    "écarter",
    "écharpe",
    "échelle",
    "éclairer",
    "éclipse",
    "éclore",
    "écluse",
    "école",
    "économie",
    "écorce",
    "écouter",
    "écraser",
    "écrémer",
    "écrivain",
    "écrou",
    "écume",
    "écureuil",
    "édifier",
    "éduquer",
    "effacer",
    "effectif",
    "effigie",
    "effort",
    "effrayer",
    "effusion",
    "égaliser",
    "égarer",
    "éjecter",
    "élaborer",
    "élargir",
    "électron",
    "élégant",
    "éléphant",
    "élève",
    "éligible",
    "élitisme",
    "éloge",
    "élucider",
    "éluder",
    "emballer",
    "embellir",
    "embryon",
    "émeraude",
    "émission",
    "emmener",
    "émotion",
    "émouvoir",
    "empereur",
    "employer",
    "emporter",
    "emprise",
    "émulsion",
    "encadrer",
    "enchère",
    "enclave",
    "encoche",
    "endiguer",
    "endosser",
    "endroit",
    "enduire",
    "énergie",
    "enfance",
    "enfermer",
    "enfouir",
    "engager",
    "engin",
    "englober",
    "énigme",
    "enjamber",
    "enjeu",
    "enlever",
    "ennemi",
    "ennuyeux",
    "enrichir",
    "enrobage",
    "enseigne",
    "entasser",
    "entendre",
    "entier",
    "entourer",
    "entraver",
    "énumérer",
    "envahir",
    "enviable",
    "envoyer",
    "enzyme",
    "éolien",
    "épaissir",
    "épargne",
    "épatant",
    "épaule",
    "épicerie",
    "épidémie",
    "épier",
    "épilogue",
    "épine",
    "épisode",
    "épitaphe",
    "époque",
    "épreuve",
    "éprouver",
    "épuisant",
    "équerre",
    "équipe",
    "ériger",
    "érosion",
    "erreur",
    "éruption",
    "escalier",
    "espadon",
    "espèce",
    "espiègle",
    "espoir",
    "esprit",
    "esquiver",
    "essayer",
    "essence",
    "essieu",
    "essorer",
    "estime",
    "estomac",
    "estrade",
    "étagère",
    "étaler",
    "étanche",
    "étatique",
    "éteindre",
    "étendoir",
    "éternel",
    "éthanol",
    "éthique",
    "ethnie",
    "étirer",
    "étoffer",
    "étoile",
    "étonnant",
    "étourdir",
    "étrange",
    "étroit",
    "étude",
    "euphorie",
    "évaluer",
    "évasion",
    "éventail",
    "évidence",
    "éviter",
    "évolutif",
    "évoquer",
    "exact",
    "exagérer",
    "exaucer",
    "exceller",
    "excitant",
    "exclusif",
    "excuse",
    "exécuter",
    "exemple",
    "exercer",
    "exhaler",
    "exhorter",
    "exigence",
    "exiler",
    "exister",
    "exotique",
    "expédier",
    "explorer",
    "exposer",
    "exprimer",
    "exquis",
    "extensif",
    "extraire",
    "exulter",
    "fable",
    "fabuleux",
    "facette",
    "facile",
    "facture",
    "faiblir",
    "falaise",
    "fameux",
    "famille",
    "farceur",
    "farfelu",
    "farine",
    "farouche",
    "fasciner",
    "fatal",
    "fatigue",
    "faucon",
    "fautif",
    "faveur",
    "favori",
    "fébrile",
    "féconder",
    "fédérer",
    "félin",
    "femme",
    "fémur",
    "fendoir",
    "féodal",
    "fermer",
    "féroce",
    "ferveur",
    "festival",
    "feuille",
    "feutre",
    "février",
    "fiasco",
    "ficeler",
    "fictif",
    "fidèle",
    "figure",
    "filature",
    "filetage",
    "filière",
    "filleul",
    "filmer",
    "filou",
    "filtrer",
    "financer",
    "finir",
    "fiole",
    "firme",
    "fissure",
    "fixer",
    "flairer",
    "flamme",
    "flasque",
    "flatteur",
    "fléau",
    "flèche",
    "fleur",
    "flexion",
    "flocon",
    "flore",
    "fluctuer",
    "fluide",
    "fluvial",
    "folie",
    "fonderie",
    "fongible",
    "fontaine",
    "forcer",
    "forgeron",
    "formuler",
    "fortune",
    "fossile",
    "foudre",
    "fougère",
    "fouiller",
    "foulure",
    "fourmi",
    "fragile",
    "fraise",
    "franchir",
    "frapper",
    "frayeur",
    "frégate",
    "freiner",
    "frelon",
    "frémir",
    "frénésie",
    "frère",
    "friable",
    "friction",
    "frisson",
    "frivole",
    "froid",
    "fromage",
    "frontal",
    "frotter",
    "fruit",
    "fugitif",
    "fuite",
    "fureur",
    "furieux",
    "furtif",
    "fusion",
    "futur",
    "gagner",
    "galaxie",
    "galerie",
    "gambader",
    "garantir",
    "gardien",
    "garnir",
    "garrigue",
    "gazelle",
    "gazon",
    "géant",
    "gélatine",
    "gélule",
    "gendarme",
    "général",
    "génie",
    "genou",
    "gentil",
    "géologie",
    "géomètre",
    "géranium",
    "germe",
    "gestuel",
    "geyser",
    "gibier",
    "gicler",
    "girafe",
    "givre",
    "glace",
    "glaive",
    "glisser",
    "globe",
    "gloire",
    "glorieux",
    "golfeur",
    "gomme",
    "gonfler",
    "gorge",
    "gorille",
    "goudron",
    "gouffre",
    "goulot",
    "goupille",
    "gourmand",
    "goutte",
    "graduel",
    "graffiti",
    "graine",
    "grand",
    "grappin",
    "gratuit",
    "gravir",
    "grenat",
    "griffure",
    "griller",
    "grimper",
    "grogner",
    "gronder",
    "grotte",
    "groupe",
    "gruger",
    "grutier",
    "gruyère",
    "guépard",
    "guerrier",
    "guide",
    "guimauve",
    "guitare",
    "gustatif",
    "gymnaste",
    "gyrostat",
    "habitude",
    "hachoir",
    "halte",
    "hameau",
    "hangar",
    "hanneton",
    "haricot",
    "harmonie",
    "harpon",
    "hasard",
    "hélium",
    "hématome",
    "herbe",
    "hérisson",
    "hermine",
    "héron",
    "hésiter",
    "heureux",
    "hiberner",
    "hibou",
    "hilarant",
    "histoire",
    "hiver",
    "homard",
    "hommage",
    "homogène",
    "honneur",
    "honorer",
    "honteux",
    "horde",
    "horizon",
    "horloge",
    "hormone",
    "horrible",
    "houleux",
    "housse",
    "hublot",
    "huileux",
    "humain",
    "humble",
    "humide",
    "humour",
    "hurler",
    "hydromel",
    "hygiène",
    "hymne",
    "hypnose",
    "idylle",
    "ignorer",
    "iguane",
    "illicite",
    "illusion",
    "image",
    "imbiber",
    "imiter",
    "immense",
    "immobile",
    "immuable",
    "impact",
    "impérial",
    "implorer",
    "imposer",
    "imprimer",
    "imputer",
    "incarner",
    "incendie",
    "incident",
    "incliner",
    "incolore",
    "indexer",
    "indice",
    "inductif",
    "inédit",
    "ineptie",
    "inexact",
    "infini",
    "infliger",
    "informer",
    "infusion",
    "ingérer",
    "inhaler",
    "inhiber",
    "injecter",
    "injure",
    "innocent",
    "inoculer",
    "inonder",
    "inscrire",
    "insecte",
    "insigne",
    "insolite",
    "inspirer",
    "instinct",
    "insulter",
    "intact",
    "intense",
    "intime",
    "intrigue",
    "intuitif",
    "inutile",
    "invasion",
    "inventer",
    "inviter",
    "invoquer",
    "ironique",
    "irradier",
    "irréel",
    "irriter",
    "isoler",
    "ivoire",
    "ivresse",
    "jaguar",
    "jaillir",
    "jambe",
    "janvier",
    "jardin",
    "jauger",
    "jaune",
    "javelot",
    "jetable",
    "jeton",
    "jeudi",
    "jeunesse",
    "joindre",
    "joncher",
    "jongler",
    "joueur",
    "jouissif",
    "journal",
    "jovial",
    "joyau",
    "joyeux",
    "jubiler",
    "jugement",
    "junior",
    "jupon",
    "juriste",
    "justice",
    "juteux",
    "juvénile",
    "kayak",
    "kimono",
    "kiosque",
    "label",
    "labial",
    "labourer",
    "lacérer",
    "lactose",
    "lagune",
    "laine",
    "laisser",
    "laitier",
    "lambeau",
    "lamelle",
    "lampe",
    "lanceur",
    "langage",
    "lanterne",
    "lapin",
    "largeur",
    "larme",
    "laurier",
    "lavabo",
    "lavoir",
    "lecture",
    "légal",
    "léger",
    "légume",
    "lessive",
    "lettre",
    "levier",
    "lexique",
    "lézard",
    "liasse",
    "libérer",
    "libre",
    "licence",
    "licorne",
    "liège",
    "lièvre",
    "ligature",
    "ligoter",
    "ligue",
    "limer",
    "limite",
    "limonade",
    "limpide",
    "linéaire",
    "lingot",
    "lionceau",
    "liquide",
    "lisière",
    "lister",
    "lithium",
    "litige",
    "littoral",
    "livreur",
    "logique",
    "lointain",
    "loisir",
    "lombric",
    "loterie",
    "louer",
    "lourd",
    "loutre",
    "louve",
    "loyal",
    "lubie",
    "lucide",
    "lucratif",
    "lueur",
    "lugubre",
    "luisant",
    "lumière",
    "lunaire",
    "lundi",
    "luron",
    "lutter",
    "luxueux",
    "machine",
    "magasin",
    "magenta",
    "magique",
    "maigre",
    "maillon",
    "maintien",
    "mairie",
    "maison",
    "majorer",
    "malaxer",
    "maléfice",
    "malheur",
    "malice",
    "mallette",
    "mammouth",
    "mandater",
    "maniable",
    "manquant",
    "manteau",
    "manuel",
    "marathon",
    "marbre",
    "marchand",
    "mardi",
    "maritime",
    "marqueur",
    "marron",
    "marteler",
    "mascotte",
    "massif",
    "matériel",
    "matière",
    "matraque",
    "maudire",
    "maussade",
    "mauve",
    "maximal",
    "méchant",
    "méconnu",
    "médaille",
    "médecin",
    "méditer",
    "méduse",
    "meilleur",
    "mélange",
    "mélodie",
    "membre",
    "mémoire",
    "menacer",
    "mener",
    "menhir",
    "mensonge",
    "mentor",
    "mercredi",
    "mérite",
    "merle",
    "messager",
    "mesure",
    "métal",
    "météore",
    "méthode",
    "métier",
    "meuble",
    "miauler",
    "microbe",
    "miette",
    "mignon",
    "migrer",
    "milieu",
    "million",
    "mimique",
    "mince",
    "minéral",
    "minimal",
    "minorer",
    "minute",
    "miracle",
    "miroiter",
    "missile",
    "mixte",
    "mobile",
    "moderne",
    "moelleux",
    "mondial",
    "moniteur",
    "monnaie",
    "monotone",
    "monstre",
    "montagne",
    "monument",
    "moqueur",
    "morceau",
    "morsure",
    "mortier",
    "moteur",
    "motif",
    "mouche",
    "moufle",
    "moulin",
    "mousson",
    "mouton",
    "mouvant",
    "multiple",
    "munition",
    "muraille",
    "murène",
    "murmure",
    "muscle",
    "muséum",
    "musicien",
    "mutation",
    "muter",
    "mutuel",
    "myriade",
    "myrtille",
    "mystère",
    "mythique",
    "nageur",
    "nappe",
    "narquois",
    "narrer",
    "natation",
    "nation",
    "nature",
    "naufrage",
    "nautique",
    "navire",
    "nébuleux",
    "nectar",
    "néfaste",
    "négation",
    "négliger",
    "négocier",
    "neige",
    "nerveux",
    "nettoyer",
    "neurone",
    "neutron",
    "neveu",
    "niche",
    "nickel",
    "nitrate",
    "niveau",
    "noble",
    "nocif",
    "nocturne",
    "noirceur",
    "noisette",
    "nomade",
    "nombreux",
    "nommer",
    "normatif",
    "notable",
    "notifier",
    "notoire",
    "nourrir",
    "nouveau",
    "novateur",
    "novembre",
    "novice",
    "nuage",
    "nuancer",
    "nuire",
    "nuisible",
    "numéro",
    "nuptial",
    "nuque",
    "nutritif",
    "obéir",
    "objectif",
    "obliger",
    "obscur",
    "observer",
    "obstacle",
    "obtenir",
    "obturer",
    "occasion",
    "occuper",
    "océan",
    "octobre",
    "octroyer",
    "octupler",
    "oculaire",
    "odeur",
    "odorant",
    "offenser",
    "officier",
    "offrir",
    "ogive",
    "oiseau",
    "oisillon",
    "olfactif",
    "olivier",
    "ombrage",
    "omettre",
    "onctueux",
    "onduler",
    "onéreux",
    "onirique",
    "opale",
    "opaque",
    "opérer",
    "opinion",
    "opportun",
    "opprimer",
    "opter",
    "optique",
    "orageux",
    "orange",
    "orbite",
    "ordonner",
    "oreille",
    "organe",
    "orgueil",
    "orifice",
    "ornement",
    "orque",
    "ortie",
    "osciller",
    "osmose",
    "ossature",
    "otarie",
    "ouragan",
    "ourson",
    "outil",
    "outrager",
    "ouvrage",
    "ovation",
    "oxyde",
    "oxygène",
    "ozone",
    "paisible",
    "palace",
    "palmarès",
    "palourde",
    "palper",
    "panache",
    "panda",
    "pangolin",
    "paniquer",
    "panneau",
    "panorama",
    "pantalon",
    "papaye",
    "papier",
    "papoter",
    "papyrus",
    "paradoxe",
    "parcelle",
    "paresse",
    "parfumer",
    "parler",
    "parole",
    "parrain",
    "parsemer",
    "partager",
    "parure",
    "parvenir",
    "passion",
    "pastèque",
    "paternel",
    "patience",
    "patron",
    "pavillon",
    "pavoiser",
    "payer",
    "paysage",
    "peigne",
    "peintre",
    "pelage",
    "pélican",
    "pelle",
    "pelouse",
    "peluche",
    "pendule",
    "pénétrer",
    "pénible",
    "pensif",
    "pénurie",
    "pépite",
    "péplum",
    "perdrix",
    "perforer",
    "période",
    "permuter",
    "perplexe",
    "persil",
    "perte",
    "peser",
    "pétale",
    "petit",
    "pétrir",
    "peuple",
    "pharaon",
    "phobie",
    "phoque",
    "photon",
    "phrase",
    "physique",
    "piano",
    "pictural",
    "pièce",
    "pierre",
    "pieuvre",
    "pilote",
    "pinceau",
    "pipette",
    "piquer",
    "pirogue",
    "piscine",
    "piston",
    "pivoter",
    "pixel",
    "pizza",
    "placard",
    "plafond",
    "plaisir",
    "planer",
    "plaque",
    "plastron",
    "plateau",
    "pleurer",
    "plexus",
    "pliage",
    "plomb",
    "plonger",
    "pluie",
    "plumage",
    "pochette",
    "poésie",
    "poète",
    "pointe",
    "poirier",
    "poisson",
    "poivre",
    "polaire",
    "policier",
    "pollen",
    "polygone",
    "pommade",
    "pompier",
    "ponctuel",
    "pondérer",
    "poney",
    "portique",
    "position",
    "posséder",
    "posture",
    "potager",
    "poteau",
    "potion",
    "pouce",
    "poulain",
    "poumon",
    "pourpre",
    "poussin",
    "pouvoir",
    "prairie",
    "pratique",
    "précieux",
    "prédire",
    "préfixe",
    "prélude",
    "prénom",
    "présence",
    "prétexte",
    "prévoir",
    "primitif",
    "prince",
    "prison",
    "priver",
    "problème",
    "procéder",
    "prodige",
    "profond",
    "progrès",
    "proie",
    "projeter",
    "prologue",
    "promener",
    "propre",
    "prospère",
    "protéger",
    "prouesse",
    "proverbe",
    "prudence",
    "pruneau",
    "psychose",
    "public",
    "puceron",
    "puiser",
    "pulpe",
    "pulsar",
    "punaise",
    "punitif",
    "pupitre",
    "purifier",
    "puzzle",
    "pyramide",
    "quasar",
    "querelle",
    "question",
    "quiétude",
    "quitter",
    "quotient",
    "racine",
    "raconter",
    "radieux",
    "ragondin",
    "raideur",
    "raisin",
    "ralentir",
    "rallonge",
    "ramasser",
    "rapide",
    "rasage",
    "ratisser",
    "ravager",
    "ravin",
    "rayonner",
    "réactif",
    "réagir",
    "réaliser",
    "réanimer",
    "recevoir",
    "réciter",
    "réclamer",
    "récolter",
    "recruter",
    "reculer",
    "recycler",
    "rédiger",
    "redouter",
    "refaire",
    "réflexe",
    "réformer",
    "refrain",
    "refuge",
    "régalien",
    "région",
    "réglage",
    "régulier",
    "réitérer",
    "rejeter",
    "rejouer",
    "relatif",
    "relever",
    "relief",
    "remarque",
    "remède",
    "remise",
    "remonter",
    "remplir",
    "remuer",
    "renard",
    "renfort",
    "renifler",
    "renoncer",
    "rentrer",
    "renvoi",
    "replier",
    "reporter",
    "reprise",
    "reptile",
    "requin",
    "réserve",
    "résineux",
    "résoudre",
    "respect",
    "rester",
    "résultat",
    "rétablir",
    "retenir",
    "réticule",
    "retomber",
    "retracer",
    "réunion",
    "réussir",
    "revanche",
    "revivre",
    "révolte",
    "révulsif",
    "richesse",
    "rideau",
    "rieur",
    "rigide",
    "rigoler",
    "rincer",
    "riposter",
    "risible",
    "risque",
    "rituel",
    "rival",
    "rivière",
    "rocheux",
    "romance",
    "rompre",
    "ronce",
    "rondin",
    "roseau",
    "rosier",
    "rotatif",
    "rotor",
    "rotule",
    "rouge",
    "rouille",
    "rouleau",
    "routine",
    "royaume",
    "ruban",
    "rubis",
    "ruche",
    "ruelle",
    "rugueux",
    "ruiner",
    "ruisseau",
    "ruser",
    "rustique",
    "rythme",
    "sabler",
    "saboter",
    "sabre",
    "sacoche",
    "safari",
    "sagesse",
    "saisir",
    "salade",
    "salive",
    "salon",
    "saluer",
    "samedi",
    "sanction",
    "sanglier",
    "sarcasme",
    "sardine",
    "saturer",
    "saugrenu",
    "saumon",
    "sauter",
    "sauvage",
    "savant",
    "savonner",
    "scalpel",
    "scandale",
    "scélérat",
    "scénario",
    "sceptre",
    "schéma",
    "science",
    "scinder",
    "score",
    "scrutin",
    "sculpter",
    "séance",
    "sécable",
    "sécher",
    "secouer",
    "sécréter",
    "sédatif",
    "séduire",
    "seigneur",
    "séjour",
    "sélectif",
    "semaine",
    "sembler",
    "semence",
    "séminal",
    "sénateur",
    "sensible",
    "sentence",
    "séparer",
    "séquence",
    "serein",
    "sergent",
    "sérieux",
    "serrure",
    "sérum",
    "service",
    "sésame",
    "sévir",
    "sevrage",
    "sextuple",
    "sidéral",
    "siècle",
    "siéger",
    "siffler",
    "sigle",
    "signal",
    "silence",
    "silicium",
    "simple",
    "sincère",
    "sinistre",
    "siphon",
    "sirop",
    "sismique",
    "situer",
    "skier",
    "social",
    "socle",
    "sodium",
    "soigneux",
    "soldat",
    "soleil",
    "solitude",
    "soluble",
    "sombre",
    "sommeil",
    "somnoler",
    "sonde",
    "songeur",
    "sonnette",
    "sonore",
    "sorcier",
    "sortir",
    "sosie",
    "sottise",
    "soucieux",
    "soudure",
    "souffle",
    "soulever",
    "soupape",
    "source",
    "soutirer",
    "souvenir",
    "spacieux",
    "spatial",
    "spécial",
    "sphère",
    "spiral",
    "stable",
    "station",
    "sternum",
    "stimulus",
    "stipuler",
    "strict",
    "studieux",
    "stupeur",
    "styliste",
    "sublime",
    "substrat",
    "subtil",
    "subvenir",
    "succès",
    "sucre",
    "suffixe",
    "suggérer",
    "suiveur",
    "sulfate",
    "superbe",
    "supplier",
    "surface",
    "suricate",
    "surmener",
    "surprise",
    "sursaut",
    "survie",
    "suspect",
    "syllabe",
    "symbole",
    "symétrie",
    "synapse",
    "syntaxe",
    "système",
    "tabac",
    "tablier",
    "tactile",
    "tailler",
    "talent",
    "talisman",
    "talonner",
    "tambour",
    "tamiser",
    "tangible",
    "tapis",
    "taquiner",
    "tarder",
    "tarif",
    "tartine",
    "tasse",
    "tatami",
    "tatouage",
    "taupe",
    "taureau",
    "taxer",
    "témoin",
    "temporel",
    "tenaille",
    "tendre",
    "teneur",
    "tenir",
    "tension",
    "terminer",
    "terne",
    "terrible",
    "tétine",
    "texte",
    "thème",
    "théorie",
    "thérapie",
    "thorax",
    "tibia",
    "tiède",
    "timide",
    "tirelire",
    "tiroir",
    "tissu",
    "titane",
    "titre",
    "tituber",
    "toboggan",
    "tolérant",
    "tomate",
    "tonique",
    "tonneau",
    "toponyme",
    "torche",
    "tordre",
    "tornade",
    "torpille",
    "torrent",
    "torse",
    "tortue",
    "totem",
    "toucher",
    "tournage",
    "tousser",
    "toxine",
    "traction",
    "trafic",
    "tragique",
    "trahir",
    "train",
    "trancher",
    "travail",
    "trèfle",
    "tremper",
    "trésor",
    "treuil",
    "triage",
    "tribunal",
    "tricoter",
    "trilogie",
    "triomphe",
    "tripler",
    "triturer",
    "trivial",
    "trombone",
    "tronc",
    "tropical",
    "troupeau",
    "tuile",
    "tulipe",
    "tumulte",
    "tunnel",
    "turbine",
    "tuteur",
    "tutoyer",
    "tuyau",
    "tympan",
    "typhon",
    "typique",
    "tyran",
    "ubuesque",
    "ultime",
    "ultrason",
    "unanime",
    "unifier",
    "union",
    "unique",
    "unitaire",
    "univers",
    "uranium",
    "urbain",
    "urticant",
    "usage",
    "usine",
    "usuel",
    "usure",
    "utile",
    "utopie",
    "vacarme",
    "vaccin",
    "vagabond",
    "vague",
    "vaillant",
    "vaincre",
    "vaisseau",
    "valable",
    "valise",
    "vallon",
    "valve",
    "vampire",
    "vanille",
    "vapeur",
    "varier",
    "vaseux",
    "vassal",
    "vaste",
    "vecteur",
    "vedette",
    "végétal",
    "véhicule",
    "veinard",
    "véloce",
    "vendredi",
    "vénérer",
    "venger",
    "venimeux",
    "ventouse",
    "verdure",
    "vérin",
    "vernir",
    "verrou",
    "verser",
    "vertu",
    "veston",
    "vétéran",
    "vétuste",
    "vexant",
    "vexer",
    "viaduc",
    "viande",
    "victoire",
    "vidange",
    "vidéo",
    "vignette",
    "vigueur",
    "vilain",
    "village",
    "vinaigre",
    "violon",
    "vipère",
    "virement",
    "virtuose",
    "virus",
    "visage",
    "viseur",
    "vision",
    "visqueux",
    "visuel",
    "vital",
    "vitesse",
    "viticole",
    "vitrine",
    "vivace",
    "vivipare",
    "vocation",
    "voguer",
    "voile",
    "voisin",
    "voiture",
    "volaille",
    "volcan",
    "voltiger",
    "volume",
    "vorace",
    "vortex",
    "voter",
    "vouloir",
    "voyage",
    "voyelle",
    "wagon",
    "xénon",
    "yacht",
    "zèbre",
    "zénith",
    "zeste",
    "zoologie"
]

},{}],39:[function(require,module,exports){
module.exports=[
    "abaco",
    "abbaglio",
    "abbinato",
    "abete",
    "abisso",
    "abolire",
    "abrasivo",
    "abrogato",
    "accadere",
    "accenno",
    "accusato",
    "acetone",
    "achille",
    "acido",
    "acqua",
    "acre",
    "acrilico",
    "acrobata",
    "acuto",
    "adagio",
    "addebito",
    "addome",
    "adeguato",
    "aderire",
    "adipe",
    "adottare",
    "adulare",
    "affabile",
    "affetto",
    "affisso",
    "affranto",
    "aforisma",
    "afoso",
    "africano",
    "agave",
    "agente",
    "agevole",
    "aggancio",
    "agire",
    "agitare",
    "agonismo",
    "agricolo",
    "agrumeto",
    "aguzzo",
    "alabarda",
    "alato",
    "albatro",
    "alberato",
    "albo",
    "albume",
    "alce",
    "alcolico",
    "alettone",
    "alfa",
    "algebra",
    "aliante",
    "alibi",
    "alimento",
    "allagato",
    "allegro",
    "allievo",
    "allodola",
    "allusivo",
    "almeno",
    "alogeno",
    "alpaca",
    "alpestre",
    "altalena",
    "alterno",
    "alticcio",
    "altrove",
    "alunno",
    "alveolo",
    "alzare",
    "amalgama",
    "amanita",
    "amarena",
    "ambito",
    "ambrato",
    "ameba",
    "america",
    "ametista",
    "amico",
    "ammasso",
    "ammenda",
    "ammirare",
    "ammonito",
    "amore",
    "ampio",
    "ampliare",
    "amuleto",
    "anacardo",
    "anagrafe",
    "analista",
    "anarchia",
    "anatra",
    "anca",
    "ancella",
    "ancora",
    "andare",
    "andrea",
    "anello",
    "angelo",
    "angolare",
    "angusto",
    "anima",
    "annegare",
    "annidato",
    "anno",
    "annuncio",
    "anonimo",
    "anticipo",
    "anzi",
    "apatico",
    "apertura",
    "apode",
    "apparire",
    "appetito",
    "appoggio",
    "approdo",
    "appunto",
    "aprile",
    "arabica",
    "arachide",
    "aragosta",
    "araldica",
    "arancio",
    "aratura",
    "arazzo",
    "arbitro",
    "archivio",
    "ardito",
    "arenile",
    "argento",
    "argine",
    "arguto",
    "aria",
    "armonia",
    "arnese",
    "arredato",
    "arringa",
    "arrosto",
    "arsenico",
    "arso",
    "artefice",
    "arzillo",
    "asciutto",
    "ascolto",
    "asepsi",
    "asettico",
    "asfalto",
    "asino",
    "asola",
    "aspirato",
    "aspro",
    "assaggio",
    "asse",
    "assoluto",
    "assurdo",
    "asta",
    "astenuto",
    "astice",
    "astratto",
    "atavico",
    "ateismo",
    "atomico",
    "atono",
    "attesa",
    "attivare",
    "attorno",
    "attrito",
    "attuale",
    "ausilio",
    "austria",
    "autista",
    "autonomo",
    "autunno",
    "avanzato",
    "avere",
    "avvenire",
    "avviso",
    "avvolgere",
    "azione",
    "azoto",
    "azzimo",
    "azzurro",
    "babele",
    "baccano",
    "bacino",
    "baco",
    "badessa",
    "badilata",
    "bagnato",
    "baita",
    "balcone",
    "baldo",
    "balena",
    "ballata",
    "balzano",
    "bambino",
    "bandire",
    "baraonda",
    "barbaro",
    "barca",
    "baritono",
    "barlume",
    "barocco",
    "basilico",
    "basso",
    "batosta",
    "battuto",
    "baule",
    "bava",
    "bavosa",
    "becco",
    "beffa",
    "belgio",
    "belva",
    "benda",
    "benevole",
    "benigno",
    "benzina",
    "bere",
    "berlina",
    "beta",
    "bibita",
    "bici",
    "bidone",
    "bifido",
    "biga",
    "bilancia",
    "bimbo",
    "binocolo",
    "biologo",
    "bipede",
    "bipolare",
    "birbante",
    "birra",
    "biscotto",
    "bisesto",
    "bisnonno",
    "bisonte",
    "bisturi",
    "bizzarro",
    "blando",
    "blatta",
    "bollito",
    "bonifico",
    "bordo",
    "bosco",
    "botanico",
    "bottino",
    "bozzolo",
    "braccio",
    "bradipo",
    "brama",
    "branca",
    "bravura",
    "bretella",
    "brevetto",
    "brezza",
    "briglia",
    "brillante",
    "brindare",
    "broccolo",
    "brodo",
    "bronzina",
    "brullo",
    "bruno",
    "bubbone",
    "buca",
    "budino",
    "buffone",
    "buio",
    "bulbo",
    "buono",
    "burlone",
    "burrasca",
    "bussola",
    "busta",
    "cadetto",
    "caduco",
    "calamaro",
    "calcolo",
    "calesse",
    "calibro",
    "calmo",
    "caloria",
    "cambusa",
    "camerata",
    "camicia",
    "cammino",
    "camola",
    "campale",
    "canapa",
    "candela",
    "cane",
    "canino",
    "canotto",
    "cantina",
    "capace",
    "capello",
    "capitolo",
    "capogiro",
    "cappero",
    "capra",
    "capsula",
    "carapace",
    "carcassa",
    "cardo",
    "carisma",
    "carovana",
    "carretto",
    "cartolina",
    "casaccio",
    "cascata",
    "caserma",
    "caso",
    "cassone",
    "castello",
    "casuale",
    "catasta",
    "catena",
    "catrame",
    "cauto",
    "cavillo",
    "cedibile",
    "cedrata",
    "cefalo",
    "celebre",
    "cellulare",
    "cena",
    "cenone",
    "centesimo",
    "ceramica",
    "cercare",
    "certo",
    "cerume",
    "cervello",
    "cesoia",
    "cespo",
    "ceto",
    "chela",
    "chiaro",
    "chicca",
    "chiedere",
    "chimera",
    "china",
    "chirurgo",
    "chitarra",
    "ciao",
    "ciclismo",
    "cifrare",
    "cigno",
    "cilindro",
    "ciottolo",
    "circa",
    "cirrosi",
    "citrico",
    "cittadino",
    "ciuffo",
    "civetta",
    "civile",
    "classico",
    "clinica",
    "cloro",
    "cocco",
    "codardo",
    "codice",
    "coerente",
    "cognome",
    "collare",
    "colmato",
    "colore",
    "colposo",
    "coltivato",
    "colza",
    "coma",
    "cometa",
    "commando",
    "comodo",
    "computer",
    "comune",
    "conciso",
    "condurre",
    "conferma",
    "congelare",
    "coniuge",
    "connesso",
    "conoscere",
    "consumo",
    "continuo",
    "convegno",
    "coperto",
    "copione",
    "coppia",
    "copricapo",
    "corazza",
    "cordata",
    "coricato",
    "cornice",
    "corolla",
    "corpo",
    "corredo",
    "corsia",
    "cortese",
    "cosmico",
    "costante",
    "cottura",
    "covato",
    "cratere",
    "cravatta",
    "creato",
    "credere",
    "cremoso",
    "crescita",
    "creta",
    "criceto",
    "crinale",
    "crisi",
    "critico",
    "croce",
    "cronaca",
    "crostata",
    "cruciale",
    "crusca",
    "cucire",
    "cuculo",
    "cugino",
    "cullato",
    "cupola",
    "curatore",
    "cursore",
    "curvo",
    "cuscino",
    "custode",
    "dado",
    "daino",
    "dalmata",
    "damerino",
    "daniela",
    "dannoso",
    "danzare",
    "datato",
    "davanti",
    "davvero",
    "debutto",
    "decennio",
    "deciso",
    "declino",
    "decollo",
    "decreto",
    "dedicato",
    "definito",
    "deforme",
    "degno",
    "delegare",
    "delfino",
    "delirio",
    "delta",
    "demenza",
    "denotato",
    "dentro",
    "deposito",
    "derapata",
    "derivare",
    "deroga",
    "descritto",
    "deserto",
    "desiderio",
    "desumere",
    "detersivo",
    "devoto",
    "diametro",
    "dicembre",
    "diedro",
    "difeso",
    "diffuso",
    "digerire",
    "digitale",
    "diluvio",
    "dinamico",
    "dinnanzi",
    "dipinto",
    "diploma",
    "dipolo",
    "diradare",
    "dire",
    "dirotto",
    "dirupo",
    "disagio",
    "discreto",
    "disfare",
    "disgelo",
    "disposto",
    "distanza",
    "disumano",
    "dito",
    "divano",
    "divelto",
    "dividere",
    "divorato",
    "doblone",
    "docente",
    "doganale",
    "dogma",
    "dolce",
    "domato",
    "domenica",
    "dominare",
    "dondolo",
    "dono",
    "dormire",
    "dote",
    "dottore",
    "dovuto",
    "dozzina",
    "drago",
    "druido",
    "dubbio",
    "dubitare",
    "ducale",
    "duna",
    "duomo",
    "duplice",
    "duraturo",
    "ebano",
    "eccesso",
    "ecco",
    "eclissi",
    "economia",
    "edera",
    "edicola",
    "edile",
    "editoria",
    "educare",
    "egemonia",
    "egli",
    "egoismo",
    "egregio",
    "elaborato",
    "elargire",
    "elegante",
    "elencato",
    "eletto",
    "elevare",
    "elfico",
    "elica",
    "elmo",
    "elsa",
    "eluso",
    "emanato",
    "emblema",
    "emesso",
    "emiro",
    "emotivo",
    "emozione",
    "empirico",
    "emulo",
    "endemico",
    "enduro",
    "energia",
    "enfasi",
    "enoteca",
    "entrare",
    "enzima",
    "epatite",
    "epilogo",
    "episodio",
    "epocale",
    "eppure",
    "equatore",
    "erario",
    "erba",
    "erboso",
    "erede",
    "eremita",
    "erigere",
    "ermetico",
    "eroe",
    "erosivo",
    "errante",
    "esagono",
    "esame",
    "esanime",
    "esaudire",
    "esca",
    "esempio",
    "esercito",
    "esibito",
    "esigente",
    "esistere",
    "esito",
    "esofago",
    "esortato",
    "esoso",
    "espanso",
    "espresso",
    "essenza",
    "esso",
    "esteso",
    "estimare",
    "estonia",
    "estroso",
    "esultare",
    "etilico",
    "etnico",
    "etrusco",
    "etto",
    "euclideo",
    "europa",
    "evaso",
    "evidenza",
    "evitato",
    "evoluto",
    "evviva",
    "fabbrica",
    "faccenda",
    "fachiro",
    "falco",
    "famiglia",
    "fanale",
    "fanfara",
    "fango",
    "fantasma",
    "fare",
    "farfalla",
    "farinoso",
    "farmaco",
    "fascia",
    "fastoso",
    "fasullo",
    "faticare",
    "fato",
    "favoloso",
    "febbre",
    "fecola",
    "fede",
    "fegato",
    "felpa",
    "feltro",
    "femmina",
    "fendere",
    "fenomeno",
    "fermento",
    "ferro",
    "fertile",
    "fessura",
    "festivo",
    "fetta",
    "feudo",
    "fiaba",
    "fiducia",
    "fifa",
    "figurato",
    "filo",
    "finanza",
    "finestra",
    "finire",
    "fiore",
    "fiscale",
    "fisico",
    "fiume",
    "flacone",
    "flamenco",
    "flebo",
    "flemma",
    "florido",
    "fluente",
    "fluoro",
    "fobico",
    "focaccia",
    "focoso",
    "foderato",
    "foglio",
    "folata",
    "folclore",
    "folgore",
    "fondente",
    "fonetico",
    "fonia",
    "fontana",
    "forbito",
    "forchetta",
    "foresta",
    "formica",
    "fornaio",
    "foro",
    "fortezza",
    "forzare",
    "fosfato",
    "fosso",
    "fracasso",
    "frana",
    "frassino",
    "fratello",
    "freccetta",
    "frenata",
    "fresco",
    "frigo",
    "frollino",
    "fronde",
    "frugale",
    "frutta",
    "fucilata",
    "fucsia",
    "fuggente",
    "fulmine",
    "fulvo",
    "fumante",
    "fumetto",
    "fumoso",
    "fune",
    "funzione",
    "fuoco",
    "furbo",
    "furgone",
    "furore",
    "fuso",
    "futile",
    "gabbiano",
    "gaffe",
    "galateo",
    "gallina",
    "galoppo",
    "gambero",
    "gamma",
    "garanzia",
    "garbo",
    "garofano",
    "garzone",
    "gasdotto",
    "gasolio",
    "gastrico",
    "gatto",
    "gaudio",
    "gazebo",
    "gazzella",
    "geco",
    "gelatina",
    "gelso",
    "gemello",
    "gemmato",
    "gene",
    "genitore",
    "gennaio",
    "genotipo",
    "gergo",
    "ghepardo",
    "ghiaccio",
    "ghisa",
    "giallo",
    "gilda",
    "ginepro",
    "giocare",
    "gioiello",
    "giorno",
    "giove",
    "girato",
    "girone",
    "gittata",
    "giudizio",
    "giurato",
    "giusto",
    "globulo",
    "glutine",
    "gnomo",
    "gobba",
    "golf",
    "gomito",
    "gommone",
    "gonfio",
    "gonna",
    "governo",
    "gracile",
    "grado",
    "grafico",
    "grammo",
    "grande",
    "grattare",
    "gravoso",
    "grazia",
    "greca",
    "gregge",
    "grifone",
    "grigio",
    "grinza",
    "grotta",
    "gruppo",
    "guadagno",
    "guaio",
    "guanto",
    "guardare",
    "gufo",
    "guidare",
    "ibernato",
    "icona",
    "identico",
    "idillio",
    "idolo",
    "idra",
    "idrico",
    "idrogeno",
    "igiene",
    "ignaro",
    "ignorato",
    "ilare",
    "illeso",
    "illogico",
    "illudere",
    "imballo",
    "imbevuto",
    "imbocco",
    "imbuto",
    "immane",
    "immerso",
    "immolato",
    "impacco",
    "impeto",
    "impiego",
    "importo",
    "impronta",
    "inalare",
    "inarcare",
    "inattivo",
    "incanto",
    "incendio",
    "inchino",
    "incisivo",
    "incluso",
    "incontro",
    "incrocio",
    "incubo",
    "indagine",
    "india",
    "indole",
    "inedito",
    "infatti",
    "infilare",
    "inflitto",
    "ingaggio",
    "ingegno",
    "inglese",
    "ingordo",
    "ingrosso",
    "innesco",
    "inodore",
    "inoltrare",
    "inondato",
    "insano",
    "insetto",
    "insieme",
    "insonnia",
    "insulina",
    "intasato",
    "intero",
    "intonaco",
    "intuito",
    "inumidire",
    "invalido",
    "invece",
    "invito",
    "iperbole",
    "ipnotico",
    "ipotesi",
    "ippica",
    "iride",
    "irlanda",
    "ironico",
    "irrigato",
    "irrorare",
    "isolato",
    "isotopo",
    "isterico",
    "istituto",
    "istrice",
    "italia",
    "iterare",
    "labbro",
    "labirinto",
    "lacca",
    "lacerato",
    "lacrima",
    "lacuna",
    "laddove",
    "lago",
    "lampo",
    "lancetta",
    "lanterna",
    "lardoso",
    "larga",
    "laringe",
    "lastra",
    "latenza",
    "latino",
    "lattuga",
    "lavagna",
    "lavoro",
    "legale",
    "leggero",
    "lembo",
    "lentezza",
    "lenza",
    "leone",
    "lepre",
    "lesivo",
    "lessato",
    "lesto",
    "letterale",
    "leva",
    "levigato",
    "libero",
    "lido",
    "lievito",
    "lilla",
    "limatura",
    "limitare",
    "limpido",
    "lineare",
    "lingua",
    "liquido",
    "lira",
    "lirica",
    "lisca",
    "lite",
    "litigio",
    "livrea",
    "locanda",
    "lode",
    "logica",
    "lombare",
    "londra",
    "longevo",
    "loquace",
    "lorenzo",
    "loto",
    "lotteria",
    "luce",
    "lucidato",
    "lumaca",
    "luminoso",
    "lungo",
    "lupo",
    "luppolo",
    "lusinga",
    "lusso",
    "lutto",
    "macabro",
    "macchina",
    "macero",
    "macinato",
    "madama",
    "magico",
    "maglia",
    "magnete",
    "magro",
    "maiolica",
    "malafede",
    "malgrado",
    "malinteso",
    "malsano",
    "malto",
    "malumore",
    "mana",
    "mancia",
    "mandorla",
    "mangiare",
    "manifesto",
    "mannaro",
    "manovra",
    "mansarda",
    "mantide",
    "manubrio",
    "mappa",
    "maratona",
    "marcire",
    "maretta",
    "marmo",
    "marsupio",
    "maschera",
    "massaia",
    "mastino",
    "materasso",
    "matricola",
    "mattone",
    "maturo",
    "mazurca",
    "meandro",
    "meccanico",
    "mecenate",
    "medesimo",
    "meditare",
    "mega",
    "melassa",
    "melis",
    "melodia",
    "meninge",
    "meno",
    "mensola",
    "mercurio",
    "merenda",
    "merlo",
    "meschino",
    "mese",
    "messere",
    "mestolo",
    "metallo",
    "metodo",
    "mettere",
    "miagolare",
    "mica",
    "micelio",
    "michele",
    "microbo",
    "midollo",
    "miele",
    "migliore",
    "milano",
    "milite",
    "mimosa",
    "minerale",
    "mini",
    "minore",
    "mirino",
    "mirtillo",
    "miscela",
    "missiva",
    "misto",
    "misurare",
    "mitezza",
    "mitigare",
    "mitra",
    "mittente",
    "mnemonico",
    "modello",
    "modifica",
    "modulo",
    "mogano",
    "mogio",
    "mole",
    "molosso",
    "monastero",
    "monco",
    "mondina",
    "monetario",
    "monile",
    "monotono",
    "monsone",
    "montato",
    "monviso",
    "mora",
    "mordere",
    "morsicato",
    "mostro",
    "motivato",
    "motosega",
    "motto",
    "movenza",
    "movimento",
    "mozzo",
    "mucca",
    "mucosa",
    "muffa",
    "mughetto",
    "mugnaio",
    "mulatto",
    "mulinello",
    "multiplo",
    "mummia",
    "munto",
    "muovere",
    "murale",
    "musa",
    "muscolo",
    "musica",
    "mutevole",
    "muto",
    "nababbo",
    "nafta",
    "nanometro",
    "narciso",
    "narice",
    "narrato",
    "nascere",
    "nastrare",
    "naturale",
    "nautica",
    "naviglio",
    "nebulosa",
    "necrosi",
    "negativo",
    "negozio",
    "nemmeno",
    "neofita",
    "neretto",
    "nervo",
    "nessuno",
    "nettuno",
    "neutrale",
    "neve",
    "nevrotico",
    "nicchia",
    "ninfa",
    "nitido",
    "nobile",
    "nocivo",
    "nodo",
    "nome",
    "nomina",
    "nordico",
    "normale",
    "norvegese",
    "nostrano",
    "notare",
    "notizia",
    "notturno",
    "novella",
    "nucleo",
    "nulla",
    "numero",
    "nuovo",
    "nutrire",
    "nuvola",
    "nuziale",
    "oasi",
    "obbedire",
    "obbligo",
    "obelisco",
    "oblio",
    "obolo",
    "obsoleto",
    "occasione",
    "occhio",
    "occidente",
    "occorrere",
    "occultare",
    "ocra",
    "oculato",
    "odierno",
    "odorare",
    "offerta",
    "offrire",
    "offuscato",
    "oggetto",
    "oggi",
    "ognuno",
    "olandese",
    "olfatto",
    "oliato",
    "oliva",
    "ologramma",
    "oltre",
    "omaggio",
    "ombelico",
    "ombra",
    "omega",
    "omissione",
    "ondoso",
    "onere",
    "onice",
    "onnivoro",
    "onorevole",
    "onta",
    "operato",
    "opinione",
    "opposto",
    "oracolo",
    "orafo",
    "ordine",
    "orecchino",
    "orefice",
    "orfano",
    "organico",
    "origine",
    "orizzonte",
    "orma",
    "ormeggio",
    "ornativo",
    "orologio",
    "orrendo",
    "orribile",
    "ortensia",
    "ortica",
    "orzata",
    "orzo",
    "osare",
    "oscurare",
    "osmosi",
    "ospedale",
    "ospite",
    "ossa",
    "ossidare",
    "ostacolo",
    "oste",
    "otite",
    "otre",
    "ottagono",
    "ottimo",
    "ottobre",
    "ovale",
    "ovest",
    "ovino",
    "oviparo",
    "ovocito",
    "ovunque",
    "ovviare",
    "ozio",
    "pacchetto",
    "pace",
    "pacifico",
    "padella",
    "padrone",
    "paese",
    "paga",
    "pagina",
    "palazzina",
    "palesare",
    "pallido",
    "palo",
    "palude",
    "pandoro",
    "pannello",
    "paolo",
    "paonazzo",
    "paprica",
    "parabola",
    "parcella",
    "parere",
    "pargolo",
    "pari",
    "parlato",
    "parola",
    "partire",
    "parvenza",
    "parziale",
    "passivo",
    "pasticca",
    "patacca",
    "patologia",
    "pattume",
    "pavone",
    "peccato",
    "pedalare",
    "pedonale",
    "peggio",
    "peloso",
    "penare",
    "pendice",
    "penisola",
    "pennuto",
    "penombra",
    "pensare",
    "pentola",
    "pepe",
    "pepita",
    "perbene",
    "percorso",
    "perdonato",
    "perforare",
    "pergamena",
    "periodo",
    "permesso",
    "perno",
    "perplesso",
    "persuaso",
    "pertugio",
    "pervaso",
    "pesatore",
    "pesista",
    "peso",
    "pestifero",
    "petalo",
    "pettine",
    "petulante",
    "pezzo",
    "piacere",
    "pianta",
    "piattino",
    "piccino",
    "picozza",
    "piega",
    "pietra",
    "piffero",
    "pigiama",
    "pigolio",
    "pigro",
    "pila",
    "pilifero",
    "pillola",
    "pilota",
    "pimpante",
    "pineta",
    "pinna",
    "pinolo",
    "pioggia",
    "piombo",
    "piramide",
    "piretico",
    "pirite",
    "pirolisi",
    "pitone",
    "pizzico",
    "placebo",
    "planare",
    "plasma",
    "platano",
    "plenario",
    "pochezza",
    "poderoso",
    "podismo",
    "poesia",
    "poggiare",
    "polenta",
    "poligono",
    "pollice",
    "polmonite",
    "polpetta",
    "polso",
    "poltrona",
    "polvere",
    "pomice",
    "pomodoro",
    "ponte",
    "popoloso",
    "porfido",
    "poroso",
    "porpora",
    "porre",
    "portata",
    "posa",
    "positivo",
    "possesso",
    "postulato",
    "potassio",
    "potere",
    "pranzo",
    "prassi",
    "pratica",
    "precluso",
    "predica",
    "prefisso",
    "pregiato",
    "prelievo",
    "premere",
    "prenotare",
    "preparato",
    "presenza",
    "pretesto",
    "prevalso",
    "prima",
    "principe",
    "privato",
    "problema",
    "procura",
    "produrre",
    "profumo",
    "progetto",
    "prolunga",
    "promessa",
    "pronome",
    "proposta",
    "proroga",
    "proteso",
    "prova",
    "prudente",
    "prugna",
    "prurito",
    "psiche",
    "pubblico",
    "pudica",
    "pugilato",
    "pugno",
    "pulce",
    "pulito",
    "pulsante",
    "puntare",
    "pupazzo",
    "pupilla",
    "puro",
    "quadro",
    "qualcosa",
    "quasi",
    "querela",
    "quota",
    "raccolto",
    "raddoppio",
    "radicale",
    "radunato",
    "raffica",
    "ragazzo",
    "ragione",
    "ragno",
    "ramarro",
    "ramingo",
    "ramo",
    "randagio",
    "rantolare",
    "rapato",
    "rapina",
    "rappreso",
    "rasatura",
    "raschiato",
    "rasente",
    "rassegna",
    "rastrello",
    "rata",
    "ravveduto",
    "reale",
    "recepire",
    "recinto",
    "recluta",
    "recondito",
    "recupero",
    "reddito",
    "redimere",
    "regalato",
    "registro",
    "regola",
    "regresso",
    "relazione",
    "remare",
    "remoto",
    "renna",
    "replica",
    "reprimere",
    "reputare",
    "resa",
    "residente",
    "responso",
    "restauro",
    "rete",
    "retina",
    "retorica",
    "rettifica",
    "revocato",
    "riassunto",
    "ribadire",
    "ribelle",
    "ribrezzo",
    "ricarica",
    "ricco",
    "ricevere",
    "riciclato",
    "ricordo",
    "ricreduto",
    "ridicolo",
    "ridurre",
    "rifasare",
    "riflesso",
    "riforma",
    "rifugio",
    "rigare",
    "rigettato",
    "righello",
    "rilassato",
    "rilevato",
    "rimanere",
    "rimbalzo",
    "rimedio",
    "rimorchio",
    "rinascita",
    "rincaro",
    "rinforzo",
    "rinnovo",
    "rinomato",
    "rinsavito",
    "rintocco",
    "rinuncia",
    "rinvenire",
    "riparato",
    "ripetuto",
    "ripieno",
    "riportare",
    "ripresa",
    "ripulire",
    "risata",
    "rischio",
    "riserva",
    "risibile",
    "riso",
    "rispetto",
    "ristoro",
    "risultato",
    "risvolto",
    "ritardo",
    "ritegno",
    "ritmico",
    "ritrovo",
    "riunione",
    "riva",
    "riverso",
    "rivincita",
    "rivolto",
    "rizoma",
    "roba",
    "robotico",
    "robusto",
    "roccia",
    "roco",
    "rodaggio",
    "rodere",
    "roditore",
    "rogito",
    "rollio",
    "romantico",
    "rompere",
    "ronzio",
    "rosolare",
    "rospo",
    "rotante",
    "rotondo",
    "rotula",
    "rovescio",
    "rubizzo",
    "rubrica",
    "ruga",
    "rullino",
    "rumine",
    "rumoroso",
    "ruolo",
    "rupe",
    "russare",
    "rustico",
    "sabato",
    "sabbiare",
    "sabotato",
    "sagoma",
    "salasso",
    "saldatura",
    "salgemma",
    "salivare",
    "salmone",
    "salone",
    "saltare",
    "saluto",
    "salvo",
    "sapere",
    "sapido",
    "saporito",
    "saraceno",
    "sarcasmo",
    "sarto",
    "sassoso",
    "satellite",
    "satira",
    "satollo",
    "saturno",
    "savana",
    "savio",
    "saziato",
    "sbadiglio",
    "sbalzo",
    "sbancato",
    "sbarra",
    "sbattere",
    "sbavare",
    "sbendare",
    "sbirciare",
    "sbloccato",
    "sbocciato",
    "sbrinare",
    "sbruffone",
    "sbuffare",
    "scabroso",
    "scadenza",
    "scala",
    "scambiare",
    "scandalo",
    "scapola",
    "scarso",
    "scatenare",
    "scavato",
    "scelto",
    "scenico",
    "scettro",
    "scheda",
    "schiena",
    "sciarpa",
    "scienza",
    "scindere",
    "scippo",
    "sciroppo",
    "scivolo",
    "sclerare",
    "scodella",
    "scolpito",
    "scomparto",
    "sconforto",
    "scoprire",
    "scorta",
    "scossone",
    "scozzese",
    "scriba",
    "scrollare",
    "scrutinio",
    "scuderia",
    "scultore",
    "scuola",
    "scuro",
    "scusare",
    "sdebitare",
    "sdoganare",
    "seccatura",
    "secondo",
    "sedano",
    "seggiola",
    "segnalato",
    "segregato",
    "seguito",
    "selciato",
    "selettivo",
    "sella",
    "selvaggio",
    "semaforo",
    "sembrare",
    "seme",
    "seminato",
    "sempre",
    "senso",
    "sentire",
    "sepolto",
    "sequenza",
    "serata",
    "serbato",
    "sereno",
    "serio",
    "serpente",
    "serraglio",
    "servire",
    "sestina",
    "setola",
    "settimana",
    "sfacelo",
    "sfaldare",
    "sfamato",
    "sfarzoso",
    "sfaticato",
    "sfera",
    "sfida",
    "sfilato",
    "sfinge",
    "sfocato",
    "sfoderare",
    "sfogo",
    "sfoltire",
    "sforzato",
    "sfratto",
    "sfruttato",
    "sfuggito",
    "sfumare",
    "sfuso",
    "sgabello",
    "sgarbato",
    "sgonfiare",
    "sgorbio",
    "sgrassato",
    "sguardo",
    "sibilo",
    "siccome",
    "sierra",
    "sigla",
    "signore",
    "silenzio",
    "sillaba",
    "simbolo",
    "simpatico",
    "simulato",
    "sinfonia",
    "singolo",
    "sinistro",
    "sino",
    "sintesi",
    "sinusoide",
    "sipario",
    "sisma",
    "sistole",
    "situato",
    "slitta",
    "slogatura",
    "sloveno",
    "smarrito",
    "smemorato",
    "smentito",
    "smeraldo",
    "smilzo",
    "smontare",
    "smottato",
    "smussato",
    "snellire",
    "snervato",
    "snodo",
    "sobbalzo",
    "sobrio",
    "soccorso",
    "sociale",
    "sodale",
    "soffitto",
    "sogno",
    "soldato",
    "solenne",
    "solido",
    "sollazzo",
    "solo",
    "solubile",
    "solvente",
    "somatico",
    "somma",
    "sonda",
    "sonetto",
    "sonnifero",
    "sopire",
    "soppeso",
    "sopra",
    "sorgere",
    "sorpasso",
    "sorriso",
    "sorso",
    "sorteggio",
    "sorvolato",
    "sospiro",
    "sosta",
    "sottile",
    "spada",
    "spalla",
    "spargere",
    "spatola",
    "spavento",
    "spazzola",
    "specie",
    "spedire",
    "spegnere",
    "spelatura",
    "speranza",
    "spessore",
    "spettrale",
    "spezzato",
    "spia",
    "spigoloso",
    "spillato",
    "spinoso",
    "spirale",
    "splendido",
    "sportivo",
    "sposo",
    "spranga",
    "sprecare",
    "spronato",
    "spruzzo",
    "spuntino",
    "squillo",
    "sradicare",
    "srotolato",
    "stabile",
    "stacco",
    "staffa",
    "stagnare",
    "stampato",
    "stantio",
    "starnuto",
    "stasera",
    "statuto",
    "stelo",
    "steppa",
    "sterzo",
    "stiletto",
    "stima",
    "stirpe",
    "stivale",
    "stizzoso",
    "stonato",
    "storico",
    "strappo",
    "stregato",
    "stridulo",
    "strozzare",
    "strutto",
    "stuccare",
    "stufo",
    "stupendo",
    "subentro",
    "succoso",
    "sudore",
    "suggerito",
    "sugo",
    "sultano",
    "suonare",
    "superbo",
    "supporto",
    "surgelato",
    "surrogato",
    "sussurro",
    "sutura",
    "svagare",
    "svedese",
    "sveglio",
    "svelare",
    "svenuto",
    "svezia",
    "sviluppo",
    "svista",
    "svizzera",
    "svolta",
    "svuotare",
    "tabacco",
    "tabulato",
    "tacciare",
    "taciturno",
    "tale",
    "talismano",
    "tampone",
    "tannino",
    "tara",
    "tardivo",
    "targato",
    "tariffa",
    "tarpare",
    "tartaruga",
    "tasto",
    "tattico",
    "taverna",
    "tavolata",
    "tazza",
    "teca",
    "tecnico",
    "telefono",
    "temerario",
    "tempo",
    "temuto",
    "tendone",
    "tenero",
    "tensione",
    "tentacolo",
    "teorema",
    "terme",
    "terrazzo",
    "terzetto",
    "tesi",
    "tesserato",
    "testato",
    "tetro",
    "tettoia",
    "tifare",
    "tigella",
    "timbro",
    "tinto",
    "tipico",
    "tipografo",
    "tiraggio",
    "tiro",
    "titanio",
    "titolo",
    "titubante",
    "tizio",
    "tizzone",
    "toccare",
    "tollerare",
    "tolto",
    "tombola",
    "tomo",
    "tonfo",
    "tonsilla",
    "topazio",
    "topologia",
    "toppa",
    "torba",
    "tornare",
    "torrone",
    "tortora",
    "toscano",
    "tossire",
    "tostatura",
    "totano",
    "trabocco",
    "trachea",
    "trafila",
    "tragedia",
    "tralcio",
    "tramonto",
    "transito",
    "trapano",
    "trarre",
    "trasloco",
    "trattato",
    "trave",
    "treccia",
    "tremolio",
    "trespolo",
    "tributo",
    "tricheco",
    "trifoglio",
    "trillo",
    "trincea",
    "trio",
    "tristezza",
    "triturato",
    "trivella",
    "tromba",
    "trono",
    "troppo",
    "trottola",
    "trovare",
    "truccato",
    "tubatura",
    "tuffato",
    "tulipano",
    "tumulto",
    "tunisia",
    "turbare",
    "turchino",
    "tuta",
    "tutela",
    "ubicato",
    "uccello",
    "uccisore",
    "udire",
    "uditivo",
    "uffa",
    "ufficio",
    "uguale",
    "ulisse",
    "ultimato",
    "umano",
    "umile",
    "umorismo",
    "uncinetto",
    "ungere",
    "ungherese",
    "unicorno",
    "unificato",
    "unisono",
    "unitario",
    "unte",
    "uovo",
    "upupa",
    "uragano",
    "urgenza",
    "urlo",
    "usanza",
    "usato",
    "uscito",
    "usignolo",
    "usuraio",
    "utensile",
    "utilizzo",
    "utopia",
    "vacante",
    "vaccinato",
    "vagabondo",
    "vagliato",
    "valanga",
    "valgo",
    "valico",
    "valletta",
    "valoroso",
    "valutare",
    "valvola",
    "vampata",
    "vangare",
    "vanitoso",
    "vano",
    "vantaggio",
    "vanvera",
    "vapore",
    "varano",
    "varcato",
    "variante",
    "vasca",
    "vedetta",
    "vedova",
    "veduto",
    "vegetale",
    "veicolo",
    "velcro",
    "velina",
    "velluto",
    "veloce",
    "venato",
    "vendemmia",
    "vento",
    "verace",
    "verbale",
    "vergogna",
    "verifica",
    "vero",
    "verruca",
    "verticale",
    "vescica",
    "vessillo",
    "vestale",
    "veterano",
    "vetrina",
    "vetusto",
    "viandante",
    "vibrante",
    "vicenda",
    "vichingo",
    "vicinanza",
    "vidimare",
    "vigilia",
    "vigneto",
    "vigore",
    "vile",
    "villano",
    "vimini",
    "vincitore",
    "viola",
    "vipera",
    "virgola",
    "virologo",
    "virulento",
    "viscoso",
    "visione",
    "vispo",
    "vissuto",
    "visura",
    "vita",
    "vitello",
    "vittima",
    "vivanda",
    "vivido",
    "viziare",
    "voce",
    "voga",
    "volatile",
    "volere",
    "volpe",
    "voragine",
    "vulcano",
    "zampogna",
    "zanna",
    "zappato",
    "zattera",
    "zavorra",
    "zefiro",
    "zelante",
    "zelo",
    "zenzero",
    "zerbino",
    "zibetto",
    "zinco",
    "zircone",
    "zitto",
    "zolla",
    "zotico",
    "zucchero",
    "zufolo",
    "zulu",
    "zuppa"
]

},{}],40:[function(require,module,exports){
module.exports=[
    "あいこくしん",
    "あいさつ",
    "あいだ",
    "あおぞら",
    "あかちゃん",
    "あきる",
    "あけがた",
    "あける",
    "あこがれる",
    "あさい",
    "あさひ",
    "あしあと",
    "あじわう",
    "あずかる",
    "あずき",
    "あそぶ",
    "あたえる",
    "あたためる",
    "あたりまえ",
    "あたる",
    "あつい",
    "あつかう",
    "あっしゅく",
    "あつまり",
    "あつめる",
    "あてな",
    "あてはまる",
    "あひる",
    "あぶら",
    "あぶる",
    "あふれる",
    "あまい",
    "あまど",
    "あまやかす",
    "あまり",
    "あみもの",
    "あめりか",
    "あやまる",
    "あゆむ",
    "あらいぐま",
    "あらし",
    "あらすじ",
    "あらためる",
    "あらゆる",
    "あらわす",
    "ありがとう",
    "あわせる",
    "あわてる",
    "あんい",
    "あんがい",
    "あんこ",
    "あんぜん",
    "あんてい",
    "あんない",
    "あんまり",
    "いいだす",
    "いおん",
    "いがい",
    "いがく",
    "いきおい",
    "いきなり",
    "いきもの",
    "いきる",
    "いくじ",
    "いくぶん",
    "いけばな",
    "いけん",
    "いこう",
    "いこく",
    "いこつ",
    "いさましい",
    "いさん",
    "いしき",
    "いじゅう",
    "いじょう",
    "いじわる",
    "いずみ",
    "いずれ",
    "いせい",
    "いせえび",
    "いせかい",
    "いせき",
    "いぜん",
    "いそうろう",
    "いそがしい",
    "いだい",
    "いだく",
    "いたずら",
    "いたみ",
    "いたりあ",
    "いちおう",
    "いちじ",
    "いちど",
    "いちば",
    "いちぶ",
    "いちりゅう",
    "いつか",
    "いっしゅん",
    "いっせい",
    "いっそう",
    "いったん",
    "いっち",
    "いってい",
    "いっぽう",
    "いてざ",
    "いてん",
    "いどう",
    "いとこ",
    "いない",
    "いなか",
    "いねむり",
    "いのち",
    "いのる",
    "いはつ",
    "いばる",
    "いはん",
    "いびき",
    "いひん",
    "いふく",
    "いへん",
    "いほう",
    "いみん",
    "いもうと",
    "いもたれ",
    "いもり",
    "いやがる",
    "いやす",
    "いよかん",
    "いよく",
    "いらい",
    "いらすと",
    "いりぐち",
    "いりょう",
    "いれい",
    "いれもの",
    "いれる",
    "いろえんぴつ",
    "いわい",
    "いわう",
    "いわかん",
    "いわば",
    "いわゆる",
    "いんげんまめ",
    "いんさつ",
    "いんしょう",
    "いんよう",
    "うえき",
    "うえる",
    "うおざ",
    "うがい",
    "うかぶ",
    "うかべる",
    "うきわ",
    "うくらいな",
    "うくれれ",
    "うけたまわる",
    "うけつけ",
    "うけとる",
    "うけもつ",
    "うける",
    "うごかす",
    "うごく",
    "うこん",
    "うさぎ",
    "うしなう",
    "うしろがみ",
    "うすい",
    "うすぎ",
    "うすぐらい",
    "うすめる",
    "うせつ",
    "うちあわせ",
    "うちがわ",
    "うちき",
    "うちゅう",
    "うっかり",
    "うつくしい",
    "うったえる",
    "うつる",
    "うどん",
    "うなぎ",
    "うなじ",
    "うなずく",
    "うなる",
    "うねる",
    "うのう",
    "うぶげ",
    "うぶごえ",
    "うまれる",
    "うめる",
    "うもう",
    "うやまう",
    "うよく",
    "うらがえす",
    "うらぐち",
    "うらない",
    "うりあげ",
    "うりきれ",
    "うるさい",
    "うれしい",
    "うれゆき",
    "うれる",
    "うろこ",
    "うわき",
    "うわさ",
    "うんこう",
    "うんちん",
    "うんてん",
    "うんどう",
    "えいえん",
    "えいが",
    "えいきょう",
    "えいご",
    "えいせい",
    "えいぶん",
    "えいよう",
    "えいわ",
    "えおり",
    "えがお",
    "えがく",
    "えきたい",
    "えくせる",
    "えしゃく",
    "えすて",
    "えつらん",
    "えのぐ",
    "えほうまき",
    "えほん",
    "えまき",
    "えもじ",
    "えもの",
    "えらい",
    "えらぶ",
    "えりあ",
    "えんえん",
    "えんかい",
    "えんぎ",
    "えんげき",
    "えんしゅう",
    "えんぜつ",
    "えんそく",
    "えんちょう",
    "えんとつ",
    "おいかける",
    "おいこす",
    "おいしい",
    "おいつく",
    "おうえん",
    "おうさま",
    "おうじ",
    "おうせつ",
    "おうたい",
    "おうふく",
    "おうべい",
    "おうよう",
    "おえる",
    "おおい",
    "おおう",
    "おおどおり",
    "おおや",
    "おおよそ",
    "おかえり",
    "おかず",
    "おがむ",
    "おかわり",
    "おぎなう",
    "おきる",
    "おくさま",
    "おくじょう",
    "おくりがな",
    "おくる",
    "おくれる",
    "おこす",
    "おこなう",
    "おこる",
    "おさえる",
    "おさない",
    "おさめる",
    "おしいれ",
    "おしえる",
    "おじぎ",
    "おじさん",
    "おしゃれ",
    "おそらく",
    "おそわる",
    "おたがい",
    "おたく",
    "おだやか",
    "おちつく",
    "おっと",
    "おつり",
    "おでかけ",
    "おとしもの",
    "おとなしい",
    "おどり",
    "おどろかす",
    "おばさん",
    "おまいり",
    "おめでとう",
    "おもいで",
    "おもう",
    "おもたい",
    "おもちゃ",
    "おやつ",
    "おやゆび",
    "およぼす",
    "おらんだ",
    "おろす",
    "おんがく",
    "おんけい",
    "おんしゃ",
    "おんせん",
    "おんだん",
    "おんちゅう",
    "おんどけい",
    "かあつ",
    "かいが",
    "がいき",
    "がいけん",
    "がいこう",
    "かいさつ",
    "かいしゃ",
    "かいすいよく",
    "かいぜん",
    "かいぞうど",
    "かいつう",
    "かいてん",
    "かいとう",
    "かいふく",
    "がいへき",
    "かいほう",
    "かいよう",
    "がいらい",
    "かいわ",
    "かえる",
    "かおり",
    "かかえる",
    "かがく",
    "かがし",
    "かがみ",
    "かくご",
    "かくとく",
    "かざる",
    "がぞう",
    "かたい",
    "かたち",
    "がちょう",
    "がっきゅう",
    "がっこう",
    "がっさん",
    "がっしょう",
    "かなざわし",
    "かのう",
    "がはく",
    "かぶか",
    "かほう",
    "かほご",
    "かまう",
    "かまぼこ",
    "かめれおん",
    "かゆい",
    "かようび",
    "からい",
    "かるい",
    "かろう",
    "かわく",
    "かわら",
    "がんか",
    "かんけい",
    "かんこう",
    "かんしゃ",
    "かんそう",
    "かんたん",
    "かんち",
    "がんばる",
    "きあい",
    "きあつ",
    "きいろ",
    "ぎいん",
    "きうい",
    "きうん",
    "きえる",
    "きおう",
    "きおく",
    "きおち",
    "きおん",
    "きかい",
    "きかく",
    "きかんしゃ",
    "ききて",
    "きくばり",
    "きくらげ",
    "きけんせい",
    "きこう",
    "きこえる",
    "きこく",
    "きさい",
    "きさく",
    "きさま",
    "きさらぎ",
    "ぎじかがく",
    "ぎしき",
    "ぎじたいけん",
    "ぎじにってい",
    "ぎじゅつしゃ",
    "きすう",
    "きせい",
    "きせき",
    "きせつ",
    "きそう",
    "きぞく",
    "きぞん",
    "きたえる",
    "きちょう",
    "きつえん",
    "ぎっちり",
    "きつつき",
    "きつね",
    "きてい",
    "きどう",
    "きどく",
    "きない",
    "きなが",
    "きなこ",
    "きぬごし",
    "きねん",
    "きのう",
    "きのした",
    "きはく",
    "きびしい",
    "きひん",
    "きふく",
    "きぶん",
    "きぼう",
    "きほん",
    "きまる",
    "きみつ",
    "きむずかしい",
    "きめる",
    "きもだめし",
    "きもち",
    "きもの",
    "きゃく",
    "きやく",
    "ぎゅうにく",
    "きよう",
    "きょうりゅう",
    "きらい",
    "きらく",
    "きりん",
    "きれい",
    "きれつ",
    "きろく",
    "ぎろん",
    "きわめる",
    "ぎんいろ",
    "きんかくじ",
    "きんじょ",
    "きんようび",
    "ぐあい",
    "くいず",
    "くうかん",
    "くうき",
    "くうぐん",
    "くうこう",
    "ぐうせい",
    "くうそう",
    "ぐうたら",
    "くうふく",
    "くうぼ",
    "くかん",
    "くきょう",
    "くげん",
    "ぐこう",
    "くさい",
    "くさき",
    "くさばな",
    "くさる",
    "くしゃみ",
    "くしょう",
    "くすのき",
    "くすりゆび",
    "くせげ",
    "くせん",
    "ぐたいてき",
    "くださる",
    "くたびれる",
    "くちこみ",
    "くちさき",
    "くつした",
    "ぐっすり",
    "くつろぐ",
    "くとうてん",
    "くどく",
    "くなん",
    "くねくね",
    "くのう",
    "くふう",
    "くみあわせ",
    "くみたてる",
    "くめる",
    "くやくしょ",
    "くらす",
    "くらべる",
    "くるま",
    "くれる",
    "くろう",
    "くわしい",
    "ぐんかん",
    "ぐんしょく",
    "ぐんたい",
    "ぐんて",
    "けあな",
    "けいかく",
    "けいけん",
    "けいこ",
    "けいさつ",
    "げいじゅつ",
    "けいたい",
    "げいのうじん",
    "けいれき",
    "けいろ",
    "けおとす",
    "けおりもの",
    "げきか",
    "げきげん",
    "げきだん",
    "げきちん",
    "げきとつ",
    "げきは",
    "げきやく",
    "げこう",
    "げこくじょう",
    "げざい",
    "けさき",
    "げざん",
    "けしき",
    "けしごむ",
    "けしょう",
    "げすと",
    "けたば",
    "けちゃっぷ",
    "けちらす",
    "けつあつ",
    "けつい",
    "けつえき",
    "けっこん",
    "けつじょ",
    "けっせき",
    "けってい",
    "けつまつ",
    "げつようび",
    "げつれい",
    "けつろん",
    "げどく",
    "けとばす",
    "けとる",
    "けなげ",
    "けなす",
    "けなみ",
    "けぬき",
    "げねつ",
    "けねん",
    "けはい",
    "げひん",
    "けぶかい",
    "げぼく",
    "けまり",
    "けみかる",
    "けむし",
    "けむり",
    "けもの",
    "けらい",
    "けろけろ",
    "けわしい",
    "けんい",
    "けんえつ",
    "けんお",
    "けんか",
    "げんき",
    "けんげん",
    "けんこう",
    "けんさく",
    "けんしゅう",
    "けんすう",
    "げんそう",
    "けんちく",
    "けんてい",
    "けんとう",
    "けんない",
    "けんにん",
    "げんぶつ",
    "けんま",
    "けんみん",
    "けんめい",
    "けんらん",
    "けんり",
    "こあくま",
    "こいぬ",
    "こいびと",
    "ごうい",
    "こうえん",
    "こうおん",
    "こうかん",
    "ごうきゅう",
    "ごうけい",
    "こうこう",
    "こうさい",
    "こうじ",
    "こうすい",
    "ごうせい",
    "こうそく",
    "こうたい",
    "こうちゃ",
    "こうつう",
    "こうてい",
    "こうどう",
    "こうない",
    "こうはい",
    "ごうほう",
    "ごうまん",
    "こうもく",
    "こうりつ",
    "こえる",
    "こおり",
    "ごかい",
    "ごがつ",
    "ごかん",
    "こくご",
    "こくさい",
    "こくとう",
    "こくない",
    "こくはく",
    "こぐま",
    "こけい",
    "こける",
    "ここのか",
    "こころ",
    "こさめ",
    "こしつ",
    "こすう",
    "こせい",
    "こせき",
    "こぜん",
    "こそだて",
    "こたい",
    "こたえる",
    "こたつ",
    "こちょう",
    "こっか",
    "こつこつ",
    "こつばん",
    "こつぶ",
    "こてい",
    "こてん",
    "ことがら",
    "ことし",
    "ことば",
    "ことり",
    "こなごな",
    "こねこね",
    "このまま",
    "このみ",
    "このよ",
    "ごはん",
    "こひつじ",
    "こふう",
    "こふん",
    "こぼれる",
    "ごまあぶら",
    "こまかい",
    "ごますり",
    "こまつな",
    "こまる",
    "こむぎこ",
    "こもじ",
    "こもち",
    "こもの",
    "こもん",
    "こやく",
    "こやま",
    "こゆう",
    "こゆび",
    "こよい",
    "こよう",
    "こりる",
    "これくしょん",
    "ころっけ",
    "こわもて",
    "こわれる",
    "こんいん",
    "こんかい",
    "こんき",
    "こんしゅう",
    "こんすい",
    "こんだて",
    "こんとん",
    "こんなん",
    "こんびに",
    "こんぽん",
    "こんまけ",
    "こんや",
    "こんれい",
    "こんわく",
    "ざいえき",
    "さいかい",
    "さいきん",
    "ざいげん",
    "ざいこ",
    "さいしょ",
    "さいせい",
    "ざいたく",
    "ざいちゅう",
    "さいてき",
    "ざいりょう",
    "さうな",
    "さかいし",
    "さがす",
    "さかな",
    "さかみち",
    "さがる",
    "さぎょう",
    "さくし",
    "さくひん",
    "さくら",
    "さこく",
    "さこつ",
    "さずかる",
    "ざせき",
    "さたん",
    "さつえい",
    "ざつおん",
    "ざっか",
    "ざつがく",
    "さっきょく",
    "ざっし",
    "さつじん",
    "ざっそう",
    "さつたば",
    "さつまいも",
    "さてい",
    "さといも",
    "さとう",
    "さとおや",
    "さとし",
    "さとる",
    "さのう",
    "さばく",
    "さびしい",
    "さべつ",
    "さほう",
    "さほど",
    "さます",
    "さみしい",
    "さみだれ",
    "さむけ",
    "さめる",
    "さやえんどう",
    "さゆう",
    "さよう",
    "さよく",
    "さらだ",
    "ざるそば",
    "さわやか",
    "さわる",
    "さんいん",
    "さんか",
    "さんきゃく",
    "さんこう",
    "さんさい",
    "ざんしょ",
    "さんすう",
    "さんせい",
    "さんそ",
    "さんち",
    "さんま",
    "さんみ",
    "さんらん",
    "しあい",
    "しあげ",
    "しあさって",
    "しあわせ",
    "しいく",
    "しいん",
    "しうち",
    "しえい",
    "しおけ",
    "しかい",
    "しかく",
    "じかん",
    "しごと",
    "しすう",
    "じだい",
    "したうけ",
    "したぎ",
    "したて",
    "したみ",
    "しちょう",
    "しちりん",
    "しっかり",
    "しつじ",
    "しつもん",
    "してい",
    "してき",
    "してつ",
    "じてん",
    "じどう",
    "しなぎれ",
    "しなもの",
    "しなん",
    "しねま",
    "しねん",
    "しのぐ",
    "しのぶ",
    "しはい",
    "しばかり",
    "しはつ",
    "しはらい",
    "しはん",
    "しひょう",
    "しふく",
    "じぶん",
    "しへい",
    "しほう",
    "しほん",
    "しまう",
    "しまる",
    "しみん",
    "しむける",
    "じむしょ",
    "しめい",
    "しめる",
    "しもん",
    "しゃいん",
    "しゃうん",
    "しゃおん",
    "じゃがいも",
    "しやくしょ",
    "しゃくほう",
    "しゃけん",
    "しゃこ",
    "しゃざい",
    "しゃしん",
    "しゃせん",
    "しゃそう",
    "しゃたい",
    "しゃちょう",
    "しゃっきん",
    "じゃま",
    "しゃりん",
    "しゃれい",
    "じゆう",
    "じゅうしょ",
    "しゅくはく",
    "じゅしん",
    "しゅっせき",
    "しゅみ",
    "しゅらば",
    "じゅんばん",
    "しょうかい",
    "しょくたく",
    "しょっけん",
    "しょどう",
    "しょもつ",
    "しらせる",
    "しらべる",
    "しんか",
    "しんこう",
    "じんじゃ",
    "しんせいじ",
    "しんちく",
    "しんりん",
    "すあげ",
    "すあし",
    "すあな",
    "ずあん",
    "すいえい",
    "すいか",
    "すいとう",
    "ずいぶん",
    "すいようび",
    "すうがく",
    "すうじつ",
    "すうせん",
    "すおどり",
    "すきま",
    "すくう",
    "すくない",
    "すける",
    "すごい",
    "すこし",
    "ずさん",
    "すずしい",
    "すすむ",
    "すすめる",
    "すっかり",
    "ずっしり",
    "ずっと",
    "すてき",
    "すてる",
    "すねる",
    "すのこ",
    "すはだ",
    "すばらしい",
    "ずひょう",
    "ずぶぬれ",
    "すぶり",
    "すふれ",
    "すべて",
    "すべる",
    "ずほう",
    "すぼん",
    "すまい",
    "すめし",
    "すもう",
    "すやき",
    "すらすら",
    "するめ",
    "すれちがう",
    "すろっと",
    "すわる",
    "すんぜん",
    "すんぽう",
    "せあぶら",
    "せいかつ",
    "せいげん",
    "せいじ",
    "せいよう",
    "せおう",
    "せかいかん",
    "せきにん",
    "せきむ",
    "せきゆ",
    "せきらんうん",
    "せけん",
    "せこう",
    "せすじ",
    "せたい",
    "せたけ",
    "せっかく",
    "せっきゃく",
    "ぜっく",
    "せっけん",
    "せっこつ",
    "せっさたくま",
    "せつぞく",
    "せつだん",
    "せつでん",
    "せっぱん",
    "せつび",
    "せつぶん",
    "せつめい",
    "せつりつ",
    "せなか",
    "せのび",
    "せはば",
    "せびろ",
    "せぼね",
    "せまい",
    "せまる",
    "せめる",
    "せもたれ",
    "せりふ",
    "ぜんあく",
    "せんい",
    "せんえい",
    "せんか",
    "せんきょ",
    "せんく",
    "せんげん",
    "ぜんご",
    "せんさい",
    "せんしゅ",
    "せんすい",
    "せんせい",
    "せんぞ",
    "せんたく",
    "せんちょう",
    "せんてい",
    "せんとう",
    "せんぬき",
    "せんねん",
    "せんぱい",
    "ぜんぶ",
    "ぜんぽう",
    "せんむ",
    "せんめんじょ",
    "せんもん",
    "せんやく",
    "せんゆう",
    "せんよう",
    "ぜんら",
    "ぜんりゃく",
    "せんれい",
    "せんろ",
    "そあく",
    "そいとげる",
    "そいね",
    "そうがんきょう",
    "そうき",
    "そうご",
    "そうしん",
    "そうだん",
    "そうなん",
    "そうび",
    "そうめん",
    "そうり",
    "そえもの",
    "そえん",
    "そがい",
    "そげき",
    "そこう",
    "そこそこ",
    "そざい",
    "そしな",
    "そせい",
    "そせん",
    "そそぐ",
    "そだてる",
    "そつう",
    "そつえん",
    "そっかん",
    "そつぎょう",
    "そっけつ",
    "そっこう",
    "そっせん",
    "そっと",
    "そとがわ",
    "そとづら",
    "そなえる",
    "そなた",
    "そふぼ",
    "そぼく",
    "そぼろ",
    "そまつ",
    "そまる",
    "そむく",
    "そむりえ",
    "そめる",
    "そもそも",
    "そよかぜ",
    "そらまめ",
    "そろう",
    "そんかい",
    "そんけい",
    "そんざい",
    "そんしつ",
    "そんぞく",
    "そんちょう",
    "ぞんび",
    "ぞんぶん",
    "そんみん",
    "たあい",
    "たいいん",
    "たいうん",
    "たいえき",
    "たいおう",
    "だいがく",
    "たいき",
    "たいぐう",
    "たいけん",
    "たいこ",
    "たいざい",
    "だいじょうぶ",
    "だいすき",
    "たいせつ",
    "たいそう",
    "だいたい",
    "たいちょう",
    "たいてい",
    "だいどころ",
    "たいない",
    "たいねつ",
    "たいのう",
    "たいはん",
    "だいひょう",
    "たいふう",
    "たいへん",
    "たいほ",
    "たいまつばな",
    "たいみんぐ",
    "たいむ",
    "たいめん",
    "たいやき",
    "たいよう",
    "たいら",
    "たいりょく",
    "たいる",
    "たいわん",
    "たうえ",
    "たえる",
    "たおす",
    "たおる",
    "たおれる",
    "たかい",
    "たかね",
    "たきび",
    "たくさん",
    "たこく",
    "たこやき",
    "たさい",
    "たしざん",
    "だじゃれ",
    "たすける",
    "たずさわる",
    "たそがれ",
    "たたかう",
    "たたく",
    "ただしい",
    "たたみ",
    "たちばな",
    "だっかい",
    "だっきゃく",
    "だっこ",
    "だっしゅつ",
    "だったい",
    "たてる",
    "たとえる",
    "たなばた",
    "たにん",
    "たぬき",
    "たのしみ",
    "たはつ",
    "たぶん",
    "たべる",
    "たぼう",
    "たまご",
    "たまる",
    "だむる",
    "ためいき",
    "ためす",
    "ためる",
    "たもつ",
    "たやすい",
    "たよる",
    "たらす",
    "たりきほんがん",
    "たりょう",
    "たりる",
    "たると",
    "たれる",
    "たれんと",
    "たろっと",
    "たわむれる",
    "だんあつ",
    "たんい",
    "たんおん",
    "たんか",
    "たんき",
    "たんけん",
    "たんご",
    "たんさん",
    "たんじょうび",
    "だんせい",
    "たんそく",
    "たんたい",
    "だんち",
    "たんてい",
    "たんとう",
    "だんな",
    "たんにん",
    "だんねつ",
    "たんのう",
    "たんぴん",
    "だんぼう",
    "たんまつ",
    "たんめい",
    "だんれつ",
    "だんろ",
    "だんわ",
    "ちあい",
    "ちあん",
    "ちいき",
    "ちいさい",
    "ちえん",
    "ちかい",
    "ちから",
    "ちきゅう",
    "ちきん",
    "ちけいず",
    "ちけん",
    "ちこく",
    "ちさい",
    "ちしき",
    "ちしりょう",
    "ちせい",
    "ちそう",
    "ちたい",
    "ちたん",
    "ちちおや",
    "ちつじょ",
    "ちてき",
    "ちてん",
    "ちぬき",
    "ちぬり",
    "ちのう",
    "ちひょう",
    "ちへいせん",
    "ちほう",
    "ちまた",
    "ちみつ",
    "ちみどろ",
    "ちめいど",
    "ちゃんこなべ",
    "ちゅうい",
    "ちゆりょく",
    "ちょうし",
    "ちょさくけん",
    "ちらし",
    "ちらみ",
    "ちりがみ",
    "ちりょう",
    "ちるど",
    "ちわわ",
    "ちんたい",
    "ちんもく",
    "ついか",
    "ついたち",
    "つうか",
    "つうじょう",
    "つうはん",
    "つうわ",
    "つかう",
    "つかれる",
    "つくね",
    "つくる",
    "つけね",
    "つける",
    "つごう",
    "つたえる",
    "つづく",
    "つつじ",
    "つつむ",
    "つとめる",
    "つながる",
    "つなみ",
    "つねづね",
    "つのる",
    "つぶす",
    "つまらない",
    "つまる",
    "つみき",
    "つめたい",
    "つもり",
    "つもる",
    "つよい",
    "つるぼ",
    "つるみく",
    "つわもの",
    "つわり",
    "てあし",
    "てあて",
    "てあみ",
    "ていおん",
    "ていか",
    "ていき",
    "ていけい",
    "ていこく",
    "ていさつ",
    "ていし",
    "ていせい",
    "ていたい",
    "ていど",
    "ていねい",
    "ていひょう",
    "ていへん",
    "ていぼう",
    "てうち",
    "ておくれ",
    "てきとう",
    "てくび",
    "でこぼこ",
    "てさぎょう",
    "てさげ",
    "てすり",
    "てそう",
    "てちがい",
    "てちょう",
    "てつがく",
    "てつづき",
    "でっぱ",
    "てつぼう",
    "てつや",
    "でぬかえ",
    "てぬき",
    "てぬぐい",
    "てのひら",
    "てはい",
    "てぶくろ",
    "てふだ",
    "てほどき",
    "てほん",
    "てまえ",
    "てまきずし",
    "てみじか",
    "てみやげ",
    "てらす",
    "てれび",
    "てわけ",
    "てわたし",
    "でんあつ",
    "てんいん",
    "てんかい",
    "てんき",
    "てんぐ",
    "てんけん",
    "てんごく",
    "てんさい",
    "てんし",
    "てんすう",
    "でんち",
    "てんてき",
    "てんとう",
    "てんない",
    "てんぷら",
    "てんぼうだい",
    "てんめつ",
    "てんらんかい",
    "でんりょく",
    "でんわ",
    "どあい",
    "といれ",
    "どうかん",
    "とうきゅう",
    "どうぐ",
    "とうし",
    "とうむぎ",
    "とおい",
    "とおか",
    "とおく",
    "とおす",
    "とおる",
    "とかい",
    "とかす",
    "ときおり",
    "ときどき",
    "とくい",
    "とくしゅう",
    "とくてん",
    "とくに",
    "とくべつ",
    "とけい",
    "とける",
    "とこや",
    "とさか",
    "としょかん",
    "とそう",
    "とたん",
    "とちゅう",
    "とっきゅう",
    "とっくん",
    "とつぜん",
    "とつにゅう",
    "とどける",
    "ととのえる",
    "とない",
    "となえる",
    "となり",
    "とのさま",
    "とばす",
    "どぶがわ",
    "とほう",
    "とまる",
    "とめる",
    "ともだち",
    "ともる",
    "どようび",
    "とらえる",
    "とんかつ",
    "どんぶり",
    "ないかく",
    "ないこう",
    "ないしょ",
    "ないす",
    "ないせん",
    "ないそう",
    "なおす",
    "ながい",
    "なくす",
    "なげる",
    "なこうど",
    "なさけ",
    "なたでここ",
    "なっとう",
    "なつやすみ",
    "ななおし",
    "なにごと",
    "なにもの",
    "なにわ",
    "なのか",
    "なふだ",
    "なまいき",
    "なまえ",
    "なまみ",
    "なみだ",
    "なめらか",
    "なめる",
    "なやむ",
    "ならう",
    "ならび",
    "ならぶ",
    "なれる",
    "なわとび",
    "なわばり",
    "にあう",
    "にいがた",
    "にうけ",
    "におい",
    "にかい",
    "にがて",
    "にきび",
    "にくしみ",
    "にくまん",
    "にげる",
    "にさんかたんそ",
    "にしき",
    "にせもの",
    "にちじょう",
    "にちようび",
    "にっか",
    "にっき",
    "にっけい",
    "にっこう",
    "にっさん",
    "にっしょく",
    "にっすう",
    "にっせき",
    "にってい",
    "になう",
    "にほん",
    "にまめ",
    "にもつ",
    "にやり",
    "にゅういん",
    "にりんしゃ",
    "にわとり",
    "にんい",
    "にんか",
    "にんき",
    "にんげん",
    "にんしき",
    "にんずう",
    "にんそう",
    "にんたい",
    "にんち",
    "にんてい",
    "にんにく",
    "にんぷ",
    "にんまり",
    "にんむ",
    "にんめい",
    "にんよう",
    "ぬいくぎ",
    "ぬかす",
    "ぬぐいとる",
    "ぬぐう",
    "ぬくもり",
    "ぬすむ",
    "ぬまえび",
    "ぬめり",
    "ぬらす",
    "ぬんちゃく",
    "ねあげ",
    "ねいき",
    "ねいる",
    "ねいろ",
    "ねぐせ",
    "ねくたい",
    "ねくら",
    "ねこぜ",
    "ねこむ",
    "ねさげ",
    "ねすごす",
    "ねそべる",
    "ねだん",
    "ねつい",
    "ねっしん",
    "ねつぞう",
    "ねったいぎょ",
    "ねぶそく",
    "ねふだ",
    "ねぼう",
    "ねほりはほり",
    "ねまき",
    "ねまわし",
    "ねみみ",
    "ねむい",
    "ねむたい",
    "ねもと",
    "ねらう",
    "ねわざ",
    "ねんいり",
    "ねんおし",
    "ねんかん",
    "ねんきん",
    "ねんぐ",
    "ねんざ",
    "ねんし",
    "ねんちゃく",
    "ねんど",
    "ねんぴ",
    "ねんぶつ",
    "ねんまつ",
    "ねんりょう",
    "ねんれい",
    "のいず",
    "のおづま",
    "のがす",
    "のきなみ",
    "のこぎり",
    "のこす",
    "のこる",
    "のせる",
    "のぞく",
    "のぞむ",
    "のたまう",
    "のちほど",
    "のっく",
    "のばす",
    "のはら",
    "のべる",
    "のぼる",
    "のみもの",
    "のやま",
    "のらいぬ",
    "のらねこ",
    "のりもの",
    "のりゆき",
    "のれん",
    "のんき",
    "ばあい",
    "はあく",
    "ばあさん",
    "ばいか",
    "ばいく",
    "はいけん",
    "はいご",
    "はいしん",
    "はいすい",
    "はいせん",
    "はいそう",
    "はいち",
    "ばいばい",
    "はいれつ",
    "はえる",
    "はおる",
    "はかい",
    "ばかり",
    "はかる",
    "はくしゅ",
    "はけん",
    "はこぶ",
    "はさみ",
    "はさん",
    "はしご",
    "ばしょ",
    "はしる",
    "はせる",
    "ぱそこん",
    "はそん",
    "はたん",
    "はちみつ",
    "はつおん",
    "はっかく",
    "はづき",
    "はっきり",
    "はっくつ",
    "はっけん",
    "はっこう",
    "はっさん",
    "はっしん",
    "はったつ",
    "はっちゅう",
    "はってん",
    "はっぴょう",
    "はっぽう",
    "はなす",
    "はなび",
    "はにかむ",
    "はぶらし",
    "はみがき",
    "はむかう",
    "はめつ",
    "はやい",
    "はやし",
    "はらう",
    "はろうぃん",
    "はわい",
    "はんい",
    "はんえい",
    "はんおん",
    "はんかく",
    "はんきょう",
    "ばんぐみ",
    "はんこ",
    "はんしゃ",
    "はんすう",
    "はんだん",
    "ぱんち",
    "ぱんつ",
    "はんてい",
    "はんとし",
    "はんのう",
    "はんぱ",
    "はんぶん",
    "はんぺん",
    "はんぼうき",
    "はんめい",
    "はんらん",
    "はんろん",
    "ひいき",
    "ひうん",
    "ひえる",
    "ひかく",
    "ひかり",
    "ひかる",
    "ひかん",
    "ひくい",
    "ひけつ",
    "ひこうき",
    "ひこく",
    "ひさい",
    "ひさしぶり",
    "ひさん",
    "びじゅつかん",
    "ひしょ",
    "ひそか",
    "ひそむ",
    "ひたむき",
    "ひだり",
    "ひたる",
    "ひつぎ",
    "ひっこし",
    "ひっし",
    "ひつじゅひん",
    "ひっす",
    "ひつぜん",
    "ぴったり",
    "ぴっちり",
    "ひつよう",
    "ひてい",
    "ひとごみ",
    "ひなまつり",
    "ひなん",
    "ひねる",
    "ひはん",
    "ひびく",
    "ひひょう",
    "ひほう",
    "ひまわり",
    "ひまん",
    "ひみつ",
    "ひめい",
    "ひめじし",
    "ひやけ",
    "ひやす",
    "ひよう",
    "びょうき",
    "ひらがな",
    "ひらく",
    "ひりつ",
    "ひりょう",
    "ひるま",
    "ひるやすみ",
    "ひれい",
    "ひろい",
    "ひろう",
    "ひろき",
    "ひろゆき",
    "ひんかく",
    "ひんけつ",
    "ひんこん",
    "ひんしゅ",
    "ひんそう",
    "ぴんち",
    "ひんぱん",
    "びんぼう",
    "ふあん",
    "ふいうち",
    "ふうけい",
    "ふうせん",
    "ぷうたろう",
    "ふうとう",
    "ふうふ",
    "ふえる",
    "ふおん",
    "ふかい",
    "ふきん",
    "ふくざつ",
    "ふくぶくろ",
    "ふこう",
    "ふさい",
    "ふしぎ",
    "ふじみ",
    "ふすま",
    "ふせい",
    "ふせぐ",
    "ふそく",
    "ぶたにく",
    "ふたん",
    "ふちょう",
    "ふつう",
    "ふつか",
    "ふっかつ",
    "ふっき",
    "ふっこく",
    "ぶどう",
    "ふとる",
    "ふとん",
    "ふのう",
    "ふはい",
    "ふひょう",
    "ふへん",
    "ふまん",
    "ふみん",
    "ふめつ",
    "ふめん",
    "ふよう",
    "ふりこ",
    "ふりる",
    "ふるい",
    "ふんいき",
    "ぶんがく",
    "ぶんぐ",
    "ふんしつ",
    "ぶんせき",
    "ふんそう",
    "ぶんぽう",
    "へいあん",
    "へいおん",
    "へいがい",
    "へいき",
    "へいげん",
    "へいこう",
    "へいさ",
    "へいしゃ",
    "へいせつ",
    "へいそ",
    "へいたく",
    "へいてん",
    "へいねつ",
    "へいわ",
    "へきが",
    "へこむ",
    "べにいろ",
    "べにしょうが",
    "へらす",
    "へんかん",
    "べんきょう",
    "べんごし",
    "へんさい",
    "へんたい",
    "べんり",
    "ほあん",
    "ほいく",
    "ぼうぎょ",
    "ほうこく",
    "ほうそう",
    "ほうほう",
    "ほうもん",
    "ほうりつ",
    "ほえる",
    "ほおん",
    "ほかん",
    "ほきょう",
    "ぼきん",
    "ほくろ",
    "ほけつ",
    "ほけん",
    "ほこう",
    "ほこる",
    "ほしい",
    "ほしつ",
    "ほしゅ",
    "ほしょう",
    "ほせい",
    "ほそい",
    "ほそく",
    "ほたて",
    "ほたる",
    "ぽちぶくろ",
    "ほっきょく",
    "ほっさ",
    "ほったん",
    "ほとんど",
    "ほめる",
    "ほんい",
    "ほんき",
    "ほんけ",
    "ほんしつ",
    "ほんやく",
    "まいにち",
    "まかい",
    "まかせる",
    "まがる",
    "まける",
    "まこと",
    "まさつ",
    "まじめ",
    "ますく",
    "まぜる",
    "まつり",
    "まとめ",
    "まなぶ",
    "まぬけ",
    "まねく",
    "まほう",
    "まもる",
    "まゆげ",
    "まよう",
    "まろやか",
    "まわす",
    "まわり",
    "まわる",
    "まんが",
    "まんきつ",
    "まんぞく",
    "まんなか",
    "みいら",
    "みうち",
    "みえる",
    "みがく",
    "みかた",
    "みかん",
    "みけん",
    "みこん",
    "みじかい",
    "みすい",
    "みすえる",
    "みせる",
    "みっか",
    "みつかる",
    "みつける",
    "みてい",
    "みとめる",
    "みなと",
    "みなみかさい",
    "みねらる",
    "みのう",
    "みのがす",
    "みほん",
    "みもと",
    "みやげ",
    "みらい",
    "みりょく",
    "みわく",
    "みんか",
    "みんぞく",
    "むいか",
    "むえき",
    "むえん",
    "むかい",
    "むかう",
    "むかえ",
    "むかし",
    "むぎちゃ",
    "むける",
    "むげん",
    "むさぼる",
    "むしあつい",
    "むしば",
    "むじゅん",
    "むしろ",
    "むすう",
    "むすこ",
    "むすぶ",
    "むすめ",
    "むせる",
    "むせん",
    "むちゅう",
    "むなしい",
    "むのう",
    "むやみ",
    "むよう",
    "むらさき",
    "むりょう",
    "むろん",
    "めいあん",
    "めいうん",
    "めいえん",
    "めいかく",
    "めいきょく",
    "めいさい",
    "めいし",
    "めいそう",
    "めいぶつ",
    "めいれい",
    "めいわく",
    "めぐまれる",
    "めざす",
    "めした",
    "めずらしい",
    "めだつ",
    "めまい",
    "めやす",
    "めんきょ",
    "めんせき",
    "めんどう",
    "もうしあげる",
    "もうどうけん",
    "もえる",
    "もくし",
    "もくてき",
    "もくようび",
    "もちろん",
    "もどる",
    "もらう",
    "もんく",
    "もんだい",
    "やおや",
    "やける",
    "やさい",
    "やさしい",
    "やすい",
    "やすたろう",
    "やすみ",
    "やせる",
    "やそう",
    "やたい",
    "やちん",
    "やっと",
    "やっぱり",
    "やぶる",
    "やめる",
    "ややこしい",
    "やよい",
    "やわらかい",
    "ゆうき",
    "ゆうびんきょく",
    "ゆうべ",
    "ゆうめい",
    "ゆけつ",
    "ゆしゅつ",
    "ゆせん",
    "ゆそう",
    "ゆたか",
    "ゆちゃく",
    "ゆでる",
    "ゆにゅう",
    "ゆびわ",
    "ゆらい",
    "ゆれる",
    "ようい",
    "ようか",
    "ようきゅう",
    "ようじ",
    "ようす",
    "ようちえん",
    "よかぜ",
    "よかん",
    "よきん",
    "よくせい",
    "よくぼう",
    "よけい",
    "よごれる",
    "よさん",
    "よしゅう",
    "よそう",
    "よそく",
    "よっか",
    "よてい",
    "よどがわく",
    "よねつ",
    "よやく",
    "よゆう",
    "よろこぶ",
    "よろしい",
    "らいう",
    "らくがき",
    "らくご",
    "らくさつ",
    "らくだ",
    "らしんばん",
    "らせん",
    "らぞく",
    "らたい",
    "らっか",
    "られつ",
    "りえき",
    "りかい",
    "りきさく",
    "りきせつ",
    "りくぐん",
    "りくつ",
    "りけん",
    "りこう",
    "りせい",
    "りそう",
    "りそく",
    "りてん",
    "りねん",
    "りゆう",
    "りゅうがく",
    "りよう",
    "りょうり",
    "りょかん",
    "りょくちゃ",
    "りょこう",
    "りりく",
    "りれき",
    "りろん",
    "りんご",
    "るいけい",
    "るいさい",
    "るいじ",
    "るいせき",
    "るすばん",
    "るりがわら",
    "れいかん",
    "れいぎ",
    "れいせい",
    "れいぞうこ",
    "れいとう",
    "れいぼう",
    "れきし",
    "れきだい",
    "れんあい",
    "れんけい",
    "れんこん",
    "れんさい",
    "れんしゅう",
    "れんぞく",
    "れんらく",
    "ろうか",
    "ろうご",
    "ろうじん",
    "ろうそく",
    "ろくが",
    "ろこつ",
    "ろじうら",
    "ろしゅつ",
    "ろせん",
    "ろてん",
    "ろめん",
    "ろれつ",
    "ろんぎ",
    "ろんぱ",
    "ろんぶん",
    "ろんり",
    "わかす",
    "わかめ",
    "わかやま",
    "わかれる",
    "わしつ",
    "わじまし",
    "わすれもの",
    "わらう",
    "われる"
]

},{}],41:[function(require,module,exports){
module.exports=[
    "가격",
    "가끔",
    "가난",
    "가능",
    "가득",
    "가르침",
    "가뭄",
    "가방",
    "가상",
    "가슴",
    "가운데",
    "가을",
    "가이드",
    "가입",
    "가장",
    "가정",
    "가족",
    "가죽",
    "각오",
    "각자",
    "간격",
    "간부",
    "간섭",
    "간장",
    "간접",
    "간판",
    "갈등",
    "갈비",
    "갈색",
    "갈증",
    "감각",
    "감기",
    "감소",
    "감수성",
    "감자",
    "감정",
    "갑자기",
    "강남",
    "강당",
    "강도",
    "강력히",
    "강변",
    "강북",
    "강사",
    "강수량",
    "강아지",
    "강원도",
    "강의",
    "강제",
    "강조",
    "같이",
    "개구리",
    "개나리",
    "개방",
    "개별",
    "개선",
    "개성",
    "개인",
    "객관적",
    "거실",
    "거액",
    "거울",
    "거짓",
    "거품",
    "걱정",
    "건강",
    "건물",
    "건설",
    "건조",
    "건축",
    "걸음",
    "검사",
    "검토",
    "게시판",
    "게임",
    "겨울",
    "견해",
    "결과",
    "결국",
    "결론",
    "결석",
    "결승",
    "결심",
    "결정",
    "결혼",
    "경계",
    "경고",
    "경기",
    "경력",
    "경복궁",
    "경비",
    "경상도",
    "경영",
    "경우",
    "경쟁",
    "경제",
    "경주",
    "경찰",
    "경치",
    "경향",
    "경험",
    "계곡",
    "계단",
    "계란",
    "계산",
    "계속",
    "계약",
    "계절",
    "계층",
    "계획",
    "고객",
    "고구려",
    "고궁",
    "고급",
    "고등학생",
    "고무신",
    "고민",
    "고양이",
    "고장",
    "고전",
    "고집",
    "고춧가루",
    "고통",
    "고향",
    "곡식",
    "골목",
    "골짜기",
    "골프",
    "공간",
    "공개",
    "공격",
    "공군",
    "공급",
    "공기",
    "공동",
    "공무원",
    "공부",
    "공사",
    "공식",
    "공업",
    "공연",
    "공원",
    "공장",
    "공짜",
    "공책",
    "공통",
    "공포",
    "공항",
    "공휴일",
    "과목",
    "과일",
    "과장",
    "과정",
    "과학",
    "관객",
    "관계",
    "관광",
    "관념",
    "관람",
    "관련",
    "관리",
    "관습",
    "관심",
    "관점",
    "관찰",
    "광경",
    "광고",
    "광장",
    "광주",
    "괴로움",
    "굉장히",
    "교과서",
    "교문",
    "교복",
    "교실",
    "교양",
    "교육",
    "교장",
    "교직",
    "교통",
    "교환",
    "교훈",
    "구경",
    "구름",
    "구멍",
    "구별",
    "구분",
    "구석",
    "구성",
    "구속",
    "구역",
    "구입",
    "구청",
    "구체적",
    "국가",
    "국기",
    "국내",
    "국립",
    "국물",
    "국민",
    "국수",
    "국어",
    "국왕",
    "국적",
    "국제",
    "국회",
    "군대",
    "군사",
    "군인",
    "궁극적",
    "권리",
    "권위",
    "권투",
    "귀국",
    "귀신",
    "규정",
    "규칙",
    "균형",
    "그날",
    "그냥",
    "그늘",
    "그러나",
    "그룹",
    "그릇",
    "그림",
    "그제서야",
    "그토록",
    "극복",
    "극히",
    "근거",
    "근교",
    "근래",
    "근로",
    "근무",
    "근본",
    "근원",
    "근육",
    "근처",
    "글씨",
    "글자",
    "금강산",
    "금고",
    "금년",
    "금메달",
    "금액",
    "금연",
    "금요일",
    "금지",
    "긍정적",
    "기간",
    "기관",
    "기념",
    "기능",
    "기독교",
    "기둥",
    "기록",
    "기름",
    "기법",
    "기본",
    "기분",
    "기쁨",
    "기숙사",
    "기술",
    "기억",
    "기업",
    "기온",
    "기운",
    "기원",
    "기적",
    "기준",
    "기침",
    "기혼",
    "기획",
    "긴급",
    "긴장",
    "길이",
    "김밥",
    "김치",
    "김포공항",
    "깍두기",
    "깜빡",
    "깨달음",
    "깨소금",
    "껍질",
    "꼭대기",
    "꽃잎",
    "나들이",
    "나란히",
    "나머지",
    "나물",
    "나침반",
    "나흘",
    "낙엽",
    "난방",
    "날개",
    "날씨",
    "날짜",
    "남녀",
    "남대문",
    "남매",
    "남산",
    "남자",
    "남편",
    "남학생",
    "낭비",
    "낱말",
    "내년",
    "내용",
    "내일",
    "냄비",
    "냄새",
    "냇물",
    "냉동",
    "냉면",
    "냉방",
    "냉장고",
    "넥타이",
    "넷째",
    "노동",
    "노란색",
    "노력",
    "노인",
    "녹음",
    "녹차",
    "녹화",
    "논리",
    "논문",
    "논쟁",
    "놀이",
    "농구",
    "농담",
    "농민",
    "농부",
    "농업",
    "농장",
    "농촌",
    "높이",
    "눈동자",
    "눈물",
    "눈썹",
    "뉴욕",
    "느낌",
    "늑대",
    "능동적",
    "능력",
    "다방",
    "다양성",
    "다음",
    "다이어트",
    "다행",
    "단계",
    "단골",
    "단독",
    "단맛",
    "단순",
    "단어",
    "단위",
    "단점",
    "단체",
    "단추",
    "단편",
    "단풍",
    "달걀",
    "달러",
    "달력",
    "달리",
    "닭고기",
    "담당",
    "담배",
    "담요",
    "담임",
    "답변",
    "답장",
    "당근",
    "당분간",
    "당연히",
    "당장",
    "대규모",
    "대낮",
    "대단히",
    "대답",
    "대도시",
    "대략",
    "대량",
    "대륙",
    "대문",
    "대부분",
    "대신",
    "대응",
    "대장",
    "대전",
    "대접",
    "대중",
    "대책",
    "대출",
    "대충",
    "대통령",
    "대학",
    "대한민국",
    "대합실",
    "대형",
    "덩어리",
    "데이트",
    "도대체",
    "도덕",
    "도둑",
    "도망",
    "도서관",
    "도심",
    "도움",
    "도입",
    "도자기",
    "도저히",
    "도전",
    "도중",
    "도착",
    "독감",
    "독립",
    "독서",
    "독일",
    "독창적",
    "동화책",
    "뒷모습",
    "뒷산",
    "딸아이",
    "마누라",
    "마늘",
    "마당",
    "마라톤",
    "마련",
    "마무리",
    "마사지",
    "마약",
    "마요네즈",
    "마을",
    "마음",
    "마이크",
    "마중",
    "마지막",
    "마찬가지",
    "마찰",
    "마흔",
    "막걸리",
    "막내",
    "막상",
    "만남",
    "만두",
    "만세",
    "만약",
    "만일",
    "만점",
    "만족",
    "만화",
    "많이",
    "말기",
    "말씀",
    "말투",
    "맘대로",
    "망원경",
    "매년",
    "매달",
    "매력",
    "매번",
    "매스컴",
    "매일",
    "매장",
    "맥주",
    "먹이",
    "먼저",
    "먼지",
    "멀리",
    "메일",
    "며느리",
    "며칠",
    "면담",
    "멸치",
    "명단",
    "명령",
    "명예",
    "명의",
    "명절",
    "명칭",
    "명함",
    "모금",
    "모니터",
    "모델",
    "모든",
    "모범",
    "모습",
    "모양",
    "모임",
    "모조리",
    "모집",
    "모퉁이",
    "목걸이",
    "목록",
    "목사",
    "목소리",
    "목숨",
    "목적",
    "목표",
    "몰래",
    "몸매",
    "몸무게",
    "몸살",
    "몸속",
    "몸짓",
    "몸통",
    "몹시",
    "무관심",
    "무궁화",
    "무더위",
    "무덤",
    "무릎",
    "무슨",
    "무엇",
    "무역",
    "무용",
    "무조건",
    "무지개",
    "무척",
    "문구",
    "문득",
    "문법",
    "문서",
    "문제",
    "문학",
    "문화",
    "물가",
    "물건",
    "물결",
    "물고기",
    "물론",
    "물리학",
    "물음",
    "물질",
    "물체",
    "미국",
    "미디어",
    "미사일",
    "미술",
    "미역",
    "미용실",
    "미움",
    "미인",
    "미팅",
    "미혼",
    "민간",
    "민족",
    "민주",
    "믿음",
    "밀가루",
    "밀리미터",
    "밑바닥",
    "바가지",
    "바구니",
    "바나나",
    "바늘",
    "바닥",
    "바닷가",
    "바람",
    "바이러스",
    "바탕",
    "박물관",
    "박사",
    "박수",
    "반대",
    "반드시",
    "반말",
    "반발",
    "반성",
    "반응",
    "반장",
    "반죽",
    "반지",
    "반찬",
    "받침",
    "발가락",
    "발걸음",
    "발견",
    "발달",
    "발레",
    "발목",
    "발바닥",
    "발생",
    "발음",
    "발자국",
    "발전",
    "발톱",
    "발표",
    "밤하늘",
    "밥그릇",
    "밥맛",
    "밥상",
    "밥솥",
    "방금",
    "방면",
    "방문",
    "방바닥",
    "방법",
    "방송",
    "방식",
    "방안",
    "방울",
    "방지",
    "방학",
    "방해",
    "방향",
    "배경",
    "배꼽",
    "배달",
    "배드민턴",
    "백두산",
    "백색",
    "백성",
    "백인",
    "백제",
    "백화점",
    "버릇",
    "버섯",
    "버튼",
    "번개",
    "번역",
    "번지",
    "번호",
    "벌금",
    "벌레",
    "벌써",
    "범위",
    "범인",
    "범죄",
    "법률",
    "법원",
    "법적",
    "법칙",
    "베이징",
    "벨트",
    "변경",
    "변동",
    "변명",
    "변신",
    "변호사",
    "변화",
    "별도",
    "별명",
    "별일",
    "병실",
    "병아리",
    "병원",
    "보관",
    "보너스",
    "보라색",
    "보람",
    "보름",
    "보상",
    "보안",
    "보자기",
    "보장",
    "보전",
    "보존",
    "보통",
    "보편적",
    "보험",
    "복도",
    "복사",
    "복숭아",
    "복습",
    "볶음",
    "본격적",
    "본래",
    "본부",
    "본사",
    "본성",
    "본인",
    "본질",
    "볼펜",
    "봉사",
    "봉지",
    "봉투",
    "부근",
    "부끄러움",
    "부담",
    "부동산",
    "부문",
    "부분",
    "부산",
    "부상",
    "부엌",
    "부인",
    "부작용",
    "부장",
    "부정",
    "부족",
    "부지런히",
    "부친",
    "부탁",
    "부품",
    "부회장",
    "북부",
    "북한",
    "분노",
    "분량",
    "분리",
    "분명",
    "분석",
    "분야",
    "분위기",
    "분필",
    "분홍색",
    "불고기",
    "불과",
    "불교",
    "불꽃",
    "불만",
    "불법",
    "불빛",
    "불안",
    "불이익",
    "불행",
    "브랜드",
    "비극",
    "비난",
    "비닐",
    "비둘기",
    "비디오",
    "비로소",
    "비만",
    "비명",
    "비밀",
    "비바람",
    "비빔밥",
    "비상",
    "비용",
    "비율",
    "비중",
    "비타민",
    "비판",
    "빌딩",
    "빗물",
    "빗방울",
    "빗줄기",
    "빛깔",
    "빨간색",
    "빨래",
    "빨리",
    "사건",
    "사계절",
    "사나이",
    "사냥",
    "사람",
    "사랑",
    "사립",
    "사모님",
    "사물",
    "사방",
    "사상",
    "사생활",
    "사설",
    "사슴",
    "사실",
    "사업",
    "사용",
    "사월",
    "사장",
    "사전",
    "사진",
    "사촌",
    "사춘기",
    "사탕",
    "사투리",
    "사흘",
    "산길",
    "산부인과",
    "산업",
    "산책",
    "살림",
    "살인",
    "살짝",
    "삼계탕",
    "삼국",
    "삼십",
    "삼월",
    "삼촌",
    "상관",
    "상금",
    "상대",
    "상류",
    "상반기",
    "상상",
    "상식",
    "상업",
    "상인",
    "상자",
    "상점",
    "상처",
    "상추",
    "상태",
    "상표",
    "상품",
    "상황",
    "새벽",
    "색깔",
    "색연필",
    "생각",
    "생명",
    "생물",
    "생방송",
    "생산",
    "생선",
    "생신",
    "생일",
    "생활",
    "서랍",
    "서른",
    "서명",
    "서민",
    "서비스",
    "서양",
    "서울",
    "서적",
    "서점",
    "서쪽",
    "서클",
    "석사",
    "석유",
    "선거",
    "선물",
    "선배",
    "선생",
    "선수",
    "선원",
    "선장",
    "선전",
    "선택",
    "선풍기",
    "설거지",
    "설날",
    "설렁탕",
    "설명",
    "설문",
    "설사",
    "설악산",
    "설치",
    "설탕",
    "섭씨",
    "성공",
    "성당",
    "성명",
    "성별",
    "성인",
    "성장",
    "성적",
    "성질",
    "성함",
    "세금",
    "세미나",
    "세상",
    "세월",
    "세종대왕",
    "세탁",
    "센터",
    "센티미터",
    "셋째",
    "소규모",
    "소극적",
    "소금",
    "소나기",
    "소년",
    "소득",
    "소망",
    "소문",
    "소설",
    "소속",
    "소아과",
    "소용",
    "소원",
    "소음",
    "소중히",
    "소지품",
    "소질",
    "소풍",
    "소형",
    "속담",
    "속도",
    "속옷",
    "손가락",
    "손길",
    "손녀",
    "손님",
    "손등",
    "손목",
    "손뼉",
    "손실",
    "손질",
    "손톱",
    "손해",
    "솔직히",
    "솜씨",
    "송아지",
    "송이",
    "송편",
    "쇠고기",
    "쇼핑",
    "수건",
    "수년",
    "수단",
    "수돗물",
    "수동적",
    "수면",
    "수명",
    "수박",
    "수상",
    "수석",
    "수술",
    "수시로",
    "수업",
    "수염",
    "수영",
    "수입",
    "수준",
    "수집",
    "수출",
    "수컷",
    "수필",
    "수학",
    "수험생",
    "수화기",
    "숙녀",
    "숙소",
    "숙제",
    "순간",
    "순서",
    "순수",
    "순식간",
    "순위",
    "숟가락",
    "술병",
    "술집",
    "숫자",
    "스님",
    "스물",
    "스스로",
    "스승",
    "스웨터",
    "스위치",
    "스케이트",
    "스튜디오",
    "스트레스",
    "스포츠",
    "슬쩍",
    "슬픔",
    "습관",
    "습기",
    "승객",
    "승리",
    "승부",
    "승용차",
    "승진",
    "시각",
    "시간",
    "시골",
    "시금치",
    "시나리오",
    "시댁",
    "시리즈",
    "시멘트",
    "시민",
    "시부모",
    "시선",
    "시설",
    "시스템",
    "시아버지",
    "시어머니",
    "시월",
    "시인",
    "시일",
    "시작",
    "시장",
    "시절",
    "시점",
    "시중",
    "시즌",
    "시집",
    "시청",
    "시합",
    "시험",
    "식구",
    "식기",
    "식당",
    "식량",
    "식료품",
    "식물",
    "식빵",
    "식사",
    "식생활",
    "식초",
    "식탁",
    "식품",
    "신고",
    "신규",
    "신념",
    "신문",
    "신발",
    "신비",
    "신사",
    "신세",
    "신용",
    "신제품",
    "신청",
    "신체",
    "신화",
    "실감",
    "실내",
    "실력",
    "실례",
    "실망",
    "실수",
    "실습",
    "실시",
    "실장",
    "실정",
    "실질적",
    "실천",
    "실체",
    "실컷",
    "실태",
    "실패",
    "실험",
    "실현",
    "심리",
    "심부름",
    "심사",
    "심장",
    "심정",
    "심판",
    "쌍둥이",
    "씨름",
    "씨앗",
    "아가씨",
    "아나운서",
    "아드님",
    "아들",
    "아쉬움",
    "아스팔트",
    "아시아",
    "아울러",
    "아저씨",
    "아줌마",
    "아직",
    "아침",
    "아파트",
    "아프리카",
    "아픔",
    "아홉",
    "아흔",
    "악기",
    "악몽",
    "악수",
    "안개",
    "안경",
    "안과",
    "안내",
    "안녕",
    "안동",
    "안방",
    "안부",
    "안주",
    "알루미늄",
    "알코올",
    "암시",
    "암컷",
    "압력",
    "앞날",
    "앞문",
    "애인",
    "애정",
    "액수",
    "앨범",
    "야간",
    "야단",
    "야옹",
    "약간",
    "약국",
    "약속",
    "약수",
    "약점",
    "약품",
    "약혼녀",
    "양념",
    "양력",
    "양말",
    "양배추",
    "양주",
    "양파",
    "어둠",
    "어려움",
    "어른",
    "어젯밤",
    "어쨌든",
    "어쩌다가",
    "어쩐지",
    "언니",
    "언덕",
    "언론",
    "언어",
    "얼굴",
    "얼른",
    "얼음",
    "얼핏",
    "엄마",
    "업무",
    "업종",
    "업체",
    "엉덩이",
    "엉망",
    "엉터리",
    "엊그제",
    "에너지",
    "에어컨",
    "엔진",
    "여건",
    "여고생",
    "여관",
    "여군",
    "여권",
    "여대생",
    "여덟",
    "여동생",
    "여든",
    "여론",
    "여름",
    "여섯",
    "여성",
    "여왕",
    "여인",
    "여전히",
    "여직원",
    "여학생",
    "여행",
    "역사",
    "역시",
    "역할",
    "연결",
    "연구",
    "연극",
    "연기",
    "연락",
    "연설",
    "연세",
    "연속",
    "연습",
    "연애",
    "연예인",
    "연인",
    "연장",
    "연주",
    "연출",
    "연필",
    "연합",
    "연휴",
    "열기",
    "열매",
    "열쇠",
    "열심히",
    "열정",
    "열차",
    "열흘",
    "염려",
    "엽서",
    "영국",
    "영남",
    "영상",
    "영양",
    "영역",
    "영웅",
    "영원히",
    "영하",
    "영향",
    "영혼",
    "영화",
    "옆구리",
    "옆방",
    "옆집",
    "예감",
    "예금",
    "예방",
    "예산",
    "예상",
    "예선",
    "예술",
    "예습",
    "예식장",
    "예약",
    "예전",
    "예절",
    "예정",
    "예컨대",
    "옛날",
    "오늘",
    "오락",
    "오랫동안",
    "오렌지",
    "오로지",
    "오른발",
    "오븐",
    "오십",
    "오염",
    "오월",
    "오전",
    "오직",
    "오징어",
    "오페라",
    "오피스텔",
    "오히려",
    "옥상",
    "옥수수",
    "온갖",
    "온라인",
    "온몸",
    "온종일",
    "온통",
    "올가을",
    "올림픽",
    "올해",
    "옷차림",
    "와이셔츠",
    "와인",
    "완성",
    "완전",
    "왕비",
    "왕자",
    "왜냐하면",
    "왠지",
    "외갓집",
    "외국",
    "외로움",
    "외삼촌",
    "외출",
    "외침",
    "외할머니",
    "왼발",
    "왼손",
    "왼쪽",
    "요금",
    "요일",
    "요즘",
    "요청",
    "용기",
    "용서",
    "용어",
    "우산",
    "우선",
    "우승",
    "우연히",
    "우정",
    "우체국",
    "우편",
    "운동",
    "운명",
    "운반",
    "운전",
    "운행",
    "울산",
    "울음",
    "움직임",
    "웃어른",
    "웃음",
    "워낙",
    "원고",
    "원래",
    "원서",
    "원숭이",
    "원인",
    "원장",
    "원피스",
    "월급",
    "월드컵",
    "월세",
    "월요일",
    "웨이터",
    "위반",
    "위법",
    "위성",
    "위원",
    "위험",
    "위협",
    "윗사람",
    "유난히",
    "유럽",
    "유명",
    "유물",
    "유산",
    "유적",
    "유치원",
    "유학",
    "유행",
    "유형",
    "육군",
    "육상",
    "육십",
    "육체",
    "은행",
    "음력",
    "음료",
    "음반",
    "음성",
    "음식",
    "음악",
    "음주",
    "의견",
    "의논",
    "의문",
    "의복",
    "의식",
    "의심",
    "의외로",
    "의욕",
    "의원",
    "의학",
    "이것",
    "이곳",
    "이념",
    "이놈",
    "이달",
    "이대로",
    "이동",
    "이렇게",
    "이력서",
    "이론적",
    "이름",
    "이민",
    "이발소",
    "이별",
    "이불",
    "이빨",
    "이상",
    "이성",
    "이슬",
    "이야기",
    "이용",
    "이웃",
    "이월",
    "이윽고",
    "이익",
    "이전",
    "이중",
    "이튿날",
    "이틀",
    "이혼",
    "인간",
    "인격",
    "인공",
    "인구",
    "인근",
    "인기",
    "인도",
    "인류",
    "인물",
    "인생",
    "인쇄",
    "인연",
    "인원",
    "인재",
    "인종",
    "인천",
    "인체",
    "인터넷",
    "인하",
    "인형",
    "일곱",
    "일기",
    "일단",
    "일대",
    "일등",
    "일반",
    "일본",
    "일부",
    "일상",
    "일생",
    "일손",
    "일요일",
    "일월",
    "일정",
    "일종",
    "일주일",
    "일찍",
    "일체",
    "일치",
    "일행",
    "일회용",
    "임금",
    "임무",
    "입대",
    "입력",
    "입맛",
    "입사",
    "입술",
    "입시",
    "입원",
    "입장",
    "입학",
    "자가용",
    "자격",
    "자극",
    "자동",
    "자랑",
    "자부심",
    "자식",
    "자신",
    "자연",
    "자원",
    "자율",
    "자전거",
    "자정",
    "자존심",
    "자판",
    "작가",
    "작년",
    "작성",
    "작업",
    "작용",
    "작은딸",
    "작품",
    "잔디",
    "잔뜩",
    "잔치",
    "잘못",
    "잠깐",
    "잠수함",
    "잠시",
    "잠옷",
    "잠자리",
    "잡지",
    "장관",
    "장군",
    "장기간",
    "장래",
    "장례",
    "장르",
    "장마",
    "장면",
    "장모",
    "장미",
    "장비",
    "장사",
    "장소",
    "장식",
    "장애인",
    "장인",
    "장점",
    "장차",
    "장학금",
    "재능",
    "재빨리",
    "재산",
    "재생",
    "재작년",
    "재정",
    "재채기",
    "재판",
    "재학",
    "재활용",
    "저것",
    "저고리",
    "저곳",
    "저녁",
    "저런",
    "저렇게",
    "저번",
    "저울",
    "저절로",
    "저축",
    "적극",
    "적당히",
    "적성",
    "적용",
    "적응",
    "전개",
    "전공",
    "전기",
    "전달",
    "전라도",
    "전망",
    "전문",
    "전반",
    "전부",
    "전세",
    "전시",
    "전용",
    "전자",
    "전쟁",
    "전주",
    "전철",
    "전체",
    "전통",
    "전혀",
    "전후",
    "절대",
    "절망",
    "절반",
    "절약",
    "절차",
    "점검",
    "점수",
    "점심",
    "점원",
    "점점",
    "점차",
    "접근",
    "접시",
    "접촉",
    "젓가락",
    "정거장",
    "정도",
    "정류장",
    "정리",
    "정말",
    "정면",
    "정문",
    "정반대",
    "정보",
    "정부",
    "정비",
    "정상",
    "정성",
    "정오",
    "정원",
    "정장",
    "정지",
    "정치",
    "정확히",
    "제공",
    "제과점",
    "제대로",
    "제목",
    "제발",
    "제법",
    "제삿날",
    "제안",
    "제일",
    "제작",
    "제주도",
    "제출",
    "제품",
    "제한",
    "조각",
    "조건",
    "조금",
    "조깅",
    "조명",
    "조미료",
    "조상",
    "조선",
    "조용히",
    "조절",
    "조정",
    "조직",
    "존댓말",
    "존재",
    "졸업",
    "졸음",
    "종교",
    "종로",
    "종류",
    "종소리",
    "종업원",
    "종종",
    "종합",
    "좌석",
    "죄인",
    "주관적",
    "주름",
    "주말",
    "주머니",
    "주먹",
    "주문",
    "주민",
    "주방",
    "주변",
    "주식",
    "주인",
    "주일",
    "주장",
    "주전자",
    "주택",
    "준비",
    "줄거리",
    "줄기",
    "줄무늬",
    "중간",
    "중계방송",
    "중국",
    "중년",
    "중단",
    "중독",
    "중반",
    "중부",
    "중세",
    "중소기업",
    "중순",
    "중앙",
    "중요",
    "중학교",
    "즉석",
    "즉시",
    "즐거움",
    "증가",
    "증거",
    "증권",
    "증상",
    "증세",
    "지각",
    "지갑",
    "지경",
    "지극히",
    "지금",
    "지급",
    "지능",
    "지름길",
    "지리산",
    "지방",
    "지붕",
    "지식",
    "지역",
    "지우개",
    "지원",
    "지적",
    "지점",
    "지진",
    "지출",
    "직선",
    "직업",
    "직원",
    "직장",
    "진급",
    "진동",
    "진로",
    "진료",
    "진리",
    "진짜",
    "진찰",
    "진출",
    "진통",
    "진행",
    "질문",
    "질병",
    "질서",
    "짐작",
    "집단",
    "집안",
    "집중",
    "짜증",
    "찌꺼기",
    "차남",
    "차라리",
    "차량",
    "차림",
    "차별",
    "차선",
    "차츰",
    "착각",
    "찬물",
    "찬성",
    "참가",
    "참기름",
    "참새",
    "참석",
    "참여",
    "참외",
    "참조",
    "찻잔",
    "창가",
    "창고",
    "창구",
    "창문",
    "창밖",
    "창작",
    "창조",
    "채널",
    "채점",
    "책가방",
    "책방",
    "책상",
    "책임",
    "챔피언",
    "처벌",
    "처음",
    "천국",
    "천둥",
    "천장",
    "천재",
    "천천히",
    "철도",
    "철저히",
    "철학",
    "첫날",
    "첫째",
    "청년",
    "청바지",
    "청소",
    "청춘",
    "체계",
    "체력",
    "체온",
    "체육",
    "체중",
    "체험",
    "초등학생",
    "초반",
    "초밥",
    "초상화",
    "초순",
    "초여름",
    "초원",
    "초저녁",
    "초점",
    "초청",
    "초콜릿",
    "촛불",
    "총각",
    "총리",
    "총장",
    "촬영",
    "최근",
    "최상",
    "최선",
    "최신",
    "최악",
    "최종",
    "추석",
    "추억",
    "추진",
    "추천",
    "추측",
    "축구",
    "축소",
    "축제",
    "축하",
    "출근",
    "출발",
    "출산",
    "출신",
    "출연",
    "출입",
    "출장",
    "출판",
    "충격",
    "충고",
    "충돌",
    "충분히",
    "충청도",
    "취업",
    "취직",
    "취향",
    "치약",
    "친구",
    "친척",
    "칠십",
    "칠월",
    "칠판",
    "침대",
    "침묵",
    "침실",
    "칫솔",
    "칭찬",
    "카메라",
    "카운터",
    "칼국수",
    "캐릭터",
    "캠퍼스",
    "캠페인",
    "커튼",
    "컨디션",
    "컬러",
    "컴퓨터",
    "코끼리",
    "코미디",
    "콘서트",
    "콜라",
    "콤플렉스",
    "콩나물",
    "쾌감",
    "쿠데타",
    "크림",
    "큰길",
    "큰딸",
    "큰소리",
    "큰아들",
    "큰어머니",
    "큰일",
    "큰절",
    "클래식",
    "클럽",
    "킬로",
    "타입",
    "타자기",
    "탁구",
    "탁자",
    "탄생",
    "태권도",
    "태양",
    "태풍",
    "택시",
    "탤런트",
    "터널",
    "터미널",
    "테니스",
    "테스트",
    "테이블",
    "텔레비전",
    "토론",
    "토마토",
    "토요일",
    "통계",
    "통과",
    "통로",
    "통신",
    "통역",
    "통일",
    "통장",
    "통제",
    "통증",
    "통합",
    "통화",
    "퇴근",
    "퇴원",
    "퇴직금",
    "튀김",
    "트럭",
    "특급",
    "특별",
    "특성",
    "특수",
    "특징",
    "특히",
    "튼튼히",
    "티셔츠",
    "파란색",
    "파일",
    "파출소",
    "판결",
    "판단",
    "판매",
    "판사",
    "팔십",
    "팔월",
    "팝송",
    "패션",
    "팩스",
    "팩시밀리",
    "팬티",
    "퍼센트",
    "페인트",
    "편견",
    "편의",
    "편지",
    "편히",
    "평가",
    "평균",
    "평생",
    "평소",
    "평양",
    "평일",
    "평화",
    "포스터",
    "포인트",
    "포장",
    "포함",
    "표면",
    "표정",
    "표준",
    "표현",
    "품목",
    "품질",
    "풍경",
    "풍속",
    "풍습",
    "프랑스",
    "프린터",
    "플라스틱",
    "피곤",
    "피망",
    "피아노",
    "필름",
    "필수",
    "필요",
    "필자",
    "필통",
    "핑계",
    "하느님",
    "하늘",
    "하드웨어",
    "하룻밤",
    "하반기",
    "하숙집",
    "하순",
    "하여튼",
    "하지만",
    "하천",
    "하품",
    "하필",
    "학과",
    "학교",
    "학급",
    "학기",
    "학년",
    "학력",
    "학번",
    "학부모",
    "학비",
    "학생",
    "학술",
    "학습",
    "학용품",
    "학원",
    "학위",
    "학자",
    "학점",
    "한계",
    "한글",
    "한꺼번에",
    "한낮",
    "한눈",
    "한동안",
    "한때",
    "한라산",
    "한마디",
    "한문",
    "한번",
    "한복",
    "한식",
    "한여름",
    "한쪽",
    "할머니",
    "할아버지",
    "할인",
    "함께",
    "함부로",
    "합격",
    "합리적",
    "항공",
    "항구",
    "항상",
    "항의",
    "해결",
    "해군",
    "해답",
    "해당",
    "해물",
    "해석",
    "해설",
    "해수욕장",
    "해안",
    "핵심",
    "핸드백",
    "햄버거",
    "햇볕",
    "햇살",
    "행동",
    "행복",
    "행사",
    "행운",
    "행위",
    "향기",
    "향상",
    "향수",
    "허락",
    "허용",
    "헬기",
    "현관",
    "현금",
    "현대",
    "현상",
    "현실",
    "현장",
    "현재",
    "현지",
    "혈액",
    "협력",
    "형부",
    "형사",
    "형수",
    "형식",
    "형제",
    "형태",
    "형편",
    "혜택",
    "호기심",
    "호남",
    "호랑이",
    "호박",
    "호텔",
    "호흡",
    "혹시",
    "홀로",
    "홈페이지",
    "홍보",
    "홍수",
    "홍차",
    "화면",
    "화분",
    "화살",
    "화요일",
    "화장",
    "화학",
    "확보",
    "확인",
    "확장",
    "확정",
    "환갑",
    "환경",
    "환영",
    "환율",
    "환자",
    "활기",
    "활동",
    "활발히",
    "활용",
    "활짝",
    "회견",
    "회관",
    "회복",
    "회색",
    "회원",
    "회장",
    "회전",
    "횟수",
    "횡단보도",
    "효율적",
    "후반",
    "후춧가루",
    "훈련",
    "훨씬",
    "휴식",
    "휴일",
    "흉내",
    "흐름",
    "흑백",
    "흑인",
    "흔적",
    "흔히",
    "흥미",
    "흥분",
    "희곡",
    "희망",
    "희생",
    "흰색",
    "힘껏"
]

},{}],42:[function(require,module,exports){
module.exports=[
    "abacate",
    "abaixo",
    "abalar",
    "abater",
    "abduzir",
    "abelha",
    "aberto",
    "abismo",
    "abotoar",
    "abranger",
    "abreviar",
    "abrigar",
    "abrupto",
    "absinto",
    "absoluto",
    "absurdo",
    "abutre",
    "acabado",
    "acalmar",
    "acampar",
    "acanhar",
    "acaso",
    "aceitar",
    "acelerar",
    "acenar",
    "acervo",
    "acessar",
    "acetona",
    "achatar",
    "acidez",
    "acima",
    "acionado",
    "acirrar",
    "aclamar",
    "aclive",
    "acolhida",
    "acomodar",
    "acoplar",
    "acordar",
    "acumular",
    "acusador",
    "adaptar",
    "adega",
    "adentro",
    "adepto",
    "adequar",
    "aderente",
    "adesivo",
    "adeus",
    "adiante",
    "aditivo",
    "adjetivo",
    "adjunto",
    "admirar",
    "adorar",
    "adquirir",
    "adubo",
    "adverso",
    "advogado",
    "aeronave",
    "afastar",
    "aferir",
    "afetivo",
    "afinador",
    "afivelar",
    "aflito",
    "afluente",
    "afrontar",
    "agachar",
    "agarrar",
    "agasalho",
    "agenciar",
    "agilizar",
    "agiota",
    "agitado",
    "agora",
    "agradar",
    "agreste",
    "agrupar",
    "aguardar",
    "agulha",
    "ajoelhar",
    "ajudar",
    "ajustar",
    "alameda",
    "alarme",
    "alastrar",
    "alavanca",
    "albergue",
    "albino",
    "alcatra",
    "aldeia",
    "alecrim",
    "alegria",
    "alertar",
    "alface",
    "alfinete",
    "algum",
    "alheio",
    "aliar",
    "alicate",
    "alienar",
    "alinhar",
    "aliviar",
    "almofada",
    "alocar",
    "alpiste",
    "alterar",
    "altitude",
    "alucinar",
    "alugar",
    "aluno",
    "alusivo",
    "alvo",
    "amaciar",
    "amador",
    "amarelo",
    "amassar",
    "ambas",
    "ambiente",
    "ameixa",
    "amenizar",
    "amido",
    "amistoso",
    "amizade",
    "amolador",
    "amontoar",
    "amoroso",
    "amostra",
    "amparar",
    "ampliar",
    "ampola",
    "anagrama",
    "analisar",
    "anarquia",
    "anatomia",
    "andaime",
    "anel",
    "anexo",
    "angular",
    "animar",
    "anjo",
    "anomalia",
    "anotado",
    "ansioso",
    "anterior",
    "anuidade",
    "anunciar",
    "anzol",
    "apagador",
    "apalpar",
    "apanhado",
    "apego",
    "apelido",
    "apertada",
    "apesar",
    "apetite",
    "apito",
    "aplauso",
    "aplicada",
    "apoio",
    "apontar",
    "aposta",
    "aprendiz",
    "aprovar",
    "aquecer",
    "arame",
    "aranha",
    "arara",
    "arcada",
    "ardente",
    "areia",
    "arejar",
    "arenito",
    "aresta",
    "argiloso",
    "argola",
    "arma",
    "arquivo",
    "arraial",
    "arrebate",
    "arriscar",
    "arroba",
    "arrumar",
    "arsenal",
    "arterial",
    "artigo",
    "arvoredo",
    "asfaltar",
    "asilado",
    "aspirar",
    "assador",
    "assinar",
    "assoalho",
    "assunto",
    "astral",
    "atacado",
    "atadura",
    "atalho",
    "atarefar",
    "atear",
    "atender",
    "aterro",
    "ateu",
    "atingir",
    "atirador",
    "ativo",
    "atoleiro",
    "atracar",
    "atrevido",
    "atriz",
    "atual",
    "atum",
    "auditor",
    "aumentar",
    "aura",
    "aurora",
    "autismo",
    "autoria",
    "autuar",
    "avaliar",
    "avante",
    "avaria",
    "avental",
    "avesso",
    "aviador",
    "avisar",
    "avulso",
    "axila",
    "azarar",
    "azedo",
    "azeite",
    "azulejo",
    "babar",
    "babosa",
    "bacalhau",
    "bacharel",
    "bacia",
    "bagagem",
    "baiano",
    "bailar",
    "baioneta",
    "bairro",
    "baixista",
    "bajular",
    "baleia",
    "baliza",
    "balsa",
    "banal",
    "bandeira",
    "banho",
    "banir",
    "banquete",
    "barato",
    "barbado",
    "baronesa",
    "barraca",
    "barulho",
    "baseado",
    "bastante",
    "batata",
    "batedor",
    "batida",
    "batom",
    "batucar",
    "baunilha",
    "beber",
    "beijo",
    "beirada",
    "beisebol",
    "beldade",
    "beleza",
    "belga",
    "beliscar",
    "bendito",
    "bengala",
    "benzer",
    "berimbau",
    "berlinda",
    "berro",
    "besouro",
    "bexiga",
    "bezerro",
    "bico",
    "bicudo",
    "bienal",
    "bifocal",
    "bifurcar",
    "bigorna",
    "bilhete",
    "bimestre",
    "bimotor",
    "biologia",
    "biombo",
    "biosfera",
    "bipolar",
    "birrento",
    "biscoito",
    "bisneto",
    "bispo",
    "bissexto",
    "bitola",
    "bizarro",
    "blindado",
    "bloco",
    "bloquear",
    "boato",
    "bobagem",
    "bocado",
    "bocejo",
    "bochecha",
    "boicotar",
    "bolada",
    "boletim",
    "bolha",
    "bolo",
    "bombeiro",
    "bonde",
    "boneco",
    "bonita",
    "borbulha",
    "borda",
    "boreal",
    "borracha",
    "bovino",
    "boxeador",
    "branco",
    "brasa",
    "braveza",
    "breu",
    "briga",
    "brilho",
    "brincar",
    "broa",
    "brochura",
    "bronzear",
    "broto",
    "bruxo",
    "bucha",
    "budismo",
    "bufar",
    "bule",
    "buraco",
    "busca",
    "busto",
    "buzina",
    "cabana",
    "cabelo",
    "cabide",
    "cabo",
    "cabrito",
    "cacau",
    "cacetada",
    "cachorro",
    "cacique",
    "cadastro",
    "cadeado",
    "cafezal",
    "caiaque",
    "caipira",
    "caixote",
    "cajado",
    "caju",
    "calafrio",
    "calcular",
    "caldeira",
    "calibrar",
    "calmante",
    "calota",
    "camada",
    "cambista",
    "camisa",
    "camomila",
    "campanha",
    "camuflar",
    "canavial",
    "cancelar",
    "caneta",
    "canguru",
    "canhoto",
    "canivete",
    "canoa",
    "cansado",
    "cantar",
    "canudo",
    "capacho",
    "capela",
    "capinar",
    "capotar",
    "capricho",
    "captador",
    "capuz",
    "caracol",
    "carbono",
    "cardeal",
    "careca",
    "carimbar",
    "carneiro",
    "carpete",
    "carreira",
    "cartaz",
    "carvalho",
    "casaco",
    "casca",
    "casebre",
    "castelo",
    "casulo",
    "catarata",
    "cativar",
    "caule",
    "causador",
    "cautelar",
    "cavalo",
    "caverna",
    "cebola",
    "cedilha",
    "cegonha",
    "celebrar",
    "celular",
    "cenoura",
    "censo",
    "centeio",
    "cercar",
    "cerrado",
    "certeiro",
    "cerveja",
    "cetim",
    "cevada",
    "chacota",
    "chaleira",
    "chamado",
    "chapada",
    "charme",
    "chatice",
    "chave",
    "chefe",
    "chegada",
    "cheiro",
    "cheque",
    "chicote",
    "chifre",
    "chinelo",
    "chocalho",
    "chover",
    "chumbo",
    "chutar",
    "chuva",
    "cicatriz",
    "ciclone",
    "cidade",
    "cidreira",
    "ciente",
    "cigana",
    "cimento",
    "cinto",
    "cinza",
    "ciranda",
    "circuito",
    "cirurgia",
    "citar",
    "clareza",
    "clero",
    "clicar",
    "clone",
    "clube",
    "coado",
    "coagir",
    "cobaia",
    "cobertor",
    "cobrar",
    "cocada",
    "coelho",
    "coentro",
    "coeso",
    "cogumelo",
    "coibir",
    "coifa",
    "coiote",
    "colar",
    "coleira",
    "colher",
    "colidir",
    "colmeia",
    "colono",
    "coluna",
    "comando",
    "combinar",
    "comentar",
    "comitiva",
    "comover",
    "complexo",
    "comum",
    "concha",
    "condor",
    "conectar",
    "confuso",
    "congelar",
    "conhecer",
    "conjugar",
    "consumir",
    "contrato",
    "convite",
    "cooperar",
    "copeiro",
    "copiador",
    "copo",
    "coquetel",
    "coragem",
    "cordial",
    "corneta",
    "coronha",
    "corporal",
    "correio",
    "cortejo",
    "coruja",
    "corvo",
    "cosseno",
    "costela",
    "cotonete",
    "couro",
    "couve",
    "covil",
    "cozinha",
    "cratera",
    "cravo",
    "creche",
    "credor",
    "creme",
    "crer",
    "crespo",
    "criada",
    "criminal",
    "crioulo",
    "crise",
    "criticar",
    "crosta",
    "crua",
    "cruzeiro",
    "cubano",
    "cueca",
    "cuidado",
    "cujo",
    "culatra",
    "culminar",
    "culpar",
    "cultura",
    "cumprir",
    "cunhado",
    "cupido",
    "curativo",
    "curral",
    "cursar",
    "curto",
    "cuspir",
    "custear",
    "cutelo",
    "damasco",
    "datar",
    "debater",
    "debitar",
    "deboche",
    "debulhar",
    "decalque",
    "decimal",
    "declive",
    "decote",
    "decretar",
    "dedal",
    "dedicado",
    "deduzir",
    "defesa",
    "defumar",
    "degelo",
    "degrau",
    "degustar",
    "deitado",
    "deixar",
    "delator",
    "delegado",
    "delinear",
    "delonga",
    "demanda",
    "demitir",
    "demolido",
    "dentista",
    "depenado",
    "depilar",
    "depois",
    "depressa",
    "depurar",
    "deriva",
    "derramar",
    "desafio",
    "desbotar",
    "descanso",
    "desenho",
    "desfiado",
    "desgaste",
    "desigual",
    "deslize",
    "desmamar",
    "desova",
    "despesa",
    "destaque",
    "desviar",
    "detalhar",
    "detentor",
    "detonar",
    "detrito",
    "deusa",
    "dever",
    "devido",
    "devotado",
    "dezena",
    "diagrama",
    "dialeto",
    "didata",
    "difuso",
    "digitar",
    "dilatado",
    "diluente",
    "diminuir",
    "dinastia",
    "dinheiro",
    "diocese",
    "direto",
    "discreta",
    "disfarce",
    "disparo",
    "disquete",
    "dissipar",
    "distante",
    "ditador",
    "diurno",
    "diverso",
    "divisor",
    "divulgar",
    "dizer",
    "dobrador",
    "dolorido",
    "domador",
    "dominado",
    "donativo",
    "donzela",
    "dormente",
    "dorsal",
    "dosagem",
    "dourado",
    "doutor",
    "drenagem",
    "drible",
    "drogaria",
    "duelar",
    "duende",
    "dueto",
    "duplo",
    "duquesa",
    "durante",
    "duvidoso",
    "eclodir",
    "ecoar",
    "ecologia",
    "edificar",
    "edital",
    "educado",
    "efeito",
    "efetivar",
    "ejetar",
    "elaborar",
    "eleger",
    "eleitor",
    "elenco",
    "elevador",
    "eliminar",
    "elogiar",
    "embargo",
    "embolado",
    "embrulho",
    "embutido",
    "emenda",
    "emergir",
    "emissor",
    "empatia",
    "empenho",
    "empinado",
    "empolgar",
    "emprego",
    "empurrar",
    "emulador",
    "encaixe",
    "encenado",
    "enchente",
    "encontro",
    "endeusar",
    "endossar",
    "enfaixar",
    "enfeite",
    "enfim",
    "engajado",
    "engenho",
    "englobar",
    "engomado",
    "engraxar",
    "enguia",
    "enjoar",
    "enlatar",
    "enquanto",
    "enraizar",
    "enrolado",
    "enrugar",
    "ensaio",
    "enseada",
    "ensino",
    "ensopado",
    "entanto",
    "enteado",
    "entidade",
    "entortar",
    "entrada",
    "entulho",
    "envergar",
    "enviado",
    "envolver",
    "enxame",
    "enxerto",
    "enxofre",
    "enxuto",
    "epiderme",
    "equipar",
    "ereto",
    "erguido",
    "errata",
    "erva",
    "ervilha",
    "esbanjar",
    "esbelto",
    "escama",
    "escola",
    "escrita",
    "escuta",
    "esfinge",
    "esfolar",
    "esfregar",
    "esfumado",
    "esgrima",
    "esmalte",
    "espanto",
    "espelho",
    "espiga",
    "esponja",
    "espreita",
    "espumar",
    "esquerda",
    "estaca",
    "esteira",
    "esticar",
    "estofado",
    "estrela",
    "estudo",
    "esvaziar",
    "etanol",
    "etiqueta",
    "euforia",
    "europeu",
    "evacuar",
    "evaporar",
    "evasivo",
    "eventual",
    "evidente",
    "evoluir",
    "exagero",
    "exalar",
    "examinar",
    "exato",
    "exausto",
    "excesso",
    "excitar",
    "exclamar",
    "executar",
    "exemplo",
    "exibir",
    "exigente",
    "exonerar",
    "expandir",
    "expelir",
    "expirar",
    "explanar",
    "exposto",
    "expresso",
    "expulsar",
    "externo",
    "extinto",
    "extrato",
    "fabricar",
    "fabuloso",
    "faceta",
    "facial",
    "fada",
    "fadiga",
    "faixa",
    "falar",
    "falta",
    "familiar",
    "fandango",
    "fanfarra",
    "fantoche",
    "fardado",
    "farelo",
    "farinha",
    "farofa",
    "farpa",
    "fartura",
    "fatia",
    "fator",
    "favorita",
    "faxina",
    "fazenda",
    "fechado",
    "feijoada",
    "feirante",
    "felino",
    "feminino",
    "fenda",
    "feno",
    "fera",
    "feriado",
    "ferrugem",
    "ferver",
    "festejar",
    "fetal",
    "feudal",
    "fiapo",
    "fibrose",
    "ficar",
    "ficheiro",
    "figurado",
    "fileira",
    "filho",
    "filme",
    "filtrar",
    "firmeza",
    "fisgada",
    "fissura",
    "fita",
    "fivela",
    "fixador",
    "fixo",
    "flacidez",
    "flamingo",
    "flanela",
    "flechada",
    "flora",
    "flutuar",
    "fluxo",
    "focal",
    "focinho",
    "fofocar",
    "fogo",
    "foguete",
    "foice",
    "folgado",
    "folheto",
    "forjar",
    "formiga",
    "forno",
    "forte",
    "fosco",
    "fossa",
    "fragata",
    "fralda",
    "frango",
    "frasco",
    "fraterno",
    "freira",
    "frente",
    "fretar",
    "frieza",
    "friso",
    "fritura",
    "fronha",
    "frustrar",
    "fruteira",
    "fugir",
    "fulano",
    "fuligem",
    "fundar",
    "fungo",
    "funil",
    "furador",
    "furioso",
    "futebol",
    "gabarito",
    "gabinete",
    "gado",
    "gaiato",
    "gaiola",
    "gaivota",
    "galega",
    "galho",
    "galinha",
    "galocha",
    "ganhar",
    "garagem",
    "garfo",
    "gargalo",
    "garimpo",
    "garoupa",
    "garrafa",
    "gasoduto",
    "gasto",
    "gata",
    "gatilho",
    "gaveta",
    "gazela",
    "gelado",
    "geleia",
    "gelo",
    "gemada",
    "gemer",
    "gemido",
    "generoso",
    "gengiva",
    "genial",
    "genoma",
    "genro",
    "geologia",
    "gerador",
    "germinar",
    "gesso",
    "gestor",
    "ginasta",
    "gincana",
    "gingado",
    "girafa",
    "girino",
    "glacial",
    "glicose",
    "global",
    "glorioso",
    "goela",
    "goiaba",
    "golfe",
    "golpear",
    "gordura",
    "gorjeta",
    "gorro",
    "gostoso",
    "goteira",
    "governar",
    "gracejo",
    "gradual",
    "grafite",
    "gralha",
    "grampo",
    "granada",
    "gratuito",
    "graveto",
    "graxa",
    "grego",
    "grelhar",
    "greve",
    "grilo",
    "grisalho",
    "gritaria",
    "grosso",
    "grotesco",
    "grudado",
    "grunhido",
    "gruta",
    "guache",
    "guarani",
    "guaxinim",
    "guerrear",
    "guiar",
    "guincho",
    "guisado",
    "gula",
    "guloso",
    "guru",
    "habitar",
    "harmonia",
    "haste",
    "haver",
    "hectare",
    "herdar",
    "heresia",
    "hesitar",
    "hiato",
    "hibernar",
    "hidratar",
    "hiena",
    "hino",
    "hipismo",
    "hipnose",
    "hipoteca",
    "hoje",
    "holofote",
    "homem",
    "honesto",
    "honrado",
    "hormonal",
    "hospedar",
    "humorado",
    "iate",
    "ideia",
    "idoso",
    "ignorado",
    "igreja",
    "iguana",
    "ileso",
    "ilha",
    "iludido",
    "iluminar",
    "ilustrar",
    "imagem",
    "imediato",
    "imenso",
    "imersivo",
    "iminente",
    "imitador",
    "imortal",
    "impacto",
    "impedir",
    "implante",
    "impor",
    "imprensa",
    "impune",
    "imunizar",
    "inalador",
    "inapto",
    "inativo",
    "incenso",
    "inchar",
    "incidir",
    "incluir",
    "incolor",
    "indeciso",
    "indireto",
    "indutor",
    "ineficaz",
    "inerente",
    "infantil",
    "infestar",
    "infinito",
    "inflamar",
    "informal",
    "infrator",
    "ingerir",
    "inibido",
    "inicial",
    "inimigo",
    "injetar",
    "inocente",
    "inodoro",
    "inovador",
    "inox",
    "inquieto",
    "inscrito",
    "inseto",
    "insistir",
    "inspetor",
    "instalar",
    "insulto",
    "intacto",
    "integral",
    "intimar",
    "intocado",
    "intriga",
    "invasor",
    "inverno",
    "invicto",
    "invocar",
    "iogurte",
    "iraniano",
    "ironizar",
    "irreal",
    "irritado",
    "isca",
    "isento",
    "isolado",
    "isqueiro",
    "italiano",
    "janeiro",
    "jangada",
    "janta",
    "jararaca",
    "jardim",
    "jarro",
    "jasmim",
    "jato",
    "javali",
    "jazida",
    "jejum",
    "joaninha",
    "joelhada",
    "jogador",
    "joia",
    "jornal",
    "jorrar",
    "jovem",
    "juba",
    "judeu",
    "judoca",
    "juiz",
    "julgador",
    "julho",
    "jurado",
    "jurista",
    "juro",
    "justa",
    "labareda",
    "laboral",
    "lacre",
    "lactante",
    "ladrilho",
    "lagarta",
    "lagoa",
    "laje",
    "lamber",
    "lamentar",
    "laminar",
    "lampejo",
    "lanche",
    "lapidar",
    "lapso",
    "laranja",
    "lareira",
    "largura",
    "lasanha",
    "lastro",
    "lateral",
    "latido",
    "lavanda",
    "lavoura",
    "lavrador",
    "laxante",
    "lazer",
    "lealdade",
    "lebre",
    "legado",
    "legendar",
    "legista",
    "leigo",
    "leiloar",
    "leitura",
    "lembrete",
    "leme",
    "lenhador",
    "lentilha",
    "leoa",
    "lesma",
    "leste",
    "letivo",
    "letreiro",
    "levar",
    "leveza",
    "levitar",
    "liberal",
    "libido",
    "liderar",
    "ligar",
    "ligeiro",
    "limitar",
    "limoeiro",
    "limpador",
    "linda",
    "linear",
    "linhagem",
    "liquidez",
    "listagem",
    "lisura",
    "litoral",
    "livro",
    "lixa",
    "lixeira",
    "locador",
    "locutor",
    "lojista",
    "lombo",
    "lona",
    "longe",
    "lontra",
    "lorde",
    "lotado",
    "loteria",
    "loucura",
    "lousa",
    "louvar",
    "luar",
    "lucidez",
    "lucro",
    "luneta",
    "lustre",
    "lutador",
    "luva",
    "macaco",
    "macete",
    "machado",
    "macio",
    "madeira",
    "madrinha",
    "magnata",
    "magreza",
    "maior",
    "mais",
    "malandro",
    "malha",
    "malote",
    "maluco",
    "mamilo",
    "mamoeiro",
    "mamute",
    "manada",
    "mancha",
    "mandato",
    "manequim",
    "manhoso",
    "manivela",
    "manobrar",
    "mansa",
    "manter",
    "manusear",
    "mapeado",
    "maquinar",
    "marcador",
    "maresia",
    "marfim",
    "margem",
    "marinho",
    "marmita",
    "maroto",
    "marquise",
    "marreco",
    "martelo",
    "marujo",
    "mascote",
    "masmorra",
    "massagem",
    "mastigar",
    "matagal",
    "materno",
    "matinal",
    "matutar",
    "maxilar",
    "medalha",
    "medida",
    "medusa",
    "megafone",
    "meiga",
    "melancia",
    "melhor",
    "membro",
    "memorial",
    "menino",
    "menos",
    "mensagem",
    "mental",
    "merecer",
    "mergulho",
    "mesada",
    "mesclar",
    "mesmo",
    "mesquita",
    "mestre",
    "metade",
    "meteoro",
    "metragem",
    "mexer",
    "mexicano",
    "micro",
    "migalha",
    "migrar",
    "milagre",
    "milenar",
    "milhar",
    "mimado",
    "minerar",
    "minhoca",
    "ministro",
    "minoria",
    "miolo",
    "mirante",
    "mirtilo",
    "misturar",
    "mocidade",
    "moderno",
    "modular",
    "moeda",
    "moer",
    "moinho",
    "moita",
    "moldura",
    "moleza",
    "molho",
    "molinete",
    "molusco",
    "montanha",
    "moqueca",
    "morango",
    "morcego",
    "mordomo",
    "morena",
    "mosaico",
    "mosquete",
    "mostarda",
    "motel",
    "motim",
    "moto",
    "motriz",
    "muda",
    "muito",
    "mulata",
    "mulher",
    "multar",
    "mundial",
    "munido",
    "muralha",
    "murcho",
    "muscular",
    "museu",
    "musical",
    "nacional",
    "nadador",
    "naja",
    "namoro",
    "narina",
    "narrado",
    "nascer",
    "nativa",
    "natureza",
    "navalha",
    "navegar",
    "navio",
    "neblina",
    "nebuloso",
    "negativa",
    "negociar",
    "negrito",
    "nervoso",
    "neta",
    "neural",
    "nevasca",
    "nevoeiro",
    "ninar",
    "ninho",
    "nitidez",
    "nivelar",
    "nobreza",
    "noite",
    "noiva",
    "nomear",
    "nominal",
    "nordeste",
    "nortear",
    "notar",
    "noticiar",
    "noturno",
    "novelo",
    "novilho",
    "novo",
    "nublado",
    "nudez",
    "numeral",
    "nupcial",
    "nutrir",
    "nuvem",
    "obcecado",
    "obedecer",
    "objetivo",
    "obrigado",
    "obscuro",
    "obstetra",
    "obter",
    "obturar",
    "ocidente",
    "ocioso",
    "ocorrer",
    "oculista",
    "ocupado",
    "ofegante",
    "ofensiva",
    "oferenda",
    "oficina",
    "ofuscado",
    "ogiva",
    "olaria",
    "oleoso",
    "olhar",
    "oliveira",
    "ombro",
    "omelete",
    "omisso",
    "omitir",
    "ondulado",
    "oneroso",
    "ontem",
    "opcional",
    "operador",
    "oponente",
    "oportuno",
    "oposto",
    "orar",
    "orbitar",
    "ordem",
    "ordinal",
    "orfanato",
    "orgasmo",
    "orgulho",
    "oriental",
    "origem",
    "oriundo",
    "orla",
    "ortodoxo",
    "orvalho",
    "oscilar",
    "ossada",
    "osso",
    "ostentar",
    "otimismo",
    "ousadia",
    "outono",
    "outubro",
    "ouvido",
    "ovelha",
    "ovular",
    "oxidar",
    "oxigenar",
    "pacato",
    "paciente",
    "pacote",
    "pactuar",
    "padaria",
    "padrinho",
    "pagar",
    "pagode",
    "painel",
    "pairar",
    "paisagem",
    "palavra",
    "palestra",
    "palheta",
    "palito",
    "palmada",
    "palpitar",
    "pancada",
    "panela",
    "panfleto",
    "panqueca",
    "pantanal",
    "papagaio",
    "papelada",
    "papiro",
    "parafina",
    "parcial",
    "pardal",
    "parede",
    "partida",
    "pasmo",
    "passado",
    "pastel",
    "patamar",
    "patente",
    "patinar",
    "patrono",
    "paulada",
    "pausar",
    "peculiar",
    "pedalar",
    "pedestre",
    "pediatra",
    "pedra",
    "pegada",
    "peitoral",
    "peixe",
    "pele",
    "pelicano",
    "penca",
    "pendurar",
    "peneira",
    "penhasco",
    "pensador",
    "pente",
    "perceber",
    "perfeito",
    "pergunta",
    "perito",
    "permitir",
    "perna",
    "perplexo",
    "persiana",
    "pertence",
    "peruca",
    "pescado",
    "pesquisa",
    "pessoa",
    "petiscar",
    "piada",
    "picado",
    "piedade",
    "pigmento",
    "pilastra",
    "pilhado",
    "pilotar",
    "pimenta",
    "pincel",
    "pinguim",
    "pinha",
    "pinote",
    "pintar",
    "pioneiro",
    "pipoca",
    "piquete",
    "piranha",
    "pires",
    "pirueta",
    "piscar",
    "pistola",
    "pitanga",
    "pivete",
    "planta",
    "plaqueta",
    "platina",
    "plebeu",
    "plumagem",
    "pluvial",
    "pneu",
    "poda",
    "poeira",
    "poetisa",
    "polegada",
    "policiar",
    "poluente",
    "polvilho",
    "pomar",
    "pomba",
    "ponderar",
    "pontaria",
    "populoso",
    "porta",
    "possuir",
    "postal",
    "pote",
    "poupar",
    "pouso",
    "povoar",
    "praia",
    "prancha",
    "prato",
    "praxe",
    "prece",
    "predador",
    "prefeito",
    "premiar",
    "prensar",
    "preparar",
    "presilha",
    "pretexto",
    "prevenir",
    "prezar",
    "primata",
    "princesa",
    "prisma",
    "privado",
    "processo",
    "produto",
    "profeta",
    "proibido",
    "projeto",
    "prometer",
    "propagar",
    "prosa",
    "protetor",
    "provador",
    "publicar",
    "pudim",
    "pular",
    "pulmonar",
    "pulseira",
    "punhal",
    "punir",
    "pupilo",
    "pureza",
    "puxador",
    "quadra",
    "quantia",
    "quarto",
    "quase",
    "quebrar",
    "queda",
    "queijo",
    "quente",
    "querido",
    "quimono",
    "quina",
    "quiosque",
    "rabanada",
    "rabisco",
    "rachar",
    "racionar",
    "radial",
    "raiar",
    "rainha",
    "raio",
    "raiva",
    "rajada",
    "ralado",
    "ramal",
    "ranger",
    "ranhura",
    "rapadura",
    "rapel",
    "rapidez",
    "raposa",
    "raquete",
    "raridade",
    "rasante",
    "rascunho",
    "rasgar",
    "raspador",
    "rasteira",
    "rasurar",
    "ratazana",
    "ratoeira",
    "realeza",
    "reanimar",
    "reaver",
    "rebaixar",
    "rebelde",
    "rebolar",
    "recado",
    "recente",
    "recheio",
    "recibo",
    "recordar",
    "recrutar",
    "recuar",
    "rede",
    "redimir",
    "redonda",
    "reduzida",
    "reenvio",
    "refinar",
    "refletir",
    "refogar",
    "refresco",
    "refugiar",
    "regalia",
    "regime",
    "regra",
    "reinado",
    "reitor",
    "rejeitar",
    "relativo",
    "remador",
    "remendo",
    "remorso",
    "renovado",
    "reparo",
    "repelir",
    "repleto",
    "repolho",
    "represa",
    "repudiar",
    "requerer",
    "resenha",
    "resfriar",
    "resgatar",
    "residir",
    "resolver",
    "respeito",
    "ressaca",
    "restante",
    "resumir",
    "retalho",
    "reter",
    "retirar",
    "retomada",
    "retratar",
    "revelar",
    "revisor",
    "revolta",
    "riacho",
    "rica",
    "rigidez",
    "rigoroso",
    "rimar",
    "ringue",
    "risada",
    "risco",
    "risonho",
    "robalo",
    "rochedo",
    "rodada",
    "rodeio",
    "rodovia",
    "roedor",
    "roleta",
    "romano",
    "roncar",
    "rosado",
    "roseira",
    "rosto",
    "rota",
    "roteiro",
    "rotina",
    "rotular",
    "rouco",
    "roupa",
    "roxo",
    "rubro",
    "rugido",
    "rugoso",
    "ruivo",
    "rumo",
    "rupestre",
    "russo",
    "sabor",
    "saciar",
    "sacola",
    "sacudir",
    "sadio",
    "safira",
    "saga",
    "sagrada",
    "saibro",
    "salada",
    "saleiro",
    "salgado",
    "saliva",
    "salpicar",
    "salsicha",
    "saltar",
    "salvador",
    "sambar",
    "samurai",
    "sanar",
    "sanfona",
    "sangue",
    "sanidade",
    "sapato",
    "sarda",
    "sargento",
    "sarjeta",
    "saturar",
    "saudade",
    "saxofone",
    "sazonal",
    "secar",
    "secular",
    "seda",
    "sedento",
    "sediado",
    "sedoso",
    "sedutor",
    "segmento",
    "segredo",
    "segundo",
    "seiva",
    "seleto",
    "selvagem",
    "semanal",
    "semente",
    "senador",
    "senhor",
    "sensual",
    "sentado",
    "separado",
    "sereia",
    "seringa",
    "serra",
    "servo",
    "setembro",
    "setor",
    "sigilo",
    "silhueta",
    "silicone",
    "simetria",
    "simpatia",
    "simular",
    "sinal",
    "sincero",
    "singular",
    "sinopse",
    "sintonia",
    "sirene",
    "siri",
    "situado",
    "soberano",
    "sobra",
    "socorro",
    "sogro",
    "soja",
    "solda",
    "soletrar",
    "solteiro",
    "sombrio",
    "sonata",
    "sondar",
    "sonegar",
    "sonhador",
    "sono",
    "soprano",
    "soquete",
    "sorrir",
    "sorteio",
    "sossego",
    "sotaque",
    "soterrar",
    "sovado",
    "sozinho",
    "suavizar",
    "subida",
    "submerso",
    "subsolo",
    "subtrair",
    "sucata",
    "sucesso",
    "suco",
    "sudeste",
    "sufixo",
    "sugador",
    "sugerir",
    "sujeito",
    "sulfato",
    "sumir",
    "suor",
    "superior",
    "suplicar",
    "suposto",
    "suprimir",
    "surdina",
    "surfista",
    "surpresa",
    "surreal",
    "surtir",
    "suspiro",
    "sustento",
    "tabela",
    "tablete",
    "tabuada",
    "tacho",
    "tagarela",
    "talher",
    "talo",
    "talvez",
    "tamanho",
    "tamborim",
    "tampa",
    "tangente",
    "tanto",
    "tapar",
    "tapioca",
    "tardio",
    "tarefa",
    "tarja",
    "tarraxa",
    "tatuagem",
    "taurino",
    "taxativo",
    "taxista",
    "teatral",
    "tecer",
    "tecido",
    "teclado",
    "tedioso",
    "teia",
    "teimar",
    "telefone",
    "telhado",
    "tempero",
    "tenente",
    "tensor",
    "tentar",
    "termal",
    "terno",
    "terreno",
    "tese",
    "tesoura",
    "testado",
    "teto",
    "textura",
    "texugo",
    "tiara",
    "tigela",
    "tijolo",
    "timbrar",
    "timidez",
    "tingido",
    "tinteiro",
    "tiragem",
    "titular",
    "toalha",
    "tocha",
    "tolerar",
    "tolice",
    "tomada",
    "tomilho",
    "tonel",
    "tontura",
    "topete",
    "tora",
    "torcido",
    "torneio",
    "torque",
    "torrada",
    "torto",
    "tostar",
    "touca",
    "toupeira",
    "toxina",
    "trabalho",
    "tracejar",
    "tradutor",
    "trafegar",
    "trajeto",
    "trama",
    "trancar",
    "trapo",
    "traseiro",
    "tratador",
    "travar",
    "treino",
    "tremer",
    "trepidar",
    "trevo",
    "triagem",
    "tribo",
    "triciclo",
    "tridente",
    "trilogia",
    "trindade",
    "triplo",
    "triturar",
    "triunfal",
    "trocar",
    "trombeta",
    "trova",
    "trunfo",
    "truque",
    "tubular",
    "tucano",
    "tudo",
    "tulipa",
    "tupi",
    "turbo",
    "turma",
    "turquesa",
    "tutelar",
    "tutorial",
    "uivar",
    "umbigo",
    "unha",
    "unidade",
    "uniforme",
    "urologia",
    "urso",
    "urtiga",
    "urubu",
    "usado",
    "usina",
    "usufruir",
    "vacina",
    "vadiar",
    "vagaroso",
    "vaidoso",
    "vala",
    "valente",
    "validade",
    "valores",
    "vantagem",
    "vaqueiro",
    "varanda",
    "vareta",
    "varrer",
    "vascular",
    "vasilha",
    "vassoura",
    "vazar",
    "vazio",
    "veado",
    "vedar",
    "vegetar",
    "veicular",
    "veleiro",
    "velhice",
    "veludo",
    "vencedor",
    "vendaval",
    "venerar",
    "ventre",
    "verbal",
    "verdade",
    "vereador",
    "vergonha",
    "vermelho",
    "verniz",
    "versar",
    "vertente",
    "vespa",
    "vestido",
    "vetorial",
    "viaduto",
    "viagem",
    "viajar",
    "viatura",
    "vibrador",
    "videira",
    "vidraria",
    "viela",
    "viga",
    "vigente",
    "vigiar",
    "vigorar",
    "vilarejo",
    "vinco",
    "vinheta",
    "vinil",
    "violeta",
    "virada",
    "virtude",
    "visitar",
    "visto",
    "vitral",
    "viveiro",
    "vizinho",
    "voador",
    "voar",
    "vogal",
    "volante",
    "voleibol",
    "voltagem",
    "volumoso",
    "vontade",
    "vulto",
    "vuvuzela",
    "xadrez",
    "xarope",
    "xeque",
    "xeretar",
    "xerife",
    "xingar",
    "zangado",
    "zarpar",
    "zebu",
    "zelador",
    "zombar",
    "zoologia",
    "zumbido"
]

},{}],43:[function(require,module,exports){
module.exports=[
    "ábaco",
    "abdomen",
    "abeja",
    "abierto",
    "abogado",
    "abono",
    "aborto",
    "abrazo",
    "abrir",
    "abuelo",
    "abuso",
    "acabar",
    "academia",
    "acceso",
    "acción",
    "aceite",
    "acelga",
    "acento",
    "aceptar",
    "ácido",
    "aclarar",
    "acné",
    "acoger",
    "acoso",
    "activo",
    "acto",
    "actriz",
    "actuar",
    "acudir",
    "acuerdo",
    "acusar",
    "adicto",
    "admitir",
    "adoptar",
    "adorno",
    "aduana",
    "adulto",
    "aéreo",
    "afectar",
    "afición",
    "afinar",
    "afirmar",
    "ágil",
    "agitar",
    "agonía",
    "agosto",
    "agotar",
    "agregar",
    "agrio",
    "agua",
    "agudo",
    "águila",
    "aguja",
    "ahogo",
    "ahorro",
    "aire",
    "aislar",
    "ajedrez",
    "ajeno",
    "ajuste",
    "alacrán",
    "alambre",
    "alarma",
    "alba",
    "álbum",
    "alcalde",
    "aldea",
    "alegre",
    "alejar",
    "alerta",
    "aleta",
    "alfiler",
    "alga",
    "algodón",
    "aliado",
    "aliento",
    "alivio",
    "alma",
    "almeja",
    "almíbar",
    "altar",
    "alteza",
    "altivo",
    "alto",
    "altura",
    "alumno",
    "alzar",
    "amable",
    "amante",
    "amapola",
    "amargo",
    "amasar",
    "ámbar",
    "ámbito",
    "ameno",
    "amigo",
    "amistad",
    "amor",
    "amparo",
    "amplio",
    "ancho",
    "anciano",
    "ancla",
    "andar",
    "andén",
    "anemia",
    "ángulo",
    "anillo",
    "ánimo",
    "anís",
    "anotar",
    "antena",
    "antiguo",
    "antojo",
    "anual",
    "anular",
    "anuncio",
    "añadir",
    "añejo",
    "año",
    "apagar",
    "aparato",
    "apetito",
    "apio",
    "aplicar",
    "apodo",
    "aporte",
    "apoyo",
    "aprender",
    "aprobar",
    "apuesta",
    "apuro",
    "arado",
    "araña",
    "arar",
    "árbitro",
    "árbol",
    "arbusto",
    "archivo",
    "arco",
    "arder",
    "ardilla",
    "arduo",
    "área",
    "árido",
    "aries",
    "armonía",
    "arnés",
    "aroma",
    "arpa",
    "arpón",
    "arreglo",
    "arroz",
    "arruga",
    "arte",
    "artista",
    "asa",
    "asado",
    "asalto",
    "ascenso",
    "asegurar",
    "aseo",
    "asesor",
    "asiento",
    "asilo",
    "asistir",
    "asno",
    "asombro",
    "áspero",
    "astilla",
    "astro",
    "astuto",
    "asumir",
    "asunto",
    "atajo",
    "ataque",
    "atar",
    "atento",
    "ateo",
    "ático",
    "atleta",
    "átomo",
    "atraer",
    "atroz",
    "atún",
    "audaz",
    "audio",
    "auge",
    "aula",
    "aumento",
    "ausente",
    "autor",
    "aval",
    "avance",
    "avaro",
    "ave",
    "avellana",
    "avena",
    "avestruz",
    "avión",
    "aviso",
    "ayer",
    "ayuda",
    "ayuno",
    "azafrán",
    "azar",
    "azote",
    "azúcar",
    "azufre",
    "azul",
    "baba",
    "babor",
    "bache",
    "bahía",
    "baile",
    "bajar",
    "balanza",
    "balcón",
    "balde",
    "bambú",
    "banco",
    "banda",
    "baño",
    "barba",
    "barco",
    "barniz",
    "barro",
    "báscula",
    "bastón",
    "basura",
    "batalla",
    "batería",
    "batir",
    "batuta",
    "baúl",
    "bazar",
    "bebé",
    "bebida",
    "bello",
    "besar",
    "beso",
    "bestia",
    "bicho",
    "bien",
    "bingo",
    "blanco",
    "bloque",
    "blusa",
    "boa",
    "bobina",
    "bobo",
    "boca",
    "bocina",
    "boda",
    "bodega",
    "boina",
    "bola",
    "bolero",
    "bolsa",
    "bomba",
    "bondad",
    "bonito",
    "bono",
    "bonsái",
    "borde",
    "borrar",
    "bosque",
    "bote",
    "botín",
    "bóveda",
    "bozal",
    "bravo",
    "brazo",
    "brecha",
    "breve",
    "brillo",
    "brinco",
    "brisa",
    "broca",
    "broma",
    "bronce",
    "brote",
    "bruja",
    "brusco",
    "bruto",
    "buceo",
    "bucle",
    "bueno",
    "buey",
    "bufanda",
    "bufón",
    "búho",
    "buitre",
    "bulto",
    "burbuja",
    "burla",
    "burro",
    "buscar",
    "butaca",
    "buzón",
    "caballo",
    "cabeza",
    "cabina",
    "cabra",
    "cacao",
    "cadáver",
    "cadena",
    "caer",
    "café",
    "caída",
    "caimán",
    "caja",
    "cajón",
    "cal",
    "calamar",
    "calcio",
    "caldo",
    "calidad",
    "calle",
    "calma",
    "calor",
    "calvo",
    "cama",
    "cambio",
    "camello",
    "camino",
    "campo",
    "cáncer",
    "candil",
    "canela",
    "canguro",
    "canica",
    "canto",
    "caña",
    "cañón",
    "caoba",
    "caos",
    "capaz",
    "capitán",
    "capote",
    "captar",
    "capucha",
    "cara",
    "carbón",
    "cárcel",
    "careta",
    "carga",
    "cariño",
    "carne",
    "carpeta",
    "carro",
    "carta",
    "casa",
    "casco",
    "casero",
    "caspa",
    "castor",
    "catorce",
    "catre",
    "caudal",
    "causa",
    "cazo",
    "cebolla",
    "ceder",
    "cedro",
    "celda",
    "célebre",
    "celoso",
    "célula",
    "cemento",
    "ceniza",
    "centro",
    "cerca",
    "cerdo",
    "cereza",
    "cero",
    "cerrar",
    "certeza",
    "césped",
    "cetro",
    "chacal",
    "chaleco",
    "champú",
    "chancla",
    "chapa",
    "charla",
    "chico",
    "chiste",
    "chivo",
    "choque",
    "choza",
    "chuleta",
    "chupar",
    "ciclón",
    "ciego",
    "cielo",
    "cien",
    "cierto",
    "cifra",
    "cigarro",
    "cima",
    "cinco",
    "cine",
    "cinta",
    "ciprés",
    "circo",
    "ciruela",
    "cisne",
    "cita",
    "ciudad",
    "clamor",
    "clan",
    "claro",
    "clase",
    "clave",
    "cliente",
    "clima",
    "clínica",
    "cobre",
    "cocción",
    "cochino",
    "cocina",
    "coco",
    "código",
    "codo",
    "cofre",
    "coger",
    "cohete",
    "cojín",
    "cojo",
    "cola",
    "colcha",
    "colegio",
    "colgar",
    "colina",
    "collar",
    "colmo",
    "columna",
    "combate",
    "comer",
    "comida",
    "cómodo",
    "compra",
    "conde",
    "conejo",
    "conga",
    "conocer",
    "consejo",
    "contar",
    "copa",
    "copia",
    "corazón",
    "corbata",
    "corcho",
    "cordón",
    "corona",
    "correr",
    "coser",
    "cosmos",
    "costa",
    "cráneo",
    "cráter",
    "crear",
    "crecer",
    "creído",
    "crema",
    "cría",
    "crimen",
    "cripta",
    "crisis",
    "cromo",
    "crónica",
    "croqueta",
    "crudo",
    "cruz",
    "cuadro",
    "cuarto",
    "cuatro",
    "cubo",
    "cubrir",
    "cuchara",
    "cuello",
    "cuento",
    "cuerda",
    "cuesta",
    "cueva",
    "cuidar",
    "culebra",
    "culpa",
    "culto",
    "cumbre",
    "cumplir",
    "cuna",
    "cuneta",
    "cuota",
    "cupón",
    "cúpula",
    "curar",
    "curioso",
    "curso",
    "curva",
    "cutis",
    "dama",
    "danza",
    "dar",
    "dardo",
    "dátil",
    "deber",
    "débil",
    "década",
    "decir",
    "dedo",
    "defensa",
    "definir",
    "dejar",
    "delfín",
    "delgado",
    "delito",
    "demora",
    "denso",
    "dental",
    "deporte",
    "derecho",
    "derrota",
    "desayuno",
    "deseo",
    "desfile",
    "desnudo",
    "destino",
    "desvío",
    "detalle",
    "detener",
    "deuda",
    "día",
    "diablo",
    "diadema",
    "diamante",
    "diana",
    "diario",
    "dibujo",
    "dictar",
    "diente",
    "dieta",
    "diez",
    "difícil",
    "digno",
    "dilema",
    "diluir",
    "dinero",
    "directo",
    "dirigir",
    "disco",
    "diseño",
    "disfraz",
    "diva",
    "divino",
    "doble",
    "doce",
    "dolor",
    "domingo",
    "don",
    "donar",
    "dorado",
    "dormir",
    "dorso",
    "dos",
    "dosis",
    "dragón",
    "droga",
    "ducha",
    "duda",
    "duelo",
    "dueño",
    "dulce",
    "dúo",
    "duque",
    "durar",
    "dureza",
    "duro",
    "ébano",
    "ebrio",
    "echar",
    "eco",
    "ecuador",
    "edad",
    "edición",
    "edificio",
    "editor",
    "educar",
    "efecto",
    "eficaz",
    "eje",
    "ejemplo",
    "elefante",
    "elegir",
    "elemento",
    "elevar",
    "elipse",
    "élite",
    "elixir",
    "elogio",
    "eludir",
    "embudo",
    "emitir",
    "emoción",
    "empate",
    "empeño",
    "empleo",
    "empresa",
    "enano",
    "encargo",
    "enchufe",
    "encía",
    "enemigo",
    "enero",
    "enfado",
    "enfermo",
    "engaño",
    "enigma",
    "enlace",
    "enorme",
    "enredo",
    "ensayo",
    "enseñar",
    "entero",
    "entrar",
    "envase",
    "envío",
    "época",
    "equipo",
    "erizo",
    "escala",
    "escena",
    "escolar",
    "escribir",
    "escudo",
    "esencia",
    "esfera",
    "esfuerzo",
    "espada",
    "espejo",
    "espía",
    "esposa",
    "espuma",
    "esquí",
    "estar",
    "este",
    "estilo",
    "estufa",
    "etapa",
    "eterno",
    "ética",
    "etnia",
    "evadir",
    "evaluar",
    "evento",
    "evitar",
    "exacto",
    "examen",
    "exceso",
    "excusa",
    "exento",
    "exigir",
    "exilio",
    "existir",
    "éxito",
    "experto",
    "explicar",
    "exponer",
    "extremo",
    "fábrica",
    "fábula",
    "fachada",
    "fácil",
    "factor",
    "faena",
    "faja",
    "falda",
    "fallo",
    "falso",
    "faltar",
    "fama",
    "familia",
    "famoso",
    "faraón",
    "farmacia",
    "farol",
    "farsa",
    "fase",
    "fatiga",
    "fauna",
    "favor",
    "fax",
    "febrero",
    "fecha",
    "feliz",
    "feo",
    "feria",
    "feroz",
    "fértil",
    "fervor",
    "festín",
    "fiable",
    "fianza",
    "fiar",
    "fibra",
    "ficción",
    "ficha",
    "fideo",
    "fiebre",
    "fiel",
    "fiera",
    "fiesta",
    "figura",
    "fijar",
    "fijo",
    "fila",
    "filete",
    "filial",
    "filtro",
    "fin",
    "finca",
    "fingir",
    "finito",
    "firma",
    "flaco",
    "flauta",
    "flecha",
    "flor",
    "flota",
    "fluir",
    "flujo",
    "flúor",
    "fobia",
    "foca",
    "fogata",
    "fogón",
    "folio",
    "folleto",
    "fondo",
    "forma",
    "forro",
    "fortuna",
    "forzar",
    "fosa",
    "foto",
    "fracaso",
    "frágil",
    "franja",
    "frase",
    "fraude",
    "freír",
    "freno",
    "fresa",
    "frío",
    "frito",
    "fruta",
    "fuego",
    "fuente",
    "fuerza",
    "fuga",
    "fumar",
    "función",
    "funda",
    "furgón",
    "furia",
    "fusil",
    "fútbol",
    "futuro",
    "gacela",
    "gafas",
    "gaita",
    "gajo",
    "gala",
    "galería",
    "gallo",
    "gamba",
    "ganar",
    "gancho",
    "ganga",
    "ganso",
    "garaje",
    "garza",
    "gasolina",
    "gastar",
    "gato",
    "gavilán",
    "gemelo",
    "gemir",
    "gen",
    "género",
    "genio",
    "gente",
    "geranio",
    "gerente",
    "germen",
    "gesto",
    "gigante",
    "gimnasio",
    "girar",
    "giro",
    "glaciar",
    "globo",
    "gloria",
    "gol",
    "golfo",
    "goloso",
    "golpe",
    "goma",
    "gordo",
    "gorila",
    "gorra",
    "gota",
    "goteo",
    "gozar",
    "grada",
    "gráfico",
    "grano",
    "grasa",
    "gratis",
    "grave",
    "grieta",
    "grillo",
    "gripe",
    "gris",
    "grito",
    "grosor",
    "grúa",
    "grueso",
    "grumo",
    "grupo",
    "guante",
    "guapo",
    "guardia",
    "guerra",
    "guía",
    "guiño",
    "guion",
    "guiso",
    "guitarra",
    "gusano",
    "gustar",
    "haber",
    "hábil",
    "hablar",
    "hacer",
    "hacha",
    "hada",
    "hallar",
    "hamaca",
    "harina",
    "haz",
    "hazaña",
    "hebilla",
    "hebra",
    "hecho",
    "helado",
    "helio",
    "hembra",
    "herir",
    "hermano",
    "héroe",
    "hervir",
    "hielo",
    "hierro",
    "hígado",
    "higiene",
    "hijo",
    "himno",
    "historia",
    "hocico",
    "hogar",
    "hoguera",
    "hoja",
    "hombre",
    "hongo",
    "honor",
    "honra",
    "hora",
    "hormiga",
    "horno",
    "hostil",
    "hoyo",
    "hueco",
    "huelga",
    "huerta",
    "hueso",
    "huevo",
    "huida",
    "huir",
    "humano",
    "húmedo",
    "humilde",
    "humo",
    "hundir",
    "huracán",
    "hurto",
    "icono",
    "ideal",
    "idioma",
    "ídolo",
    "iglesia",
    "iglú",
    "igual",
    "ilegal",
    "ilusión",
    "imagen",
    "imán",
    "imitar",
    "impar",
    "imperio",
    "imponer",
    "impulso",
    "incapaz",
    "índice",
    "inerte",
    "infiel",
    "informe",
    "ingenio",
    "inicio",
    "inmenso",
    "inmune",
    "innato",
    "insecto",
    "instante",
    "interés",
    "íntimo",
    "intuir",
    "inútil",
    "invierno",
    "ira",
    "iris",
    "ironía",
    "isla",
    "islote",
    "jabalí",
    "jabón",
    "jamón",
    "jarabe",
    "jardín",
    "jarra",
    "jaula",
    "jazmín",
    "jefe",
    "jeringa",
    "jinete",
    "jornada",
    "joroba",
    "joven",
    "joya",
    "juerga",
    "jueves",
    "juez",
    "jugador",
    "jugo",
    "juguete",
    "juicio",
    "junco",
    "jungla",
    "junio",
    "juntar",
    "júpiter",
    "jurar",
    "justo",
    "juvenil",
    "juzgar",
    "kilo",
    "koala",
    "labio",
    "lacio",
    "lacra",
    "lado",
    "ladrón",
    "lagarto",
    "lágrima",
    "laguna",
    "laico",
    "lamer",
    "lámina",
    "lámpara",
    "lana",
    "lancha",
    "langosta",
    "lanza",
    "lápiz",
    "largo",
    "larva",
    "lástima",
    "lata",
    "látex",
    "latir",
    "laurel",
    "lavar",
    "lazo",
    "leal",
    "lección",
    "leche",
    "lector",
    "leer",
    "legión",
    "legumbre",
    "lejano",
    "lengua",
    "lento",
    "leña",
    "león",
    "leopardo",
    "lesión",
    "letal",
    "letra",
    "leve",
    "leyenda",
    "libertad",
    "libro",
    "licor",
    "líder",
    "lidiar",
    "lienzo",
    "liga",
    "ligero",
    "lima",
    "límite",
    "limón",
    "limpio",
    "lince",
    "lindo",
    "línea",
    "lingote",
    "lino",
    "linterna",
    "líquido",
    "liso",
    "lista",
    "litera",
    "litio",
    "litro",
    "llaga",
    "llama",
    "llanto",
    "llave",
    "llegar",
    "llenar",
    "llevar",
    "llorar",
    "llover",
    "lluvia",
    "lobo",
    "loción",
    "loco",
    "locura",
    "lógica",
    "logro",
    "lombriz",
    "lomo",
    "lonja",
    "lote",
    "lucha",
    "lucir",
    "lugar",
    "lujo",
    "luna",
    "lunes",
    "lupa",
    "lustro",
    "luto",
    "luz",
    "maceta",
    "macho",
    "madera",
    "madre",
    "maduro",
    "maestro",
    "mafia",
    "magia",
    "mago",
    "maíz",
    "maldad",
    "maleta",
    "malla",
    "malo",
    "mamá",
    "mambo",
    "mamut",
    "manco",
    "mando",
    "manejar",
    "manga",
    "maniquí",
    "manjar",
    "mano",
    "manso",
    "manta",
    "mañana",
    "mapa",
    "máquina",
    "mar",
    "marco",
    "marea",
    "marfil",
    "margen",
    "marido",
    "mármol",
    "marrón",
    "martes",
    "marzo",
    "masa",
    "máscara",
    "masivo",
    "matar",
    "materia",
    "matiz",
    "matriz",
    "máximo",
    "mayor",
    "mazorca",
    "mecha",
    "medalla",
    "medio",
    "médula",
    "mejilla",
    "mejor",
    "melena",
    "melón",
    "memoria",
    "menor",
    "mensaje",
    "mente",
    "menú",
    "mercado",
    "merengue",
    "mérito",
    "mes",
    "mesón",
    "meta",
    "meter",
    "método",
    "metro",
    "mezcla",
    "miedo",
    "miel",
    "miembro",
    "miga",
    "mil",
    "milagro",
    "militar",
    "millón",
    "mimo",
    "mina",
    "minero",
    "mínimo",
    "minuto",
    "miope",
    "mirar",
    "misa",
    "miseria",
    "misil",
    "mismo",
    "mitad",
    "mito",
    "mochila",
    "moción",
    "moda",
    "modelo",
    "moho",
    "mojar",
    "molde",
    "moler",
    "molino",
    "momento",
    "momia",
    "monarca",
    "moneda",
    "monja",
    "monto",
    "moño",
    "morada",
    "morder",
    "moreno",
    "morir",
    "morro",
    "morsa",
    "mortal",
    "mosca",
    "mostrar",
    "motivo",
    "mover",
    "móvil",
    "mozo",
    "mucho",
    "mudar",
    "mueble",
    "muela",
    "muerte",
    "muestra",
    "mugre",
    "mujer",
    "mula",
    "muleta",
    "multa",
    "mundo",
    "muñeca",
    "mural",
    "muro",
    "músculo",
    "museo",
    "musgo",
    "música",
    "muslo",
    "nácar",
    "nación",
    "nadar",
    "naipe",
    "naranja",
    "nariz",
    "narrar",
    "nasal",
    "natal",
    "nativo",
    "natural",
    "náusea",
    "naval",
    "nave",
    "navidad",
    "necio",
    "néctar",
    "negar",
    "negocio",
    "negro",
    "neón",
    "nervio",
    "neto",
    "neutro",
    "nevar",
    "nevera",
    "nicho",
    "nido",
    "niebla",
    "nieto",
    "niñez",
    "niño",
    "nítido",
    "nivel",
    "nobleza",
    "noche",
    "nómina",
    "noria",
    "norma",
    "norte",
    "nota",
    "noticia",
    "novato",
    "novela",
    "novio",
    "nube",
    "nuca",
    "núcleo",
    "nudillo",
    "nudo",
    "nuera",
    "nueve",
    "nuez",
    "nulo",
    "número",
    "nutria",
    "oasis",
    "obeso",
    "obispo",
    "objeto",
    "obra",
    "obrero",
    "observar",
    "obtener",
    "obvio",
    "oca",
    "ocaso",
    "océano",
    "ochenta",
    "ocho",
    "ocio",
    "ocre",
    "octavo",
    "octubre",
    "oculto",
    "ocupar",
    "ocurrir",
    "odiar",
    "odio",
    "odisea",
    "oeste",
    "ofensa",
    "oferta",
    "oficio",
    "ofrecer",
    "ogro",
    "oído",
    "oír",
    "ojo",
    "ola",
    "oleada",
    "olfato",
    "olivo",
    "olla",
    "olmo",
    "olor",
    "olvido",
    "ombligo",
    "onda",
    "onza",
    "opaco",
    "opción",
    "ópera",
    "opinar",
    "oponer",
    "optar",
    "óptica",
    "opuesto",
    "oración",
    "orador",
    "oral",
    "órbita",
    "orca",
    "orden",
    "oreja",
    "órgano",
    "orgía",
    "orgullo",
    "oriente",
    "origen",
    "orilla",
    "oro",
    "orquesta",
    "oruga",
    "osadía",
    "oscuro",
    "osezno",
    "oso",
    "ostra",
    "otoño",
    "otro",
    "oveja",
    "óvulo",
    "óxido",
    "oxígeno",
    "oyente",
    "ozono",
    "pacto",
    "padre",
    "paella",
    "página",
    "pago",
    "país",
    "pájaro",
    "palabra",
    "palco",
    "paleta",
    "pálido",
    "palma",
    "paloma",
    "palpar",
    "pan",
    "panal",
    "pánico",
    "pantera",
    "pañuelo",
    "papá",
    "papel",
    "papilla",
    "paquete",
    "parar",
    "parcela",
    "pared",
    "parir",
    "paro",
    "párpado",
    "parque",
    "párrafo",
    "parte",
    "pasar",
    "paseo",
    "pasión",
    "paso",
    "pasta",
    "pata",
    "patio",
    "patria",
    "pausa",
    "pauta",
    "pavo",
    "payaso",
    "peatón",
    "pecado",
    "pecera",
    "pecho",
    "pedal",
    "pedir",
    "pegar",
    "peine",
    "pelar",
    "peldaño",
    "pelea",
    "peligro",
    "pellejo",
    "pelo",
    "peluca",
    "pena",
    "pensar",
    "peñón",
    "peón",
    "peor",
    "pepino",
    "pequeño",
    "pera",
    "percha",
    "perder",
    "pereza",
    "perfil",
    "perico",
    "perla",
    "permiso",
    "perro",
    "persona",
    "pesa",
    "pesca",
    "pésimo",
    "pestaña",
    "pétalo",
    "petróleo",
    "pez",
    "pezuña",
    "picar",
    "pichón",
    "pie",
    "piedra",
    "pierna",
    "pieza",
    "pijama",
    "pilar",
    "piloto",
    "pimienta",
    "pino",
    "pintor",
    "pinza",
    "piña",
    "piojo",
    "pipa",
    "pirata",
    "pisar",
    "piscina",
    "piso",
    "pista",
    "pitón",
    "pizca",
    "placa",
    "plan",
    "plata",
    "playa",
    "plaza",
    "pleito",
    "pleno",
    "plomo",
    "pluma",
    "plural",
    "pobre",
    "poco",
    "poder",
    "podio",
    "poema",
    "poesía",
    "poeta",
    "polen",
    "policía",
    "pollo",
    "polvo",
    "pomada",
    "pomelo",
    "pomo",
    "pompa",
    "poner",
    "porción",
    "portal",
    "posada",
    "poseer",
    "posible",
    "poste",
    "potencia",
    "potro",
    "pozo",
    "prado",
    "precoz",
    "pregunta",
    "premio",
    "prensa",
    "preso",
    "previo",
    "primo",
    "príncipe",
    "prisión",
    "privar",
    "proa",
    "probar",
    "proceso",
    "producto",
    "proeza",
    "profesor",
    "programa",
    "prole",
    "promesa",
    "pronto",
    "propio",
    "próximo",
    "prueba",
    "público",
    "puchero",
    "pudor",
    "pueblo",
    "puerta",
    "puesto",
    "pulga",
    "pulir",
    "pulmón",
    "pulpo",
    "pulso",
    "puma",
    "punto",
    "puñal",
    "puño",
    "pupa",
    "pupila",
    "puré",
    "quedar",
    "queja",
    "quemar",
    "querer",
    "queso",
    "quieto",
    "química",
    "quince",
    "quitar",
    "rábano",
    "rabia",
    "rabo",
    "ración",
    "radical",
    "raíz",
    "rama",
    "rampa",
    "rancho",
    "rango",
    "rapaz",
    "rápido",
    "rapto",
    "rasgo",
    "raspa",
    "rato",
    "rayo",
    "raza",
    "razón",
    "reacción",
    "realidad",
    "rebaño",
    "rebote",
    "recaer",
    "receta",
    "rechazo",
    "recoger",
    "recreo",
    "recto",
    "recurso",
    "red",
    "redondo",
    "reducir",
    "reflejo",
    "reforma",
    "refrán",
    "refugio",
    "regalo",
    "regir",
    "regla",
    "regreso",
    "rehén",
    "reino",
    "reír",
    "reja",
    "relato",
    "relevo",
    "relieve",
    "relleno",
    "reloj",
    "remar",
    "remedio",
    "remo",
    "rencor",
    "rendir",
    "renta",
    "reparto",
    "repetir",
    "reposo",
    "reptil",
    "res",
    "rescate",
    "resina",
    "respeto",
    "resto",
    "resumen",
    "retiro",
    "retorno",
    "retrato",
    "reunir",
    "revés",
    "revista",
    "rey",
    "rezar",
    "rico",
    "riego",
    "rienda",
    "riesgo",
    "rifa",
    "rígido",
    "rigor",
    "rincón",
    "riñón",
    "río",
    "riqueza",
    "risa",
    "ritmo",
    "rito",
    "rizo",
    "roble",
    "roce",
    "rociar",
    "rodar",
    "rodeo",
    "rodilla",
    "roer",
    "rojizo",
    "rojo",
    "romero",
    "romper",
    "ron",
    "ronco",
    "ronda",
    "ropa",
    "ropero",
    "rosa",
    "rosca",
    "rostro",
    "rotar",
    "rubí",
    "rubor",
    "rudo",
    "rueda",
    "rugir",
    "ruido",
    "ruina",
    "ruleta",
    "rulo",
    "rumbo",
    "rumor",
    "ruptura",
    "ruta",
    "rutina",
    "sábado",
    "saber",
    "sabio",
    "sable",
    "sacar",
    "sagaz",
    "sagrado",
    "sala",
    "saldo",
    "salero",
    "salir",
    "salmón",
    "salón",
    "salsa",
    "salto",
    "salud",
    "salvar",
    "samba",
    "sanción",
    "sandía",
    "sanear",
    "sangre",
    "sanidad",
    "sano",
    "santo",
    "sapo",
    "saque",
    "sardina",
    "sartén",
    "sastre",
    "satán",
    "sauna",
    "saxofón",
    "sección",
    "seco",
    "secreto",
    "secta",
    "sed",
    "seguir",
    "seis",
    "sello",
    "selva",
    "semana",
    "semilla",
    "senda",
    "sensor",
    "señal",
    "señor",
    "separar",
    "sepia",
    "sequía",
    "ser",
    "serie",
    "sermón",
    "servir",
    "sesenta",
    "sesión",
    "seta",
    "setenta",
    "severo",
    "sexo",
    "sexto",
    "sidra",
    "siesta",
    "siete",
    "siglo",
    "signo",
    "sílaba",
    "silbar",
    "silencio",
    "silla",
    "símbolo",
    "simio",
    "sirena",
    "sistema",
    "sitio",
    "situar",
    "sobre",
    "socio",
    "sodio",
    "sol",
    "solapa",
    "soldado",
    "soledad",
    "sólido",
    "soltar",
    "solución",
    "sombra",
    "sondeo",
    "sonido",
    "sonoro",
    "sonrisa",
    "sopa",
    "soplar",
    "soporte",
    "sordo",
    "sorpresa",
    "sorteo",
    "sostén",
    "sótano",
    "suave",
    "subir",
    "suceso",
    "sudor",
    "suegra",
    "suelo",
    "sueño",
    "suerte",
    "sufrir",
    "sujeto",
    "sultán",
    "sumar",
    "superar",
    "suplir",
    "suponer",
    "supremo",
    "sur",
    "surco",
    "sureño",
    "surgir",
    "susto",
    "sutil",
    "tabaco",
    "tabique",
    "tabla",
    "tabú",
    "taco",
    "tacto",
    "tajo",
    "talar",
    "talco",
    "talento",
    "talla",
    "talón",
    "tamaño",
    "tambor",
    "tango",
    "tanque",
    "tapa",
    "tapete",
    "tapia",
    "tapón",
    "taquilla",
    "tarde",
    "tarea",
    "tarifa",
    "tarjeta",
    "tarot",
    "tarro",
    "tarta",
    "tatuaje",
    "tauro",
    "taza",
    "tazón",
    "teatro",
    "techo",
    "tecla",
    "técnica",
    "tejado",
    "tejer",
    "tejido",
    "tela",
    "teléfono",
    "tema",
    "temor",
    "templo",
    "tenaz",
    "tender",
    "tener",
    "tenis",
    "tenso",
    "teoría",
    "terapia",
    "terco",
    "término",
    "ternura",
    "terror",
    "tesis",
    "tesoro",
    "testigo",
    "tetera",
    "texto",
    "tez",
    "tibio",
    "tiburón",
    "tiempo",
    "tienda",
    "tierra",
    "tieso",
    "tigre",
    "tijera",
    "tilde",
    "timbre",
    "tímido",
    "timo",
    "tinta",
    "tío",
    "típico",
    "tipo",
    "tira",
    "tirón",
    "titán",
    "títere",
    "título",
    "tiza",
    "toalla",
    "tobillo",
    "tocar",
    "tocino",
    "todo",
    "toga",
    "toldo",
    "tomar",
    "tono",
    "tonto",
    "topar",
    "tope",
    "toque",
    "tórax",
    "torero",
    "tormenta",
    "torneo",
    "toro",
    "torpedo",
    "torre",
    "torso",
    "tortuga",
    "tos",
    "tosco",
    "toser",
    "tóxico",
    "trabajo",
    "tractor",
    "traer",
    "tráfico",
    "trago",
    "traje",
    "tramo",
    "trance",
    "trato",
    "trauma",
    "trazar",
    "trébol",
    "tregua",
    "treinta",
    "tren",
    "trepar",
    "tres",
    "tribu",
    "trigo",
    "tripa",
    "triste",
    "triunfo",
    "trofeo",
    "trompa",
    "tronco",
    "tropa",
    "trote",
    "trozo",
    "truco",
    "trueno",
    "trufa",
    "tubería",
    "tubo",
    "tuerto",
    "tumba",
    "tumor",
    "túnel",
    "túnica",
    "turbina",
    "turismo",
    "turno",
    "tutor",
    "ubicar",
    "úlcera",
    "umbral",
    "unidad",
    "unir",
    "universo",
    "uno",
    "untar",
    "uña",
    "urbano",
    "urbe",
    "urgente",
    "urna",
    "usar",
    "usuario",
    "útil",
    "utopía",
    "uva",
    "vaca",
    "vacío",
    "vacuna",
    "vagar",
    "vago",
    "vaina",
    "vajilla",
    "vale",
    "válido",
    "valle",
    "valor",
    "válvula",
    "vampiro",
    "vara",
    "variar",
    "varón",
    "vaso",
    "vecino",
    "vector",
    "vehículo",
    "veinte",
    "vejez",
    "vela",
    "velero",
    "veloz",
    "vena",
    "vencer",
    "venda",
    "veneno",
    "vengar",
    "venir",
    "venta",
    "venus",
    "ver",
    "verano",
    "verbo",
    "verde",
    "vereda",
    "verja",
    "verso",
    "verter",
    "vía",
    "viaje",
    "vibrar",
    "vicio",
    "víctima",
    "vida",
    "vídeo",
    "vidrio",
    "viejo",
    "viernes",
    "vigor",
    "vil",
    "villa",
    "vinagre",
    "vino",
    "viñedo",
    "violín",
    "viral",
    "virgo",
    "virtud",
    "visor",
    "víspera",
    "vista",
    "vitamina",
    "viudo",
    "vivaz",
    "vivero",
    "vivir",
    "vivo",
    "volcán",
    "volumen",
    "volver",
    "voraz",
    "votar",
    "voto",
    "voz",
    "vuelo",
    "vulgar",
    "yacer",
    "yate",
    "yegua",
    "yema",
    "yerno",
    "yeso",
    "yodo",
    "yoga",
    "yogur",
    "zafiro",
    "zanja",
    "zapato",
    "zarza",
    "zona",
    "zorro",
    "zumo",
    "zurdo"
]

},{}],44:[function(require,module,exports){
'use strict'

const Bignumber = require('bignumber.js').BigNumber

exports.MT = {
  POS_INT: 0,
  NEG_INT: 1,
  BYTE_STRING: 2,
  UTF8_STRING: 3,
  ARRAY: 4,
  MAP: 5,
  TAG: 6,
  SIMPLE_FLOAT: 7
}

exports.TAG = {
  DATE_STRING: 0,
  DATE_EPOCH: 1,
  POS_BIGINT: 2,
  NEG_BIGINT: 3,
  DECIMAL_FRAC: 4,
  BIGFLOAT: 5,
  BASE64URL_EXPECTED: 21,
  BASE64_EXPECTED: 22,
  BASE16_EXPECTED: 23,
  CBOR: 24,
  URI: 32,
  BASE64URL: 33,
  BASE64: 34,
  REGEXP: 35,
  MIME: 36
}

exports.NUMBYTES = {
  ZERO: 0,
  ONE: 24,
  TWO: 25,
  FOUR: 26,
  EIGHT: 27,
  INDEFINITE: 31
}

exports.SIMPLE = {
  FALSE: 20,
  TRUE: 21,
  NULL: 22,
  UNDEFINED: 23
}

exports.SYMS = {
  NULL: Symbol('null'),
  UNDEFINED: Symbol('undef'),
  PARENT: Symbol('parent'),
  BREAK: Symbol('break'),
  STREAM: Symbol('stream')
}

exports.SHIFT32 = Math.pow(2, 32)
exports.SHIFT16 = Math.pow(2, 16)

exports.MAX_SAFE_HIGH = 0x1fffff
exports.NEG_ONE = new Bignumber(-1)
exports.TEN = new Bignumber(10)
exports.TWO = new Bignumber(2)

exports.PARENT = {
  ARRAY: 0,
  OBJECT: 1,
  MAP: 2,
  TAG: 3,
  BYTE_STRING: 4,
  UTF8_STRING: 5
}

},{"bignumber.js":31}],45:[function(require,module,exports){
/* eslint-disable */

module.exports = function decodeAsm (stdlib, foreign, buffer) {
  'use asm'

  // -- Imports

  var heap = new stdlib.Uint8Array(buffer)
  // var log = foreign.log
  var pushInt = foreign.pushInt
  var pushInt32 = foreign.pushInt32
  var pushInt32Neg = foreign.pushInt32Neg
  var pushInt64 = foreign.pushInt64
  var pushInt64Neg = foreign.pushInt64Neg
  var pushFloat = foreign.pushFloat
  var pushFloatSingle = foreign.pushFloatSingle
  var pushFloatDouble = foreign.pushFloatDouble
  var pushTrue = foreign.pushTrue
  var pushFalse = foreign.pushFalse
  var pushUndefined = foreign.pushUndefined
  var pushNull = foreign.pushNull
  var pushInfinity = foreign.pushInfinity
  var pushInfinityNeg = foreign.pushInfinityNeg
  var pushNaN = foreign.pushNaN
  var pushNaNNeg = foreign.pushNaNNeg

  var pushArrayStart = foreign.pushArrayStart
  var pushArrayStartFixed = foreign.pushArrayStartFixed
  var pushArrayStartFixed32 = foreign.pushArrayStartFixed32
  var pushArrayStartFixed64 = foreign.pushArrayStartFixed64
  var pushObjectStart = foreign.pushObjectStart
  var pushObjectStartFixed = foreign.pushObjectStartFixed
  var pushObjectStartFixed32 = foreign.pushObjectStartFixed32
  var pushObjectStartFixed64 = foreign.pushObjectStartFixed64

  var pushByteString = foreign.pushByteString
  var pushByteStringStart = foreign.pushByteStringStart
  var pushUtf8String = foreign.pushUtf8String
  var pushUtf8StringStart = foreign.pushUtf8StringStart

  var pushSimpleUnassigned = foreign.pushSimpleUnassigned

  var pushTagStart = foreign.pushTagStart
  var pushTagStart4 = foreign.pushTagStart4
  var pushTagStart8 = foreign.pushTagStart8
  var pushTagUnassigned = foreign.pushTagUnassigned

  var pushBreak = foreign.pushBreak

  var pow = stdlib.Math.pow

  // -- Constants


  // -- Mutable Variables

  var offset = 0
  var inputLength = 0
  var code = 0

  // Decode a cbor string represented as Uint8Array
  // which is allocated on the heap from 0 to inputLength
  //
  // input - Int
  //
  // Returns Code - Int,
  // Success = 0
  // Error > 0
  function parse (input) {
    input = input | 0

    offset = 0
    inputLength = input

    while ((offset | 0) < (inputLength | 0)) {
      code = jumpTable[heap[offset] & 255](heap[offset] | 0) | 0

      if ((code | 0) > 0) {
        break
      }
    }

    return code | 0
  }

  // -- Helper Function

  function checkOffset (n) {
    n = n | 0

    if ((((offset | 0) + (n | 0)) | 0) < (inputLength | 0)) {
      return 0
    }

    return 1
  }

  function readUInt16 (n) {
    n = n | 0

    return (
      (heap[n | 0] << 8) | heap[(n + 1) | 0]
    ) | 0
  }

  function readUInt32 (n) {
    n = n | 0

    return (
      (heap[n | 0] << 24) | (heap[(n + 1) | 0] << 16) | (heap[(n + 2) | 0] << 8) | heap[(n + 3) | 0]
    ) | 0
  }

  // -- Initial Byte Handlers

  function INT_P (octet) {
    octet = octet | 0

    pushInt(octet | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function UINT_P_8 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushInt(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2) | 0

    return 0
  }

  function UINT_P_16 (octet) {
    octet = octet | 0

    if (checkOffset(2) | 0) {
      return 1
    }

    pushInt(
      readUInt16((offset + 1) | 0) | 0
    )

    offset = (offset + 3) | 0

    return 0
  }

  function UINT_P_32 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushInt32(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function UINT_P_64 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushInt64(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function INT_N (octet) {
    octet = octet | 0

    pushInt((-1 - ((octet - 32) | 0)) | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function UINT_N_8 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushInt(
      (-1 - (heap[(offset + 1) | 0] | 0)) | 0
    )

    offset = (offset + 2) | 0

    return 0
  }

  function UINT_N_16 (octet) {
    octet = octet | 0

    var val = 0

    if (checkOffset(2) | 0) {
      return 1
    }

    val = readUInt16((offset + 1) | 0) | 0
    pushInt((-1 - (val | 0)) | 0)

    offset = (offset + 3) | 0

    return 0
  }

  function UINT_N_32 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushInt32Neg(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function UINT_N_64 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushInt64Neg(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function BYTE_STRING (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var step = 0

    step = (octet - 64) | 0
    if (checkOffset(step | 0) | 0) {
      return 1
    }

    start = (offset + 1) | 0
    end = (((offset + 1) | 0) + (step | 0)) | 0

    pushByteString(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function BYTE_STRING_8 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(1) | 0) {
      return 1
    }

    length = heap[(offset + 1) | 0] | 0
    start = (offset + 2) | 0
    end = (((offset + 2) | 0) + (length | 0)) | 0

    if (checkOffset((length + 1) | 0) | 0) {
      return 1
    }

    pushByteString(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function BYTE_STRING_16 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(2) | 0) {
      return 1
    }

    length = readUInt16((offset + 1) | 0) | 0
    start = (offset + 3) | 0
    end = (((offset + 3) | 0) + (length | 0)) | 0


    if (checkOffset((length + 2) | 0) | 0) {
      return 1
    }

    pushByteString(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function BYTE_STRING_32 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(4) | 0) {
      return 1
    }

    length = readUInt32((offset + 1) | 0) | 0
    start = (offset + 5) | 0
    end = (((offset + 5) | 0) + (length | 0)) | 0


    if (checkOffset((length + 4) | 0) | 0) {
      return 1
    }

    pushByteString(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function BYTE_STRING_64 (octet) {
    // NOT IMPLEMENTED
    octet = octet | 0

    return 1
  }

  function BYTE_STRING_BREAK (octet) {
    octet = octet | 0

    pushByteStringStart()

    offset = (offset + 1) | 0

    return 0
  }

  function UTF8_STRING (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var step = 0

    step = (octet - 96) | 0

    if (checkOffset(step | 0) | 0) {
      return 1
    }

    start = (offset + 1) | 0
    end = (((offset + 1) | 0) + (step | 0)) | 0

    pushUtf8String(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function UTF8_STRING_8 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(1) | 0) {
      return 1
    }

    length = heap[(offset + 1) | 0] | 0
    start = (offset + 2) | 0
    end = (((offset + 2) | 0) + (length | 0)) | 0

    if (checkOffset((length + 1) | 0) | 0) {
      return 1
    }

    pushUtf8String(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function UTF8_STRING_16 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(2) | 0) {
      return 1
    }

    length = readUInt16((offset + 1) | 0) | 0
    start = (offset + 3) | 0
    end = (((offset + 3) | 0) + (length | 0)) | 0

    if (checkOffset((length + 2) | 0) | 0) {
      return 1
    }

    pushUtf8String(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function UTF8_STRING_32 (octet) {
    octet = octet | 0

    var start = 0
    var end = 0
    var length = 0

    if (checkOffset(4) | 0) {
      return 1
    }

    length = readUInt32((offset + 1) | 0) | 0
    start = (offset + 5) | 0
    end = (((offset + 5) | 0) + (length | 0)) | 0

    if (checkOffset((length + 4) | 0) | 0) {
      return 1
    }

    pushUtf8String(start | 0, end | 0)

    offset = end | 0

    return 0
  }

  function UTF8_STRING_64 (octet) {
    // NOT IMPLEMENTED
    octet = octet | 0

    return 1
  }

  function UTF8_STRING_BREAK (octet) {
    octet = octet | 0

    pushUtf8StringStart()

    offset = (offset + 1) | 0

    return 0
  }

  function ARRAY (octet) {
    octet = octet | 0

    pushArrayStartFixed((octet - 128) | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function ARRAY_8 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushArrayStartFixed(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2) | 0

    return 0
  }

  function ARRAY_16 (octet) {
    octet = octet | 0

    if (checkOffset(2) | 0) {
      return 1
    }

    pushArrayStartFixed(
      readUInt16((offset + 1) | 0) | 0
    )

    offset = (offset + 3) | 0

    return 0
  }

  function ARRAY_32 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushArrayStartFixed32(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function ARRAY_64 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushArrayStartFixed64(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function ARRAY_BREAK (octet) {
    octet = octet | 0

    pushArrayStart()

    offset = (offset + 1) | 0

    return 0
  }

  function MAP (octet) {
    octet = octet | 0

    var step = 0

    step = (octet - 160) | 0

    if (checkOffset(step | 0) | 0) {
      return 1
    }

    pushObjectStartFixed(step | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function MAP_8 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushObjectStartFixed(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2) | 0

    return 0
  }

  function MAP_16 (octet) {
    octet = octet | 0

    if (checkOffset(2) | 0) {
      return 1
    }

    pushObjectStartFixed(
      readUInt16((offset + 1) | 0) | 0
    )

    offset = (offset + 3) | 0

    return 0
  }

  function MAP_32 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushObjectStartFixed32(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function MAP_64 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushObjectStartFixed64(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function MAP_BREAK (octet) {
    octet = octet | 0

    pushObjectStart()

    offset = (offset + 1) | 0

    return 0
  }

  function TAG_KNOWN (octet) {
    octet = octet | 0

    pushTagStart((octet - 192| 0) | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BIGNUM_POS (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BIGNUM_NEG (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_FRAC (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BIGNUM_FLOAT (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_UNASSIGNED (octet) {
    octet = octet | 0

    pushTagStart((octet - 192| 0) | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BASE64_URL (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BASE64 (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_BASE16 (octet) {
    octet = octet | 0

    pushTagStart(octet | 0)

    offset = (offset + 1 | 0)

    return 0
  }

  function TAG_MORE_1 (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushTagStart(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2 | 0)

    return 0
  }

  function TAG_MORE_2 (octet) {
    octet = octet | 0

    if (checkOffset(2) | 0) {
      return 1
    }

    pushTagStart(
      readUInt16((offset + 1) | 0) | 0
    )

    offset = (offset + 3 | 0)

    return 0
  }

  function TAG_MORE_4 (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushTagStart4(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0
    )

    offset = (offset + 5 | 0)

    return 0
  }

  function TAG_MORE_8 (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushTagStart8(
      readUInt16((offset + 1) | 0) | 0,
      readUInt16((offset + 3) | 0) | 0,
      readUInt16((offset + 5) | 0) | 0,
      readUInt16((offset + 7) | 0) | 0
    )

    offset = (offset + 9 | 0)

    return 0
  }

  function SIMPLE_UNASSIGNED (octet) {
    octet = octet | 0

    pushSimpleUnassigned(((octet | 0) - 224) | 0)

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_FALSE (octet) {
    octet = octet | 0

    pushFalse()

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_TRUE (octet) {
    octet = octet | 0

    pushTrue()

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_NULL (octet) {
    octet = octet | 0

    pushNull()

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_UNDEFINED (octet) {
    octet = octet | 0

    pushUndefined()

    offset = (offset + 1) | 0

    return 0
  }

  function SIMPLE_BYTE (octet) {
    octet = octet | 0

    if (checkOffset(1) | 0) {
      return 1
    }

    pushSimpleUnassigned(heap[(offset + 1) | 0] | 0)

    offset = (offset + 2)  | 0

    return 0
  }

  function SIMPLE_FLOAT_HALF (octet) {
    octet = octet | 0

    var f = 0
    var g = 0
    var sign = 1.0
    var exp = 0.0
    var mant = 0.0
    var r = 0.0
    if (checkOffset(2) | 0) {
      return 1
    }

    f = heap[(offset + 1) | 0] | 0
    g = heap[(offset + 2) | 0] | 0

    if ((f | 0) & 0x80) {
      sign = -1.0
    }

    exp = +(((f | 0) & 0x7C) >> 2)
    mant = +((((f | 0) & 0x03) << 8) | g)

    if (+exp == 0.0) {
      pushFloat(+(
        (+sign) * +5.9604644775390625e-8 * (+mant)
      ))
    } else if (+exp == 31.0) {
      if (+sign == 1.0) {
        if (+mant > 0.0) {
          pushNaN()
        } else {
          pushInfinity()
        }
      } else {
        if (+mant > 0.0) {
          pushNaNNeg()
        } else {
          pushInfinityNeg()
        }
      }
    } else {
      pushFloat(+(
        +sign * pow(+2, +(+exp - 25.0)) * +(1024.0 + mant)
      ))
    }

    offset = (offset + 3) | 0

    return 0
  }

  function SIMPLE_FLOAT_SINGLE (octet) {
    octet = octet | 0

    if (checkOffset(4) | 0) {
      return 1
    }

    pushFloatSingle(
      heap[(offset + 1) | 0] | 0,
      heap[(offset + 2) | 0] | 0,
      heap[(offset + 3) | 0] | 0,
      heap[(offset + 4) | 0] | 0
    )

    offset = (offset + 5) | 0

    return 0
  }

  function SIMPLE_FLOAT_DOUBLE (octet) {
    octet = octet | 0

    if (checkOffset(8) | 0) {
      return 1
    }

    pushFloatDouble(
      heap[(offset + 1) | 0] | 0,
      heap[(offset + 2) | 0] | 0,
      heap[(offset + 3) | 0] | 0,
      heap[(offset + 4) | 0] | 0,
      heap[(offset + 5) | 0] | 0,
      heap[(offset + 6) | 0] | 0,
      heap[(offset + 7) | 0] | 0,
      heap[(offset + 8) | 0] | 0
    )

    offset = (offset + 9) | 0

    return 0
  }

  function ERROR (octet) {
    octet = octet | 0

    return 1
  }

  function BREAK (octet) {
    octet = octet | 0

    pushBreak()

    offset = (offset + 1) | 0

    return 0
  }

  // -- Jump Table

  var jumpTable = [
    // Integer 0x00..0x17 (0..23)
    INT_P, // 0x00
    INT_P, // 0x01
    INT_P, // 0x02
    INT_P, // 0x03
    INT_P, // 0x04
    INT_P, // 0x05
    INT_P, // 0x06
    INT_P, // 0x07
    INT_P, // 0x08
    INT_P, // 0x09
    INT_P, // 0x0A
    INT_P, // 0x0B
    INT_P, // 0x0C
    INT_P, // 0x0D
    INT_P, // 0x0E
    INT_P, // 0x0F
    INT_P, // 0x10
    INT_P, // 0x11
    INT_P, // 0x12
    INT_P, // 0x13
    INT_P, // 0x14
    INT_P, // 0x15
    INT_P, // 0x16
    INT_P, // 0x17
    // Unsigned integer (one-byte uint8_t follows)
    UINT_P_8, // 0x18
    // Unsigned integer (two-byte uint16_t follows)
    UINT_P_16, // 0x19
    // Unsigned integer (four-byte uint32_t follows)
    UINT_P_32, // 0x1a
    // Unsigned integer (eight-byte uint64_t follows)
    UINT_P_64, // 0x1b
    ERROR, // 0x1c
    ERROR, // 0x1d
    ERROR, // 0x1e
    ERROR, // 0x1f
    // Negative integer -1-0x00..-1-0x17 (-1..-24)
    INT_N, // 0x20
    INT_N, // 0x21
    INT_N, // 0x22
    INT_N, // 0x23
    INT_N, // 0x24
    INT_N, // 0x25
    INT_N, // 0x26
    INT_N, // 0x27
    INT_N, // 0x28
    INT_N, // 0x29
    INT_N, // 0x2A
    INT_N, // 0x2B
    INT_N, // 0x2C
    INT_N, // 0x2D
    INT_N, // 0x2E
    INT_N, // 0x2F
    INT_N, // 0x30
    INT_N, // 0x31
    INT_N, // 0x32
    INT_N, // 0x33
    INT_N, // 0x34
    INT_N, // 0x35
    INT_N, // 0x36
    INT_N, // 0x37
    // Negative integer -1-n (one-byte uint8_t for n follows)
    UINT_N_8, // 0x38
    // Negative integer -1-n (two-byte uint16_t for n follows)
    UINT_N_16, // 0x39
    // Negative integer -1-n (four-byte uint32_t for nfollows)
    UINT_N_32, // 0x3a
    // Negative integer -1-n (eight-byte uint64_t for n follows)
    UINT_N_64, // 0x3b
    ERROR, // 0x3c
    ERROR, // 0x3d
    ERROR, // 0x3e
    ERROR, // 0x3f
    // byte string (0x00..0x17 bytes follow)
    BYTE_STRING, // 0x40
    BYTE_STRING, // 0x41
    BYTE_STRING, // 0x42
    BYTE_STRING, // 0x43
    BYTE_STRING, // 0x44
    BYTE_STRING, // 0x45
    BYTE_STRING, // 0x46
    BYTE_STRING, // 0x47
    BYTE_STRING, // 0x48
    BYTE_STRING, // 0x49
    BYTE_STRING, // 0x4A
    BYTE_STRING, // 0x4B
    BYTE_STRING, // 0x4C
    BYTE_STRING, // 0x4D
    BYTE_STRING, // 0x4E
    BYTE_STRING, // 0x4F
    BYTE_STRING, // 0x50
    BYTE_STRING, // 0x51
    BYTE_STRING, // 0x52
    BYTE_STRING, // 0x53
    BYTE_STRING, // 0x54
    BYTE_STRING, // 0x55
    BYTE_STRING, // 0x56
    BYTE_STRING, // 0x57
    // byte string (one-byte uint8_t for n, and then n bytes follow)
    BYTE_STRING_8, // 0x58
    // byte string (two-byte uint16_t for n, and then n bytes follow)
    BYTE_STRING_16, // 0x59
    // byte string (four-byte uint32_t for n, and then n bytes follow)
    BYTE_STRING_32, // 0x5a
    // byte string (eight-byte uint64_t for n, and then n bytes follow)
    BYTE_STRING_64, // 0x5b
    ERROR, // 0x5c
    ERROR, // 0x5d
    ERROR, // 0x5e
    // byte string, byte strings follow, terminated by "break"
    BYTE_STRING_BREAK, // 0x5f
    // UTF-8 string (0x00..0x17 bytes follow)
    UTF8_STRING, // 0x60
    UTF8_STRING, // 0x61
    UTF8_STRING, // 0x62
    UTF8_STRING, // 0x63
    UTF8_STRING, // 0x64
    UTF8_STRING, // 0x65
    UTF8_STRING, // 0x66
    UTF8_STRING, // 0x67
    UTF8_STRING, // 0x68
    UTF8_STRING, // 0x69
    UTF8_STRING, // 0x6A
    UTF8_STRING, // 0x6B
    UTF8_STRING, // 0x6C
    UTF8_STRING, // 0x6D
    UTF8_STRING, // 0x6E
    UTF8_STRING, // 0x6F
    UTF8_STRING, // 0x70
    UTF8_STRING, // 0x71
    UTF8_STRING, // 0x72
    UTF8_STRING, // 0x73
    UTF8_STRING, // 0x74
    UTF8_STRING, // 0x75
    UTF8_STRING, // 0x76
    UTF8_STRING, // 0x77
    // UTF-8 string (one-byte uint8_t for n, and then n bytes follow)
    UTF8_STRING_8, // 0x78
    // UTF-8 string (two-byte uint16_t for n, and then n bytes follow)
    UTF8_STRING_16, // 0x79
    // UTF-8 string (four-byte uint32_t for n, and then n bytes follow)
    UTF8_STRING_32, // 0x7a
    // UTF-8 string (eight-byte uint64_t for n, and then n bytes follow)
    UTF8_STRING_64, // 0x7b
    // UTF-8 string, UTF-8 strings follow, terminated by "break"
    ERROR, // 0x7c
    ERROR, // 0x7d
    ERROR, // 0x7e
    UTF8_STRING_BREAK, // 0x7f
    // array (0x00..0x17 data items follow)
    ARRAY, // 0x80
    ARRAY, // 0x81
    ARRAY, // 0x82
    ARRAY, // 0x83
    ARRAY, // 0x84
    ARRAY, // 0x85
    ARRAY, // 0x86
    ARRAY, // 0x87
    ARRAY, // 0x88
    ARRAY, // 0x89
    ARRAY, // 0x8A
    ARRAY, // 0x8B
    ARRAY, // 0x8C
    ARRAY, // 0x8D
    ARRAY, // 0x8E
    ARRAY, // 0x8F
    ARRAY, // 0x90
    ARRAY, // 0x91
    ARRAY, // 0x92
    ARRAY, // 0x93
    ARRAY, // 0x94
    ARRAY, // 0x95
    ARRAY, // 0x96
    ARRAY, // 0x97
    // array (one-byte uint8_t fo, and then n data items follow)
    ARRAY_8, // 0x98
    // array (two-byte uint16_t for n, and then n data items follow)
    ARRAY_16, // 0x99
    // array (four-byte uint32_t for n, and then n data items follow)
    ARRAY_32, // 0x9a
    // array (eight-byte uint64_t for n, and then n data items follow)
    ARRAY_64, // 0x9b
    // array, data items follow, terminated by "break"
    ERROR, // 0x9c
    ERROR, // 0x9d
    ERROR, // 0x9e
    ARRAY_BREAK, // 0x9f
    // map (0x00..0x17 pairs of data items follow)
    MAP, // 0xa0
    MAP, // 0xa1
    MAP, // 0xa2
    MAP, // 0xa3
    MAP, // 0xa4
    MAP, // 0xa5
    MAP, // 0xa6
    MAP, // 0xa7
    MAP, // 0xa8
    MAP, // 0xa9
    MAP, // 0xaA
    MAP, // 0xaB
    MAP, // 0xaC
    MAP, // 0xaD
    MAP, // 0xaE
    MAP, // 0xaF
    MAP, // 0xb0
    MAP, // 0xb1
    MAP, // 0xb2
    MAP, // 0xb3
    MAP, // 0xb4
    MAP, // 0xb5
    MAP, // 0xb6
    MAP, // 0xb7
    // map (one-byte uint8_t for n, and then n pairs of data items follow)
    MAP_8, // 0xb8
    // map (two-byte uint16_t for n, and then n pairs of data items follow)
    MAP_16, // 0xb9
    // map (four-byte uint32_t for n, and then n pairs of data items follow)
    MAP_32, // 0xba
    // map (eight-byte uint64_t for n, and then n pairs of data items follow)
    MAP_64, // 0xbb
    ERROR, // 0xbc
    ERROR, // 0xbd
    ERROR, // 0xbe
    // map, pairs of data items follow, terminated by "break"
    MAP_BREAK, // 0xbf
    // Text-based date/time (data item follows; see Section 2.4.1)
    TAG_KNOWN, // 0xc0
    // Epoch-based date/time (data item follows; see Section 2.4.1)
    TAG_KNOWN, // 0xc1
    // Positive bignum (data item "byte string" follows)
    TAG_KNOWN, // 0xc2
    // Negative bignum (data item "byte string" follows)
    TAG_KNOWN, // 0xc3
    // Decimal Fraction (data item "array" follows; see Section 2.4.3)
    TAG_KNOWN, // 0xc4
    // Bigfloat (data item "array" follows; see Section 2.4.3)
    TAG_KNOWN, // 0xc5
    // (tagged item)
    TAG_UNASSIGNED, // 0xc6
    TAG_UNASSIGNED, // 0xc7
    TAG_UNASSIGNED, // 0xc8
    TAG_UNASSIGNED, // 0xc9
    TAG_UNASSIGNED, // 0xca
    TAG_UNASSIGNED, // 0xcb
    TAG_UNASSIGNED, // 0xcc
    TAG_UNASSIGNED, // 0xcd
    TAG_UNASSIGNED, // 0xce
    TAG_UNASSIGNED, // 0xcf
    TAG_UNASSIGNED, // 0xd0
    TAG_UNASSIGNED, // 0xd1
    TAG_UNASSIGNED, // 0xd2
    TAG_UNASSIGNED, // 0xd3
    TAG_UNASSIGNED, // 0xd4
    // Expected Conversion (data item follows; see Section 2.4.4.2)
    TAG_UNASSIGNED, // 0xd5
    TAG_UNASSIGNED, // 0xd6
    TAG_UNASSIGNED, // 0xd7
    // (more tagged items, 1/2/4/8 bytes and then a data item follow)
    TAG_MORE_1, // 0xd8
    TAG_MORE_2, // 0xd9
    TAG_MORE_4, // 0xda
    TAG_MORE_8, // 0xdb
    ERROR, // 0xdc
    ERROR, // 0xdd
    ERROR, // 0xde
    ERROR, // 0xdf
    // (simple value)
    SIMPLE_UNASSIGNED, // 0xe0
    SIMPLE_UNASSIGNED, // 0xe1
    SIMPLE_UNASSIGNED, // 0xe2
    SIMPLE_UNASSIGNED, // 0xe3
    SIMPLE_UNASSIGNED, // 0xe4
    SIMPLE_UNASSIGNED, // 0xe5
    SIMPLE_UNASSIGNED, // 0xe6
    SIMPLE_UNASSIGNED, // 0xe7
    SIMPLE_UNASSIGNED, // 0xe8
    SIMPLE_UNASSIGNED, // 0xe9
    SIMPLE_UNASSIGNED, // 0xea
    SIMPLE_UNASSIGNED, // 0xeb
    SIMPLE_UNASSIGNED, // 0xec
    SIMPLE_UNASSIGNED, // 0xed
    SIMPLE_UNASSIGNED, // 0xee
    SIMPLE_UNASSIGNED, // 0xef
    SIMPLE_UNASSIGNED, // 0xf0
    SIMPLE_UNASSIGNED, // 0xf1
    SIMPLE_UNASSIGNED, // 0xf2
    SIMPLE_UNASSIGNED, // 0xf3
    // False
    SIMPLE_FALSE, // 0xf4
    // True
    SIMPLE_TRUE, // 0xf5
    // Null
    SIMPLE_NULL, // 0xf6
    // Undefined
    SIMPLE_UNDEFINED, // 0xf7
    // (simple value, one byte follows)
    SIMPLE_BYTE, // 0xf8
    // Half-Precision Float (two-byte IEEE 754)
    SIMPLE_FLOAT_HALF, // 0xf9
    // Single-Precision Float (four-byte IEEE 754)
    SIMPLE_FLOAT_SINGLE, // 0xfa
    // Double-Precision Float (eight-byte IEEE 754)
    SIMPLE_FLOAT_DOUBLE, // 0xfb
    ERROR, // 0xfc
    ERROR, // 0xfd
    ERROR, // 0xfe
    // "break" stop code
    BREAK // 0xff
  ]

  // --

  return {
    parse: parse
  }
}

},{}],46:[function(require,module,exports){
(function (global){(function (){
'use strict'

const { Buffer } = require('buffer')
const ieee754 = require('ieee754')
const Bignumber = require('bignumber.js').BigNumber

const parser = require('./decoder.asm')
const utils = require('./utils')
const c = require('./constants')
const Simple = require('./simple')
const Tagged = require('./tagged')
const { URL } = require('iso-url')

/**
 * Transform binary cbor data into JavaScript objects.
 */
class Decoder {
  /**
   * @param {Object} [opts={}]
   * @param {number} [opts.size=65536] - Size of the allocated heap.
   */
  constructor (opts) {
    opts = opts || {}

    if (!opts.size || opts.size < 0x10000) {
      opts.size = 0x10000
    } else {
      // Ensure the size is a power of 2
      opts.size = utils.nextPowerOf2(opts.size)
    }

    // Heap use to share the input with the parser
    this._heap = new ArrayBuffer(opts.size)
    this._heap8 = new Uint8Array(this._heap)
    this._buffer = Buffer.from(this._heap)

    this._reset()

    // Known tags
    this._knownTags = Object.assign({
      0: (val) => new Date(val),
      1: (val) => new Date(val * 1000),
      2: (val) => utils.arrayBufferToBignumber(val),
      3: (val) => c.NEG_ONE.minus(utils.arrayBufferToBignumber(val)),
      4: (v) => {
        // const v = new Uint8Array(val)
        return c.TEN.pow(v[0]).times(v[1])
      },
      5: (v) => {
        // const v = new Uint8Array(val)
        return c.TWO.pow(v[0]).times(v[1])
      },
      32: (val) => new URL(val),
      35: (val) => new RegExp(val)
    }, opts.tags)

    // Initialize asm based parser
    this.parser = parser(global, {
      // eslint-disable-next-line no-console
      log: console.log.bind(console),
      pushInt: this.pushInt.bind(this),
      pushInt32: this.pushInt32.bind(this),
      pushInt32Neg: this.pushInt32Neg.bind(this),
      pushInt64: this.pushInt64.bind(this),
      pushInt64Neg: this.pushInt64Neg.bind(this),
      pushFloat: this.pushFloat.bind(this),
      pushFloatSingle: this.pushFloatSingle.bind(this),
      pushFloatDouble: this.pushFloatDouble.bind(this),
      pushTrue: this.pushTrue.bind(this),
      pushFalse: this.pushFalse.bind(this),
      pushUndefined: this.pushUndefined.bind(this),
      pushNull: this.pushNull.bind(this),
      pushInfinity: this.pushInfinity.bind(this),
      pushInfinityNeg: this.pushInfinityNeg.bind(this),
      pushNaN: this.pushNaN.bind(this),
      pushNaNNeg: this.pushNaNNeg.bind(this),
      pushArrayStart: this.pushArrayStart.bind(this),
      pushArrayStartFixed: this.pushArrayStartFixed.bind(this),
      pushArrayStartFixed32: this.pushArrayStartFixed32.bind(this),
      pushArrayStartFixed64: this.pushArrayStartFixed64.bind(this),
      pushObjectStart: this.pushObjectStart.bind(this),
      pushObjectStartFixed: this.pushObjectStartFixed.bind(this),
      pushObjectStartFixed32: this.pushObjectStartFixed32.bind(this),
      pushObjectStartFixed64: this.pushObjectStartFixed64.bind(this),
      pushByteString: this.pushByteString.bind(this),
      pushByteStringStart: this.pushByteStringStart.bind(this),
      pushUtf8String: this.pushUtf8String.bind(this),
      pushUtf8StringStart: this.pushUtf8StringStart.bind(this),
      pushSimpleUnassigned: this.pushSimpleUnassigned.bind(this),
      pushTagUnassigned: this.pushTagUnassigned.bind(this),
      pushTagStart: this.pushTagStart.bind(this),
      pushTagStart4: this.pushTagStart4.bind(this),
      pushTagStart8: this.pushTagStart8.bind(this),
      pushBreak: this.pushBreak.bind(this)
    }, this._heap)
  }

  get _depth () {
    return this._parents.length
  }

  get _currentParent () {
    return this._parents[this._depth - 1]
  }

  get _ref () {
    return this._currentParent.ref
  }

  // Finish the current parent
  _closeParent () {
    var p = this._parents.pop()

    if (p.length > 0) {
      throw new Error(`Missing ${p.length} elements`)
    }

    switch (p.type) {
      case c.PARENT.TAG:
        this._push(
          this.createTag(p.ref[0], p.ref[1])
        )
        break
      case c.PARENT.BYTE_STRING:
        this._push(this.createByteString(p.ref, p.length))
        break
      case c.PARENT.UTF8_STRING:
        this._push(this.createUtf8String(p.ref, p.length))
        break
      case c.PARENT.MAP:
        if (p.values % 2 > 0) {
          throw new Error('Odd number of elements in the map')
        }
        this._push(this.createMap(p.ref, p.length))
        break
      case c.PARENT.OBJECT:
        if (p.values % 2 > 0) {
          throw new Error('Odd number of elements in the map')
        }
        this._push(this.createObject(p.ref, p.length))
        break
      case c.PARENT.ARRAY:
        this._push(this.createArray(p.ref, p.length))
        break
      default:
        break
    }

    if (this._currentParent && this._currentParent.type === c.PARENT.TAG) {
      this._dec()
    }
  }

  // Reduce the expected length of the current parent by one
  _dec () {
    const p = this._currentParent
    // The current parent does not know the epxected child length

    if (p.length < 0) {
      return
    }

    p.length--

    // All children were seen, we can close the current parent
    if (p.length === 0) {
      this._closeParent()
    }
  }

  // Push any value to the current parent
  _push (val, hasChildren) {
    const p = this._currentParent
    p.values++

    switch (p.type) {
      case c.PARENT.ARRAY:
      case c.PARENT.BYTE_STRING:
      case c.PARENT.UTF8_STRING:
        if (p.length > -1) {
          this._ref[this._ref.length - p.length] = val
        } else {
          this._ref.push(val)
        }
        this._dec()
        break
      case c.PARENT.OBJECT:
        if (p.tmpKey != null) {
          this._ref[p.tmpKey] = val
          p.tmpKey = null
          this._dec()
        } else {
          p.tmpKey = val

          if (typeof p.tmpKey !== 'string') {
            // too bad, convert to a Map
            p.type = c.PARENT.MAP
            p.ref = utils.buildMap(p.ref)
          }
        }
        break
      case c.PARENT.MAP:
        if (p.tmpKey != null) {
          this._ref.set(p.tmpKey, val)
          p.tmpKey = null
          this._dec()
        } else {
          p.tmpKey = val
        }
        break
      case c.PARENT.TAG:
        this._ref.push(val)
        if (!hasChildren) {
          this._dec()
        }
        break
      default:
        throw new Error('Unknown parent type')
    }
  }

  // Create a new parent in the parents list
  _createParent (obj, type, len) {
    this._parents[this._depth] = {
      type: type,
      length: len,
      ref: obj,
      values: 0,
      tmpKey: null
    }
  }

  // Reset all state back to the beginning, also used for initiatlization
  _reset () {
    this._res = []
    this._parents = [{
      type: c.PARENT.ARRAY,
      length: -1,
      ref: this._res,
      values: 0,
      tmpKey: null
    }]
  }

  // -- Interface to customize deoding behaviour
  createTag (tagNumber, value) {
    const typ = this._knownTags[tagNumber]

    if (!typ) {
      return new Tagged(tagNumber, value)
    }

    return typ(value)
  }

  createMap (obj, len) {
    return obj
  }

  createObject (obj, len) {
    return obj
  }

  createArray (arr, len) {
    return arr
  }

  createByteString (raw, len) {
    return Buffer.concat(raw)
  }

  createByteStringFromHeap (start, end) {
    if (start === end) {
      return Buffer.alloc(0)
    }

    return Buffer.from(this._heap.slice(start, end))
  }

  createInt (val) {
    return val
  }

  createInt32 (f, g) {
    return utils.buildInt32(f, g)
  }

  createInt64 (f1, f2, g1, g2) {
    return utils.buildInt64(f1, f2, g1, g2)
  }

  createFloat (val) {
    return val
  }

  createFloatSingle (a, b, c, d) {
    return ieee754.read([a, b, c, d], 0, false, 23, 4)
  }

  createFloatDouble (a, b, c, d, e, f, g, h) {
    return ieee754.read([a, b, c, d, e, f, g, h], 0, false, 52, 8)
  }

  createInt32Neg (f, g) {
    return -1 - utils.buildInt32(f, g)
  }

  createInt64Neg (f1, f2, g1, g2) {
    const f = utils.buildInt32(f1, f2)
    const g = utils.buildInt32(g1, g2)

    if (f > c.MAX_SAFE_HIGH) {
      return c.NEG_ONE.minus(new Bignumber(f).times(c.SHIFT32).plus(g))
    }

    return -1 - ((f * c.SHIFT32) + g)
  }

  createTrue () {
    return true
  }

  createFalse () {
    return false
  }

  createNull () {
    return null
  }

  createUndefined () {
    return undefined
  }

  createInfinity () {
    return Infinity
  }

  createInfinityNeg () {
    return -Infinity
  }

  createNaN () {
    return NaN
  }

  createNaNNeg () {
    return -NaN
  }

  createUtf8String (raw, len) {
    return raw.join('')
  }

  createUtf8StringFromHeap (start, end) {
    if (start === end) {
      return ''
    }

    return this._buffer.toString('utf8', start, end)
  }

  createSimpleUnassigned (val) {
    return new Simple(val)
  }

  // -- Interface for decoder.asm.js

  pushInt (val) {
    this._push(this.createInt(val))
  }

  pushInt32 (f, g) {
    this._push(this.createInt32(f, g))
  }

  pushInt64 (f1, f2, g1, g2) {
    this._push(this.createInt64(f1, f2, g1, g2))
  }

  pushFloat (val) {
    this._push(this.createFloat(val))
  }

  pushFloatSingle (a, b, c, d) {
    this._push(this.createFloatSingle(a, b, c, d))
  }

  pushFloatDouble (a, b, c, d, e, f, g, h) {
    this._push(this.createFloatDouble(a, b, c, d, e, f, g, h))
  }

  pushInt32Neg (f, g) {
    this._push(this.createInt32Neg(f, g))
  }

  pushInt64Neg (f1, f2, g1, g2) {
    this._push(this.createInt64Neg(f1, f2, g1, g2))
  }

  pushTrue () {
    this._push(this.createTrue())
  }

  pushFalse () {
    this._push(this.createFalse())
  }

  pushNull () {
    this._push(this.createNull())
  }

  pushUndefined () {
    this._push(this.createUndefined())
  }

  pushInfinity () {
    this._push(this.createInfinity())
  }

  pushInfinityNeg () {
    this._push(this.createInfinityNeg())
  }

  pushNaN () {
    this._push(this.createNaN())
  }

  pushNaNNeg () {
    this._push(this.createNaNNeg())
  }

  pushArrayStart () {
    this._createParent([], c.PARENT.ARRAY, -1)
  }

  pushArrayStartFixed (len) {
    this._createArrayStartFixed(len)
  }

  pushArrayStartFixed32 (len1, len2) {
    const len = utils.buildInt32(len1, len2)
    this._createArrayStartFixed(len)
  }

  pushArrayStartFixed64 (len1, len2, len3, len4) {
    const len = utils.buildInt64(len1, len2, len3, len4)
    this._createArrayStartFixed(len)
  }

  pushObjectStart () {
    this._createObjectStartFixed(-1)
  }

  pushObjectStartFixed (len) {
    this._createObjectStartFixed(len)
  }

  pushObjectStartFixed32 (len1, len2) {
    const len = utils.buildInt32(len1, len2)
    this._createObjectStartFixed(len)
  }

  pushObjectStartFixed64 (len1, len2, len3, len4) {
    const len = utils.buildInt64(len1, len2, len3, len4)
    this._createObjectStartFixed(len)
  }

  pushByteStringStart () {
    this._parents[this._depth] = {
      type: c.PARENT.BYTE_STRING,
      length: -1,
      ref: [],
      values: 0,
      tmpKey: null
    }
  }

  pushByteString (start, end) {
    this._push(this.createByteStringFromHeap(start, end))
  }

  pushUtf8StringStart () {
    this._parents[this._depth] = {
      type: c.PARENT.UTF8_STRING,
      length: -1,
      ref: [],
      values: 0,
      tmpKey: null
    }
  }

  pushUtf8String (start, end) {
    this._push(this.createUtf8StringFromHeap(start, end))
  }

  pushSimpleUnassigned (val) {
    this._push(this.createSimpleUnassigned(val))
  }

  pushTagStart (tag) {
    this._parents[this._depth] = {
      type: c.PARENT.TAG,
      length: 1,
      ref: [tag]
    }
  }

  pushTagStart4 (f, g) {
    this.pushTagStart(utils.buildInt32(f, g))
  }

  pushTagStart8 (f1, f2, g1, g2) {
    this.pushTagStart(utils.buildInt64(f1, f2, g1, g2))
  }

  pushTagUnassigned (tagNumber) {
    this._push(this.createTag(tagNumber))
  }

  pushBreak () {
    if (this._currentParent.length > -1) {
      throw new Error('Unexpected break')
    }

    this._closeParent()
  }

  _createObjectStartFixed (len) {
    if (len === 0) {
      this._push(this.createObject({}))
      return
    }

    this._createParent({}, c.PARENT.OBJECT, len)
  }

  _createArrayStartFixed (len) {
    if (len === 0) {
      this._push(this.createArray([]))
      return
    }

    this._createParent(new Array(len), c.PARENT.ARRAY, len)
  }

  _decode (input) {
    if (input.byteLength === 0) {
      throw new Error('Input too short')
    }

    this._reset()
    this._heap8.set(input)
    const code = this.parser.parse(input.byteLength)

    if (this._depth > 1) {
      while (this._currentParent.length === 0) {
        this._closeParent()
      }
      if (this._depth > 1) {
        throw new Error('Undeterminated nesting')
      }
    }

    if (code > 0) {
      throw new Error('Failed to parse')
    }

    if (this._res.length === 0) {
      throw new Error('No valid result')
    }
  }

  // -- Public Interface

  decodeFirst (input) {
    this._decode(input)

    return this._res[0]
  }

  decodeAll (input) {
    this._decode(input)

    return this._res
  }

  /**
   * Decode the first cbor object.
   *
   * @param {Buffer|string} input
   * @param {string} [enc='hex'] - Encoding used if a string is passed.
   * @returns {*}
   */
  static decode (input, enc) {
    if (typeof input === 'string') {
      input = Buffer.from(input, enc || 'hex')
    }

    const dec = new Decoder({ size: input.length })
    return dec.decodeFirst(input)
  }

  /**
   * Decode all cbor objects.
   *
   * @param {Buffer|string} input
   * @param {string} [enc='hex'] - Encoding used if a string is passed.
   * @returns {Array<*>}
   */
  static decodeAll (input, enc) {
    if (typeof input === 'string') {
      input = Buffer.from(input, enc || 'hex')
    }

    const dec = new Decoder({ size: input.length })
    return dec.decodeAll(input)
  }
}

Decoder.decodeFirst = Decoder.decode

module.exports = Decoder

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./constants":44,"./decoder.asm":45,"./simple":50,"./tagged":51,"./utils":52,"bignumber.js":31,"buffer":4,"ieee754":74,"iso-url":76}],47:[function(require,module,exports){
'use strict'

const { Buffer } = require('buffer')
const Decoder = require('./decoder')
const utils = require('./utils')

/**
 * Output the diagnostic format from a stream of CBOR bytes.
 *
 */
class Diagnose extends Decoder {
  createTag (tagNumber, value) {
    return `${tagNumber}(${value})`
  }

  createInt (val) {
    return super.createInt(val).toString()
  }

  createInt32 (f, g) {
    return super.createInt32(f, g).toString()
  }

  createInt64 (f1, f2, g1, g2) {
    return super.createInt64(f1, f2, g1, g2).toString()
  }

  createInt32Neg (f, g) {
    return super.createInt32Neg(f, g).toString()
  }

  createInt64Neg (f1, f2, g1, g2) {
    return super.createInt64Neg(f1, f2, g1, g2).toString()
  }

  createTrue () {
    return 'true'
  }

  createFalse () {
    return 'false'
  }

  createFloat (val) {
    const fl = super.createFloat(val)
    if (utils.isNegativeZero(val)) {
      return '-0_1'
    }

    return `${fl}_1`
  }

  createFloatSingle (a, b, c, d) {
    const fl = super.createFloatSingle(a, b, c, d)
    return `${fl}_2`
  }

  createFloatDouble (a, b, c, d, e, f, g, h) {
    const fl = super.createFloatDouble(a, b, c, d, e, f, g, h)
    return `${fl}_3`
  }

  createByteString (raw, len) {
    const val = raw.join(', ')

    if (len === -1) {
      return `(_ ${val})`
    }
    return `h'${val}`
  }

  createByteStringFromHeap (start, end) {
    const val = (Buffer.from(
      super.createByteStringFromHeap(start, end)
    )).toString('hex')

    return `h'${val}'`
  }

  createInfinity () {
    return 'Infinity_1'
  }

  createInfinityNeg () {
    return '-Infinity_1'
  }

  createNaN () {
    return 'NaN_1'
  }

  createNaNNeg () {
    return '-NaN_1'
  }

  createNull () {
    return 'null'
  }

  createUndefined () {
    return 'undefined'
  }

  createSimpleUnassigned (val) {
    return `simple(${val})`
  }

  createArray (arr, len) {
    const val = super.createArray(arr, len)

    if (len === -1) {
      // indefinite
      return `[_ ${val.join(', ')}]`
    }

    return `[${val.join(', ')}]`
  }

  createMap (map, len) {
    const val = super.createMap(map)
    const list = Array.from(val.keys())
      .reduce(collectObject(val), '')

    if (len === -1) {
      return `{_ ${list}}`
    }

    return `{${list}}`
  }

  createObject (obj, len) {
    const val = super.createObject(obj)
    const map = Object.keys(val)
      .reduce(collectObject(val), '')

    if (len === -1) {
      return `{_ ${map}}`
    }

    return `{${map}}`
  }

  createUtf8String (raw, len) {
    const val = raw.join(', ')

    if (len === -1) {
      return `(_ ${val})`
    }

    return `"${val}"`
  }

  createUtf8StringFromHeap (start, end) {
    const val = (Buffer.from(
      super.createUtf8StringFromHeap(start, end)
    )).toString('utf8')

    return `"${val}"`
  }

  static diagnose (input, enc) {
    if (typeof input === 'string') {
      input = Buffer.from(input, enc || 'hex')
    }

    const dec = new Diagnose()
    return dec.decodeFirst(input)
  }
}

module.exports = Diagnose

function collectObject (val) {
  return (acc, key) => {
    if (acc) {
      return `${acc}, ${key}: ${val[key]}`
    }
    return `${key}: ${val[key]}`
  }
}

},{"./decoder":46,"./utils":52,"buffer":4}],48:[function(require,module,exports){
'use strict'

const { Buffer } = require('buffer')
const { URL } = require('iso-url')
const Bignumber = require('bignumber.js').BigNumber

const utils = require('./utils')
const constants = require('./constants')
const MT = constants.MT
const NUMBYTES = constants.NUMBYTES
const SHIFT32 = constants.SHIFT32
const SYMS = constants.SYMS
const TAG = constants.TAG
const HALF = (constants.MT.SIMPLE_FLOAT << 5) | constants.NUMBYTES.TWO
const FLOAT = (constants.MT.SIMPLE_FLOAT << 5) | constants.NUMBYTES.FOUR
const DOUBLE = (constants.MT.SIMPLE_FLOAT << 5) | constants.NUMBYTES.EIGHT
const TRUE = (constants.MT.SIMPLE_FLOAT << 5) | constants.SIMPLE.TRUE
const FALSE = (constants.MT.SIMPLE_FLOAT << 5) | constants.SIMPLE.FALSE
const UNDEFINED = (constants.MT.SIMPLE_FLOAT << 5) | constants.SIMPLE.UNDEFINED
const NULL = (constants.MT.SIMPLE_FLOAT << 5) | constants.SIMPLE.NULL

const MAXINT_BN = new Bignumber('0x20000000000000')
const BUF_NAN = Buffer.from('f97e00', 'hex')
const BUF_INF_NEG = Buffer.from('f9fc00', 'hex')
const BUF_INF_POS = Buffer.from('f97c00', 'hex')

function toType (obj) {
  // [object Type]
  // --------8---1
  return ({}).toString.call(obj).slice(8, -1)
}

/**
 * Transform JavaScript values into CBOR bytes
 *
 */
class Encoder {
  /**
   * @param {Object} [options={}]
   * @param {function(Buffer)} options.stream
   */
  constructor (options) {
    options = options || {}

    this.streaming = typeof options.stream === 'function'
    this.onData = options.stream

    this.semanticTypes = [
      [URL, this._pushUrl],
      [Bignumber, this._pushBigNumber]
    ]

    const addTypes = options.genTypes || []
    const len = addTypes.length
    for (let i = 0; i < len; i++) {
      this.addSemanticType(
        addTypes[i][0],
        addTypes[i][1]
      )
    }

    this._reset()
  }

  addSemanticType (type, fun) {
    const len = this.semanticTypes.length
    for (let i = 0; i < len; i++) {
      const typ = this.semanticTypes[i][0]
      if (typ === type) {
        const old = this.semanticTypes[i][1]
        this.semanticTypes[i][1] = fun
        return old
      }
    }
    this.semanticTypes.push([type, fun])
    return null
  }

  push (val) {
    if (!val) {
      return true
    }

    this.result[this.offset] = val
    this.resultMethod[this.offset] = 0
    this.resultLength[this.offset] = val.length
    this.offset++

    if (this.streaming) {
      this.onData(this.finalize())
    }

    return true
  }

  pushWrite (val, method, len) {
    this.result[this.offset] = val
    this.resultMethod[this.offset] = method
    this.resultLength[this.offset] = len
    this.offset++

    if (this.streaming) {
      this.onData(this.finalize())
    }

    return true
  }

  _pushUInt8 (val) {
    return this.pushWrite(val, 1, 1)
  }

  _pushUInt16BE (val) {
    return this.pushWrite(val, 2, 2)
  }

  _pushUInt32BE (val) {
    return this.pushWrite(val, 3, 4)
  }

  _pushDoubleBE (val) {
    return this.pushWrite(val, 4, 8)
  }

  _pushNaN () {
    return this.push(BUF_NAN)
  }

  _pushInfinity (obj) {
    const half = (obj < 0) ? BUF_INF_NEG : BUF_INF_POS
    return this.push(half)
  }

  _pushFloat (obj) {
    const b2 = Buffer.allocUnsafe(2)

    if (utils.writeHalf(b2, obj)) {
      if (utils.parseHalf(b2) === obj) {
        return this._pushUInt8(HALF) && this.push(b2)
      }
    }

    const b4 = Buffer.allocUnsafe(4)
    b4.writeFloatBE(obj, 0)
    if (b4.readFloatBE(0) === obj) {
      return this._pushUInt8(FLOAT) && this.push(b4)
    }

    return this._pushUInt8(DOUBLE) && this._pushDoubleBE(obj)
  }

  _pushInt (obj, mt, orig) {
    const m = mt << 5
    if (obj < 24) {
      return this._pushUInt8(m | obj)
    }

    if (obj <= 0xff) {
      return this._pushUInt8(m | NUMBYTES.ONE) && this._pushUInt8(obj)
    }

    if (obj <= 0xffff) {
      return this._pushUInt8(m | NUMBYTES.TWO) && this._pushUInt16BE(obj)
    }

    if (obj <= 0xffffffff) {
      return this._pushUInt8(m | NUMBYTES.FOUR) && this._pushUInt32BE(obj)
    }

    if (obj <= Number.MAX_SAFE_INTEGER) {
      return this._pushUInt8(m | NUMBYTES.EIGHT) &&
        this._pushUInt32BE(Math.floor(obj / SHIFT32)) &&
        this._pushUInt32BE(obj % SHIFT32)
    }

    if (mt === MT.NEG_INT) {
      return this._pushFloat(orig)
    }

    return this._pushFloat(obj)
  }

  _pushIntNum (obj) {
    if (obj < 0) {
      return this._pushInt(-obj - 1, MT.NEG_INT, obj)
    } else {
      return this._pushInt(obj, MT.POS_INT)
    }
  }

  _pushNumber (obj) {
    switch (false) {
      case (obj === obj): // eslint-disable-line
        return this._pushNaN(obj)
      case isFinite(obj):
        return this._pushInfinity(obj)
      case ((obj % 1) !== 0):
        return this._pushIntNum(obj)
      default:
        return this._pushFloat(obj)
    }
  }

  _pushString (obj) {
    const len = Buffer.byteLength(obj, 'utf8')
    return this._pushInt(len, MT.UTF8_STRING) && this.pushWrite(obj, 5, len)
  }

  _pushBoolean (obj) {
    return this._pushUInt8(obj ? TRUE : FALSE)
  }

  _pushUndefined (obj) {
    return this._pushUInt8(UNDEFINED)
  }

  _pushArray (gen, obj) {
    const len = obj.length
    if (!gen._pushInt(len, MT.ARRAY)) {
      return false
    }
    for (let j = 0; j < len; j++) {
      if (!gen.pushAny(obj[j])) {
        return false
      }
    }
    return true
  }

  _pushTag (tag) {
    return this._pushInt(tag, MT.TAG)
  }

  _pushDate (gen, obj) {
    // Round date, to get seconds since 1970-01-01 00:00:00 as defined in
    // Sec. 2.4.1 and get a possibly more compact encoding. Note that it is
    // still allowed to encode fractions of seconds which can be achieved by
    // changing overwriting the encode function for Date objects.
    return gen._pushTag(TAG.DATE_EPOCH) && gen.pushAny(Math.round(obj / 1000))
  }

  _pushBuffer (gen, obj) {
    return gen._pushInt(obj.length, MT.BYTE_STRING) && gen.push(obj)
  }

  _pushNoFilter (gen, obj) {
    return gen._pushBuffer(gen, obj.slice())
  }

  _pushRegexp (gen, obj) {
    return gen._pushTag(TAG.REGEXP) && gen.pushAny(obj.source)
  }

  _pushSet (gen, obj) {
    if (!gen._pushInt(obj.size, MT.ARRAY)) {
      return false
    }
    for (const x of obj) {
      if (!gen.pushAny(x)) {
        return false
      }
    }
    return true
  }

  _pushUrl (gen, obj) {
    return gen._pushTag(TAG.URI) && gen.pushAny(obj.format())
  }

  _pushBigint (obj) {
    let tag = TAG.POS_BIGINT
    if (obj.isNegative()) {
      obj = obj.negated().minus(1)
      tag = TAG.NEG_BIGINT
    }
    let str = obj.toString(16)
    if (str.length % 2) {
      str = '0' + str
    }
    const buf = Buffer.from(str, 'hex')
    return this._pushTag(tag) && this._pushBuffer(this, buf)
  }

  _pushBigNumber (gen, obj) {
    if (obj.isNaN()) {
      return gen._pushNaN()
    }
    if (!obj.isFinite()) {
      return gen._pushInfinity(obj.isNegative() ? -Infinity : Infinity)
    }
    if (obj.isInteger()) {
      return gen._pushBigint(obj)
    }
    if (!(gen._pushTag(TAG.DECIMAL_FRAC) &&
      gen._pushInt(2, MT.ARRAY))) {
      return false
    }

    const dec = obj.decimalPlaces()
    const slide = obj.multipliedBy(new Bignumber(10).pow(dec))
    if (!gen._pushIntNum(-dec)) {
      return false
    }
    if (slide.abs().isLessThan(MAXINT_BN)) {
      return gen._pushIntNum(slide.toNumber())
    } else {
      return gen._pushBigint(slide)
    }
  }

  _pushMap (gen, obj) {
    if (!gen._pushInt(obj.size, MT.MAP)) {
      return false
    }

    return this._pushRawMap(
      obj.size,
      Array.from(obj)
    )
  }

  _pushObject (obj) {
    if (!obj) {
      return this._pushUInt8(NULL)
    }

    var len = this.semanticTypes.length
    for (var i = 0; i < len; i++) {
      if (obj instanceof this.semanticTypes[i][0]) {
        return this.semanticTypes[i][1].call(obj, this, obj)
      }
    }

    var f = obj.encodeCBOR
    if (typeof f === 'function') {
      return f.call(obj, this)
    }

    var keys = Object.keys(obj)
    var keyLength = keys.length
    if (!this._pushInt(keyLength, MT.MAP)) {
      return false
    }

    return this._pushRawMap(
      keyLength,
      keys.map((k) => [k, obj[k]])
    )
  }

  _pushRawMap (len, map) {
    // Sort keys for canoncialization
    // 1. encode key
    // 2. shorter key comes before longer key
    // 3. same length keys are sorted with lower
    //    byte value before higher

    map = map.map(function (a) {
      a[0] = Encoder.encode(a[0])
      return a
    }).sort(utils.keySorter)

    for (var j = 0; j < len; j++) {
      if (!this.push(map[j][0])) {
        return false
      }

      if (!this.pushAny(map[j][1])) {
        return false
      }
    }

    return true
  }

  /**
   * Alias for `.pushAny`
   *
   * @param {*} obj
   * @returns {boolean} true on success
   */
  write (obj) {
    return this.pushAny(obj)
  }

  /**
   * Push any supported type onto the encoded stream
   *
   * @param {any} obj
   * @returns {boolean} true on success
   */
  pushAny (obj) {
    var typ = toType(obj)

    switch (typ) {
      case 'Number':
        return this._pushNumber(obj)
      case 'String':
        return this._pushString(obj)
      case 'Boolean':
        return this._pushBoolean(obj)
      case 'Object':
        return this._pushObject(obj)
      case 'Array':
        return this._pushArray(this, obj)
      case 'Uint8Array':
        return this._pushBuffer(this, Buffer.isBuffer(obj) ? obj : Buffer.from(obj))
      case 'Null':
        return this._pushUInt8(NULL)
      case 'Undefined':
        return this._pushUndefined(obj)
      case 'Map':
        return this._pushMap(this, obj)
      case 'Set':
        return this._pushSet(this, obj)
      case 'URL':
        return this._pushUrl(this, obj)
      case 'BigNumber':
        return this._pushBigNumber(this, obj)
      case 'Date':
        return this._pushDate(this, obj)
      case 'RegExp':
        return this._pushRegexp(this, obj)
      case 'Symbol':
        switch (obj) {
          case SYMS.NULL:
            return this._pushObject(null)
          case SYMS.UNDEFINED:
            return this._pushUndefined(undefined)
          // TODO: Add pluggable support for other symbols
          default:
            throw new Error('Unknown symbol: ' + obj.toString())
        }
      default:
        throw new Error('Unknown type: ' + typeof obj + ', ' + (obj ? obj.toString() : ''))
    }
  }

  finalize () {
    if (this.offset === 0) {
      return null
    }

    var result = this.result
    var resultLength = this.resultLength
    var resultMethod = this.resultMethod
    var offset = this.offset

    // Determine the size of the buffer
    var size = 0
    var i = 0

    for (; i < offset; i++) {
      size += resultLength[i]
    }

    var res = Buffer.allocUnsafe(size)
    var index = 0
    var length = 0

    // Write the content into the result buffer
    for (i = 0; i < offset; i++) {
      length = resultLength[i]

      switch (resultMethod[i]) {
        case 0:
          result[i].copy(res, index)
          break
        case 1:
          res.writeUInt8(result[i], index, true)
          break
        case 2:
          res.writeUInt16BE(result[i], index, true)
          break
        case 3:
          res.writeUInt32BE(result[i], index, true)
          break
        case 4:
          res.writeDoubleBE(result[i], index, true)
          break
        case 5:
          res.write(result[i], index, length, 'utf8')
          break
        default:
          throw new Error('unkown method')
      }

      index += length
    }

    var tmp = res

    this._reset()

    return tmp
  }

  _reset () {
    this.result = []
    this.resultMethod = []
    this.resultLength = []
    this.offset = 0
  }

  /**
   * Encode the given value
   * @param {*} o
   * @returns {Buffer}
   */
  static encode (o) {
    const enc = new Encoder()
    const ret = enc.pushAny(o)
    if (!ret) {
      throw new Error('Failed to encode input')
    }

    return enc.finalize()
  }
}

module.exports = Encoder

},{"./constants":44,"./utils":52,"bignumber.js":31,"buffer":4,"iso-url":76}],49:[function(require,module,exports){
'use strict'

// exports.Commented = require('./commented')
exports.Diagnose = require('./diagnose')
exports.Decoder = require('./decoder')
exports.Encoder = require('./encoder')
exports.Simple = require('./simple')
exports.Tagged = require('./tagged')

// exports.comment = exports.Commented.comment
exports.decodeAll = exports.Decoder.decodeAll
exports.decodeFirst = exports.Decoder.decodeFirst
exports.diagnose = exports.Diagnose.diagnose
exports.encode = exports.Encoder.encode
exports.decode = exports.Decoder.decode

exports.leveldb = {
  decode: exports.Decoder.decodeAll,
  encode: exports.Encoder.encode,
  buffer: true,
  name: 'cbor'
}

},{"./decoder":46,"./diagnose":47,"./encoder":48,"./simple":50,"./tagged":51}],50:[function(require,module,exports){
'use strict'

const constants = require('./constants')
const MT = constants.MT
const SIMPLE = constants.SIMPLE
const SYMS = constants.SYMS

/**
 * A CBOR Simple Value that does not map onto a known constant.
 */
class Simple {
  /**
   * Creates an instance of Simple.
   *
   * @param {integer} value - the simple value's integer value
   */
  constructor (value) {
    if (typeof value !== 'number') {
      throw new Error('Invalid Simple type: ' + (typeof value))
    }
    if ((value < 0) || (value > 255) || ((value | 0) !== value)) {
      throw new Error('value must be a small positive integer: ' + value)
    }
    this.value = value
  }

  /**
   * Debug string for simple value
   *
   * @returns {string} simple(value)
   */
  toString () {
    return 'simple(' + this.value + ')'
  }

  /**
   * Debug string for simple value
   *
   * @returns {string} simple(value)
   */
  inspect () {
    return 'simple(' + this.value + ')'
  }

  /**
   * Push the simple value onto the CBOR stream
   *
   * @param {cbor.Encoder} gen The generator to push onto
   * @returns {number}
   */
  encodeCBOR (gen) {
    return gen._pushInt(this.value, MT.SIMPLE_FLOAT)
  }

  /**
   * Is the given object a Simple?
   *
   * @param {any} obj - object to test
   * @returns {bool} - is it Simple?
   */
  static isSimple (obj) {
    return obj instanceof Simple
  }

  /**
   * Decode from the CBOR additional information into a JavaScript value.
   * If the CBOR item has no parent, return a "safe" symbol instead of
   * `null` or `undefined`, so that the value can be passed through a
   * stream in object mode.
   *
   * @param {Number} val - the CBOR additional info to convert
   * @param {bool} hasParent - Does the CBOR item have a parent?
   * @returns {(null|undefined|Boolean|Symbol)} - the decoded value
   */
  static decode (val, hasParent) {
    if (hasParent == null) {
      hasParent = true
    }
    switch (val) {
      case SIMPLE.FALSE:
        return false
      case SIMPLE.TRUE:
        return true
      case SIMPLE.NULL:
        if (hasParent) {
          return null
        } else {
          return SYMS.NULL
        }
      case SIMPLE.UNDEFINED:
        if (hasParent) {
          return undefined
        } else {
          return SYMS.UNDEFINED
        }
      case -1:
        if (!hasParent) {
          throw new Error('Invalid BREAK')
        }
        return SYMS.BREAK
      default:
        return new Simple(val)
    }
  }
}

module.exports = Simple

},{"./constants":44}],51:[function(require,module,exports){
'use strict'

/**
 * A CBOR tagged item, where the tag does not have semantics specified at the
 * moment, or those semantics threw an error during parsing. Typically this will
 * be an extension point you're not yet expecting.
 */
class Tagged {
  /**
   * Creates an instance of Tagged.
   *
   * @param {Number} tag - the number of the tag
   * @param {any} value - the value inside the tag
   * @param {Error} err - the error that was thrown parsing the tag, or null
   */
  constructor (tag, value, err) {
    this.tag = tag
    this.value = value
    this.err = err
    if (typeof this.tag !== 'number') {
      throw new Error('Invalid tag type (' + (typeof this.tag) + ')')
    }
    if ((this.tag < 0) || ((this.tag | 0) !== this.tag)) {
      throw new Error('Tag must be a positive integer: ' + this.tag)
    }
  }

  /**
   * Convert to a String
   *
   * @returns {String} string of the form '1(2)'
   */
  toString () {
    return `${this.tag}(${JSON.stringify(this.value)})`
  }

  /**
   * Push the simple value onto the CBOR stream
   *
   * @param {cbor.Encoder} gen The generator to push onto
   * @returns {number}
   */
  encodeCBOR (gen) {
    gen._pushTag(this.tag)
    return gen.pushAny(this.value)
  }

  /**
   * If we have a converter for this type, do the conversion.  Some converters
   * are built-in.  Additional ones can be passed in.  If you want to remove
   * a built-in converter, pass a converter in whose value is 'null' instead
   * of a function.
   *
   * @param {Object} converters - keys in the object are a tag number, the value
   *   is a function that takes the decoded CBOR and returns a JavaScript value
   *   of the appropriate type.  Throw an exception in the function on errors.
   * @returns {any} - the converted item
   */
  convert (converters) {
    var er, f
    f = converters != null ? converters[this.tag] : undefined
    if (typeof f !== 'function') {
      f = Tagged['_tag' + this.tag]
      if (typeof f !== 'function') {
        return this
      }
    }
    try {
      return f.call(Tagged, this.value)
    } catch (error) {
      er = error
      this.err = er
      return this
    }
  }
}

module.exports = Tagged

},{}],52:[function(require,module,exports){
'use strict'

const { Buffer } = require('buffer')
const Bignumber = require('bignumber.js').BigNumber

const constants = require('./constants')
const SHIFT32 = constants.SHIFT32
const SHIFT16 = constants.SHIFT16
const MAX_SAFE_HIGH = 0x1fffff

exports.parseHalf = function parseHalf (buf) {
  var exp, mant, sign
  sign = buf[0] & 0x80 ? -1 : 1
  exp = (buf[0] & 0x7C) >> 2
  mant = ((buf[0] & 0x03) << 8) | buf[1]
  if (!exp) {
    return sign * 5.9604644775390625e-8 * mant
  } else if (exp === 0x1f) {
    return sign * (mant ? 0 / 0 : 2e308)
  } else {
    return sign * Math.pow(2, exp - 25) * (1024 + mant)
  }
}

function toHex (n) {
  if (n < 16) {
    return '0' + n.toString(16)
  }

  return n.toString(16)
}

exports.arrayBufferToBignumber = function (buf) {
  const len = buf.byteLength
  let res = ''
  for (let i = 0; i < len; i++) {
    res += toHex(buf[i])
  }

  return new Bignumber(res, 16)
}

// convert an Object into a Map
exports.buildMap = (obj) => {
  const res = new Map()
  const keys = Object.keys(obj)
  const length = keys.length
  for (let i = 0; i < length; i++) {
    res.set(keys[i], obj[keys[i]])
  }
  return res
}

exports.buildInt32 = (f, g) => {
  return f * SHIFT16 + g
}

exports.buildInt64 = (f1, f2, g1, g2) => {
  const f = exports.buildInt32(f1, f2)
  const g = exports.buildInt32(g1, g2)

  if (f > MAX_SAFE_HIGH) {
    return new Bignumber(f).times(SHIFT32).plus(g)
  } else {
    return (f * SHIFT32) + g
  }
}

exports.writeHalf = function writeHalf (buf, half) {
  // assume 0, -0, NaN, Infinity, and -Infinity have already been caught

  // HACK: everyone settle in.  This isn't going to be pretty.
  // Translate cn-cbor's C code (from Carsten Borman):

  // uint32_t be32;
  // uint16_t be16, u16;
  // union {
  //   float f;
  //   uint32_t u;
  // } u32;
  // u32.f = float_val;

  const u32 = Buffer.allocUnsafe(4)
  u32.writeFloatBE(half, 0)
  const u = u32.readUInt32BE(0)

  // if ((u32.u & 0x1FFF) == 0) { /* worth trying half */

  // hildjj: If the lower 13 bits are 0, we won't lose anything in the conversion
  if ((u & 0x1FFF) !== 0) {
    return false
  }

  //   int s16 = (u32.u >> 16) & 0x8000;
  //   int exp = (u32.u >> 23) & 0xff;
  //   int mant = u32.u & 0x7fffff;

  var s16 = (u >> 16) & 0x8000 // top bit is sign
  const exp = (u >> 23) & 0xff // then 5 bits of exponent
  const mant = u & 0x7fffff

  //   if (exp == 0 && mant == 0)
  //     ;              /* 0.0, -0.0 */

  // hildjj: zeros already handled.  Assert if you don't believe me.

  //   else if (exp >= 113 && exp <= 142) /* normalized */
  //     s16 += ((exp - 112) << 10) + (mant >> 13);
  if ((exp >= 113) && (exp <= 142)) {
    s16 += ((exp - 112) << 10) + (mant >> 13)

  //   else if (exp >= 103 && exp < 113) { /* denorm, exp16 = 0 */
  //     if (mant & ((1 << (126 - exp)) - 1))
  //       goto float32;         /* loss of precision */
  //     s16 += ((mant + 0x800000) >> (126 - exp));
  } else if ((exp >= 103) && (exp < 113)) {
    if (mant & ((1 << (126 - exp)) - 1)) {
      return false
    }
    s16 += ((mant + 0x800000) >> (126 - exp))

    //   } else if (exp == 255 && mant == 0) { /* Inf */
    //     s16 += 0x7c00;

    // hildjj: Infinity already handled

  //   } else
  //     goto float32;           /* loss of range */
  } else {
    return false
  }

  //   ensure_writable(3);
  //   u16 = s16;
  //   be16 = hton16p((const uint8_t*)&u16);
  buf.writeUInt16BE(s16, 0)
  return true
}

exports.keySorter = function (a, b) {
  var lenA = a[0].byteLength
  var lenB = b[0].byteLength

  if (lenA > lenB) {
    return 1
  }

  if (lenB > lenA) {
    return -1
  }

  return a[0].compare(b[0])
}

// Adapted from http://www.2ality.com/2012/03/signedzero.html
exports.isNegativeZero = (x) => {
  return x === 0 && (1 / x < 0)
}

exports.nextPowerOf2 = (n) => {
  let count = 0
  // First n in the below condition is for
  // the case where n is 0
  if (n && !(n & (n - 1))) {
    return n
  }

  while (n !== 0) {
    n >>= 1
    count += 1
  }

  return 1 << count
}

},{"./constants":44,"bignumber.js":31,"buffer":4}],53:[function(require,module,exports){
(function (Buffer){(function (){
const {chacha20poly1305Encrypt, chacha20poly1305Decrypt, blake2b, sha3_256} = require("./crypto-primitives")

const cbor = require('borc')
const crc32 = require('../utils/crc32')
const base58 = require('../utils/base58')
const bech32 = require('../utils/bech32')
const pbkdf2 = require('../utils/pbkdf2')
const variableLengthEncode = require('../utils/variableLengthEncode')
const CborIndefiniteLengthArray = require('../utils/CborIndefiniteLengthArray')
const {validateBuffer, validateDerivationScheme, validateArray, validateString, validateNetworkId, validateUint32} = require("../utils/validation")

const AddressTypes = {
  'BASE': 0b0000,
  'POINTER': 0b0100,
  'ENTERPRISE': 0b0110,
  'BOOTSTRAP': 0b1000,
  'REWARD': 0b1110
}

const shelleyAddressTypes = [AddressTypes.BASE, AddressTypes.POINTER, AddressTypes.ENTERPRISE, AddressTypes.REWARD]

const PUB_KEY_LEN = 32
const KEY_HASH_LEN = 28
const MAINNET_PROTOCOL_MAGIC = 764824073

function validatePointer(input) {
  if (!input.hasOwnProperty('blockIndex')
    || !input.hasOwnProperty('txIndex')
    || !input.hasOwnProperty('certificateIndex')) {
    throw new Error('Invalid pointer! Missing one of blockIndex, txIndex, certificateIndex')
  }
  if (!Number.isInteger(input.blockIndex)
    || !Number.isInteger(input.txIndex)
    || !Number.isInteger(input.certificateIndex)) {
    throw new Error('Invalid pointer! values must be integer')
  }
}

function packBootstrapAddress(derivationPath, xpub, hdPassphrase, derivationScheme, protocolMagic) {
  validateBuffer(xpub, 64)
  validateDerivationScheme(derivationScheme)
  validateUint32(protocolMagic)

  if (derivationScheme === 1) {
    validateArray(derivationPath)
    validateBuffer(hdPassphrase, 32)
  }

  let addressPayload, addressAttributes
  if (derivationScheme === 1 && derivationPath.length > 0) {
    addressPayload = encryptDerivationPath(derivationPath, hdPassphrase)
    addressAttributes = new Map([[1, cbor.encode(addressPayload)]])
  } else {
    addressPayload = Buffer.from([])
    addressAttributes = new Map()
  }

  if (protocolMagic !== MAINNET_PROTOCOL_MAGIC) {
    addressAttributes.set(2, cbor.encode(protocolMagic))
  }

  const getAddressRootHash = (input) => blake2b(sha3_256(cbor.encode(input)), 28)

  const addressRoot = getAddressRootHash([
    0,
    [0, xpub],
    addressPayload.length > 0 ? new Map([[1, cbor.encode(addressPayload)]]) : new Map(),
  ])
  const addressType = 0 // Public key address
  const addressData = [addressRoot, addressAttributes, addressType]
  const addressDataEncoded = cbor.encode(addressData)

  return cbor.encode([new cbor.Tagged(24, addressDataEncoded), crc32(addressDataEncoded)])
}

function getAddressHeader(addressType, networkId) {
  return Buffer.from([(addressType << 4) | networkId])
}

function getPubKeyBlake2b224Hash(pubKey) {
  validateBuffer(pubKey, PUB_KEY_LEN)

  return blake2b(pubKey, KEY_HASH_LEN)
}

function packBaseAddress(spendingKeyHash, stakingKeyHash, networkId) {
  validateBuffer(spendingKeyHash, KEY_HASH_LEN)
  validateBuffer(stakingKeyHash, KEY_HASH_LEN)
  validateNetworkId(networkId)

  return Buffer.concat([
    getAddressHeader(AddressTypes.BASE, networkId),
    spendingKeyHash,
    stakingKeyHash,
  ])
}

function packPointerAddress(pubKeyHash, pointer, networkId) {
  validateBuffer(pubKeyHash, KEY_HASH_LEN)
  validatePointer(pointer)
  validateNetworkId(networkId)

  const {blockIndex, txIndex, certificateIndex} = pointer

  return Buffer.concat([
    getAddressHeader(AddressTypes.POINTER, networkId),
    pubKeyHash,
    Buffer.concat([
      variableLengthEncode(blockIndex),
      variableLengthEncode(txIndex),
      variableLengthEncode(certificateIndex)
    ])
  ])
}

function packEnterpriseAddress(spendingKeyHash, networkId) {
  validateBuffer(spendingKeyHash, KEY_HASH_LEN)
  validateNetworkId(networkId)

  return Buffer.concat([
    getAddressHeader(AddressTypes.ENTERPRISE, networkId),
    spendingKeyHash
  ])
}

function packRewardAddress(stakingKeyHash, networkId) {
  validateBuffer(stakingKeyHash, KEY_HASH_LEN)
  validateNetworkId(networkId)

  return Buffer.concat([
    getAddressHeader(AddressTypes.REWARD, networkId),
    stakingKeyHash
  ])
}

function getBootstrapAddressAttributes(addressBuffer) {
  // we decode the address from the base58 string
  // and then we strip the 24 CBOR data tags (the "[0].value" part)
  const addressAsBuffer = cbor.decode(addressBuffer)[0].value
  const addressData = cbor.decode(addressAsBuffer)
  const addressAttributes = addressData[1]

  // cbor decoder decodes empty map as empty object, so we re-cast it to Map(0)
  if (!(addressAttributes instanceof Map)) {
    return new Map()
  }

  return addressAttributes
}

function getBootstrapAddressDerivationPath(addressBuffer, hdPassphrase) {
  const addressAttributes = getBootstrapAddressAttributes(addressBuffer)
  const addressPayloadCbor = addressAttributes.get(1)

  if (!addressPayloadCbor) {
    return null
  }
  const addressPayload = cbor.decode(addressPayloadCbor)


  let derivationPath = null
  try {
    derivationPath = decryptDerivationPath(addressPayload, hdPassphrase)
  } catch (e) {
    throw new Error('Unable to get derivation path from address')
  }

  if (derivationPath && derivationPath.length > 2) {
    throw Error('Invalid derivation path length, should be at most 2')
  }

  return derivationPath
}

function getBootstrapAddressProtocolMagic(addressBuffer) {
  const addressAttributes = getBootstrapAddressAttributes(addressBuffer)

  const protocolMagicCbor = addressAttributes.get(2)
  if (!protocolMagicCbor) {
    return MAINNET_PROTOCOL_MAGIC
  }

  return cbor.decode(protocolMagicCbor)
}

function isValidBootstrapAddress(address) {
  validateString(address)

  try {
    const addressAsArray = cbor.decode(base58.decode(address))
    // we strip the 24 CBOR data taga by taking the "value" attribute from the "Tagged" object
    const addressDataEncoded = addressAsArray[0].value
    const crc32Checksum = addressAsArray[1]

    if (crc32Checksum !== crc32(addressDataEncoded)) {
      return false
    }

  } catch (e) {
    return false
  }
  return true
}

function isValidShelleyAddress(address) {
  validateString(address)

  try {
    const {data: addressBuffer} = bech32.decode(address)
    
    if (!shelleyAddressTypes.includes(getAddressType(addressBuffer))) {
      return false
    }
  } catch (e) {
    return false
  }
  return true
}

function addressToBuffer(addressStr) {
  validateString(addressStr)

  try {
    return base58.decode(addressStr)
  } catch (e) {
    return bech32.decode(addressStr).data
  }
}


function getAddressType(addressBuffer) {
  validateBuffer(addressBuffer)

  return addressBuffer[0] >> 4
}

function getShelleyAddressNetworkId(addressBuffer) {
  validateBuffer(addressBuffer)

  return addressBuffer[0] & 15
}

function encryptDerivationPath(derivationPath, hdPassphrase) {
  const serializedDerivationPath = cbor.encode(new CborIndefiniteLengthArray(derivationPath))

  return chacha20poly1305Encrypt(
    serializedDerivationPath,
    hdPassphrase,
    Buffer.from('serokellfore')
  )
}

function decryptDerivationPath(addressPayload, hdPassphrase) {
  const decipheredDerivationPath = chacha20poly1305Decrypt(
    addressPayload,
    hdPassphrase,
    Buffer.from('serokellfore')
  )

  try {
    return cbor.decode(Buffer.from(decipheredDerivationPath))
  } catch (err) {
    throw new Error('incorrect address or passphrase')
  }
}

async function xpubToHdPassphrase(xpub) {
  validateBuffer(xpub, 64)

  return pbkdf2(xpub, 'address-hashing', 500, 32, 'sha512')
}

module.exports = {
  addressToBuffer,
  packBootstrapAddress,
  packBaseAddress,
  packPointerAddress,
  packEnterpriseAddress,
  packRewardAddress,
  getAddressType,
  getShelleyAddressNetworkId,
  getBootstrapAddressAttributes,
  getBootstrapAddressDerivationPath,
  getBootstrapAddressProtocolMagic,
  isValidBootstrapAddress,
  isValidShelleyAddress,
  xpubToHdPassphrase,
  getPubKeyBlake2b224Hash,
  AddressTypes,
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"../utils/CborIndefiniteLengthArray":61,"../utils/base58":63,"../utils/bech32":64,"../utils/crc32":65,"../utils/pbkdf2":66,"../utils/validation":68,"../utils/variableLengthEncode":69,"./crypto-primitives":54,"borc":49,"buffer":4}],54:[function(require,module,exports){
(function (Buffer){(function (){
const Module = require('../lib.js')

const {validateBuffer, validateString, validateArray} = require("../utils/validation")

function blake2b(input, outputLen) {
  validateBuffer(input)

  const inputLen = input.length
  const inputArrPtr = Module._malloc(inputLen)
  const inputArr = new Uint8Array(Module.HEAPU8.buffer, inputArrPtr, inputLen)
  const outputArrPtr = Module._malloc(outputLen)
  const outputArr = new Uint8Array(Module.HEAPU8.buffer, outputArrPtr, outputLen)

  inputArr.set(input)

  Module._emscripten_blake2b(inputArrPtr, inputLen, outputArrPtr, outputLen)

  Module._free(inputArrPtr)
  Module._free(outputArrPtr)

  return Buffer.from(outputArr)
}

function hmac_sha512(initKey, inputs) {
  validateBuffer(initKey)
  validateArray(inputs)
  inputs.map(validateBuffer)

  const ctxLen = Module._emscripten_size_of_hmac_sha512_ctx()
  const ctxArrPtr = Module._malloc(ctxLen)
  const ctxArr = new Uint8Array(Module.HEAPU8.buffer, ctxArrPtr, ctxLen)

  const initKeyLen = initKey.length
  const initKeyArrPtr = Module._malloc(initKeyLen)
  const initKeyArr = new Uint8Array(Module.HEAPU8.buffer, initKeyArrPtr, initKeyLen)

  const outputLen = 64
  const outputArrPtr = Module._malloc(outputLen)
  const outputArr = new Uint8Array(Module.HEAPU8.buffer, outputArrPtr, outputLen)

  initKeyArr.set(initKey)

  Module._emscripten_hmac_sha512_init(ctxArrPtr, initKeyArrPtr, initKeyLen)

  for (let i = 0; i < inputs.length; i++) {
    const inputLen = inputs[i].length
    const inputArrPtr = Module._malloc(inputLen)
    const inputArr = new Uint8Array(Module.HEAPU8.buffer, inputArrPtr, inputLen)

    inputArr.set(inputs[i])

    Module._emscripten_hmac_sha512_update(ctxArrPtr, inputArrPtr, inputLen)

    Module._free(inputArrPtr)
  }

  Module._emscripten_hmac_sha512_final(ctxArrPtr, outputArrPtr)

  Module._free(initKeyArrPtr)
  Module._free(ctxArrPtr)
  Module._free(outputArrPtr)

  return Buffer.from(outputArr)
}


function chacha20poly1305Encrypt(input, key, nonce) {
  validateBuffer(input)
  validateBuffer(key, 32)
  validateBuffer(nonce, 12)

  const inputLen = input.length
  const inputArrPtr = Module._malloc(inputLen)
  const inputArr = new Uint8Array(Module.HEAPU8.buffer, inputArrPtr, inputLen)

  const keyLen = key.length
  const keyArrPtr = Module._malloc(keyLen)
  const keyArr = new Uint8Array(Module.HEAPU8.buffer, keyArrPtr, keyLen)

  const nonceLen = nonce.length
  const nonceArrPtr = Module._malloc(nonceLen)
  const nonceArr = new Uint8Array(Module.HEAPU8.buffer, nonceArrPtr, nonceLen)

  const tagLen = 16
  const outputLen = inputLen + tagLen
  const outputArrPtr = Module._malloc(outputLen)
  const outputArr = new Uint8Array(Module.HEAPU8.buffer, outputArrPtr, outputLen)

  inputArr.set(input)
  keyArr.set(key)
  nonceArr.set(nonce)

  const resultCode = Module._emscripten_chacha20poly1305_enc(keyArrPtr, nonceArrPtr, inputArrPtr, inputLen, outputArrPtr, outputArrPtr + inputLen, tagLen, 1)

  Module._free(inputArrPtr)
  Module._free(keyArrPtr)
  Module._free(nonceArrPtr)
  Module._free(outputArrPtr)

  if (resultCode !== 0) {
    throw Error('chacha20poly1305 encryption has failed!')
  }

  return Buffer.from(outputArr)
}

function chacha20poly1305Decrypt(input, key, nonce) {
  validateBuffer(input)
  validateBuffer(key, 32)
  validateBuffer(nonce, 12)

  // extract tag from input
  const tagLen = 16
  const tag = input.slice(input.length - tagLen, input.length)
  input = input.slice(0, input.length - tagLen)

  const inputLen = input.length
  const inputArrPtr = Module._malloc(inputLen)
  const inputArr = new Uint8Array(Module.HEAPU8.buffer, inputArrPtr, inputLen)

  const tagArrPtr = Module._malloc(tagLen)
  const tagArr = new Uint8Array(Module.HEAPU8.buffer, tagArrPtr, tagLen)

  const keyLen = key.length
  const keyArrPtr = Module._malloc(keyLen)
  const keyArr = new Uint8Array(Module.HEAPU8.buffer, keyArrPtr, keyLen)

  const nonceLen = nonce.length
  const nonceArrPtr = Module._malloc(nonceLen)
  const nonceArr = new Uint8Array(Module.HEAPU8.buffer, nonceArrPtr, nonceLen)

  const outputLen = inputLen
  const outputArrPtr = Module._malloc(outputLen)
  const outputArr = new Uint8Array(Module.HEAPU8.buffer, outputArrPtr, outputLen)

  inputArr.set(input)
  tagArr.set(tag)
  keyArr.set(key)
  nonceArr.set(nonce)

  const resultCode = Module._emscripten_chacha20poly1305_enc(keyArrPtr, nonceArrPtr, inputArrPtr, inputLen, outputArrPtr, tagArrPtr, tagLen, 0)

  Module._free(inputArrPtr)
  Module._free(keyArrPtr)
  Module._free(nonceArrPtr)
  Module._free(outputArrPtr)
  Module._free(tagArrPtr)

  if (resultCode !== 0) {
    throw Error('chacha20poly1305 decryption has failed!')
  }

  return Buffer.from(outputArr)
}

function sha3_256(input) {
  validateBuffer(input)
  const inputLen = input.length
  const inputArrPtr = Module._malloc(inputLen)
  const inputArr = new Uint8Array(Module.HEAPU8.buffer, inputArrPtr, inputLen)

  const outputLen = 32
  const outputArrPtr = Module._malloc(outputLen)
  const outputArr = new Uint8Array(Module.HEAPU8.buffer, outputArrPtr, outputLen)

  inputArr.set(input)

  Module._emscripten_sha3_256(inputArrPtr, inputLen, outputArrPtr)

  Module._free(inputArrPtr)
  Module._free(outputArrPtr)

  return Buffer.from(outputArr)
}

// used for encoding/decoding seeds to JSON in Daedalus
function cardanoMemoryCombine(input, password) {
  validateBuffer(input)
  validateString(password)

  if (password === '') {
    return input
  }

  const transformedPassword = blake2b(Buffer.from(password, 'utf-8'), 32)
  const transformedPasswordLen = transformedPassword.length
  const transformedPasswordArrPtr = Module._malloc(transformedPasswordLen)
  const transformedPasswordArr = new Uint8Array(Module.HEAPU8.buffer, transformedPasswordArrPtr, transformedPasswordLen)

  const inputLen = input.length
  const inputArrPtr = Module._malloc(inputLen)
  const inputArr = new Uint8Array(Module.HEAPU8.buffer, inputArrPtr, inputLen)

  const outputArrPtr = Module._malloc(inputLen)
  const outputArr = new Uint8Array(Module.HEAPU8.buffer, outputArrPtr, inputLen)

  inputArr.set(input)
  transformedPasswordArr.set(transformedPassword)

  Module._emscripten_cardano_memory_combine(transformedPasswordArrPtr, transformedPasswordLen, inputArrPtr, outputArrPtr, inputLen)

  Module._free(inputArrPtr)
  Module._free(outputArrPtr)
  Module._free(transformedPasswordArrPtr)

  return Buffer.from(outputArr)
}

module.exports = {
  blake2b,
  chacha20poly1305Decrypt,
  chacha20poly1305Encrypt,
  hmac_sha512,
  sha3_256,
  cardanoMemoryCombine,
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"../lib.js":59,"../utils/validation":68,"buffer":4}],55:[function(require,module,exports){
(function (Buffer){(function (){
const bip39 = require('bip39')

const {validateBuffer, validateDerivationIndex, validateDerivationScheme, validateMnemonic} = require("../utils/validation")
const crypto = require("./crypto-primitives")
const pbkdf2 = require('../utils/pbkdf2')
const Module = require('../lib.js')

async function mnemonicToRootKeypair(mnemonic, derivationScheme) {
  validateDerivationScheme(derivationScheme)

  if (derivationScheme === 1) {
    return mnemonicToRootKeypairV1(mnemonic)
  } else if (derivationScheme === 2) {
    return mnemonicToRootKeypairV2(mnemonic, '')
  } else {
    throw Error(`Derivation scheme ${derivationScheme} not implemented`)
  }
}

function mnemonicToRootKeypairV1(mnemonic) {
  const seed = mnemonicToSeedV1(mnemonic)
  return seedToKeypairV1(seed)
}

function mnemonicToSeedV1(mnemonic) {
  validateMnemonic(mnemonic)
  const entropy = Buffer.from(bip39.mnemonicToEntropy(mnemonic), 'hex')

  return cborEncodeBuffer(crypto.blake2b(cborEncodeBuffer(entropy), 32))
}

function seedToKeypairV1(seed) {
  let result
  for (let i = 1; result === undefined && i <= 1000; i++) {
    try {
      const digest = crypto.hmac_sha512(seed, [Buffer.from(`Root Seed Chain ${i}`, 'ascii')])
      const tempSeed = digest.slice(0, 32)
      const chainCode = digest.slice(32, 64)

      result = trySeedChainCodeToKeypairV1(tempSeed, chainCode)

    } catch (e) {
      if (e.name === 'InvalidKeypair') {
        continue
      }

      throw e
    }
  }

  if (result === undefined) {
    const e = new Error('Secret key generation from mnemonic is looping forever')
    e.name = 'RuntimeException'
    throw e
  }

  return result
}

function trySeedChainCodeToKeypairV1(seed, chainCode) {
  validateBuffer(seed, 32)
  validateBuffer(chainCode, 32)

  const seedArrPtr = Module._malloc(32)
  const seedArr = new Uint8Array(Module.HEAPU8.buffer, seedArrPtr, 32)
  const chainCodeArrPtr = Module._malloc(32)
  const chainCodeArr = new Uint8Array(Module.HEAPU8.buffer, chainCodeArrPtr, 32)
  const keypairArrPtr = Module._malloc(128)
  const keypairArr = new Uint8Array(Module.HEAPU8.buffer, keypairArrPtr, 128)

  seedArr.set(seed)
  chainCodeArr.set(chainCode)

  const returnCode = Module._emscripten_wallet_secret_from_seed(seedArrPtr, chainCodeArrPtr, keypairArrPtr)

  Module._free(seedArrPtr)
  Module._free(chainCodeArrPtr)
  Module._free(keypairArrPtr)

  if (returnCode === 1) {
    const e = new Error('Invalid keypair')
    e.name = 'InvalidKeypair'

    throw e
  }

  return Buffer.from(keypairArr)
}

async function mnemonicToRootKeypairV2(mnemonic, password) {
  const seed = mnemonicToSeedV2(mnemonic)
  const rootSecret = await seedToKeypairV2(seed, password)

  return seedToKeypairV2(seed, password)
}

function mnemonicToSeedV2(mnemonic) {
  validateMnemonic(mnemonic)
  return Buffer.from(bip39.mnemonicToEntropy(mnemonic), 'hex')
}

async function seedToKeypairV2(seed, password) {
  const xprv = await pbkdf2(password, seed, 4096, 96, 'sha512')

  xprv[0] &= 248
  xprv[31] &= 31
  xprv[31] |= 64

  const publicKey = toPublic(xprv.slice(0, 64))

  return Buffer.concat([xprv.slice(0, 64), publicKey, xprv.slice(64,)])
}

function toPublic(privateKey) {
  validateBuffer(privateKey, 64)

  const privateKeyArrPtr = Module._malloc(64)
  const privateKeyArr = new Uint8Array(Module.HEAPU8.buffer, privateKeyArrPtr, 64)
  const publicKeyArrPtr = Module._malloc(32)
  const publicKeyArr = new Uint8Array(Module.HEAPU8.buffer, publicKeyArrPtr, 32)

  privateKeyArr.set(privateKey)

  Module._emscripten_to_public(privateKeyArrPtr, publicKeyArrPtr)

  Module._free(privateKeyArrPtr)
  Module._free(publicKeyArrPtr)

  return Buffer.from(publicKeyArr)
}

function derivePrivate(parentKey, index, derivationScheme) {
  validateBuffer(parentKey, 128)
  validateDerivationIndex(index)
  validateDerivationScheme(derivationScheme)

  const parentKeyArrPtr = Module._malloc(128)
  const parentKeyArr = new Uint8Array(Module.HEAPU8.buffer, parentKeyArrPtr, 128)
  const childKeyArrPtr = Module._malloc(128)
  const childKeyArr = new Uint8Array(Module.HEAPU8.buffer, childKeyArrPtr, 128)

  parentKeyArr.set(parentKey)

  Module._emscripten_derive_private(parentKeyArrPtr, index, childKeyArrPtr, derivationScheme)
  Module._free(parentKeyArrPtr)
  Module._free(childKeyArrPtr)

  return Buffer.from(childKeyArr)
}

function derivePublic(parentExtPubKey, index, derivationScheme) {
  validateBuffer(parentExtPubKey, 64)
  validateDerivationIndex(index)
  validateDerivationScheme(derivationScheme)

  const parentPubKey = parentExtPubKey.slice(0, 32)
  const parentChainCode = parentExtPubKey.slice(32, 64)

  const parentPubKeyArrPtr = Module._malloc(32)
  const parentPubKeyArr = new Uint8Array(Module.HEAPU8.buffer, parentPubKeyArrPtr, 32)
  const parentChainCodeArrPtr = Module._malloc(32)
  const parentChainCodeArr = new Uint8Array(Module.HEAPU8.buffer, parentChainCodeArrPtr, 32)

  const childPubKeyArrPtr = Module._malloc(32)
  const childPubKeyArr = new Uint8Array(Module.HEAPU8.buffer, childPubKeyArrPtr, 32)
  const childChainCodeArrPtr = Module._malloc(32)
  const childChainCodeArr = new Uint8Array(Module.HEAPU8.buffer, childChainCodeArrPtr, 32)

  parentPubKeyArr.set(parentPubKey)
  parentChainCodeArr.set(parentChainCode)

  const resultCode = Module._emscripten_derive_public(parentPubKeyArrPtr, parentChainCodeArrPtr, index, childPubKeyArrPtr, childChainCodeArrPtr, derivationScheme)

  Module._free(parentPubKeyArrPtr)
  Module._free(parentChainCodeArrPtr)
  Module._free(parentPubKeyArrPtr)
  Module._free(parentChainCodeArrPtr)

  if (resultCode !== 0) {
    throw Error(`derivePublic has exited with code ${resultCode}`)
  }

  return Buffer.concat([Buffer.from(childPubKeyArr), Buffer.from(childChainCodeArr)])
}

function cborEncodeBuffer(input) {
  validateBuffer(input)

  const len = input.length
  let cborPrefix = []

  if (len < 24) {
    cborPrefix = [0x40 + len]
  } else if (len < 256) {
    cborPrefix = [0x58, len]
  } else {
    throw Error('CBOR encode for more than 256 bytes not yet implemented')
  }

  return Buffer.concat([Buffer.from(cborPrefix), input])
}

module.exports = {
  mnemonicToRootKeypair,
  derivePublic,
  derivePrivate,
  toPublic,
  _mnemonicToSeedV1: mnemonicToSeedV1,
  _seedToKeypairV1: seedToKeypairV1,
  _seedToKeypairV2: seedToKeypairV2,
  _mnemonicToSeedV2: mnemonicToSeedV2,
}
}).call(this)}).call(this,require("buffer").Buffer)
},{"../lib.js":59,"../utils/pbkdf2":66,"../utils/validation":68,"./crypto-primitives":54,"bip39":33,"buffer":4}],56:[function(require,module,exports){
(function (Buffer){(function (){
const bip39 = require('bip39')

const {validateBuffer, validateString, validatePaperWalletMnemonic} = require("../utils/validation")
const pbkdf2 = require('../utils/pbkdf2')
const crypto = require("./crypto-primitives")
const Module = require('../lib.js')


async function decodePaperWalletMnemonic(paperWalletMnemonic) {
  validatePaperWalletMnemonic(paperWalletMnemonic)

  const paperWalletMnemonicAsList = paperWalletMnemonic.split(' ')

  const mnemonicScrambledPart = paperWalletMnemonicAsList.slice(0, 18).join(' ')
  const mnemonicPassphrasePart = paperWalletMnemonicAsList.slice(18, 27).join(' ')

  const passphrase = await mnemonicToPaperWalletPassphrase(mnemonicPassphrasePart)
  const unscrambledMnemonic = await paperWalletUnscrambleStrings(passphrase, mnemonicScrambledPart)

  return unscrambledMnemonic
}

async function mnemonicToPaperWalletPassphrase(mnemonic, password) {
  const mnemonicBuffer = Buffer.from(mnemonic, 'utf8')
  const salt = `mnemonic${password || ''}`
  const saltBuffer = Buffer.from(salt, 'utf8')
  return (await pbkdf2(mnemonicBuffer, saltBuffer, 2048, 32, 'sha512')).toString('hex')
}

/* taken from https://github.com/input-output-hk/rust-cardano/blob/08796d9f100f417ff30549b297bd20b249f87809/cardano/src/paperwallet.rs */
async function paperWalletUnscrambleStrings(passphrase, mnemonic) {
  const input = Buffer.from(bip39.mnemonicToEntropy(mnemonic), 'hex')
  const saltLength = 8

  if (saltLength >= input.length) {
    throw Error('unscrambleStrings: Input is too short')
  }

  const outputLength = input.length - saltLength

  const output = await pbkdf2(passphrase, input.slice(0, saltLength), 10000, outputLength, 'sha512')

  for (let i = 0; i < outputLength; i++) {
    output[i] = output[i] ^ input[saltLength + i]
  }

  return bip39.entropyToMnemonic(output)
}

module.exports = {
  decodePaperWalletMnemonic,
}
}).call(this)}).call(this,require("buffer").Buffer)
},{"../lib.js":59,"../utils/pbkdf2":66,"../utils/validation":68,"./crypto-primitives":54,"bip39":33,"buffer":4}],57:[function(require,module,exports){
(function (Buffer){(function (){

const {validateBuffer} = require("../utils/validation")
const Module = require('../lib.js')

function sign(msg, keypair) {
  validateBuffer(msg)
  validateBuffer(keypair, 128)

  const msgLen = msg.length
  const msgArrPtr = Module._malloc(msgLen)
  const msgArr = new Uint8Array(Module.HEAPU8.buffer, msgArrPtr, msgLen)
  const keypairArrPtr = Module._malloc(128)
  const keypairArr = new Uint8Array(Module.HEAPU8.buffer, keypairArrPtr, 128)
  const sigPtr = Module._malloc(64)
  const sigArr = new Uint8Array(Module.HEAPU8.buffer, sigPtr, 64)

  msgArr.set(msg)
  keypairArr.set(keypair)

  Module._emscripten_sign(keypairArrPtr, msgArrPtr, msgLen, sigPtr)
  Module._free(msgArrPtr)
  Module._free(keypairArrPtr)
  Module._free(sigPtr)

  return Buffer.from(sigArr)
}

function verify(msg, publicKey, sig) {
  validateBuffer(msg)
  validateBuffer(publicKey, 32)
  validateBuffer(sig, 64)

  const msgLen = msg.length
  const msgArrPtr = Module._malloc(msgLen)
  const msgArr = new Uint8Array(Module.HEAPU8.buffer, msgArrPtr, msgLen)
  const publicKeyArrPtr = Module._malloc(32)
  const publicKeyArr = new Uint8Array(Module.HEAPU8.buffer, publicKeyArrPtr, 32)
  const sigPtr = Module._malloc(64)
  const sigArr = new Uint8Array(Module.HEAPU8.buffer, sigPtr, 64)

  msgArr.set(msg)
  publicKeyArr.set(publicKey)
  sigArr.set(sig)

  const result = Module._emscripten_verify(msgArrPtr, msgLen, publicKeyArrPtr, sigPtr) === 0

  Module._free(msgArrPtr)
  Module._free(publicKeyArrPtr)
  Module._free(sigPtr)

  return result
}

module.exports = {
  sign,
  verify,
}
}).call(this)}).call(this,require("buffer").Buffer)
},{"../lib.js":59,"../utils/validation":68,"buffer":4}],58:[function(require,module,exports){
const crypto = require('./features/crypto-primitives')
const address = require('./features/address');
const keyDerivation = require('./features/key-derivation')
const signing = require('./features/signing')
const paperWallets = require('./features/paper-wallets')

const base58 = require('./utils/base58')
const bech32 = require('./utils/bech32')
const scrypt = require('./utils/scrypt-async')

const Module = require('./lib.js')

module.exports = {
  ...address,
  ...keyDerivation,
  ...signing,
  ...paperWallets,
  base58,
  bech32,
  scrypt,
  blake2b: crypto.blake2b,
  cardanoMemoryCombine: crypto.cardanoMemoryCombine,
  _sha3_256: crypto.sha3_256,
  _chacha20poly1305Decrypt: crypto.chacha20poly1305Decrypt,
  _chacha20poly1305Encrypt: crypto.chacha20poly1305Encrypt,
}

},{"./features/address":53,"./features/crypto-primitives":54,"./features/key-derivation":55,"./features/paper-wallets":56,"./features/signing":57,"./lib.js":59,"./utils/base58":63,"./utils/bech32":64,"./utils/scrypt-async":67}],59:[function(require,module,exports){
(function (process,Buffer){(function (){
var Module=typeof Module!=="undefined"?Module:{};var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}Module["arguments"]=[];Module["thisProgram"]="./this.program";Module["quit"]=(function(status,toThrow){throw toThrow});Module["preRun"]=[];Module["postRun"]=[];var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof require==="function"&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;ENVIRONMENT_IS_SHELL=!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;if(ENVIRONMENT_IS_NODE){var nodeFS;var nodePath;Module["read"]=function shell_read(filename,binary){var ret;ret=tryParseAsDataURI(filename);if(!ret){if(!nodeFS)nodeFS=require("fs");if(!nodePath)nodePath=require("path");filename=nodePath["normalize"](filename);ret=nodeFS["readFileSync"](filename)}return binary?ret:ret.toString()};Module["readBinary"]=function readBinary(filename){var ret=Module["read"](filename,true);if(!ret.buffer){ret=new Uint8Array(ret)}assert(ret.buffer);return ret};if(process["argv"].length>1){Module["thisProgram"]=process["argv"][1].replace(/\\/g,"/")}Module["arguments"]=process["argv"].slice(2);if(typeof module!=="undefined"){module["exports"]=Module}Module["quit"]=(function(status){process["exit"](status)});Module["inspect"]=(function(){return"[Emscripten Module object]"})}else if(ENVIRONMENT_IS_SHELL){if(typeof read!="undefined"){Module["read"]=function shell_read(f){var data=tryParseAsDataURI(f);if(data){return intArrayToString(data)}return read(f)}}Module["readBinary"]=function readBinary(f){var data;data=tryParseAsDataURI(f);if(data){return data}if(typeof readbuffer==="function"){return new Uint8Array(readbuffer(f))}data=read(f,"binary");assert(typeof data==="object");return data};if(typeof scriptArgs!="undefined"){Module["arguments"]=scriptArgs}else if(typeof arguments!="undefined"){Module["arguments"]=arguments}if(typeof quit==="function"){Module["quit"]=(function(status){quit(status)})}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){Module["read"]=function shell_read(url){try{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText}catch(err){var data=tryParseAsDataURI(url);if(data){return intArrayToString(data)}throw err}};if(ENVIRONMENT_IS_WORKER){Module["readBinary"]=function readBinary(url){try{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}catch(err){var data=tryParseAsDataURI(url);if(data){return data}throw err}}}Module["readAsync"]=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}var data=tryParseAsDataURI(url);if(data){onload(data.buffer);return}onerror()};xhr.onerror=onerror;xhr.send(null)};Module["setWindowTitle"]=(function(title){document.title=title})}else{}var out=Module["print"]||(typeof console!=="undefined"?console.log.bind(console):typeof print!=="undefined"?print:null);var err=Module["printErr"]||(typeof printErr!=="undefined"?printErr:typeof console!=="undefined"&&console.warn.bind(console)||out);for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}moduleOverrides=undefined;var STACK_ALIGN=16;function staticAlloc(size){var ret=STATICTOP;STATICTOP=STATICTOP+size+15&-16;return ret}function dynamicAlloc(size){var ret=HEAP32[DYNAMICTOP_PTR>>2];var end=ret+size+15&-16;HEAP32[DYNAMICTOP_PTR>>2]=end;if(end>=TOTAL_MEMORY){var success=enlargeMemory();if(!success){HEAP32[DYNAMICTOP_PTR>>2]=ret;return 0}}return ret}function alignMemory(size,factor){if(!factor)factor=STACK_ALIGN;var ret=size=Math.ceil(size/factor)*factor;return ret}function getNativeTypeSize(type){switch(type){case"i1":case"i8":return 1;case"i16":return 2;case"i32":return 4;case"i64":return 8;case"float":return 4;case"double":return 8;default:{if(type[type.length-1]==="*"){return 4}else if(type[0]==="i"){var bits=parseInt(type.substr(1));assert(bits%8===0);return bits/8}else{return 0}}}}function warnOnce(text){if(!warnOnce.shown)warnOnce.shown={};if(!warnOnce.shown[text]){warnOnce.shown[text]=1;err(text)}}var jsCallStartIndex=1;var functionPointers=new Array(0);var funcWrappers={};function dynCall(sig,ptr,args){if(args&&args.length){return Module["dynCall_"+sig].apply(null,[ptr].concat(args))}else{return Module["dynCall_"+sig].call(null,ptr)}}var GLOBAL_BASE=8;var ABORT=0;var EXITSTATUS=0;function assert(condition,text){if(!condition){abort("Assertion failed: "+text)}}function getCFunc(ident){var func=Module["_"+ident];assert(func,"Cannot call unknown function "+ident+", make sure it is exported");return func}var JSfuncs={"stackSave":(function(){stackSave()}),"stackRestore":(function(){stackRestore()}),"arrayToC":(function(arr){var ret=stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}),"stringToC":(function(str){var ret=0;if(str!==null&&str!==undefined&&str!==0){var len=(str.length<<2)+1;ret=stackAlloc(len);stringToUTF8(str,ret,len)}return ret})};var toC={"string":JSfuncs["stringToC"],"array":JSfuncs["arrayToC"]};function ccall(ident,returnType,argTypes,args,opts){function convertReturnValue(ret){if(returnType==="string")return Pointer_stringify(ret);if(returnType==="boolean")return Boolean(ret);return ret}var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func.apply(null,cArgs);ret=convertReturnValue(ret);if(stack!==0)stackRestore(stack);return ret}function setValue(ptr,value,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":HEAP8[ptr>>0]=value;break;case"i8":HEAP8[ptr>>0]=value;break;case"i16":HEAP16[ptr>>1]=value;break;case"i32":HEAP32[ptr>>2]=value;break;case"i64":tempI64=[value>>>0,(tempDouble=value,+Math_abs(tempDouble)>=+1?tempDouble>+0?(Math_min(+Math_floor(tempDouble/+4294967296),+4294967295)|0)>>>0:~~+Math_ceil((tempDouble- +(~~tempDouble>>>0))/+4294967296)>>>0:0)],HEAP32[ptr>>2]=tempI64[0],HEAP32[ptr+4>>2]=tempI64[1];break;case"float":HEAPF32[ptr>>2]=value;break;case"double":HEAPF64[ptr>>3]=value;break;default:abort("invalid type for setValue: "+type)}}var ALLOC_STATIC=2;var ALLOC_NONE=4;function Pointer_stringify(ptr,length){if(length===0||!ptr)return"";var hasUtf=0;var t;var i=0;while(1){t=HEAPU8[ptr+i>>0];hasUtf|=t;if(t==0&&!length)break;i++;if(length&&i==length)break}if(!length)length=i;var ret="";if(hasUtf<128){var MAX_CHUNK=1024;var curr;while(length>0){curr=String.fromCharCode.apply(String,HEAPU8.subarray(ptr,ptr+Math.min(length,MAX_CHUNK)));ret=ret?ret+curr:curr;ptr+=MAX_CHUNK;length-=MAX_CHUNK}return ret}return UTF8ToString(ptr)}var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(u8Array,idx){var endPtr=idx;while(u8Array[endPtr])++endPtr;if(endPtr-idx>16&&u8Array.subarray&&UTF8Decoder){return UTF8Decoder.decode(u8Array.subarray(idx,endPtr))}else{var u0,u1,u2,u3,u4,u5;var str="";while(1){u0=u8Array[idx++];if(!u0)return str;if(!(u0&128)){str+=String.fromCharCode(u0);continue}u1=u8Array[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}u2=u8Array[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u3=u8Array[idx++]&63;if((u0&248)==240){u0=(u0&7)<<18|u1<<12|u2<<6|u3}else{u4=u8Array[idx++]&63;if((u0&252)==248){u0=(u0&3)<<24|u1<<18|u2<<12|u3<<6|u4}else{u5=u8Array[idx++]&63;u0=(u0&1)<<30|u1<<24|u2<<18|u3<<12|u4<<6|u5}}}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}}}function UTF8ToString(ptr){return UTF8ArrayToString(HEAPU8,ptr)}function stringToUTF8Array(str,outU8Array,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){if(outIdx>=endIdx)break;outU8Array[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;outU8Array[outIdx++]=192|u>>6;outU8Array[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;outU8Array[outIdx++]=224|u>>12;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else if(u<=2097151){if(outIdx+3>=endIdx)break;outU8Array[outIdx++]=240|u>>18;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else if(u<=67108863){if(outIdx+4>=endIdx)break;outU8Array[outIdx++]=248|u>>24;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else{if(outIdx+5>=endIdx)break;outU8Array[outIdx++]=252|u>>30;outU8Array[outIdx++]=128|u>>24&63;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}}outU8Array[outIdx]=0;return outIdx-startIdx}function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){++len}else if(u<=2047){len+=2}else if(u<=65535){len+=3}else if(u<=2097151){len+=4}else if(u<=67108863){len+=5}else{len+=6}}return len}var UTF16Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf-16le"):undefined;function demangle(func){return func}function demangleAll(text){var regex=/__Z[\w\d_]+/g;return text.replace(regex,(function(x){var y=demangle(x);return x===y?x:x+" ["+y+"]"}))}function jsStackTrace(){var err=new Error;if(!err.stack){try{throw new Error(0)}catch(e){err=e}if(!err.stack){return"(no stack trace available)"}}return err.stack.toString()}var buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferViews(){Module["HEAP8"]=HEAP8=new Int8Array(buffer);Module["HEAP16"]=HEAP16=new Int16Array(buffer);Module["HEAP32"]=HEAP32=new Int32Array(buffer);Module["HEAPU8"]=HEAPU8=new Uint8Array(buffer);Module["HEAPU16"]=HEAPU16=new Uint16Array(buffer);Module["HEAPU32"]=HEAPU32=new Uint32Array(buffer);Module["HEAPF32"]=HEAPF32=new Float32Array(buffer);Module["HEAPF64"]=HEAPF64=new Float64Array(buffer)}var STATIC_BASE,STATICTOP,staticSealed;var STACK_BASE,STACKTOP,STACK_MAX;var DYNAMIC_BASE,DYNAMICTOP_PTR;STATIC_BASE=STATICTOP=STACK_BASE=STACKTOP=STACK_MAX=DYNAMIC_BASE=DYNAMICTOP_PTR=0;staticSealed=false;function abortOnCannotGrowMemory(){abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value "+TOTAL_MEMORY+", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")}function enlargeMemory(){abortOnCannotGrowMemory()}var TOTAL_STACK=Module["TOTAL_STACK"]||5242880;var TOTAL_MEMORY=Module["TOTAL_MEMORY"]||16777216;if(TOTAL_MEMORY<TOTAL_STACK)err("TOTAL_MEMORY should be larger than TOTAL_STACK, was "+TOTAL_MEMORY+"! (TOTAL_STACK="+TOTAL_STACK+")");if(Module["buffer"]){buffer=Module["buffer"]}else{{buffer=new ArrayBuffer(TOTAL_MEMORY)}Module["buffer"]=buffer}updateGlobalBufferViews();function getTotalMemory(){return TOTAL_MEMORY}function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback();continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){Module["dynCall_v"](func)}else{Module["dynCall_vi"](func,callback.arg)}}else{func(callback.arg===undefined?null:callback.arg)}}}var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATEXIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;var runtimeExited=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function ensureInitRuntime(){if(runtimeInitialized)return;runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function preMain(){callRuntimeCallbacks(__ATMAIN__)}function exitRuntime(){callRuntimeCallbacks(__ATEXIT__);runtimeExited=true}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer)}function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i)}if(!dontAddNull)HEAP8[buffer>>0]=0}var Math_abs=Math.abs;var Math_ceil=Math.ceil;var Math_floor=Math.floor;var Math_min=Math.min;var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};var memoryInitializer=null;var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return String.prototype.startsWith?filename.startsWith(dataURIPrefix):filename.indexOf(dataURIPrefix)===0}STATIC_BASE=GLOBAL_BASE;STATICTOP=STATIC_BASE+30640;__ATINIT__.push();memoryInitializer="data:application/octet-stream;base64,AAAAAAAAAACjeFkDhHLTAL1uFQMOCmoAKcABAJjoeQG7PKADmHHOAf+24gKzDUgBAAAAAAAAAAA+kUDXBTkQnbO+QNEFnzn9CYqPaDSEwaVnEviYki/9RIU7jPXGk7wvGQ6M+8Ytk8/CQj1kmEgLJ2W61DM6nc8HWbtvS2cVvdvqpaLuAD/hQfrGV8kcndTNyuwWrx++Dk+o1bRCYKWZivasYE4MgSuPqjdusWsjnuBVJclpppW1a9dxPJP85ySStfUPepadRp8CB9bhZZqmWi4ufag/BgxZAmjT2qp+NG4FSO6Dk1nzuiZoB+YQvso7uNFeFgpPMUll0vyk6B9hVn26weX9U9M7vdZLIRrzMYFi2ltVhxW5KjCX7kyosCWvikuG6DCEWgIyZwGfAlAbwfT4gJobThZ6NEhn8fQR8puV+C32F2tOuE4qclsHb97XISq7Y7kEmlS/GGgFCgX+lan6YFZxiX4yc1CgBs3j6MOapEV0TD+TJ58J/I65UXMoOCX9ffTGZWdlkgr7PY00yieH5SEDkQ5osCYU5exFHr+UD7ptPcYr48BS+IzVdCnkGEzmsLF58ES61kekw4KRf7cpJ0vRFADVh6BkuBzxPOPzVRvrc35KFTO7pQhEvBKiAu1ex8NIUI1E7L9aDOsb3esG4kbxzEUpswPQ53mhMsh+TRIACp1yX/OPbQ6h1MFimHqyOFmsuGikjH17tgaYSTkn0ieE4ltXuVNFIOdcCLuEeEGuQUy2ODFxFXfr7gw6iK/IAIkVJ5s2p1naaLZlgL04zKK2e+VRpOOdaJGtnY83kfv4KCRfF4i5z58ytQoFn8BUE6LfZXixITKqmixvuqcjujtTIaBsOiwZkk926p3gF1MuXd1uHb+jTpTQXBpr0sCdszo1cHRJLlQoglKycX6SPChp6htGNtoPq6yKeiHISTU9VMYopWh1qxOLW9A3N7wsOmLvPCPZNJLz7V2n4vlYteGAdj2W+yM8bqxBJyzDAQ4yoSSQOo8+3QRmWbdZLHCI4ncDs2wjw9leZpwzsS/lvGFg5xUJfqM0qDXofd/qV5ho2pzhiyazZ3E2hREswtXv29mznlheUapJVGNb7TqCxgufxGWoxNFCW+kfDIW5FdMDb23XMB2cL2MO3cwuFTGJdpa20FFYemOoa7ffUjnvDqBJfdNtx+QGIRdERGxpf42SgNZT+yY/TWmknnO0sEuGLhGXxhDeX759J8STZKJ+rRmtT10mkEUwRsjfAA4J/mbtqxzmJQXIWIOgKqYMR0IgeuNKPWrc7RE7ptNkdO8GCFWvm78DBGZYzCjhEz9+dFm07HNYb/VoEsztPbagLOKGRWN4bVY0CMGcn6Q3FlHEm6jVVo6829J/fw/stRzZNcxeyluXM9AvWsaFQgWhw2cW8yoRZGxY7hpzQOIKaCqyk0fzpfsU1PeFaRZG1zxXAMjJhF4+WR4TYXu28sMvbFL8g+qcghTCld2XhHtD/6e1TqowTnRsi+iFPGFdDJ5zgXVfHsfZL7jscU4vC+ch43ekQLndVuaATx3OzlZlv357XVPEO/wF3d6vUq6zuCTPMDvtjGOVNJWBvqmDvKQzBB9lXEdnNzfZrdFA/Zm6LyfQ9JZvFgezrjvwFVLwY0OZ+Rg7bKW+H5BlJBTLlUBjNVXBFkAUEu9gvBCJDBQ4nox8kDBXkPVriltB4fF4pw9+p8O6959ABlCaopq411JvVlpjevYcUgKUUp0KC+4/UWZa3w9c55iPzgfhv4iGYdTtLDhxfgqgP+ReL3cgZxSxzpoHlrGU+OhKgqwATSL4SsRszffZUxcANNs9li0jaTxYOJe02ofeHYXykaD50deqtu1IoC/+tRJN4/yWxPvwce1b861rgrlzYcUo/2FyBNJvILFv+XabdJIeb60mfCvfE4lLUCPTZkvDixx1wJ1AjLjHlgfCk35vBa6mrgT2Wh+ZnOS+8VEjwWZr/+61CKhhUSHgAQ/Bzg9EHv5JplhNZH53rTGirvwh0tB/iFocRALzEcWDcaoBSUVOJMSd0vI9Ct7Yk3QOAitNIQyCfgbIbAq56m8WeTdB8PgajFS3sQi0mWIkfHoPzjnZBh75sGD3ExJtcnuIu0G+RkN0RH3oQCUrtRXU2kgdPmA7oRiKOnz3vc0vwSi3Tq6RZnxZTCN+yLSFCj2diGTn+ko1DMni2h2eagwHHocKiYm8S5m1ATNgQt1bOq5rczye1RnirWENZNSFJg8w5z631n2e5FXS9aweC2FcERaAyofhkl2XmTzCJZGXYleBExh1HoRHefpD10acY1n6xuV0KwXjHV4GoTCQuM+ixkd94NbwjhTQ2j88b1SRmnQ+nVeBuyYQYuxxgOzJNI31jBQn8DR59pKkRqkKhPa+hJlGVBhhiSq8oVzUu129HvryP2115Jp9L1fif0jziLtFw1aNqGBpbQvRn7mhrk6t648nZjmTjB9oqrGYDCkgnJQhjFI8nSGRUhE5e2ec/gLdBEEqQiQRXr+ycrU6o5gzDPqhZrZS+gFhy5TVU6+vADuGLLhqCdsGTiGBNU/kDMm2qCH1Kp5AKsEkZYGk/I6ktWUBdmqEoHSkkPHAfC/NhPnvEo8rqlgGKV5puMj+v9lnG1n6m7SAHA0vMYrs86teUXlZiBzwnsAzcHLLe4/Kxy7gPV21GJ9xs7mZHmSMofrlZeTtBZ/CNhEIYYsSMHCGT5tI75LrOi0QMtJhqBZhtFNi4SSqCxnnq349v75sSbr79UnUz1uKEJqUMOtzZLxw3UDcHA18MMGUwpJ0bvrLbagEVi5XnB6MYl0VQUeIxayGTYrrY1dR9lKjkVtRZ4jCpqEGtmQXfNTRiHJRi0HgQBFUctH2rBhgGgOfxkIn/omemCB/zC06/XeXSZLYT6UsfIUyoOMH0mTYeaIpfqYMHe0DBC7s6oWLJ3QW3yvLegfcIVZa9MthFkwKZNOVBfdQmQtzUsVOhzUtS8mNbySYz8jmxc41wBb6Rsv3zD0wCENF11vCTLIoldGaf4HBNWNlVGt/NnLAT262uGaDrYBzAHg6Eyp55xUhk8SFyd3NvaKJTMZi16OtqD0enSz4ZzAS27dbvmLKxmf0YQnuUhkh1iHsBHBH1Zt3YCMY0uDwWG3KDXROzs9SB+5I37cI7Abz+v/DxFlUuSoLcQWNoz6W+iUdFjxDeARXjBojnUOBwg4ntbefB9nj6pmq29kDK2wl9QMsfaRTe3UYD3l5WAzPMAF7MPn3fiV3PZAxr7uWvb1olGnP/tr0Ri8fvffWf6QUAe98f7NHStr9H9OFV5BzpBlSUkgZqWrmPd3YzNLAL8JkUEgv6v00ZiRImzouSmxOHD4p4RJRkksTbjegXaHctXg3cBExHEaviUWwIygDf0RcYFuJfMQgWYBlucyPO5IMEPDnd+/iAmUlAQDus66ozm2nJEzw5/DG/uk7YknjdZ5XaoYa5h0eFu9CVdW9Wsz0/hIvQMfA37IiRQoHpMlAf27QEGj2z3hBFM/GkDekGCV7YF4YGN9sjx2zWKJYYsNPp881bh3mZk//s+H31c1sq6xnUBTPlqUcQyygAOTTrkAtxOPbJg8ugCZF0mhwRZ4TMx8gUZ0DCGt/Uv0GAHwBZEmxGKikJS6wDiLVdQNGYoi6fDmyWVnwkzDBMHZ5qemNoTriJl4dcpHULyI6bG52INM5I+d5E8j7wxV48Srh3SCUYabV/aiF+MCp/1LC4cEiQBt3py86UYbZfdgIz9T5cZus9bODoh4bw2vQdhqXGZIYGjPGgE/7RW8W9c91x2HexzacHNlBkBvo1OMh/r2Da3wWMa9ydZ06L1EmnkoHaIjiy1vE94ARwcHthHumSfafYckaaBBLUkI4K/KH6ZzuOzRoUMhQYkqEcZ38EbEIHzQ2JGGNiU6H20Gd2SDcB2zxpf4JvJsP0GcsPXlA/16eMOLrRjgmLRrjSWOLNf3TmwC3352ka6CjuPGLf0UE2XgxqiIVOElhaVMvOCwQbS23mkD+2ifyRraRM8jobDAkBfVw/kWMCwyWpnVI2iAvDu920Ghb1I8LPc9R+wfUkuOgIxaNQpEUlcggSfJiogxjP8gH8AW41Mn10kW7b0UierVtn2EW/QijAURKTwisyqV2wxkiqH280UNG3rjexji9YC1ZgR1frA2mVoc2YVfcq+tqL+AXfQ/OTC0/GX/w3OyJd0ojIOjFhXuftmWHsrpo0Ytn8G+bDzMdfOdwOnyOr7BRbV86UrJ4cbYN0nZg0R7V+TQcB3AR5LMgSir2ZuP/PDWC1ny2+ofYW6ThC247QLoyaoQqAGBu6RIQktlDCdw7hsg4KPP0rGhgzWWm0+PXPBgt2ULZJWAznThZV//YLCs7JfA+MFBGSs+wa9Grd8UVQWtJ+p1Bq/SKrs+CEiioBqa43CHIn52MRgRgXMujKtRuCUAlnC/uEkxNWxKrHaOUgdDDC7oxd776AI2aiRieYn5gA4J/2fNDNwLMsotnb2y/DYRdi+GfMA04bnDHZeG5pi2wbqsgrn2ZurtX3ZbBKiN2Qjr6hHCKLENCS0Xlud/jGYqJXeRYnCEAn77R622hznfxH8t+RNtywfg7vS0oxh/Ez1/+Fap1wP+sgPmp4SToyXAH/bW1RZrZYc8keTob6YQJhok+PjAZCTDnHgtQQf1k8jmc4ufbFzStp5wTnCtqN5S9qXtZk44b6aBAmIhoNNcSF+F7Cf6rSpvRKRng3+H8baT/8aYslAjJw07xNSwnIcZl3ZMxzviJK+e7wCWhVjMQTYP+HC49qRkEcuKcsQqA+SLL+J4+ijZaYBVHUKUiwOnjjyQkX7BIPVXlJnZkzRb0E6z9bprdnwJCQUmlNL7OErl7872HuWQPZLTKmIXTpHFBjEzJmapYJ/oHuACwb28AI5JT2q3dkdL7q9FLV/oUglBL/tY+FWkCwsR3HVE5Z1qmlK8ULEYm3stLp6tv7GD5ItYD0FO7FRpGZcnzvIgoELJaOmhsdXbFJ0e0bMikWHc6dlCuk/YRgVSmVP0d3yGuHWVeEfOQjCQSlPTnjV/Rn11/cmNt0wgUAzO1x9fvmjdqS+KuzMWP4anTvo9PkTUvMx5S1+4qTSQ/FZYuQyiQOo7UFpwud7pk4diY60f6h8E7DMKG6hUBR20l0UZsy7eKmYgBZjq1MnjXA7pvkM6BDUV1UiCmobZ7boOOPEHXIU+qslyP6FXRVm/hWzSmS13iLT90rhyW2HTQ7WMc7vUYbfgp7fTnW8W9lwixOmZ50rpMzR/XoCSQ0YD4iij7CsIlxRlkOl9Ll6OxM3IA4u+8f30BKGsmah7v+hafc9XEaGyGLHYDG7wvivaNWreHXkN1WZSQwvPFXXzNqwWRKpqigcdYMBxCNh3GgNfU2NyW0ZxPaDd7atiXkhljetEaJFjQ0BcMHFytnAK6BwN6OITQzXwXBCZtLEKm3L1AgpRQPRWud8Zo+7TBwKlTz9Bh7dCLQpPMYGcYhAybmSqzGnoArs0Y2gtihuyNqETKkIGEypM1p5qEXpoYE5LN+thlNcPY1NG7/VNbVFKM5mMt2giDOScT1F5DKI3DQsnMeDJg81C97wPaeRqrB7tVM4y+rpeVJlMkcApMDqG53ht91WZYog/32ifNtdm5//0zLElFKSxXvjDN1kXHf8f7rrrj0+jf5AzaXaowiCyigMpbwJhUmH8X4QufiM5JOIiiVHsbrQWAHJL8I5/Doz0E8zEKR+zCdmNjvw9SFVbTpvtNz0VaBAjCoD+HvE/C7ucSm9Y8ZfIwhQzBqjjJCIrLayfbYJsXRnCsbw4ewCCp2nNkWfFzEi8RHuCKfPw5R5+rakqQdFL9Lo9yh4KK2UHyaVvYKleeXcALp1XXi0gw50LU8aS11gZiYVm8nqbR6oT3xe2XGaw4O7FRpxe1ZgaMhZt+hgZ9dEneTUURwKysnObpv5zN3yLZDA3D4NLbjTNDu6xfZo6tH5YqMowla4/HwUhUwBYpa6HgOxC0WexWaflZ0uy64y4yzfUTlLJ8eXLkzSR4h+kPO5G6CtE0234OrG0ugs2jThX4eGX/PQhmFwrwfzA/MEyFjLIX1jsK0+o7dzm3d9PFv1xqHoznxsbEtyqL97hhDQBF2Q1YA/wpk+y7b6R60uz4p+LCXxUKE9WhBrcaFWtBsDbB6e/XqFYgS+RYzeUHvavgVxvaL+av0uh3QvcqGhkxFDzFS/cWzt7tciDOJZcr5z6ytW/DubgIyVwLRQ4ufvsORk9DK+af1gc2ptQD094k2qC3DiFS8JNbVAC+fX4jMLQBZ+11NQEQ/Quf5pQQIyJ/5IMVDzJ141URsZmmr3EdtlM5m2/OZeZBoa/qOVjG/ln3qf1fQw+OwrHC6UIRAtZQO0ccPELqEO84Ox966FGVvsmyX7+Emxya+Hi8H3MAgBj4SBjHMOQZwc5eIgyWv+MVumuD4Nq2CFjhRzNvTUzJH33Bz+z3GBQ8QFGm9XVs3wzu9ytx3tsieuSnqt0/GXAZj5j83QwvG/W5sCdikWu+dpF3xLbHbqifj6gAlb84b4foNzzJ0h8sRtEYWh72onYSJDmC9YBQaUkNv565b2rrVQhWu8FGap3wk/g4uxYkwaxxjzcRHdfqlhijFGn3dcYj5La1IrHujv+G8hBwnZOMXc8dgyqpkBDrxUKf2m8T0b0Fo7HfTPkILPifnUs2D4pYu8Ol2IcqutzoC1GDIQIULa1eOGb3SjBYfMqA2I6gPR4hEOamEw0DbIB74RwHan96MEMBcVqdX6R9xJ7eY7DTepK+Uv67ImxCQP1BxIcT+IqXh9HD07UTRA5/PVorcqB8R7tISHsNktwer2qycTGoTFaXkDEvqRnhdSJMuHv/UFGHpDf+VU9ag/A8h9QfItFHirLYtw2m8aRwF9YUv6ZYvd1Tk/ih1OlDQjRjSlFsQWMVOk8gIiMtAwq66eBz+w4DD0FM3eD8qkqS+5al2kjHnKVcZo7KbqCsOC5LJUeozhce0gjHrzH3StjK/NZtZ5OXTMhdHfYUBoJB7+P5QZmsd2I0j7j1zal5ig76N8hYWJD8loVo+QwboFZ787vcHWrWNUl958LcCn+lxvJzTxy7oF8wvU96Dq1jxlTgTJ2CSDjjL4PDIfRCTPYbDchaeYQ0fPxucG6zYc/Bw7TJ33Plxxx4yXkd61xnr33bmkVwsyu0kUnbkRvK3AJLI5YmV9x4jB/lnt+f0x/ijIRi4V8alpThTyFZTk/NcQ3Hfb5JLfJQO9LPAJMycpH8RtSJRwiyfF0thXko5/J9aHDd3riReGghq/8L3DWqfWdDwEQrjrdOB6uHHBpn9NqZjtHG+meQT0jNu6w+5KS5K+8uxWDxi/07vIldCxpV88k3kmuw9Sgw1bAWTA6rys8sMZy8EBFtrnzCxStwq4ykVJtpx0SyLkm6VkC8721nttlIctdwW6DCPkvoiqrggRft9J5pmNGFjnDkE0V5E/R2qdNbdWNTCNEqPqBftWk15p6QdW81kLhpvv3x+Z+Eb8GLxMGMDbes8ZcYEMc92LtlwV592l0PAqEPnFuOUFYqxTcXdWMnqRm0btMClAKlYLR3fk608FZJPNQwYqjP52bReordwnAO7G+fUJRhZY1Rxkapfi7uXJvgZ/PBM5eVhJRjY6wPLhN+7bh9ltSReoF21wovJXRkJYUN4IIJ5OU8pRY4YbgyZM1I5L7353nQhngIZzrIai7b5KDZ1J/4QU9ac1wheUEq7dzX55RwjHCc00fDivuXAtkGqTPgO+F2ndkMo0QDcDTNayi5M67k3NadVbZ+77cfjtOzHxSLJ4bCQSJmhfox9CI2LkJsgq8tUDOYhykgwSOROCvht8GbiSSVqRIjuyTDZ94yF+2osUhJG0YYlLQ80rzPdkNDvY4IgBgehz7uD2tc+PUqDPhBlGf6BMOEcmitG7qjmd9FiRZd6//5Kh0N3x5iMqGK2ql5ZSJZoSK4MJPBmqd7GQRAdh1TGJfXrBY9HZstr3LfclokMqQ2KkZjN5azFnmgzj4JIzC59g4+Eq22h3jFxlnJuv6QX62e4ZQE9UKjYk7iFgAXFhhL004WmuYvGUzZfkgTFZE66iyuYSfepLnT9nuH6/NzEMYP2nhqxivlKF3xW44a8HAY40cs3YvCBryvGSQ6F2sl694lLZQ6DGjxgJ+i5ufpGhV+93FzeQFIWPEAEd2NsxazpEoFuHwmGY1GyN+vTeVmnHgoCxfsbmYqHesqYKd9q6YQRhP+sPaNx44TURv1deWJ2pdTufF6cR16IAlQ1iAruv0CIRX10XfnZSrN8WCqj4eRiVTlBrzavDu3sfvJfKnLeEhloeZcBQXknpYprVESaKe8NhWkfaoX9Ro6urLsKdsl1wpXJE6DsWdC3MUbznC1RHW2117R9wt68BpQNqBx+8/vSoVvBZsMvMf+1//152hSfVP6rhJDYsavd9mfOQJTX2dPHhcVBDY2LcM7SJiJEe8rzRBRlNCtbgqHYWWoonK7zAvIqbHqL5ZeGM19FGU15ueG8m1buzHgkrA+t9ZZq/AkQJYS/lBMXm0Yfp/o/oJ7OeCwMXBQxfbHO8I3jxBp/XhmwmNoYzH6hhXyMy1XSIz2B/yunnifzHNPAUetjhDiQi2b0t+UFRP1l2pMPzFdmFVhEFBFCAc/oesi09K4CCZrZ5N1Uw8Ne3EhTAYeEwtpTpGf4Cp1roe2G248Qpun8wtCRytbHGW6OIGAGxsx7LZxhrA1MbyxDP974PEMnPovXXS9yMkrHlpSv4GdRyYIJlvq21UB3w7HEdXQ9QyW6zziGmpO0yFX3zZg0LN7mSeI27H6anXIwwnC0znIHUzlW+EGSpkyGYddcluw2rHOtRw1MgXKt9pJFcR998GOJ2HY3lhcxWbykzcX2ElORczFdsnIqMMmvPiC41z59oVU6J3zL6jJwraoW/stjFks9Y7v7khzFS3xB5GAM9hbHVNraboIesXvw+4+7XcRSP/UF1XgBMtxpvE/ej3qVP58lLQzBhJCAGGReJiUC+j66+w8sedOwKTwlJVzvnCFkdW0mQrTNQoQEklHMb2CBr5vfm17I97GeeoRGXYe4d47OcvjO0MH9JfpXMBEef+jUVyw5D1dV3yEdlr9gTNYn9r2et4+hy0JNDdDZDF6FdmBqvTut7j6Bkim9eb+k7C2p39wVDZ3LoH5XU7hAmKq9eEVUBdZDaJsHeK603WiGFMCYAGKYUMFwSNMl/S96g2TRs6dJQpvqiy6mqK4LCAEDZYHLTZDFEt6H262x7fEzH4vDPUlfhVEHK8+cfxt8D73Y9pSZ0QvWMucUhzpVHyW+zXGZJIm9jBlGRJ49K9HJ1xv9uoYhAMX5EwyINN7McbEi0ik6EIQqGQTWk6L8R6yyY2izUscKgxHBB9v0MdN0lnAh9s+niayj9Ky+3ICW9F3SPbG0YtVfEVpvWlIgcTtIo0cvn2QbQ2rxVzVEtI7xoPcFKMwm2paPUaW0yQV7NDwJFrDimK7EqRfvBx5Ogylw6/7CsqlBATWQ6cKB0AfjOheJlvL0LrM3tKPZmsES1czlt3K/Vs5RtFvQSobnrxii1lQ4yj3xrVnaV092D80BJju+OcWdVI5nJpdGi3bfxEqXADRvEV3nOpv1VTxvtTvFtAi6CmaV3YXKsBJfo62RX+jqbyiUc0jG0wi7BFf1j6xvQWe3ISjQ/I0tFITtTwz4YDek0koMtjONQ11hyhRtcF3Jyq7FMUCRbbxi9rVS2hTS7X2ftOL+1PSsKnXFjkxWYBUYQmSYBGqz9opaRZNtI9ZE4RMn1LaWVU9Rcpj7+kLjmnFWxIeNc1NmzYWVjh6YzVcZacswHUhgPHU+RvCfULg5pF0fWMvvnv2GkabtNRhiavIegMD1vuZpvmf4d5xmirO5wYtGH/saAGrZI58ekPF7RVVSlrL2g7NR9MZVQmwkz40jKzUZyJ1IY5yS0UJ2LiE1PToWKo8kEZ/TSVY0xdSHCRDwKxEd1d6T7trfRzhE4OR1P41i4RGa8nGodxKvXGtEoMcbVWCOY0M40DvFzT6oxU+B/cxbmRzB8vzIU//ToIdbWxsdCHoG7FWZ/CB3fOjECP4rw9dRplqVdCy+AV/jMw4vnoJpC2lfofJSQxDHdybVWlDTNLrzPcJOCwCvYTuS6MUflcKO6dhrGji8PWlkTcQ+vry6QBta4I+4cFCj9dv6X76YCvXTb2+zv6UESIPBtpPavT/0cjAd1lKEpWSAPu4BFNwxm4pTTUdPbbYMa1fPgXD8+xCvbSMlQtn/VNjoQyOOSHzMys4igX1ibTASK0LuuJabrM9pQO1k4/mMqKVne2jWgFWt7T5qpgncq2NXBNyrF4joLdhYarO0k59j+mEsr8bYWXZx+l3Z2U2gMdyVBIry+5uUNmZMgVlzFeJXk7hB0qZ+Q2YyxLkTnHHbjxv1xWj/Xdckt7tpbsCNDEdOawLP5ukd8TNWAskF/BHZN7aOP2tasinMo2SGYGgr4Tteq9Q5Vv2FQHeT26yCWEhISaYKdnWrQuBBQJ4BtDruhajIRn8cLjffi9Cib2zdk/rayks903CNtTxOAewrnPiQd9YZIvB89marVrXnMGxYO8OalbZDlwlrAuaPvXHYqDsnQR7g0RENXrjy9yTvu0PM3mIdYfdxRLDBGB4ZA6Vwsvck2BtcOCFhZrzHzM557PYpdA2O0WPceHyuUN8qSdICOrRV0sDhGC+7t5rVLgPeLbCmTGVBi22q3Yzl5B9ZIvJgDFucbAooee2eu6qi6iTbVnBpDBhIbKC3rT3GL2X3Z2ZPjbEH+41wUOols/I5AhVs26XMNOMtQFoL7QrBTppeJvuSMauS+LcSBgvYK+8ulVym3Yx6e88bjzLkFWz+cablx8jxvMqzEveMVwfjSD+MLBLsGa0T8EJcI23EyR5CJv6mwf0DTDaUTqQ47BaqT0jZDmEgGQ1Cy3xPO2UcYGE9neMA0VC1aKA7cnzUjn2d3iLoAp1VAjRY6xt12tjcJQV+/Qe7HsWW+ZeToXCzdCWQgpZWZkhEJg037JyVv8LSirpXlfPLxiKkIDA1L2dSJnCcOEw3jP3Ule9ugUA/dMsEefUQwHYpApFvEZd2LkzpScSr8PCBokrJjueOBtYLzh+HgogxTr56me5jVHAUmYFm5i8cfWXcVbZhSv+OE4eZVLKDgWcDD9F3hpDw5s7cP9eBPXpPXuE7cl62fzG9FgcwuYOS+po5mB2OayXl7Q6Ff67GZufp+w0tXmxTFeuMaGfwFFhll3w/Q1c9Tp67rQq4C4m3QkXFxKHu7IRCwMPgPok7x+WMaca+1PWNxhk1z8wlZQPshc6+wkLIK0+YcgvKUlNVIZrlzD1r9IiBEbSwga4kI3luuVNbImh3BcMNMjmXwAoiIZSNJ+672qhfRAllP8bXDZL2WbNu1v3+m0xD5Ny5HJPCIGXjCCVJuEORSMLKlCxAt7vA6aunf1MozMnjC6dWid2KtM19vMH8GZlX4ZNqnpQRNAol+eFPDhk4A8Af+4f5ffbA9oFU3a9zTQUSfLapOyIStLN1Up7QwUE7lFA+QCyMNPDI2s1jQYbR7CbixzyPLhCbmwxbLMNseqLfpzXB1OXrwe7k+/Xp2a3Pc/QPljFHgtuv5hpzlIE1F3S/7dHEt0IvJz7+4ebwu7hOmsGir/BH9srJFcNtkumXqMgNRxKo8u8plPSgJshODihw2E+luOCmAG2w5Bv5g5ddwU9HFnAayFAb6jNfti8Eh0jux+QCccXnmqVtFUu0WY7DHU4GuUilEDxLmlx9l0rPMfAyyngTHTnTwEhfEgw08fiIQaNg1mCzGCYr9yan8bBSOqQMB5YZTdIJmW8pdN7CdYHAPPw27CWF663luF84bmv31S0o6rpcTCSJZ0uAKGcWI5dS6lCCJUdv8A+Lo9YY8PTsu/iUbs4FJYKhr8cPHjXgxXheqJd76Lu7HQBZ1UUOnxZehYJZhIqpslwj+2BLl8qJcconcwERwOQj8Us955nGx0mh1u+XyvhFgpYxYNOBlhJDehmUCaUKA1rjHwwhffD/P0SEQx42lMbiLND2AsXnAf/b/pk5OwGBSPlBWIeQ+O+Quq4USRCeTUA+8lK4wXsbVbQ1cBQzdbNO1cDu21o95pI78PzP3KmPMyKezHXwGhns8FV8eUltpSRe3uZp/N7QQAma23cvSzC9FLN3RReRFFRSRQ7SytQV7O8S0Rr/2eO24VjFidpvbjIlZLjMW8YE1WkviurRzGJKZEHkk+iU4yn9zC+SPlJSz3UT24IkOkSLrvff7OWDPH56hwSXpOanz+YWzrENhHfr5k+XfDjsnfexC6cxalvKcvzhE+/YYu8CPmoF9kGdxxdJdN6/JW3Y6Sw3RKcY5jVa4YkwDCf0aVg5PxYAy980YpeCS4VlaEHyF+eOAKPNqg75I3PAjtDkEMmQcVd/aGvNwEvAz3ojz6UonAFuRWLL0lFCGdwQvKUhP27YeFaHN4HQKx/eTu6dTzR7+iNTHAIMTfgM44axd/jzWASpV2dpYaMJaaZCNYiltHNcMDbOWKain1si4r+YGASQOu8R4izXp53h3vQBAmckbrd1B/OtKqNTMc+2zHPUcyGrWPMYywH3h28PxTiQ7lA+UhmLTL0OQwtvQwvlQYx+YGgrZd2Fmwq97rOqkBioJWiW5x0NPha0jfKW3yU1moxyeenO/FmrAy0jSOvvVbrMzX147kqNkA9uW7VaIUzclVaHVIUDp4YE3SDbagkHbI7ncFs0xATuYYjYrdrKgZcT6HXkYWbfFRXHn5QMaoDH87U/0h27PQcjKxU8OpF4Hw1CR2CJdKIWUjrmtxhskO7ebuIGR5b5Z01esF90J6gM+o9YOIuLLDCaydbz1VgMmQTlWyLPVEZe/QLACZx/pRnlU/V3RCNAmQJlELi1bQC8o3RKMtVobQI5WwYRkbM6olDgmyT9JzEEDRdrgnIpieIsQ0fzeumi+hbWmc619M3Wlj1FaPfLvJ+oWD/dHG2LFRpPcQKJyzNsspmalc+St1sA9dpJFn6eZkljD1gAxUi0OELOfnN7lnx44xyRCBCqfTwlHpmHImCNvSQOLf0HXskorKz4PKS5GARVSsGnmx8Dnt/DeKP6xWSWfxYJu/8YYz1+AcYIi5f1AmU1J9cVeMwprYfjaiqsj3gUtNFgmloehgYKoVdsdvXrN2G06rk84LE9g+B4rpEzwGvPUdMz0b55cSe7SVlQgMzkBYB2l4O3Mrly/KnsXJAX+sUzXs4KUCBSfGnbjwhVEgrOfh+Hny6zilWjMOIJLvFjA3lqmUQVw0g3yVFLBxKZ8q/1i07XDBAg+Gx5wcKFuccT+aYoWm8eBrZ4LJikGeWUMiciMlHuHBQQGZK9Z2/oZMkqeZpc+3Kxdw0RAHhM/uEPJZd7UfnoIbtdpUBcOT5Z9J7abIlZGiYE/s/Z524x11B2fulPF47J987zE7g0kxOtT1oIBSX0Z0kHr14tALBWF4ANQxiXKy6zC/TAvstpwj16zu2YNBazMFvu+40i6xGlukMG2pT3mumSdqw08GB0GFBO+gxTysGnhLH6JfYCjIpT4/kST9oGG9L4exbFwNVLbYez1VYPcJlEBB5WJyBlFBtCJ2Lp1/FEqkvQOLUkQhXZGWaZlKM9X3jtXYwNsyZ5925Otcg7hNJ4xyDvTMBumKq+1Ya7MmdXFBrPpQaN3ynu1clMFF2NEFWrnOYXIrFmWeDxBO54bNaRl06QmE/8ceHwRP8trm17GQ2+BkHtjemkwz4ZoDQi11q+9zEQkgaV+zE695lU+W4g+iy1Ce45ch9yL1QEeHfboM3bWDZqxHwFT41MpY7tyXDOrBkrtVfckRk1R19EmIz+H+kjxV8zXHEap+8iwwiSUNFcW4uc58hEllkDprIuggA5pfC4MPh6hHqTH18l+ef4Yvj880Fo2MPRTo6J0Y52DEvjwcQpZTegzGdOIBvmRdtbOPRe6ipk5ONjDEZ/v8qA1108mbbJH9JPJ8M75iFuuPTmLwUUx2aZ3xMIpjTHaspnmZdO54tNFgWkvzNc1nz/R2FVfYKlSXDQZpQ6SX5ptxuwL0zHxtk9PM+eYk+g52AEuyCiROhKCPwvwUL4MojcBMyNlnPrNEKz0pUiBwa0kkQdJanRCr6w4wLeOQSxQ3doIFo/vqlRMgN509AUkqPa450H+qjAe7Nd2JXXzBPI7yK8x4I3gUUvX9Xmg0q5jQUpYJeobdxYnIY9F+d24kXDAiOOfV45/MlIGCnXQO9BkyJmPq+Zqkl3ANqEECVthPoR9vl4RAmQzsqXfN2Eng46SYfrGnLoKCM29Qp0FMzM68KrdnlCdOspZ1mOPD3iMiKZVc8+r4sBVGKs0qT1WhnJSt82hPKIkRXwMGYHc4KytULqPGQpojArdHNKZzA3V/v0c/Wzl1X9/0+K+jCNBYgXWvVJZsr7QS7xkEwSOFW2fny8g8uazWfdZfnrVwCbF+7mEYae5oEFGi9SxBn7fFoMf3wUcI7b9jNHYEs3vLSBENc3ERJcSoJV8zoW2Pxf9Zfml2pgVbHTJ3mK+lX8iDeTAL4t/UtB/sgKk8gebDrMD07FMgwLmW9WhWJdTFcbY8xPDxlHxZ5whf7cCV1FbYsfzb6PmwC1hx2b/n1YiW1ZSoUx+jNCgNT6mXLPVokuAtVqS4Z0VCQj6j75sg1yaSILeqGeWiGAd6RXxwkqmzeQCkX2Cg6c9ki8Cy/j9EBWyPd/NcW5fDNX90OQghK+mKDqyD/zW4+GuLUGOFXK+Y5/BeWF+P9aRe871OaDc4Q9AROw1gDhQZuJ1pbE7YhFbnrx3CWXZyI2yHzVNYE1bW93RbBfV4t3aWNtt5UKZKiNDMXCLYc1xqZGCZPekqVX7FfAhin9I8bXGs0X/Y9EhHgAIXw/M1IGNPdTAy1EUsqN6+RssMk8keBcXCC2pPynomGZIWE3TPu4CNCMZZK1v+kCEQn6KbZdhWcfheOc/KzAj22SDN3Ucxrzk3OS0+EJSTiWs4fp56K9ZJWcuom9DzqHNcJGtLmARy3FN38c28LncRuYeIwFyPsyo9xVuSmT2vym0DrSDdfWWHlzkIwQaybRHlwfkIKMeK8beNahXwahF8hdq5M1uGcmgx0njjOudw0rrP8ZK3QSOMjA1CXGzjGYn3ws0WIZ1pGeVNUYSisDlf2eL3J4ZyRJzILW+XtkZuhqz78ZZA2JtblJcQlbt7X8aYGPj8IIwaOJ3b5Pndsik4m9hSMWUdIFYmgOWVz99LDdB/S6UVoxCVBVFDBM565+ehcTmJsGM3FquTFERlKuxTU28Tdjk9CmDy8shlpcco215+oSJC9GfAOMmUPxuD9yrHRhtSBUTsW4+Y/T5qT8voNr6hZKgcz7L3Hq0wuCpwIJJaeIzhH/jrAxEjHKqFPdirt2xeChRwy8JObY4nSeD+PeI/An01AoSynMP6dzGXP/It38iEgy1oWmOR+w6ERkeMI1XuJdJCA1JArKxn9cq7CrtLnpgK2hTxJ3w5oWptZWIHMrg7iresPT1fqB3+2InQd5E+0T50B45I7QBNBdoTSxGdnNfj19z9AkKDevubK+s+PHGmj39FUDMAE+FxGi4Evwk3474AUWvOgcVfWxwStv+iu9HZhsiqxWzX0u5N0zGQep8Owo+zZhL3lhecF+gzFawoSwy4YMoGbDxhzjFrH2gGjEarOs50DkO0tP647v3wHb46tUuD46hh1Mmx/G8RZiKSYMjj0vGAtD9nRsckpqRUYxFUXuxuHw0dIT+xxl1NEUW5djMl9sQX4a8bDRxrBYvfcmUZ2hZu4ALBmUMhQXeb7sJmis7DE7GLg6BpE6lQ35V+N1OgsoP4I0OreaHbdTYIjXWhLIEVkyGXWiV3NzxS1N9V1T6cpOEcYxHlGddrSgvCNYbLY1zvmCutHrCTvXjW0xjNITGh4IMkCOa06U9kjj1gD787dwmS0L+HPkHMlFZDT5ERNi2ZsDIJ4eiHPSDuXPieBsgpq93vtjoynZWypP0OKTwWmEXRtyJ25Mp1lTRXxOmB13EwEiOTC3CxxTLP/NIH7dGUTfLR1sRg95ZpXAqGS81kxcWj1Ne8euuxVhI85jEVyqMkem1CiANSk5ri0gsgLAteBm2F1lfGbzOdXYGTNx6WI3Try3DW2cFeJq7wfbPZs798Ch9G2vmgCU4V0nofM/CmZJEYwOVnUmMKF7Fn2X5g1fo86bvbyKqIsHSCnBqQxEbphKZCVFvGg0KOJvX66bGs7AgczeCY+WvF75+zYuwwxIFZD1jRJQ5OJUvUiEqUG+Nu5Ihz0w4+HbY8wl51NKmpnN9aF4nf0tUZmk2GPbGf/6EDdlLWrEXPspk3sjGXzRsh+xy6iHT+PXpsTzQFsdx0PE7ifmKLPj0wh1Z2bOSP3qm1Hvj3rYnU6X7igvY5UOOr3mXJ0RTHlwwBR1ScW5+kEE6KOray/BDtYhOiLFOhDtynbxRAIO1geK6q7s47lSVQr/pzcatIUmHgL3UiLP6sbPArGefn/4Q/ak9YtfC3eaESeRhmUXjW7UVTH3SNM3OYzYpl/RNa2pZNjvUT7b3zObM4HY/jG2JpLKAxdQzE1ESEsd3plxWao1FJzJGN+QqZdyiKs3ojGlBr4H667924GuQ9YWY04jK2IqCyf57+a8lhoPueNq88O6aV2fjefbwNUglkBvgtbSfA2HvSnxCl2V/bNDnG/ZFpLPCksRjjlTLG5OgvVVtBDNnBIWxgkN/lqiKjGCUUCIDJziVVLEzbg0p8oMzwjNuKDj8GuDLslH3DtbGHk+LCow32oJZ4OZgD3nKW89B8G42HpC8S9v5IMLhPBvnzZ9hid5Nu/dOYGSoTWYE6sIrX1IFFelVDAWwpyNVqAm0MJPwz8q0JiN4tO6EaTIlzzFxRp7PBOFLucmw6tIFf7j9S6+w4N+dtrkYHuv0NVY1IxgdTYezM/6wQRIu6+sV3Vm+6NuT9yCjerw8mR12gcv/GoRN48/RwZRG02FIy88kMXPJ47bIW1/CbaLpf7p2gOL7jMRDJZvOakZ0EAJ/Z2KJ07ZOtodg5AnR1dhAb8IQNDSxtqJFUifrs4ee6PzvhlJr7CLNaA6BT/Z+nuTjYvfm4u8fbSfstwM7M0zNaBhu6Rxc1Tp4XtnBACzoOIgFjBhXTt5GX+LW78dhGbYZxb0GyvtICEpbL0yd8txE3p6wKlTz00X31nTDr8CLgOd0mJ4pDbo0D0rCrM+5ibh9fe/k81IbYGafJUPmof6jQH05nBpGDWXBYxtoXAQJWCWfcjPjPi0QC5FgGtL09UTq6UQbK+RGzvVxhRHFRfmASNNi1rHqar9y6XpIRURDi2O7cd2SyWCJwS/Kp3BeaJFrbzOZthb4HuRClfmVE0fH3qn9D8UpH2XJOwlGyBSkBcKEeqmo4lt5MoBKacuBCcKBiXSUdZPSY/UyTF+OsSFe/DFMu/YgKOUbd31Xi4IG7wRVq+QTl1ZV+cbe2ufNC2Uf9ynGt3EalNDe/Z0dIXaj4/Bxiv8idpEFLXGeU//SIApjwst+Mip8ZlzGNPIXKTpgdTQH/jtJVnMy/XFKermRB2c6fQ+9bJy3GBxUjfX8kpO/S5t50ddY9RT0qCBdbEnS8xvXLA8rBFFVqFrCQfqgWVjjII1iTuIBQM0cFIR6Il+wZc5P/H5pXjKp5zugDWkIdc3pguWd+iwkXTt7/lIpm0+WA7WhHzeK1nPjooAya7iOr1JkSu+zuXhNl5BjZQTmkmDAOfXCbSGNXnfSlyObkMvscdJEiAMGOLTZvxMgiTKAINyd/TRRknRmgp4QVaSZwts+6Cuny5K/H8yO/O4NG1k66rLbCbjWkTnAzAOVBFLCTIu7+t2YEw0OwMyLyS38j1pmY1hEzOWILTJc94aJ1IMY5rrhWH8CucqxyFqgX6TvCXWqfJMvg/awdSawAceJWd4c/gKeIQY5YY34G2OWtRcNM531ciYcc7RONXTS0IzrkWfsv1Kbx6QUzxBzSrp/Qrzmuz1M51nxpW6eJ9y16ltvTUcN6Z24Vdf1IBSIGa7tNAxMnb7SlgGq+QKmuXHuaa/PQjadFfP+AdKDVXLdHt5kOuZKdKPi3R6fTYXwrYslsk8+t3mwe5L0cbMNgzc+5M8uZHxgkhbCfIElhG2WIQKrK+Q00W3DE4dftlcNdoKd57Sg0YkGexHCssswX9qE3SzF7AyIPv3wWsGs+hYc35ffLvvtuZHkd7o1ZVO5WB1XospPz3zPMzQ24oFDKdlws0DZ3CtuEHc1ZIGncxgtRN4STFsDK2pCsaVFGz7fNaKyhIYNGj6zZzetJ5wE9/L7+JsDjJUafp3wJlvZckU+SAeJzA//+SjvnKzmdFEg3FhgxEizTcUeaUzMnLNxO5PD5kTfciZAjN47rCcBEktHPECoar+T815BMB7h2R8K/ExutgUOdKDQCHbJYShj/eDSp4yQyaVYWDceqyzR1VjCPvMVuGYn89YXN5dqdKUBONBDb6/Bic3Z2Jc7OdFSmq0JKfCzWf3NQZiofufvUmse+HVtUsqwx78XokYtGAUWckWk80WsGFaTC6nT2UQUCWzOtDuu7Aw6+c6iacnHSNxsx3HO6V+tkPNIR22aEgFN2qbKJDdyFLzreKZCS0pkfjyfsDek8dyxnQAJhCMdkST1k305l3xgB7pDqyQFE8XpXzX+NUKBhEEqBZQzGSTxtRCRWJnRBcPmpp6S2R+s45IDBflz/k6iCuLRN/KlebI7FmmKQwMM8zWUhfIdJzHyX29N5RQKqCq/Yjmm/VkfFfaJAtrDPUnoEjhclfeauDKD3rk1WAckXvyzaPdWpSDAK829ie+DSYd2ykfNz5qvLIdLDho9xMUql3ODEVRsyqAonMQvBZ7zHptksSjp2cWCyXWceuiuHIrQzFAlYK/ixF33d4ZKD3oIaffGAOJ2TEu8kR+/El6here4dLMHt9+0z+dZu4bD20coDcapzZlMZUn0zjPjeqw7hkUwc5K2K0FBLviZfCmYbiDRlX33HNbivQcMnsV8hDw8U6TUO8TB1bJp8KzBUm+7blzI24Kw5POgWnaTOLSQET0S1ZWBL3mC9Wng+1TKeUDCATjo6p9B9bZw8wgiHMKpr5qgbYSeJqOgGnVE9ErhIu3tfLqfA+/vzgXYN1DYm/zlRFYefpYoAdWnyQqYXaemViD7mRtagOGum0NN/7HQ6N81/yruiMiymyDPfvU3mSKnZwFXkqyYlLas+nMHpFGJSF5FxNQKi4NN5lIQrqcnqD9nnPC7QHqz9wrjh3xzYWUtzXpwMYJ6ZrNTNpg7XsbsL9/rVj3xOo1XMlsqSaqpOiahxeRt0r1nGA33jTKMwzZbSkDwp5Q9v2WtoB9/lfZOOkKxfzF/PVdPVe97HatS3N9WWwFs+Vf9eF8Ek/6h9XFD0rKyYhNjMcgcrZZ1Tlb6g3jCkrdXyLOTtirOOSCG3ajNnpR0XM60rJAW0nGwfwEnCMxIbFurjnqfvWcZsSCFOStz1a+fuIXRC2VHOejUALbluoW1Mya4AHolhKAzrm2yzfocnd2TsX33JY/h4PUCvBGDnULljWWOA6Z8mOJ+3mGaOesRPN4QYjbxZvUa3QQL5qqx+TMo4RjghNoBRe4z9mYuEmNWCAMFMDW55irytHRwSNJ5ALqjsnv0OWRl94DBN7g40aajp/C4A9XTlE5vf27QHJVdWolTljLFkweM1ofjBRLu390DCzMxLyGk1Z4JxNzPCO59sbd5pJj38YZWlomAksIBSSClBHuGgel7Scz7tkZilylaArQfpyJueNXNmJxVFDCBVGLqC5rsAZkLyuTAMWDRHHVewymWUB9W0O/l3KlSgNyjukYl08vDHwQGB68M8+i/wZRbUPE6I9GJjNE4+u3d4xVr8BzJ62jmicb4lEpq2DvPDin3pfX5UtykGC8o0DtKhOAtLK8QpG7SqD7oykBVMwRl8a8UlFdyGRY6QsVDAJziQGwQb99ZDoH/IQiF01aMS1Pq+Mbv4IeIJL1waKwuPUQYUL8/1Voc8/pC43No4W99JE+JJk3mTgsoBCTzKnKJlULhruY6cybvLq/V/St+SRrmlNf9E70zu8av/cwN5mG0mnMurHPbH1mJjbFn7M+NXjR9n4y1K/Cqys5F7I0DjzCKFk2tCOSvB1SyjiZ68sIu2ke3sfeaM0gmeLAbewuPZMvXMamSGog8N6DDLfAbwnq2Nwd4QbMz3BmYoH64JKDVMlSPnhMDZMAFpTq4wmeC1+i/+EzCMjSMe5cBcQP3XqZZ6/mmxFc2ltgKgASfyyfyVQuM/IEvSsK1u9vwzg57MNY2MJ4j78Zj1ry7VhfyzWgRo7RBNCBL4P26HhIRnspAKiuCQ7miXmXLigr0XMele4N3Cgi+jmy8y/CXgSUTwUPV95z/FiYcj18lfuJhmGjBF4NQYchSQhF89/BuxdK9E2V0UVeZEnbRIKOnj8XI/k1aybF9/otr02WSioW4gX9S7crliMTpc3RqRB8Kv7Iu+5inGA6VbZheGmqEOx+ngbL1EvWzD7v+6WuJaViK04+dMl3dVGxy318JUAOruQgpZXAeEgCkO4GvdH7PAkjWWT89Hu4m6oCXXP4aMq3DU+xH3D2X2IZWaWhVVTsEsxmw/JsXkg7/iN4MYvwYx1FiD3fhiXPidcKnhalP1OXpnGdjU+fSMfBdguD5kK1YIduE8E2eMHqcUY38FZY0zOHTezV0m7AbI0RXDKLt0wnD+CeX/oE7WjOdI0g9ioH7nUcDbBM72Q9TZBtRK02YTXcwNOCrqH9WjwH5xq3shQAE6JJwjnW+19VZm/PPDWBhxDsKlkGSl9W6HWsy41gjrVoPa0sEddpIlDzlZxbDQYzgp9GgcLuofIqi0H0+5ipb8FKSYBi3bvwAIwVM+cfupGccw7LDFE4SBSNQzMQVGxCQeVZQ02X50gG2L1mtNVd2H3vGl8XynoBOvX8Ad981AvJRjbENeYFxejqVHpHaWsInOaWm/FxkEvDAChi5v7/gzBeZ/EnxzFPHBH+k7Kr0fhoiFOSb5E2aPr1Cnnnq94gEAJno0DnIZHelYlRSQ7je6AlqsCmg3l3YWKpO9JorkPTiKaIdn2HtkdHwn6NLtG6st2XWuU2QzsbFVXiLod0Fxv3HJkd7RCjxRpAa9UcyeF9jPjCiIleB4XQfng0zZpA3Su5vFGx/zQoj6LQD4x3QOchvsWYgm2M5cZjigz4avYtHL8JD7QkQnt9xFIddBwj4vjgT/+r9l+zA+Rf0uHZSShuFxUBEcMS9J+OaiTCfUEwQ9RUCTIF181f9sKpJlC18MjuXT36vjLiz581T3c3kzT4tMKnSRuM8UPDG/ZzzHDGd5edBz+7gkA/dbyvh768IsVfBKieZguQnwZ9kc2ylLU3Uqky6xOS8E/QZtoT+8HffhONXS5Ua7Ej6Lelv5NdNNzmR2oSDiHC2hAYpXfZ9F5JNhOddnFYCK14/64sEHr/C41UDxl9qkwrAiIbSM5BdKSLTA9KKS8osETeNk9hqGR8GLthvpowri8x65Mrhxvt9PlEHfx4OS2b7wtk2q9pCm/4QTo9np41GYZXmDQJrReX9wOZ47aU9a/U1RB9qkk7B7c6SOKVwM7Joe/crocNlFstEWhf08xvypAqVD0jI7c8VfihL6oI0vVux07cctto793IeTjf4rdTZ3OMA5idlZkE6tYmQ6ze09ZS98pEjLvChxcj9t5+rwbCDezWV/CHoFIYIckg5xldnoIu7WKfTgZ5kouo0RTqvbbjXhAG7S06oh9YA0TSpfrsF4DPr8XG9kAGoP7W5hEfhFhNjGWcSpG4PxLkCXUSDSsg2Q9pFu+Wmh1svJh6zMJlm5SSf/JqA89VGll9noQdXLfquawI7YpVRMY1dGt19vwGBEfwc+IeJ+Xm3UUcfDhMocBOsplGri1ef6DLuK8Fsf1wYUJ6BnrK7SuSiUUN6ad7BOmkBUF6nJZEXiP3CCs1A+oT02slNKamjQENrNkLRvA2ztfkJWcfk8uMIFXvEtnYg/crYk5D1LYxtn7U66ZKYxMjmMu2TqZMf6ZUjU9RMhx1+rr2xw7zYtmlKTxnkmSgMitRKHE7kIZkkkjrhlTrH2SPuoMkT0bLCIRPCWU5DxVdcr5TjFlCirCJ/n3f5O3LTWm0BcGH3Tbdq9VEaLzglntLXxkGOL2TDp5HDzNGjbPO7w1Wqy8ni+rps2o6WDoYBMa6m2bw10FtluNwnwiGbGr/013vE7iB4kso+TOeDyotiSqEHcwGhKXSgOfXl3b5C28NDAJ/FPhsdNRlZFGBUYt5UB6bMc/M8mDdMc+cVnWr5YruHfgv4jTvJcQIyieKJs67WxKuXtSLkhbmSqZPVYBODhufNAFNOXYZC/eNVBI96mnIJsGiWsNInBiQaAqgU5bJPn6iVqZBe9yUM7Erf9z63OqAyG8I3fbx7WM+oJAVcE0x/iGhgZ+pef22cjmKc+bY6cI03MEBZ5YAyZ57sqSxNxGEkJLK0+pAeZ076ECGjQE3r9zLxDGRVd/q7kY65DGh1fuijoCqa/3LdoSJ7c9AVzqJX1ZNpocUbXg2rSiBv//KylgyHo0QlD1XTcfmC2hTtol12s/rFhgEHuNTXNfkMZvnldA2S2TApL5+GZk0NZg2hnMfnsNaVxpPDfCeG6QQgZmLiXd0ivhSkREHZVWOXQBdq01Qpv6fKdRSq5tUIaj51Q2JoLbgi2Pzf+7CbrK9Rtm3L4D9XWJBw3LWGKY8omRVEIpSeRu4+IjtMqgoWbwzbDifA6jhYzEOmSUxK05YTz0HTb9SE3pOt0X2wlKZ7SPXQpuZvlwS9nf/qb+Lbr8wVHAMPGJqy9/ftSCSLXu7IoTVlJhDctwSE72uypri0Wq8LxlzV2Y6HW6Tr6a5N4U1RDIC39vE/QmpGsAuTUw4FeeNmeNKDxGT9nfyMv12+74vI0fDaATcnOtnayDmC73Lrr49p9XaexD3S4eMXWrxd59kDod3IHQPjGTFrqANBuFrZ8yKcshAwM8ASgB4/0bo0QbAQAMbMY/bKDfP9IN1k2O40BdcU2OJjiL43rhV4NukY3EOlynCmppH1YWar1SWFxyv8GtZnmaf92oESYQhdKiiNljLiO9r1MHEgCD9tj9uM4r6ZEr54SzaRb4ZqBoIyvV+jMWHuTFxkkGVDV3PzMwZPgKRucF89L8rLKn3FaiKfTAFujPIsTQyCyNyzqhBXtPKwdvpfbs5rb+o+JxCrnMVcM8MZE+kEOUtunON1Z6y5SkuESSurqk0XzIaHWua0KvHmOf/mbaEATps6blFmxSS92Fg7/5HmGXPby1Gakei2SZVegNcKO5ddlHUgX44vvFgHLhXeQyJ49lU7WAX2Z/LB9DGXuPhURjAtZKUeqhLzWrFNepkCAaRACJJjslkV9xBHtDrvasKL3tg7R6XH2LfDWGRCzrt2lHQMA/WPbC9XuzWca65sSAwnazC5sdbd3TDpdE+QtFWJWasCPizVf6rNBIcearfeQmD7Y3Oi9il6HR8ZQDlul+zghC2zttM5FBIxb2fyb23pnkuUMILHR7ynJ3sfKk6T8VoCMGUNDV7N/fLECG8x/WnEndoCU2BsObzSnDPdc9AtjiUTGSOyB6cCVKau32U4pmtyqhcNEdWEJCMGEB4jpMFABA/EmOJG2JIVeuGxj9F1VuC7RjuSufYiKQJUYGMum8CVXaEzz2dN2OV07a0KGRUF0oCD7+tadvqkuzk5PhfBflY/0wsMSvNckDPQwrScZ2cpn8BeLfxMLMRzw6Yt2Em9LcoseIAlmrwj65e9jke9Kgoe0aOWHrTYupg5vLc9DdoJnOyg8gWsLVLcvRMq4JOiGn1cL1QN+HKw8pqx7oxqSuC16s22ps9hsOfogseenVq+JdbZLLGAACGh5frrrNabq/X4/oWrNIBXPuuKjLo1E1xBZfEbIdb6JlUDiMq1JPD3bKuB1BO0RDMDTj1qFLCVuAGT81CXfxPr8rcCIGywY/Qt1FeNh3IlpYYonUM4JfiqF/JXjstcSYZv9BPjelb46nH5jvUIknVnbAyB/VWc/DOPK2BgX90u2bjw5Xq58QvyamRrjBqGBBP53Phuqjc3Dh3F8VB7f7jDqOioMx/OdTSBb2E7aE9LsofGwTb1wvYfK+Ed32B9HqrzNv3hPSmn5SXfeIgTXLeR7x4/fuwzY0AfgQnv5/aouC/N75vOUI+X8xODs6G5XXZYGB4PXYU+l32d6dKUQMpYTlJUWGDC1s3PTy0TkttYpHWdFSktOkpmYHyBqHvOHd5W/JwaZAayy4FCIhGkF62BYVYgZCWn69s8EkWgzN45uHt5T51rFdwFemjPNlgXz4KIMFTtXi1aT7+pm9LtevH+KPd+luc8J6Sd5tWnpXC5kf1vfoG61ONKOPeeqs61AefVLgDVKeVsZ3Pm1NU+EviEXWg3l1XTRpZqYRqhcR7bZijxJemFcY3X3d9ib2uOWPaORvPJQpmazYopKDo2Hx+bXzmsi+E9uZJnTwBeQ8hM99wDJHSkjWkGyZMlbK/UMh1eHGXZHDKL6zGxknc35oOWemdVY4FCB47+ip/aown2Siy6jfXFDr0UyzwE0duloRRsAaDMidzG2mNqQ4G/RcoJfG19uVvvPrp6t9fo32uKB9dtq1w1MZD9SbnhEhc2+sHWBZsv4hYMwDS0tng36IX1oRPaFwzwFjj8TQDTUVuM7PfqS8pNSXAvc0FE3kVrZpNrlDpqDTKJaeZCDD5gDLw7Uy7C18iQJTmwzH0dXieuNDM+Gm7QY/fjjAOqGZUR0wZxE4Jjb42Fq9vunVT83mIWpf5kYwChfG8SQ10gAqKnFYVbeCjDy922lX/5Wh8flrWOOymWYSKUHvARONcEcI03G9sIIR0DJUMjaLHgAHGzdFC3n4Xo0I26blNwlh3PB4UrhuoWHSSQOseSHlkDewrw4vBEg3wVUFlhGqC4LmQZohDG1Iczj3gRxhxgJaZ8yaMB2udQ9egEBRMMxiJuP7AuxtOZLqHt/rLLNbQ8VEM65E7kOlu7mJ8pxCcclanQ5286pgk0/G5YIdj2eUfxsi1WJtk9AYnClMUgwaDIpstWvIMYZK2y4FdaNiRXW85P0OXDx69zom1IV1TRTp/hF7rt89GfdZgHAGpTcgkoNTmvIU9deyJdx+cd9AMLWZ23D5IWJM7cO3NJLaPgnue1w2cl5/IXFFB/xbV1vZlAZdZ3k3Mx4Z9Ls3Cpq86rRHTBDxdz6zCC8GOZN9vjKf3+VZllv9vZ4frT3/rLdJc8tVBbJwTCwRVcUTUb7NH4iaOkKIZkc7UF6Fd2ZESkAGSo85NA7ovc4+2SJ9tgcvgidB6LMJjW1bsB+mP3RyIzaKNgVUXigZSz4JC5MYQPbzcw7h431vXTlz2hcy9D6cN8rW3opvmrK3/T0SQOORshqi4Zd7SJ6U5v0CfZb5l97TyC7nDXi855oIRYXiCgZNfxzP3o04uBFIClEVrDjkjJJx9ouyDnIn9ADz6h9nqkGMKirrco+SMjeX13+hKaaHtTKtxu8dp5VR7xq+W6/tFXuRdxKMFC7a5Xr795EpZyjd+BsgfUatT+90mpH+laIIo/bse4I6AXukCdMBTpaXx6NbTzzEcannela99B68vZhE1rJMYj/ITh8s0mQQ5AFAOLqlxfkuzXSe+vZt/bZ6Jq/kvHiC8Q6Z7/HQs1WCk/LFkKOMdVqVJEbZECe3ogNQfdXSxqg6yoe0oL8A1OPscuuzROK6LZTcYR2LkeCMZjCBmkY27Y3TquivKajm1D/UOfYngHMKzOH/Vy9KD5hDmIPhDQ1nAP0V+0lKP1wQnKYmUWPKmCZ4urAyiDFl54v/XJL3MRg4zB8poJEbqAgH68pJzD20Hw7ZPV4vcD0uhlPS5BgJP55qqU0C9j53XjIz+koMSwA8K7j0BqxGqZrzxAaopYSiHIdHzcZfJtM+F9IfzQH9Q2tExZdGS12nx7//D99I+P0VWnhGquu5aCgU91JbENdoWvMOdj5YQse1kLkK7rlS3HU/kisHwicUv/DZ8G8tC0JzBh6Fnsv2LK/EOCLGEzlZj3Pz+5mWuIranrw06i9jtT3Y2V33K+5u9KVZZzn2sRcNc3KeSTHR8hsTX9dJ3xoyBNUlmIKxkEkukYmaPofr6u34SnBMOT3w7g4r35WkfhlZrlrl5Blg4QTpki9+ekN756SaFW/BLc7HwAzX9MH96kUr10WAhQGEaVEGL8+i+iJMxi0ia2U2GpTe2mIDyOteWu2xzM8kRg62lQNcvZLC21nJgQTcHZ2gMUDZVl3qznM/xo1OCtG/p7c5s8lEfgBXvvquVxV/IMFg2xhiJpGIBSYE/2CDpgT3WfTmYXbeP9nDUTWHEnMqG4NXXWFOLgytVELldsY8joFMrczOA5MsQl4InxK0yswH7LhDRLIQ+u0NKlIruNVnO+7rwaWfRmPxNtOfwW7y0rSlCJR6p7qy7GI9KxVhUnnt5dHX3Q59NWJJcUxrudDIgnS+2GapGflZLnQotq82KAeSpQTheYVezV9KoTDGrQGtWpg/ZnVQPZFh2jEyGjYtxg1wAiCUMlhH+s6UlT9RAdgCXF3AMaHC2z1LxV7O+Q/cmg0TL4xrKpwDFZX48McHgAJrswSsFIOWeBS7lieiV6rzIdoHm7e6OogcOaAxGOJL5fkFMtg4++dejmpEQcv9jVP5N0lDqf2spXiMPCaNkK9GCQ3Kmzxj0GFmJdv/NUl0Y7toC3iJa73FA+w+VYAyG2/1165H2F+Wbt9z/Pi8KKOt/Dfwpl1phO4JqcI427R/Y9x7BvgtrCNbe1KA7lO50pqNbd76qhmP6M+CDhUEF3EO3N6V3bm7uXnCJjFqQFWz65PDyGiog2PSgnq55SlkDGxHIf3JWPFlUHRzn46ufZnRFgi7z/iiMqAKX0RtErpszTS4zApGEagbVJlCDPtpgXBnz27XrABG4bpF5nCKuaou8vqkWJ7zgTmTCiNZdYr7GF305mBpjxYdtTypFEWphTr90KwFNwjcON5v5m2l30XIOkhALAClUuEy9rTHY+HS6WUbvNwuRfQwQJd1xYInbYXMvpz5aUUT+nFO6sBz/ESIaSQ/WRqaLWOmywe4FWu79tfwVLzfxyMYC2cpbgOXHbtXSu1HiPQkC6eEDO0R/Qm/OmmfDYFx8GN5h89XLYyQIaJL9oryfVo6x+obUb7U2tzyzCbtdYBTpGWaXwCf/5zhYx9IdUT3/DTKZ5d4TOCXwX1G2TjLTXG4qF/5g4KI3lX3Y/pNFtw7PZiqz3irHbul8nILGWei7VyOYJIKEckJk7B0sy8EoxkBfRfC6JzYomfB0JVo9qWdZrCigrLlmGX1cwri7fGIwFYXbqgQET1tM/qydQsyiPPXiCkHJXYzFfmHixCZa0xnCQKP8ySsXxtYvQzjuv7pC6nwks+KAmkhmo8DWYOkfosD+G8xmSH4Tp9PjafqgtJJL3Qx71qrpXEJZetpWQIxXm77k+WH9WJssXE+Xcre7ZlJbT7MFODBkbSo26iJRxH1CCJiBmMO+wQzP7qsh4kGNfujYRCMdyQZvSCGg9FDrVgw0GN25f0PPDIQpi6iON/DBZpPmay9ise9mdzj76SfVCbW+WseRloddIGld3f8swUj2dN0ZKJ0VdT/4AFk3OEmGW5mP69JhUbbpQ5K8QTPf9dHDLqk9z/yPYU8zjLh3xA6oM4X6opOf+D9wR86RhXVL/HA8jH9IlMXFV0ehh3QoR8ymFl9lFWAzCBV8TfaVkYeIJMFTnT39pkzz3VqvGM1d6uU39EArNw46Q0I0d0rcS5i4tX9PukTf+UBmu4Y7fxzs5wTYwjpsQbNPqDFZ9qTpDKJY63IzneNRE+GG3BrQh8BHJFBTCbJ7yUsohe4t6PxRxQP82vadViQsDEdJ/UaTlIloZHINX7xdpxeV1OBa7c+cpsNb0CD+jjkpz8bu3YLm5OSf/nBuAhuq0TUy3FnvheAu5ljZOUiValytx7WbXuSPfNQ6MGtt8/VjGBP+ph521v8jb0tlq1PLx2vzps+cMfSAav5qzBXGDsUQNx2+xaBssugZb5shv5q/5tlm/pTVVSIlOnIFGzl1K5lZl06hPFa1rw+txsYUB/GxOWTjTnzSOIzZ9FLHF8KvxWHEp69dgMLofCMP9QTGxnfXZuwU/Lj59JgfIfDsYuCMKCqNDs48Z5z5yY+KHcFwwKQnJxpzPFGWSOnBvN92eXMtRgXknXptIFH0s0oB9nNbwzzylEK4HR2QqcLpvN7eqFwhQ5jzCQzzz1WWDeq/YMjKaoEVcdUrBia+XpzD7Mcxdx4M5DHDOFMM7yJK5rp+InBKa4SzwENH8vAnqmu9zQ6zO/RDSJOnNAhdcpV6qXrWOlP0V8sq0Uo3y3ctZPpfwqxkZQGRuMCQNbzqk3RdGRYbvI/CY7Lk79e/kI8X1bUNlGo377oIEKInoXw4CjRJQeWP9d9KZgFaP4kDbHlI6/bcgZzdSmsV7Q6JWcTpHC0hry8WS9fExeZQn2Eg9cDfVYfkRut0ap3vtlId35Kr1EuLrRYVAHDkbZg1UFwHufXrT8bIIWFVTMRY+HCFrEoCAE9XqUqT0QHDOaSUe0QHUJ0LU7FQmTItf2CTCs1ZIZ2ikoA6RPbzi+DRYidc2P4a67J1jj69/5Pt8oNvDJe5LwUiH6Tc3+HOxnJAC67a1Dc4JCo4+yfZN42wLfz7Bqe3pgIBEZfjfR7KRZxA7k0aPDUIjvRqca9lkZXFZfhNejVkeik+CxnDxEHh/2TbUm1OHzTCUzdhmpzwkxqsXwJKiVYbr1JIKJr0Bd+SLUsaxlQORw40iQwipeFgZxl1/ak1pEof296Se+aao39CX0LuT1bvmDu8NS/nlEstSFMHZRFxd+qEWA8+JXPbZJnX3GQKHFhhX58W3qPmfPnodbg+WILG8zFb5D4ywLI0N5jqmr/DcqY0PuZ7ba5/QpNYh4LNHm3GM5py3mYsihV79GSkH7UPK4a3VIjnxhCBH4S8QFx5TprWRWieZE/0jknRs/d1pcxEoP/ihTyU7XeBxPaTV97aDciDcokUX4WMf8J30XH2YsV5AvlVvV+In0rKTjRtq9B4qQ69QUzKr84wSzDJumijz9YSOvSSVWisToIbKOHRm6q/DL1mn3FjW7Fe/K98J3t0gs+o+TvIt4UwKpcar3+zuknRt/MhydzpAcy+OMT8ggZ4xdOlg321+yy1ekLYMI2Y290HJdsq0XzSj8fc0OZcuuI4m0YRAOKalkzk2LWfgAXSXtksISrXPuFLRS884nSEHhJDM4Ve0Tcakd7/UT4dqMrEt2iU90oGzRUP/xC31uQF6r0+NJN2ZL1D33TjOAPYgMdVOW0os0yAsJ/GF0RQv3Qntl51H2+tKsuTOxoK/ULxwK7LwtdS+yHosqCSAeQV1xBXIHQwR6mRODg9Z5ACk8zJuFyjUW/MuWstTy3fOBo51vnvYvulH3PVgM6tP7jlwZrwKNi30rwyLZdpG0H7wDwPqnS8ElYuZycri8bREN/wxxPMsdcWlaPUCKpBuXAxGHQGaxFXNurGPtKMYADwQlobLmuzsnxVmbXamXlGPgVWxw0I0yEMijnJjhoGS93bzQ6yGra4hJR1dLtUeixMQO96WJyxo7dRgeW0MX3bp8bkQW7Dt/1g5kzwaxMLFGPdfPA4ZizCwoT8SxiDCeq+ew8a+/qLlHzrElTScvBHNNBwSCNaJqpBwwYJBctS8bR+V5VCL1zO7pwpzYMv6+jCO9KYvJGCbSY/zdXnXSBM+FNX2f8ghdrA1IsDrSDrWyBbIFkPgdkadm93NAgxWQB953ZEx2z2jvZ9i+h/i1lnQ/YJQeHlL6a80+cAUM8zYK4UPRgysDlIcNeSwGivxnXyWnLT6AjAHUYHF9OgKztVZ7eBhzixD6j1noPmY7gLr44+QhmFUUoY8VDoZwNti3sH4rzTKppbf9AK9X/u0lA3BgLUzSXmE2jL1xKXi26Mn2Obwl451z6DWWqqqCMR7VIKp7E+VtyA3B9zAlPvhoJJjqtPDd89cmCTWOUsjZFkyTh/csfWtuMQbNNnJ78GURF2fNAAK273Yn7qL7xy66uYbwsyzudjZsfu6dYj4amElHaflQh04ZZ/Tnp/d4MOApRiSwn9LkZMbsHpCu39E0lSjMKVWM3z2m17dYHZeEupQywKYQXXdZr65AAfOpRj/fax2LqPkl7VHJFWLqb4AjE4vrGBfON8TTHafroYHp2faqvK6k5TieT5hPHJJ1109tod4VjX5qziutgVVJwzcTJZQZqQ2gnPy8g6DUCvLB1+WTiAFzHFiSMo9XppJH5ibeK9ue2F3wQIOgX01YeZekKhERoJsV6/A8yxqHgwXIUYZGcZnNTV1IOmqsUKF38s8rJhCCPkMoeLVuI9cqvEX34eKa1tBxs/Eo5a8BktrFf2pgk3ogMNNjKSxYDjU+iNHTeeMoLM+cHoKJiqnRrscdx8LDgEfMj4gsAOOQHV6xu74It/cAtTnQZEYT/LpgkRwcrll5p+ftTyb9PwYrF9RyfNhu+MTzuipQITYb0sG8cupHuGdwHWKGspq7NdXm71GJCE2ELM3JCy/mTvGjBmNvOxx9xuK56jaw0qlIOf7tVfX4Jwc5BioBtotcZlvdtFZ4dntQfuyffodtsw9dzfXcoH9lMtCZ1dDiPR0jwUTzLvpz0vF2yVSCf2UQSq5rWpRAcbJ5wLIMDc2KT8rfhLIrK6/95UksUE9S/inf82g9hcpwUEOt9eu5mh2qvYssOzVNVBOzLZrXkCw84AYBY6uIs9p+O5gitMMFLClCtNJzUCz1J2ziNvokKUJg9XKIJO7ruhz8fL/nyuArVCS0v3yNZxY0huay5bHZzJjSPSvUZ9zjXO7FMSrYV5XWMhPc4kErbugGVpVAbdT8/MQ3C6C6uwFPjoRnDBfq6YHUcfWFe5cagoOGzc2TWwBiXUuOGNAzCEWtUQb29ltXNciG0QPzumENF4JO1CUG0R1OxnzSuZgKZ02tztLM0k1AtU4VzZYFgSxH9RnWDXEIwX1/MXKt/uKKVIkHp1n71iJvJGSXI+G0my5NTc9IKsxMy7lw0Li2161PhFMbqk+JhUmUu26wzIQOSWoRrmQB5y3UJRoDdWhmNu2AHioHmzRcaPkGEoGntqW0VV7HMykaPJr8s8sU6w5u+NGuywHg6ZC/f83wCLvIelz5Mo7XBSV4cfewt3SIJj8ESINPycWVlafwRenMOU0XoycY1UP7Uouc64wvTbS62x7kBKZ3IWuVVC4hjp6BFHySDFB9s58Lf7zY96K1LTnhbrwgzJR+I3Jk0KLYjk3faJQWd9EE0Z/vdeomNFjoWcZ23MksszInSFHPijReHohG95EvOZDP61ijVGG6C2a/VwSNkarP87dn4hcz55UY3j8K8Is3T5fk4453kzC0+wfteCkhxIGIBC+dRC8WvHYvPBbUGzata72Gwaywxv7cMYCeqRx8izkLkTGG2KDkFTMydGW4DvhzcpLQ/ZgaOHGlHHbMkw/gVwO0eVCp8P2l8fv6kEdZ4ok4TZq/wlKDdFF1YW1QPOtSgXie/Z77umwg0juatLud51EwTiUJUVLoyw/liD+Ehs+PQ5ARilR7/KHpjqjuevZlb/c8MC3HQyGQ+3CJNOV871olltPxhz8tXP2quXAX6OpXSwrr+NhQ3NhqgDxz/PZQitgTG0qCzz0TOvoy8eIaAl/NPJV2/phw7T2GjD1Bqk4wOKwhptsXawTWgyfk0tt/EVD63b0DBKx2bQQVA8IK+ub3+A6CQrEQ6r8GJII76VBmRn0n4QqtA74ohuh8+9cj6SJRUq0E3pnua6PaBAV4rbH1s/XRCbsioyjouOZQBez4EVz5Pf6/aCO4+Hajx3tyZq8Y5yNVhd/8TXVNsrzWKPuk0vUwW6IdYRIEHLquwmvJ2nDEZO8EK1eR/4SV29gQe15soCpUPQtZSHI4gqx9pNLDYhlFRs58qRFFXJach8Xb1f1+R44fNLycySsMm5RtN3i+6zJuJaYmPgrprATn+kGa80eLVepmgGEq1TNRghK8UaR2X5Htrf09QnVXVVOuzeINzp3w8VaVm02kdugAo+WLPJgoXMn6A1RKrAf1m0vbnkUicG3gHA5uhRAc74mFgHY84iA7VSzWjpj4Sli3jQZAYjRFIWDHYwuPtudlFMthxQqseVKEYyeJhOUqgu+b44DvccQrj/340+M7Wakc64V9Ckqljtx3747zWLB4/I/NE1icDFvD8NA4mmkl5udryFqe1gx8R1Jut7qxoEMLX8w7JtDgMBK23JG6OMCM+57fx2WA4l/UItdVgV1mXY6oE4b8pYcv8p6QIAJaPWJSQfYnAiz+pkbLcPqSfcJAnAv3ryyqIYFcRxAUzr4n0czR945L0ZStaUVTfxbIsyir9Y4xdCuv/TmkuZsEr0jqwy/hu8yMnHxPI8Owp8HAzPu0uswcTRueBVaQzLwSuZgNfGdNJRMlYSDFsil19C7mwEF6qr2oqqRoE73Cj8Hgf1jqqd/s+d+HZS6eipexEQ9WVezJI1CUdDzSjAIPTcCvF4WAcUxze5Ol9LFEkIicuNMVJr5K8GtD65rIR2O7/KU7I/I2Mou9DxUykGN+1Efx1qUKKu3u/WKOtlnc5XIxIqu3Nb8d/4qYgvPbXX3MZZkLIQtCQq+N+VBl/D46E67mXpGXQoQMlX4nfkRGR7w8+kUADdUEOAKJz1gMFii4AfOb0AwmKjwA0GsIAuPRMAIGPKQG+9BMBhTuMAb3xJAH3JcMBYNw3ALdMPgPCQj0AMkykAeGkTAFLPaMDdD4fAGiqegNhgUQAedWTAFZlHgGgZ5sAjFlDAe7lvgFDC7UAxvCJAu1FvAFl0vwAKfpHAMyqTwMNLu8BT03vAL3WSwEQjfkAJlBMAb1VdQBW5KoAMJfuABMqbAHkVXEBMkSHARBqCQAyZwEBTwGoASOYHgEPqLkBOFnoAYnY0AHDz6QBlUJMA67hEAGMUGIBTNvyAMaicgAu2pgAmyvxApqgaAG61kcA6bBgAPLvNgE5WYoAUwBUA4egZABcjngCZ3y+ALWxPgP5KVUAM7ulAAIRrwBCVKAB9zoeACNBNQJE7L8ALYb1AaN73QAgbhQDMxelAIWCKgFg/PYAl5c/Au6FPgAgOJwALae9AY2FswGDVtMAu7OWAvmqDgGxITICqibLAU33dADR3ZkAhYCyATosGQDJJzsBvRP8ADHl0gF1u3UAv6NOACU0lwBjTRoA7pzVAdTA0QFJLlQAFEEpATbOTwDJg5ICqW8YAaKzuAEActsAMF6TAPUpOAB9DcwC8613ACzdIAJT6hQA+aDGAex+6gFkgJ0DgF+IAW1+MwACqbcBBoJiAkSwXgFzBOMB2fKRAcmtHwFpAScBL2OoAqnimQFls9gA4o16AXlCmQK19YYA4+QZAdY56wHXrTgDtOfSABuvRQDkLzoB1uBFAs44RQEP/osDFs/UAckUfgNe1WABCLAhAMgFzwFIQ4YBksDWASsmcABEuEsBzVr7AJXrjQC1qjoAdPTvAFydAgBmrWIA3iqAAiIhwAH35cQBgRF4APtnlwMGNHABizhCAyfi9QHYRiUCq9YJAemJYAF/McsABZuUABeUCQHSegwAIoYaAdrMiACGCCkB31MrAlQZ9wCTv38CzE7AAQ1q7QG720wAr/O7AmhZrQBVGVkBovOUAAJ20QIgngkAbX8AAqiIMADud9sD5q3VAM4S/gIHugcBfQkHAW8qSABvNOwCXz+NAHijLgNcRigAbCqOAm78jgGa35AAM+WnAUj8mwNddAwBl6DaA5vuJQELz4wCkWHzAIHAGgLIVCEBbgpOA5JRsgEDBBgAoe7XAQWNIQA11w4BoOrPA8QAswGZpI0A4cRoAAojGQLQ1PIBYP3eArdl5QDeEn8BpIiHARa10APmi50As8vdA/65cQC94qwDcELWAck+LQNlQAgBTa4QAoR1RAGH3iAAEZLhAAKBtgGXrLUAwHMoAiUtlAGUEycBPwcCAYIk/gL5n8YBgZ0OAeW7nQFY8okAuAZuAIMYlQJIEo8BNzKbAVN1vACF200CZMm0AVTIyAEprmAAjm1AAfnyzwFR9M8ADI13AUGMrANZLlUB7lllAxIbHQFHEXQAGbJRAZAmCQHmd+gAu9b0ATKjcgADO80B8t/aAF7blwCNWYYAK5rGARvP3gFu+sICT3w7AcjqewO1FjoB2nuOAqzo9gHpT+MBR2lyAWcO8QHeczwAon4rAsIyDwFqd/8DdyIUAIiL0wE4YXcAIgjGA0ARIAF10TYCjnQIAG1HxgPcTD8BKtDuAkeKgwAQci4Ds8uLAeSNhQAmeNwBx3+jAAu0JwGEeJUBrTAdAYNmgQIjDm4B5Gu3ABWxLQEGZVECYs5UAd8eRQCedL0AQnOZA0wszAF1aesACJWlAc8WpQPvKMIAWv9oAUd7aQFZc1IAVjF4AVzXrwPcVs4AcLnkAOmrHABtD54CDIWIAf3+NQGAbQYAgw4VAr+KRAEyArsCWfIrAWiCPAMgHnEAjxT8A3AOXgD5i30B4rISAYNLEwIXBRoAzMOCAYIheQCZ1xMD1z4aAH5URAMNSvIB0mreAycxVABoqNwAJ49hAAkXWgGKw90AE/0gA40WNgAGq3EDxz94AV/gkQNdm+IBOBFHAUKl/ADPMcoArXvKAby/dQGtCKcBEuK8AxVCJAGZu3UAaK2sAXa5oAPREtwBF6saAbqgqwDNBpgCkPVCAerYjwFFFaABVa3EA/9xyQHAmNAAx/0KADDSbADzaicBsgX5A0yZAgGkuC4A6/tcAV+FXwIYVTMBspnPAXTFmQCInKYBEBWIAFRLzQGfEBIBxb2KAHpkdAAfy3cCJDPlAVNQrAKwCbEBXglLArOXaQG2a/ICIRAxAIV4GQBapdAByPy2A9UgwAE0SlgC4O7nAAN6JQOjlR4Bka0eAQJiUwAkzrEAxhaFAG2dZgOopE4AAT93AM7JGQBxYZ8B3q/UASMz4wK2Ka0B3NHqAqVR7QHQGoUB+r0bAOV9VwAwx90AUpmLA66B8gCQA9UBceACAOyABwCNRA0Br6L4Abel8ABBJR8DrkvTAJ3/IwNtBToAQ1TiAgWtoQDovtEAjn8vAHd0AAOxJCoAE6cUAXZ+RQHVVSIDf2TMAe+9pAIw11MBz4sRAP9V9wDHkDQBTmfqAeijvQINSbsA6pHyAEC/CgAho94B4JwvAJOxsgC1VPoALzAoAYudoQC99S4C84pjAYpvjAM9OqMBsmGSA7iJuwGdzwsBqULPABdvPQLKG9oBJVvjAE+CDQDP6VIBXZPtAGCECwI/uMcB5WnJAJhBpwHZqUYAaMfLAGp8WQGbqUQBUXWlAJwmGABMRjwCIrAJAOE57gDyxxQB0pqKAxdMWAHVwLADOQqzAORsigM62N4BpnfCAWEKAQHr00YDXpmNAXzF8gJrKAwA0a6SAHvjJQEBonwCa2saAFUPKQNIukcAbJGNAWKQpQHUNT4BsasCAKrSOgDA3H0Adg/BAAtZAQCm/CwAPtIOAClD7gAED5AAZUDCAXD6ggBgXgICuBI5ABwEJwPlXn4B7OzAAhwNWgF8zrECCyJiAH4GRQEx2aUBpnOWAAn24QAqfJIAN6pvAfAOZQG1Y28B4UDNA4/DOwCs8GEDzCrUATcQ+ALooIwA0SN+Af7rHQFou7wBYyUuANat6APlFggAdXD7A6zlUwHNHrEChfFrAe8ijwC70ucALtklAoXn7ABziFAA9RZ+AV3o+wEOmuMBeZJmAQqBfAH1QUkC6+sjAIh26wDxYFcARkHKAufNcwB1u1IAp//1AGuFuAPNfcsABk7xAtAgGAB1QdcBIp7lAFCl+wNBRkgAiAA1A6PJwwFV89wAHEgEAWTkIgDnP/cBJTPgAJi2UgGadu8CYzaXAIybAwBbOQEBR1+AAexgkQHQLIMD6waLABfX1AMGsEwAj1unAzA9OwGIrc8B0TTwAYozeADj0scBIyu8AgU/iwGq2YACRD1fAFqpIAKX6+4A7KpiA1FdgwBD9bkBTaw/Aa6TrQJk9I4B980SAqmLEwGrgxUBJj2cAbSQhwK24uIAWLc7A/Hb8AHRS3MD5bEpAQ6VswIiyTsAyD6lATJVjAHuPG8AeTyuAF35UQM3pxIAuJbVA/5YdgFK5awA2maLAJnFNgCiYyoBoessA6xrEgB+/twDGE+fAe4ayAErvEQAZXGCABN8TwHwMLQDzJa/AGKNDAKXGUcBMXn8Ad1CHwBKdboAOdNbAEm+PwAwOWsBnBUqAbCDnwBnD1MDhXvlAYG97AKUwpYAqeT8AaUBdwF9BHUBMUruAOWGJgHU/I4AVNxJA29GswGjnBcCFGTYAdCv8ANkWTAAKHRcAR5xmQBCVF0BFBDHAC4LtAHPg9QBhsOvAVlImAH/A2IDqMZFAKqoIACqC5kAED8xA97ufADkKXQCzgZ4AaFXkwP0+EIBtqeUAvTM6gCz7VkCbh4xAW8yTQBGwzABPO/MAbIkxAGMkWQDwI8UAHuKYwFb/aEBE9CKAqTlgQAzT6UBAeF0AVcCPQBshToAzx0FAB0r9gCt0EMBva1CAJDaDwDrPHQB5OVzAUnHewF6E7cDls4FAYoh+QB8jFsB+ALhAOLXWAG4pWkBdvGyAHo0iwHy/kwB46QUApUVfwHlem0AccOVAW3ikQPGp2IAq0I/AIatDQGYgU8CKitUAVTEFABxxIkBjpiQA515uAASSeQC5uJ4AFRWBwDtPpIBcs1AAHZ8owBm1AkAHVPIAHAXZQIBnWAAZcKGAjxRNAGBku4APCJdAAx2XAM2m2cAuOxzAFCqbwHkm8gCRMJvAYOM8wJy64sBLM6zAmWwlwB7AU8Df5XdAWGPFABXs+oA+NJDA/yYMwCONh4BHyp4AOqeAQBvexEA0dAoAbvmpQEbT5QB4UErAQGDMQMwzY4BsdAEAYs5OAABZ3IDjKidAWmXLQCBpqcAKJAdAzL86wBeQCACzvpxAfgw2QJqbX8BR4w7AvnVKQFWJJcCJKWjANJMbwD6OUQABTXFAP3CkAFEclAA+TCZAHCSowHGJ9MBR7yZAz3hzwGZvTIDfT6zAOT1AwK1JzYA+IoBAIGFRwEYIkoAtzsuANCEkwNi6kYBk5YLAl8VFwBvfskDR4xzAB/btQPPj4ABmPzoAd0l7QFFUL8BK1zrAJj+eAEwVbgBsA7CASLsrgHungsDftC3AW/hhwH7IUQBMaefANe2QABhGIQAvH+iAL+a1gK/zVgA7PkpAa4ZPAGTW2wC5386AbqySwBvImMAypUqANnvqwHB0vUCGIM3ALVPcwNzgCUB9vBjAuBwrQEGbbUBvY8YAQOVGwHh0jYAzKgTAT4cVAG8K6wCZ1jZAVl09AGJ1OoASFurAEU72wEBuO0ATwJLAA8ZuADC5B8Bgh9iANcIBQF2WhoA/dfHAG25qgPc2ZwBNWacAR6qzgDyXAgBr0f9AeH14wOZPksAatTjATwDYACo8F8B2M1QASGOngK88YwAsWwVAD9iPQBp8KQBU9DYAOqKtgG2WsoBQ64WA0TcNAFYjRwAQ7OEAIHHGAMfRDUBXhqlA/STkgE3u0gAQTM9AR4VQwHhdJwBFBmRAN7ddgBvwmsAX47UAL57IgConmIAi1/qATCjeQFfHXoCjo+/ASpu0gJetsYAthpwAXfaUQBntrQBfM6gAHvjigNSyCoB/rCgA7vClwDSF6AAKovrAWK5IAFC+wUA/bZTA874YQBjFHoAZApWAZKn4ACSfJABImY6AfFHewBZ8bICCeWmAXrdKgIdFNQAUoADADDR8wB3eUADMeOcAf9txQFnG5AAAAAAAAAAAACwoA4C0smGAZ0YjwB/aTUAYAy9AKfX+wGeTIACaWXhAR38BACSDK4AAAAAAAAAAAAirijXmC+KQs1l7yORRDdxLztN7M/7wLW824mBpdu16Ti1SPNbwlY5GdAFtvER8VmbTxmvpII/khiBbdrVXhyrQgIDo5iqB9i+b3BFAVuDEoyy5E6+hTEk4rT/1cN9DFVviXvydF2+crGWFjv+sd6ANRLHJacG3JuUJmnPdPGbwdJK8Z7BaZvk4yVPOIZHvu+11YyLxp3BD2WcrHfMoQwkdQIrWW8s6S2D5KZuqoR0StT7Qb3cqbBctVMRg9qI+Xar32buUlE+mBAytC1txjGoPyH7mMgnA7DkDu++x39Zv8KPqD3zC+DGJacKk0eRp9VvggPgUWPKBnBuDgpnKSkU/C/SRoUKtycmySZcOCEbLu0qxFr8bSxN37OVnRMNOFPeY6+LVHMKZaiydzy7Cmp25q7tRy7JwoE7NYIUhSxykmQD8Uyh6L+iATBCvEtmGqiRl/jQcItLwjC+VAajUWzHGFLv1hnoktEQqWVVJAaZ1iogcVeFNQ70uNG7MnCgahDI0NK4FsGkGVOrQVEIbDcemeuO30x3SCeoSJvhtbywNGNaycWzDBw5y4pB40qq2E5z42N3T8qcW6O4stbzby5o/LLvXe6Cj3RgLxdDb2OleHKr8KEUeMiE7DlkGggCx4woHmMj+v++kOm9gt7rbFCkFXnGsvej+b4rU3Lj8nhxxpxhJurOPifKB8LAIce4htEe6+DN1n3a6njRbu5/T331um8Xcqpn8AammMiixX1jCq4N+b4EmD8RG0ccEzULcRuEfQQj9XfbKJMkx0B7q8oyvL7JFQq+njxMDRCcxGcdQ7ZCPsu+1MVMKn5l/Jwpf1ns+tY6q2/LXxdYR0qMGURsAQAAAAAAAACCgAAAAAAAAIqAAAAAAACAAIAAgAAAAICLgAAAAAAAAAEAAIAAAAAAgYAAgAAAAIAJgAAAAAAAgIoAAAAAAAAAiAAAAAAAAAAJgACAAAAAAAoAAIAAAAAAi4AAgAAAAACLAAAAAAAAgImAAAAAAACAA4AAAAAAAIACgAAAAAAAgIAAAAAAAACACoAAAAAAAAAKAACAAAAAgIGAAIAAAACAgIAAAAAAAIABAACAAAAAAAiAAIAAAACACMm882fmCWo7p8qEha5nuyv4lP5y82488TYdXzr1T6XRguatf1IOUR9sPiuMaAWba71B+6vZgx95IX4TGc3gWwoAAAAHAAAACwAAABEAAAASAAAAAwAAAAUAAAAQAAAACAAAABUAAAAYAAAABAAAAA8AAAAXAAAAEwAAAA0AAAAMAAAAAgAAABQAAAAOAAAAFgAAAAkAAAAGAAAAAQAAAAEAAAADAAAABgAAAAoAAAAPAAAAFQAAABwAAAAkAAAALQAAADcAAAACAAAADgAAABsAAAApAAAAOAAAAAgAAAAZAAAAKwAAAD4AAAASAAAAJwAAAD0AAAAUAAAALAAAAAEAAAACAAEAAwBlbmNyeXB0ZWQgd2FsbGV0IHNhbHQAcGFzc19sZW4gPiAwAC4vdmVuZG9yL2NiaXRzL2VuY3J5cHRlZF9zaWduLmgAc3RyZXRjaABpdGVyYXRpb25zAHZlbmRvci9jYml0cy9jcnlwdG9uaXRlX2NiaXRzL2NyeXB0b25pdGVfcGJrZGYyLmMAb3V0ICYmIG5vdXQAcGJrZGYyX3NoYTUxMgCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGV4cGFuZCAzMi1ieXRlIGtleHBhbmQgMTYtYnl0ZSBra2V5X2xlbiA9PSAxMjggfHwga2V5X2xlbiA9PSAyNTYAdmVuZG9yL2NiaXRzL2NoYWNoYXBvbHkvY2hhY2hhcG9seS5jAGNoYWNoYXBvbHlfaW5pdAAB";var tempDoublePtr=STATICTOP;STATICTOP+=16;function ___assert_fail(condition,filename,line,func){abort("Assertion failed: "+Pointer_stringify(condition)+", at: "+[filename?Pointer_stringify(filename):"unknown filename",line,func?Pointer_stringify(func):"unknown function"])}function _emscripten_memcpy_big(dest,src,num){HEAPU8.set(HEAPU8.subarray(src,src+num),dest);return dest}function ___setErrNo(value){if(Module["___errno_location"])HEAP32[Module["___errno_location"]()>>2]=value;return value}DYNAMICTOP_PTR=staticAlloc(4);STACK_BASE=STACKTOP=alignMemory(STATICTOP);STACK_MAX=STACK_BASE+TOTAL_STACK;DYNAMIC_BASE=alignMemory(STACK_MAX);HEAP32[DYNAMICTOP_PTR>>2]=DYNAMIC_BASE;staticSealed=true;var ASSERTIONS=false;function intArrayToString(array){var ret=[];for(var i=0;i<array.length;i++){var chr=array[i];if(chr>255){if(ASSERTIONS){assert(false,"Character code "+chr+" ("+String.fromCharCode(chr)+")  at offset "+i+" not in 0x00-0xFF.")}chr&=255}ret.push(String.fromCharCode(chr))}return ret.join("")}var decodeBase64=typeof atob==="function"?atob:(function(input){var keyStr="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";var output="";var chr1,chr2,chr3;var enc1,enc2,enc3,enc4;var i=0;input=input.replace(/[^A-Za-z0-9\+\/\=]/g,"");do{enc1=keyStr.indexOf(input.charAt(i++));enc2=keyStr.indexOf(input.charAt(i++));enc3=keyStr.indexOf(input.charAt(i++));enc4=keyStr.indexOf(input.charAt(i++));chr1=enc1<<2|enc2>>4;chr2=(enc2&15)<<4|enc3>>2;chr3=(enc3&3)<<6|enc4;output=output+String.fromCharCode(chr1);if(enc3!==64){output=output+String.fromCharCode(chr2)}if(enc4!==64){output=output+String.fromCharCode(chr3)}}while(i<input.length);return output});function intArrayFromBase64(s){if(typeof ENVIRONMENT_IS_NODE==="boolean"&&ENVIRONMENT_IS_NODE){var buf;try{buf=Buffer.from(s,"base64")}catch(_){buf=new Buffer(s,"base64")}return new Uint8Array(buf.buffer,buf.byteOffset,buf.byteLength)}try{var decoded=decodeBase64(s);var bytes=new Uint8Array(decoded.length);for(var i=0;i<decoded.length;++i){bytes[i]=decoded.charCodeAt(i)}return bytes}catch(_){throw new Error("Converting base64 string to bytes failed.")}}function tryParseAsDataURI(filename){if(!isDataURI(filename)){return}return intArrayFromBase64(filename.slice(dataURIPrefix.length))}function invoke_iiii(index,a1,a2,a3){var sp=stackSave();try{return Module["dynCall_iiii"](index,a1,a2,a3)}catch(e){stackRestore(sp);if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0)}}Module.asmGlobalArg={"Math":Math,"Int8Array":Int8Array,"Int16Array":Int16Array,"Int32Array":Int32Array,"Uint8Array":Uint8Array,"Uint16Array":Uint16Array,"Uint32Array":Uint32Array,"Float32Array":Float32Array,"Float64Array":Float64Array,"NaN":NaN,"Infinity":Infinity};Module.asmLibraryArg={"abort":abort,"assert":assert,"enlargeMemory":enlargeMemory,"getTotalMemory":getTotalMemory,"abortOnCannotGrowMemory":abortOnCannotGrowMemory,"invoke_iiii":invoke_iiii,"___assert_fail":___assert_fail,"___setErrNo":___setErrNo,"_emscripten_memcpy_big":_emscripten_memcpy_big,"DYNAMICTOP_PTR":DYNAMICTOP_PTR,"tempDoublePtr":tempDoublePtr,"ABORT":ABORT,"STACKTOP":STACKTOP,"STACK_MAX":STACK_MAX};// EMSCRIPTEN_START_ASM
var asm=(/** @suppress {uselessCode} */ function(global,env,buffer) {
"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.DYNAMICTOP_PTR|0;var j=env.tempDoublePtr|0;var k=env.ABORT|0;var l=env.STACKTOP|0;var m=env.STACK_MAX|0;var n=0;var o=0;var p=0;var q=0;var r=global.NaN,s=global.Infinity;var t=0,u=0,v=0,w=0,x=0.0;var y=0;var z=global.Math.floor;var A=global.Math.abs;var B=global.Math.sqrt;var C=global.Math.pow;var D=global.Math.cos;var E=global.Math.sin;var F=global.Math.tan;var G=global.Math.acos;var H=global.Math.asin;var I=global.Math.atan;var J=global.Math.atan2;var K=global.Math.exp;var L=global.Math.log;var M=global.Math.ceil;var N=global.Math.imul;var O=global.Math.min;var P=global.Math.max;var Q=global.Math.clz32;var R=env.abort;var S=env.assert;var T=env.enlargeMemory;var U=env.getTotalMemory;var V=env.abortOnCannotGrowMemory;var W=env.invoke_iiii;var X=env.___assert_fail;var Y=env.___setErrNo;var Z=env._emscripten_memcpy_big;var _=0.0;
// EMSCRIPTEN_START_FUNCS
function aa(a){a=a|0;var b=0;b=l;l=l+a|0;l=l+15&-16;return b|0}function ba(){return l|0}function ca(a){a=a|0;l=a}function da(a,b){a=a|0;b=b|0;l=a;m=b}function ea(a,b){a=a|0;b=b|0;if(!n){n=a;o=b}}function fa(a){a=a|0;y=a}function ga(){return y|0}function ha(a,b){a=a|0;b=b|0;hd(a|0,0,b|0)|0;return}function ia(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;g=l;l=l+64|0;f=g;if(!(Jb(c,f)|0)){ja(a,b,f,d,e);a=0}else a=1;l=g;return a|0}function ja(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=l;l=l+32|0;h=g;Sa(d,h);na(b,c,d,f,64);b=f+64|0;c=h;d=b+32|0;do{a[b>>0]=a[c>>0]|0;b=b+1|0;c=c+1|0}while((b|0)<(d|0));b=f+96|0;c=e;d=b+32|0;do{a[b>>0]=a[c>>0]|0;b=b+1|0;c=c+1|0}while((b|0)<(d|0));l=g;return}function ka(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=l;l=l+96|0;h=g+32|0;i=g;la(b,c,a,h);Sa(h,i);mb(d,e,a+96|0,32,h,i,f);ma(h);l=g;return}function la(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;na(a,b,c,d,64);return}function ma(a){a=a|0;ha(a,64);return}function na(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;h=l;l=l+176|0;f=h+136|0;g=h;if(!b)gd(d|0,c|0,e|0)|0;else{hd(g|0,0,131)|0;Na(f,a,b);Ob(g,20,32,f,8,f+32|0);ha(f,40);Pb(d,g,c,e);ha(g,131)}l=h;return}function oa(b,c,e){b=b|0;c=c|0;e=e|0;var f=0,g=0;f=0;g=0;while(1){f=f+(d[b+g>>0]|0)+(d[c+g>>0]|0)|0;a[e+g>>0]=f;g=g+1|0;if((g|0)==32)break;else f=f>>>8}return}function pa(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0;o=l;l=l+688|0;j=o+616|0;k=o+552|0;m=o;n=o+544|0;g=o+480|0;h=o+416|0;qa(n,d,f);la(b,c,a,j);i=a+96|0;ra(m,i,32);d=(sa(d)|0)==0;if(d){ta(m,29668,1);ta(m,a+64|0,32)}else{ta(m,30596,1);ta(m,j,64)}ta(m,n,4);ua(m,g);va(k,g,j,f);wa(k,g,j,f);ra(m,i,32);if(d){ta(m,29672,1);ta(m,a+64|0,32)}else{ta(m,29670,1);ta(m,j,64)}ta(m,n,4);ua(m,h);ma(j);ja(b,c,k,h+32|0,e);ha(k,64);ha(h,64);l=o;return}function qa(b,c,d){b=b|0;c=c|0;d=d|0;switch(d|0){case 1:{a[b>>0]=c>>>24;a[b+1>>0]=c>>>16;a[b+2>>0]=c>>>8;a[b+3>>0]=c;break}case 2:{a[b+3>>0]=c>>>24;a[b+2>>0]=c>>>16;a[b+1>>0]=c>>>8;a[b>>0]=c;break}default:{}}return}function ra(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;h=l;l=l+384|0;e=h+256|0;f=h+128|0;g=h;if(d>>>0>128){dc(b);ec(b,c,d);kc(b,e);d=64;c=e}if((e|0)!=(c|0))gd(e|0,c|0,d|0)|0;if(d>>>0<128)hd(e+d|0,0,128-d|0)|0;c=0;do{d=a[e+c>>0]|0;a[f+c>>0]=d^54;a[g+c>>0]=d^92;c=c+1|0}while((c|0)!=128);dc(b);ec(b,f,128);f=b+208|0;dc(f);ec(f,g,128);l=h;return}function sa(a){a=a|0;return a&-2147483648|0}function ta(a,b,c){a=a|0;b=b|0;c=c|0;ec(a,b,c);return}function ua(a,b){a=a|0;b=b|0;kc(a,b);a=a+208|0;ec(a,b,64);kc(a,b);return}function va(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=l;l=l+32|0;f=h;g=f;i=g+32|0;do{a[g>>0]=0;g=g+1|0}while((g|0)<(i|0));switch(e|0){case 1:{Oa(f,c);Fb(f,d,b)|0;break}case 2:{Pa(f,c);oa(f,d,b);break}default:{}}l=h;return}function wa(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;switch(d|0){case 1:{Qa(a+32|0,b+32|0,c+32|0);break}case 2:{Ra(a+32|0,b+32|0,c+32|0);break}default:{}}return}function xa(b,c,d,e,f,g){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0;m=l;l=l+560|0;h=m;i=m+544|0;j=m+480|0;k=m+416|0;if(!(sa(d)|0)){qa(i,d,g);ra(h,c,32);ta(h,29668,1);ta(h,b,32);ta(h,i,4);ua(h,j);ya(e,j,b,g);ra(h,c,32);ta(h,29672,1);ta(h,b,32);ta(h,i,4);ua(h,k);b=k+32|0;c=f+32|0;do{a[f>>0]=a[b>>0]|0;f=f+1|0;b=b+1|0}while((f|0)<(c|0));b=0}else b=1;l=m;return b|0}function ya(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;i=l;l=l+64|0;f=i+32|0;g=i;h=f;j=h+32|0;do{a[h>>0]=0;h=h+1|0}while((h|0)<(j|0));switch(e|0){case 1:{Oa(f,c);break}case 2:{Pa(f,c);break}default:{}}Sa(f,g);Gb(g,d,b)|0;l=i;return}function za(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ka(a,0,0,b,c,d);return}function Aa(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return vb(a,b,c,d)|0}function Ba(a,b){a=a|0;b=b|0;Sa(a,b);return}function Ca(a,b,c){a=a|0;b=b|0;c=c|0;return ia(0,0,a,b,c)|0}function Da(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;pa(a,0,0,b,c,d);return}function Ea(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return xa(a,b,c,d,e,f)|0}function Fa(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return Kc(c,d,a,b,0,0)|0}function Ga(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=l;l=l+208|0;e=d;hd(e|0,0,208)|0;mc(e,256);nc(e,a,b);tc(e,256,c);l=d;return}function Ha(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;na(a,b,c,d,e);return}function Ia(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,m=0,n=0;m=l;l=l+64|0;j=m;k=j;n=k+64|0;do{c[k>>2]=0;k=k+4|0}while((k|0)<(n|0));Oc(j,a,256)|0;n=Pc(j,b,0,0,d,e,f,g,h,i)|0;l=m;return n|0}function Ja(){return 416}function Ka(a,b,c){a=a|0;b=b|0;c=c|0;ra(a,b,c);return}function La(a,b,c){a=a|0;b=b|0;c=c|0;ta(a,b,c);return}function Ma(a,b){a=a|0;b=b|0;ua(a,b);return}function Na(a,b,c){a=a|0;b=b|0;c=c|0;if(!c)X(29696,29709,28,29741);else{Vb(b,c,29674,22,15e3,a,40);return}}function Oa(b,c){b=b|0;c=c|0;var e=0;e=0;do{a[b+e>>0]=(d[c+e>>0]|0)<<3;e=e+1|0}while((e|0)!=32);return}function Pa(b,c){b=b|0;c=c|0;var e=0,f=0,g=0;e=0;f=0;while(1){g=c+e|0;a[b+e>>0]=(d[g>>0]|0)<<3|f&7;e=e+1|0;if((e|0)==28)break;else f=(d[g>>0]|0)>>>5}a[b+28>>0]=(d[c+27>>0]|0)>>>5;return}function Qa(b,c,e){b=b|0;c=c|0;e=e|0;var f=0;f=0;do{a[b+f>>0]=(d[e+f>>0]|0)+(d[c+f>>0]|0);f=f+1|0}while((f|0)!=32);return}function Ra(b,c,e){b=b|0;c=c|0;e=e|0;var f=0,g=0;f=0;g=0;while(1){f=f+(d[c+g>>0]|0)+(d[e+g>>0]|0)|0;a[b+g>>0]=f;g=g+1|0;if((g|0)==32)break;else f=f>>>0>255&1}return}function Sa(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0;h=l;l=l+272|0;d=h+160|0;e=h;f=h+200|0;g=f+32|0;i=g+32|0;do{a[g>>0]=0;g=g+1|0}while((g|0)<(i|0));g=f;i=g+32|0;do{a[g>>0]=a[b>>0]|0;g=g+1|0;b=b+1|0}while((g|0)<(i|0));Ta(d,f,32);Ua(e,d);Va(c,e);l=h;return}function Ta(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=l;l=l+112|0;v=e+40|0;f=e;hd(v+d|0,0,(d>>>0>63?0:64-d|0)|0)|0;gd(v|0,b|0,d|0)|0;u=ib(v)|0;t=ib(v+4|0)|0;s=ib(v+8|0)|0;r=ib(v+12|0)|0;q=ib(v+16|0)|0;p=ib(v+20|0)|0;o=ib(v+24|0)|0;n=ib(v+28|0)|0;m=ib(v+32|0)|0;k=ib(v+36|0)|0;j=ib(v+40|0)|0;i=ib(v+44|0)|0;h=ib(v+48|0)|0;g=ib(v+52|0)|0;b=ib(v+56|0)|0;d=ib(v+60|0)|0;c[a>>2]=u&1073741823;c[a+4>>2]=t<<2&1073741820|u>>>30;c[a+8>>2]=s<<4&1073741808|t>>>28;c[a+12>>2]=r<<6&1073741760|s>>>26;c[a+16>>2]=q<<8&1073741568|r>>>24;c[a+20>>2]=p<<10&1073740800|q>>>22;c[a+24>>2]=o<<12&1073737728|p>>>20;c[a+28>>2]=n<<14&1073725440|o>>>18;c[a+32>>2]=m<<16&16711680|n>>>16;c[f>>2]=m<<8&1073741568|n>>>24;c[f+4>>2]=k<<10&1073740800|m>>>22;c[f+8>>2]=j<<12&1073737728|k>>>20;c[f+12>>2]=i<<14&1073725440|j>>>18;c[f+16>>2]=h<<16&1073676288|i>>>16;c[f+20>>2]=g<<18&1073479680|h>>>14;c[f+24>>2]=b<<20&1072693248|g>>>12;c[f+28>>2]=d<<22&1069547520|b>>>10;c[f+32>>2]=d>>>8;jb(a,f,a);l=e;return}function Ua(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;i=l;l=l+192|0;g=i+120|0;h=i;$a(g,d);ab(h,0,a[g+1>>0]|0);f=c[h+40>>2]|0;A=c[h>>2]|0;C=f+268435380-A|0;B=C&67108863;c[b>>2]=B;z=c[h+44>>2]|0;y=c[h+4>>2]|0;C=z+134217724+(C>>>26)-y|0;c[b+4>>2]=C&33554431;x=c[h+48>>2]|0;d=c[h+8>>2]|0;C=x+268435452-d+(C>>>25)|0;c[b+8>>2]=C&67108863;v=c[h+52>>2]|0;w=c[h+12>>2]|0;C=v+134217724-w+(C>>>26)|0;c[b+12>>2]=C&33554431;t=c[h+56>>2]|0;u=c[h+16>>2]|0;C=t+268435452-u+(C>>>25)|0;c[b+16>>2]=C&67108863;r=c[h+60>>2]|0;s=c[h+20>>2]|0;C=r+134217724-s+(C>>>26)|0;c[b+20>>2]=C&33554431;p=c[h+64>>2]|0;q=c[h+24>>2]|0;C=p+268435452-q+(C>>>25)|0;c[b+24>>2]=C&67108863;n=c[h+68>>2]|0;o=c[h+28>>2]|0;C=n+134217724-o+(C>>>26)|0;c[b+28>>2]=C&33554431;k=c[h+72>>2]|0;m=c[h+32>>2]|0;C=k+268435452-m+(C>>>25)|0;c[b+32>>2]=C&67108863;e=c[h+76>>2]|0;j=c[h+36>>2]|0;C=e+134217724-j+(C>>>26)|0;c[b+36>>2]=C&33554431;c[b>>2]=((C>>>25)*19|0)+B;f=A+f|0;y=(f>>>26)+z+y|0;c[b+44>>2]=y&33554431;d=(y>>>25)+x+d|0;c[b+48>>2]=d&67108863;d=w+v+(d>>>26)|0;c[b+52>>2]=d&33554431;d=u+t+(d>>>25)|0;c[b+56>>2]=d&67108863;d=s+r+(d>>>26)|0;c[b+60>>2]=d&33554431;d=q+p+(d>>>25)|0;c[b+64>>2]=d&67108863;d=o+n+(d>>>26)|0;c[b+68>>2]=d&33554431;d=m+k+(d>>>25)|0;c[b+72>>2]=d&67108863;d=j+e+(d>>>26)|0;c[b+76>>2]=d&33554431;c[b+40>>2]=((d>>>25)*19|0)+(f&67108863);f=b+80|0;d=b+84|0;e=d+36|0;do{c[d>>2]=0;d=d+4|0}while((d|0)<(e|0));e=h+80|0;c[b+120>>2]=c[e>>2];c[b+124>>2]=c[h+84>>2];c[b+128>>2]=c[h+88>>2];c[b+132>>2]=c[h+92>>2];c[b+136>>2]=c[h+96>>2];c[b+140>>2]=c[h+100>>2];c[b+144>>2]=c[h+104>>2];c[b+148>>2]=c[h+108>>2];c[b+152>>2]=c[h+112>>2];c[b+156>>2]=c[h+116>>2];c[f>>2]=2;d=3;do{ab(h,d>>>1,a[g+d>>0]|0);bb(b,h);d=d+2|0}while(d>>>0<64);cb(b,b);cb(b,b);cb(b,b);db(b,b);ab(h,0,a[g>>0]|0);Xa(e,e,16);bb(b,h);d=2;do{ab(h,d>>>1,a[g+d>>0]|0);bb(b,h);d=d+2|0}while(d>>>0<64);l=i;return}function Va(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;d=l;l=l+160|0;f=d+80|0;g=d+40|0;h=d;e=d+120|0;Wa(h,c+80|0);Xa(f,c,h);Xa(g,c+40|0,h);Ya(b,g);Ya(e,f);c=b+31|0;a[c>>0]=a[c>>0]^a[e>>0]<<7&255;l=d;return}function Wa(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=l;l=l+144|0;d=c+96|0;f=c+48|0;e=c;Za(d,b,1);Za(f,d,2);Xa(e,f,b);Xa(d,e,d);Za(f,d,1);Xa(e,f,e);_a(e);Za(e,e,5);Xa(a,e,d);l=c;return}function Xa(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0,uc=0,vc=0,wc=0,xc=0;K=c[d>>2]|0;k=c[d+4>>2]|0;Xb=c[d+8>>2]|0;Ob=c[d+12>>2]|0;Qb=c[d+16>>2]|0;cb=c[d+20>>2]|0;eb=c[d+24>>2]|0;sa=c[d+28>>2]|0;ua=c[d+32>>2]|0;I=c[d+36>>2]|0;Y=c[b>>2]|0;e=c[b+4>>2]|0;fb=c[b+8>>2]|0;_b=c[b+12>>2]|0;Yb=c[b+16>>2]|0;kb=c[b+20>>2]|0;ib=c[b+24>>2]|0;wa=c[b+28>>2]|0;ta=c[b+32>>2]|0;d=c[b+36>>2]|0;xc=bd(e|0,0,K|0,0)|0;wc=y;vc=bd(Y|0,0,k|0,0)|0;uc=y;Hb=bd(_b|0,0,K|0,0)|0;Gb=y;Jb=bd(fb|0,0,k|0,0)|0;Ib=y;Nb=bd(e|0,0,Xb|0,0)|0;Mb=y;Lb=bd(Y|0,0,Ob|0,0)|0;Kb=y;Ta=bd(kb|0,0,K|0,0)|0;Sa=y;Va=bd(Yb|0,0,k|0,0)|0;Ua=y;Xa=bd(_b|0,0,Xb|0,0)|0;Wa=y;Za=bd(fb|0,0,Ob|0,0)|0;Ya=y;bb=bd(e|0,0,Qb|0,0)|0;ab=y;$a=bd(Y|0,0,cb|0,0)|0;_a=y;da=bd(wa|0,0,K|0,0)|0;ca=y;fa=bd(ib|0,0,k|0,0)|0;ea=y;ha=bd(kb|0,0,Xb|0,0)|0;ga=y;ja=bd(Yb|0,0,Ob|0,0)|0;ia=y;la=bd(_b|0,0,Qb|0,0)|0;ka=y;na=bd(fb|0,0,cb|0,0)|0;ma=y;ra=bd(e|0,0,eb|0,0)|0;qa=y;pa=bd(Y|0,0,sa|0,0)|0;oa=y;o=bd(d|0,0,K|0,0)|0;n=y;q=bd(ta|0,0,k|0,0)|0;p=y;s=bd(wa|0,0,Xb|0,0)|0;r=y;u=bd(ib|0,0,Ob|0,0)|0;t=y;w=bd(kb|0,0,Qb|0,0)|0;v=y;z=bd(Yb|0,0,cb|0,0)|0;x=y;B=bd(_b|0,0,eb|0,0)|0;A=y;D=bd(fb|0,0,sa|0,0)|0;C=y;H=bd(e|0,0,ua|0,0)|0;G=y;F=bd(Y|0,0,I|0,0)|0;E=y;M=k<<1;Q=Ob<<1;U=cb<<1;g=bd(Y|0,0,K|0,0)|0;db=y;ac=bd(fb|0,0,K|0,0)|0;$b=y;ec=bd(e|0,0,M|0,0)|0;dc=y;cc=bd(Y|0,0,Xb|0,0)|0;bc=y;mb=bd(Yb|0,0,K|0,0)|0;lb=y;ob=bd(_b|0,0,M|0,0)|0;nb=y;qb=bd(fb|0,0,Xb|0,0)|0;pb=y;ub=bd(e|0,0,Q|0,0)|0;tb=y;sb=bd(Y|0,0,Qb|0,0)|0;rb=y;ya=bd(ib|0,0,K|0,0)|0;xa=y;Aa=bd(kb|0,0,M|0,0)|0;za=y;Ca=bd(Yb|0,0,Xb|0,0)|0;Ba=y;Ea=bd(_b|0,0,Q|0,0)|0;Da=y;Ga=bd(fb|0,0,Qb|0,0)|0;Fa=y;Ka=bd(e|0,0,U|0,0)|0;Ja=y;Ia=bd(Y|0,0,eb|0,0)|0;Ha=y;K=bd(ta|0,0,K|0,0)|0;J=y;M=bd(wa|0,0,M|0,0)|0;L=y;O=bd(ib|0,0,Xb|0,0)|0;N=y;Q=bd(kb|0,0,Q|0,0)|0;P=y;S=bd(Yb|0,0,Qb|0,0)|0;R=y;U=bd(_b|0,0,U|0,0)|0;T=y;W=bd(fb|0,0,eb|0,0)|0;V=y;_=bd(e|0,0,sa<<1|0,0)|0;Z=y;Y=bd(Y|0,0,ua|0,0)|0;X=y;Xb=Xb*19|0;Ob=Ob&2147483647;Qb=Qb*19|0;cb=cb&2147483647;xb=cb*19|0;eb=eb*19|0;sa=sa&2147483647;Na=sa*19|0;ua=ua*19|0;ba=I*19|0;tc=bd(fb|0,0,ba|0,0)|0;sc=y;rc=bd(_b|0,0,ua|0,0)|0;qc=y;pc=bd(Yb|0,0,Na|0,0)|0;oc=y;nc=bd(kb|0,0,eb|0,0)|0;mc=y;lc=bd(ib|0,0,xb|0,0)|0;kc=y;jc=bd(wa|0,0,Qb|0,0)|0;ic=y;hc=bd(ta|0,0,Ob*19|0,0)|0;gc=y;fc=bd(d|0,0,Xb|0,0)|0;j=y;Fb=bd(Yb|0,0,ba|0,0)|0;Eb=y;Db=bd(kb|0,0,ua|0,0)|0;Cb=y;Bb=bd(ib|0,0,Na|0,0)|0;Ab=y;zb=bd(wa|0,0,eb|0,0)|0;yb=y;xb=bd(ta|0,0,xb|0,0)|0;wb=y;vb=bd(d|0,0,Qb|0,0)|0;h=y;Ra=bd(ib|0,0,ba|0,0)|0;Qa=y;Pa=bd(wa|0,0,ua|0,0)|0;Oa=y;Na=bd(ta|0,0,Na|0,0)|0;Ma=y;La=bd(d|0,0,eb|0,0)|0;f=y;ba=bd(ta|0,0,ba|0,0)|0;aa=y;$=bd(d|0,0,ua|0,0)|0;b=y;Ob=Ob*38|0;cb=cb*38|0;sa=sa*38|0;I=I*38|0;e=bd(e|0,0,I|0,0)|0;va=y;fb=bd(fb|0,0,ua|0,0)|0;gb=y;hb=bd(_b|0,0,sa|0,0)|0;jb=y;i=bd(Yb|0,0,eb|0,0)|0;Pb=y;Rb=bd(kb|0,0,cb|0,0)|0;Sb=y;Tb=bd(ib|0,0,Qb|0,0)|0;Ub=y;Vb=bd(wa|0,0,Ob|0,0)|0;Wb=y;Xb=bd(ta|0,0,Xb|0,0)|0;Zb=y;k=bd(d|0,0,k*38|0,0)|0;m=y;db=ed(e|0,va|0,g|0,db|0)|0;gb=ed(db|0,y|0,fb|0,gb|0)|0;jb=ed(gb|0,y|0,hb|0,jb|0)|0;Pb=ed(jb|0,y|0,i|0,Pb|0)|0;Sb=ed(Pb|0,y|0,Rb|0,Sb|0)|0;Ub=ed(Sb|0,y|0,Tb|0,Ub|0)|0;Wb=ed(Ub|0,y|0,Vb|0,Wb|0)|0;Zb=ed(Wb|0,y|0,Xb|0,Zb|0)|0;m=ed(Zb|0,y|0,k|0,m|0)|0;k=y;_b=bd(_b|0,0,I|0,0)|0;Zb=y;Yb=bd(Yb|0,0,ua|0,0)|0;Xb=y;Wb=bd(kb|0,0,sa|0,0)|0;Vb=y;Ub=bd(ib|0,0,eb|0,0)|0;Tb=y;Sb=bd(wa|0,0,cb|0,0)|0;Rb=y;Qb=bd(ta|0,0,Qb|0,0)|0;Pb=y;Ob=bd(d|0,0,Ob|0,0)|0;i=y;kb=bd(kb|0,0,I|0,0)|0;jb=y;ib=bd(ib|0,0,ua|0,0)|0;hb=y;gb=bd(wa|0,0,sa|0,0)|0;fb=y;eb=bd(ta|0,0,eb|0,0)|0;db=y;cb=bd(d|0,0,cb|0,0)|0;g=y;wa=bd(wa|0,0,I|0,0)|0;va=y;ua=bd(ta|0,0,ua|0,0)|0;ta=y;sa=bd(d|0,0,sa|0,0)|0;e=y;I=bd(d|0,0,I|0,0)|0;d=y;k=cd(m|0,k|0,26)|0;l=y;uc=ed(xc|0,wc|0,vc|0,uc|0)|0;sc=ed(uc|0,y|0,tc|0,sc|0)|0;qc=ed(sc|0,y|0,rc|0,qc|0)|0;oc=ed(qc|0,y|0,pc|0,oc|0)|0;mc=ed(oc|0,y|0,nc|0,mc|0)|0;kc=ed(mc|0,y|0,lc|0,kc|0)|0;ic=ed(kc|0,y|0,jc|0,ic|0)|0;gc=ed(ic|0,y|0,hc|0,gc|0)|0;j=ed(gc|0,y|0,fc|0,j|0)|0;l=ed(j|0,y|0,k|0,l|0)|0;k=cd(l|0,y|0,25)|0;j=y;bc=ed(ec|0,dc|0,cc|0,bc|0)|0;$b=ed(bc|0,y|0,ac|0,$b|0)|0;Zb=ed($b|0,y|0,_b|0,Zb|0)|0;Xb=ed(Zb|0,y|0,Yb|0,Xb|0)|0;Vb=ed(Xb|0,y|0,Wb|0,Vb|0)|0;Tb=ed(Vb|0,y|0,Ub|0,Tb|0)|0;Rb=ed(Tb|0,y|0,Sb|0,Rb|0)|0;Pb=ed(Rb|0,y|0,Qb|0,Pb|0)|0;i=ed(Pb|0,y|0,Ob|0,i|0)|0;j=ed(i|0,y|0,k|0,j|0)|0;k=cd(j|0,y|0,26)|0;i=y;Kb=ed(Nb|0,Mb|0,Lb|0,Kb|0)|0;Ib=ed(Kb|0,y|0,Jb|0,Ib|0)|0;Gb=ed(Ib|0,y|0,Hb|0,Gb|0)|0;Eb=ed(Gb|0,y|0,Fb|0,Eb|0)|0;Cb=ed(Eb|0,y|0,Db|0,Cb|0)|0;Ab=ed(Cb|0,y|0,Bb|0,Ab|0)|0;yb=ed(Ab|0,y|0,zb|0,yb|0)|0;wb=ed(yb|0,y|0,xb|0,wb|0)|0;h=ed(wb|0,y|0,vb|0,h|0)|0;i=ed(h|0,y|0,k|0,i|0)|0;k=cd(i|0,y|0,25)|0;h=y;rb=ed(ub|0,tb|0,sb|0,rb|0)|0;pb=ed(rb|0,y|0,qb|0,pb|0)|0;nb=ed(pb|0,y|0,ob|0,nb|0)|0;lb=ed(nb|0,y|0,mb|0,lb|0)|0;jb=ed(lb|0,y|0,kb|0,jb|0)|0;hb=ed(jb|0,y|0,ib|0,hb|0)|0;fb=ed(hb|0,y|0,gb|0,fb|0)|0;db=ed(fb|0,y|0,eb|0,db|0)|0;g=ed(db|0,y|0,cb|0,g|0)|0;h=ed(g|0,y|0,k|0,h|0)|0;k=cd(h|0,y|0,26)|0;g=y;_a=ed(bb|0,ab|0,$a|0,_a|0)|0;Ya=ed(_a|0,y|0,Za|0,Ya|0)|0;Wa=ed(Ya|0,y|0,Xa|0,Wa|0)|0;Ua=ed(Wa|0,y|0,Va|0,Ua|0)|0;Sa=ed(Ua|0,y|0,Ta|0,Sa|0)|0;Qa=ed(Sa|0,y|0,Ra|0,Qa|0)|0;Oa=ed(Qa|0,y|0,Pa|0,Oa|0)|0;Ma=ed(Oa|0,y|0,Na|0,Ma|0)|0;f=ed(Ma|0,y|0,La|0,f|0)|0;g=ed(f|0,y|0,k|0,g|0)|0;k=cd(g|0,y|0,25)|0;f=y;Ha=ed(Ka|0,Ja|0,Ia|0,Ha|0)|0;Fa=ed(Ha|0,y|0,Ga|0,Fa|0)|0;Da=ed(Fa|0,y|0,Ea|0,Da|0)|0;Ba=ed(Da|0,y|0,Ca|0,Ba|0)|0;za=ed(Ba|0,y|0,Aa|0,za|0)|0;xa=ed(za|0,y|0,ya|0,xa|0)|0;va=ed(xa|0,y|0,wa|0,va|0)|0;ta=ed(va|0,y|0,ua|0,ta|0)|0;e=ed(ta|0,y|0,sa|0,e|0)|0;f=ed(e|0,y|0,k|0,f|0)|0;k=cd(f|0,y|0,26)|0;e=y;oa=ed(ra|0,qa|0,pa|0,oa|0)|0;ma=ed(oa|0,y|0,na|0,ma|0)|0;ka=ed(ma|0,y|0,la|0,ka|0)|0;ia=ed(ka|0,y|0,ja|0,ia|0)|0;ga=ed(ia|0,y|0,ha|0,ga|0)|0;ea=ed(ga|0,y|0,fa|0,ea|0)|0;ca=ed(ea|0,y|0,da|0,ca|0)|0;aa=ed(ca|0,y|0,ba|0,aa|0)|0;b=ed(aa|0,y|0,$|0,b|0)|0;e=ed(b|0,y|0,k|0,e|0)|0;k=cd(e|0,y|0,25)|0;b=y;X=ed(_|0,Z|0,Y|0,X|0)|0;V=ed(X|0,y|0,W|0,V|0)|0;T=ed(V|0,y|0,U|0,T|0)|0;R=ed(T|0,y|0,S|0,R|0)|0;P=ed(R|0,y|0,Q|0,P|0)|0;N=ed(P|0,y|0,O|0,N|0)|0;L=ed(N|0,y|0,M|0,L|0)|0;J=ed(L|0,y|0,K|0,J|0)|0;d=ed(J|0,y|0,I|0,d|0)|0;b=ed(d|0,y|0,k|0,b|0)|0;k=cd(b|0,y|0,26)|0;d=y;E=ed(H|0,G|0,F|0,E|0)|0;C=ed(E|0,y|0,D|0,C|0)|0;A=ed(C|0,y|0,B|0,A|0)|0;x=ed(A|0,y|0,z|0,x|0)|0;v=ed(x|0,y|0,w|0,v|0)|0;t=ed(v|0,y|0,u|0,t|0)|0;r=ed(t|0,y|0,s|0,r|0)|0;p=ed(r|0,y|0,q|0,p|0)|0;n=ed(p|0,y|0,o|0,n|0)|0;d=ed(n|0,y|0,k|0,d|0)|0;k=cd(d|0,y|0,25)|0;k=bd(k|0,0,19,0)|0;m=ed(k|0,y|0,m&67108863|0,0)|0;k=cd(m|0,y|0,26)|0;c[a>>2]=m&67108863;c[a+4>>2]=(l&33554431)+k;c[a+8>>2]=j&67108863;c[a+12>>2]=i&33554431;c[a+16>>2]=h&67108863;c[a+20>>2]=g&33554431;c[a+24>>2]=f&67108863;c[a+28>>2]=e&33554431;c[a+32>>2]=b&67108863;c[a+36>>2]=d&33554431;return}function Ya(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;m=c[d>>2]|0;l=(c[d+4>>2]|0)+(m>>>26)|0;k=(l>>>25)+(c[d+8>>2]|0)|0;j=(k>>>26)+(c[d+12>>2]|0)|0;i=(j>>>25)+(c[d+16>>2]|0)|0;h=(i>>>26)+(c[d+20>>2]|0)|0;g=(h>>>25)+(c[d+24>>2]|0)|0;f=(g>>>26)+(c[d+28>>2]|0)|0;e=(f>>>25)+(c[d+32>>2]|0)|0;d=(e>>>26)+(c[d+36>>2]|0)|0;m=((d>>>25)*19|0)+(m&67108863)|0;l=(m>>>26)+(l&33554431)|0;k=(l>>>25)+(k&67108863)|0;j=(k>>>26)+(j&33554431)|0;i=(j>>>25)+(i&67108863)|0;h=(i>>>26)+(h&33554431)|0;g=(h>>>25)+(g&67108863)|0;f=(g>>>26)+(f&33554431)|0;e=(f>>>25)+(e&67108863)|0;d=(e>>>26)+(d&33554431)|0;m=(m&67108863)+19+(0-(d>>>25)&19)|0;l=(m>>>26)+(l&33554431)|0;k=(l>>>25)+(k&67108863)|0;j=(k>>>26)+(j&33554431)|0;i=(j>>>25)+(i&67108863)|0;h=(i>>>26)+(h&33554431)|0;g=(h>>>25)+(g&67108863)|0;f=(g>>>26)+(f&33554431)|0;e=(f>>>25)+(e&67108863)|0;d=(e>>>26)+(d&33554431)|0;m=(m&67108863)+67108845+(0-(d>>>25)&19)|0;l=(l&33554431)+33554431+(m>>>26)|0;k=(k&67108863)+67108863+(l>>>25)|0;j=(j&33554431)+33554431+(k>>>26)|0;i=(i&67108863)+67108863+(j>>>25)|0;h=(h&33554431)+33554431+(i>>>26)|0;g=(g&67108863)+67108863+(h>>>25)|0;f=(f&33554431)+33554431+(g>>>26)|0;e=(e&67108863)+67108863+(f>>>25)|0;d=d+33554431+(e>>>26)|0;a[b>>0]=m;a[b+1>>0]=m>>>8;a[b+2>>0]=m>>>16;a[b+3>>0]=l<<2|m>>>24&3;a[b+4>>0]=l>>>6;a[b+5>>0]=l>>>14;a[b+6>>0]=k<<3|l>>>22&7;a[b+7>>0]=k>>>5;a[b+8>>0]=k>>>13;a[b+9>>0]=j<<5|k>>>21&31;a[b+10>>0]=j>>>3;a[b+11>>0]=j>>>11;a[b+12>>0]=i<<6|j>>>19&63;a[b+13>>0]=i>>>2;a[b+14>>0]=i>>>10;a[b+15>>0]=i>>>18;a[b+16>>0]=h;a[b+17>>0]=h>>>8;a[b+18>>0]=h>>>16;a[b+19>>0]=g<<1|h>>>24&1;a[b+20>>0]=g>>>7;a[b+21>>0]=g>>>15;a[b+22>>0]=f<<3|g>>>23&7;a[b+23>>0]=f>>>5;a[b+24>>0]=f>>>13;a[b+25>>0]=e<<4|f>>>21&15;a[b+26>>0]=e>>>4;a[b+27>>0]=e>>>12;a[b+28>>0]=d<<6|e>>>20&63;a[b+29>>0]=d>>>2;a[b+30>>0]=d>>>10;a[b+31>>0]=d>>>18&127;return}function Za(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0;e=c[b>>2]|0;f=c[b+4>>2]|0;g=c[b+8>>2]|0;h=c[b+12>>2]|0;i=c[b+16>>2]|0;j=c[b+20>>2]|0;k=c[b+24>>2]|0;l=c[b+28>>2]|0;m=c[b+32>>2]|0;b=c[b+36>>2]|0;do{p=bd(e|0,0,e|0,0)|0;n=y;s=e<<1;_a=bd(s|0,0,f|0,0)|0;q=y;Pa=bd(s|0,0,g|0,0)|0;Oa=y;$a=f<<1;Ra=bd($a|0,0,f|0,0)|0;Qa=y;Fa=bd(s|0,0,h|0,0)|0;Ea=y;Ha=bd($a|0,0,g|0,0)|0;Ga=y;ta=bd(s|0,0,i|0,0)|0;sa=y;Ta=h<<1;va=bd($a|0,0,Ta|0,0)|0;ua=y;xa=bd(g|0,0,g|0,0)|0;wa=y;bb=g<<1;ja=bd(s|0,0,j|0,0)|0;ia=y;la=bd($a|0,0,i|0,0)|0;ka=y;na=bd(bb|0,0,h|0,0)|0;ma=y;Z=bd(s|0,0,k|0,0)|0;Y=y;za=j<<1;$=bd($a|0,0,za|0,0)|0;_=y;ba=bd(bb|0,0,i|0,0)|0;aa=y;da=bd(Ta|0,0,h|0,0)|0;ca=y;P=bd(s|0,0,l|0,0)|0;O=y;R=bd($a|0,0,k|0,0)|0;Q=y;T=bd(bb|0,0,j|0,0)|0;S=y;X=bd(Ta|0,0,i|0,0)|0;W=y;D=bd(s|0,0,m|0,0)|0;C=y;ha=l<<1;F=bd($a|0,0,ha|0,0)|0;E=y;H=bd(bb|0,0,k|0,0)|0;G=y;J=bd(Ta|0,0,za|0,0)|0;I=y;N=bd(i|0,0,i|0,0)|0;M=y;s=bd(s|0,0,b|0,0)|0;r=y;u=bd($a|0,0,m|0,0)|0;t=y;w=bd(bb|0,0,l|0,0)|0;v=y;B=bd(Ta|0,0,k|0,0)|0;A=y;z=bd(i|0,0,za|0,0)|0;x=y;Xa=k*19|0;Ba=l*38|0;fa=m*19|0;L=b*38|0;$a=bd($a|0,0,L|0,0)|0;ab=y;bb=bd(bb|0,0,fa|0,0)|0;cb=y;db=bd(Ta|0,0,Ba|0,0)|0;eb=y;Va=i<<1;Sa=bd(Va|0,0,Xa|0,0)|0;fb=y;gb=bd(j*38|0,0,j|0,0)|0;gb=ed(Sa|0,fb|0,gb|0,y|0)|0;eb=ed(gb|0,y|0,db|0,eb|0)|0;cb=ed(eb|0,y|0,bb|0,cb|0)|0;ab=ed(cb|0,y|0,$a|0,ab|0)|0;n=ed(ab|0,y|0,p|0,n|0)|0;p=y;ab=bd(g&2147483647|0,0,L|0,0)|0;$a=y;cb=bd(Ta|0,0,fa|0,0)|0;bb=y;eb=bd(i|0,0,Ba|0,0)|0;db=y;gb=bd(za|0,0,Xa|0,0)|0;fb=y;Ta=bd(Ta|0,0,L|0,0)|0;Sa=y;Va=bd(Va|0,0,fa|0,0)|0;Ua=y;Za=bd(za|0,0,Ba|0,0)|0;Ya=y;Xa=bd(Xa|0,0,k|0,0)|0;Wa=y;Ja=bd(i|0,0,L|0,0)|0;Ia=y;Na=bd(za|0,0,fa|0,0)|0;Ma=y;La=bd(Ba|0,0,k|0,0)|0;Ka=y;za=bd(za|0,0,L|0,0)|0;ya=y;Da=bd(k<<1|0,0,fa|0,0)|0;Ca=y;Ba=bd(Ba|0,0,l|0,0)|0;Aa=y;ra=bd(k|0,0,L|0,0)|0;qa=y;pa=bd(ha|0,0,fa|0,0)|0;oa=y;ha=bd(ha|0,0,L|0,0)|0;ga=y;fa=bd(fa|0,0,m|0,0)|0;ea=y;V=bd(L|0,0,m|0,0)|0;U=y;L=bd(L|0,0,b|0,0)|0;K=y;p=cd(n|0,p|0,26)|0;o=y;db=ed(gb|0,fb|0,eb|0,db|0)|0;bb=ed(db|0,y|0,cb|0,bb|0)|0;$a=ed(bb|0,y|0,ab|0,$a|0)|0;q=ed($a|0,y|0,_a|0,q|0)|0;o=ed(q|0,y|0,p|0,o|0)|0;p=cd(o|0,y|0,25)|0;q=y;Wa=ed(Za|0,Ya|0,Xa|0,Wa|0)|0;Ua=ed(Wa|0,y|0,Va|0,Ua|0)|0;Sa=ed(Ua|0,y|0,Ta|0,Sa|0)|0;Qa=ed(Sa|0,y|0,Ra|0,Qa|0)|0;Oa=ed(Qa|0,y|0,Pa|0,Oa|0)|0;q=ed(Oa|0,y|0,p|0,q|0)|0;g=q&67108863;q=cd(q|0,y|0,26)|0;p=y;Ka=ed(Na|0,Ma|0,La|0,Ka|0)|0;Ia=ed(Ka|0,y|0,Ja|0,Ia|0)|0;Ga=ed(Ia|0,y|0,Ha|0,Ga|0)|0;Ea=ed(Ga|0,y|0,Fa|0,Ea|0)|0;p=ed(Ea|0,y|0,q|0,p|0)|0;h=p&33554431;p=cd(p|0,y|0,25)|0;q=y;Aa=ed(Da|0,Ca|0,Ba|0,Aa|0)|0;ya=ed(Aa|0,y|0,za|0,ya|0)|0;wa=ed(ya|0,y|0,xa|0,wa|0)|0;ua=ed(wa|0,y|0,va|0,ua|0)|0;sa=ed(ua|0,y|0,ta|0,sa|0)|0;q=ed(sa|0,y|0,p|0,q|0)|0;i=q&67108863;q=cd(q|0,y|0,26)|0;p=y;oa=ed(ra|0,qa|0,pa|0,oa|0)|0;ma=ed(oa|0,y|0,na|0,ma|0)|0;ka=ed(ma|0,y|0,la|0,ka|0)|0;ia=ed(ka|0,y|0,ja|0,ia|0)|0;p=ed(ia|0,y|0,q|0,p|0)|0;j=p&33554431;p=cd(p|0,y|0,25)|0;q=y;ea=ed(ha|0,ga|0,fa|0,ea|0)|0;ca=ed(ea|0,y|0,da|0,ca|0)|0;aa=ed(ca|0,y|0,ba|0,aa|0)|0;_=ed(aa|0,y|0,$|0,_|0)|0;Y=ed(_|0,y|0,Z|0,Y|0)|0;q=ed(Y|0,y|0,p|0,q|0)|0;k=q&67108863;q=cd(q|0,y|0,26)|0;p=y;U=ed(X|0,W|0,V|0,U|0)|0;S=ed(U|0,y|0,T|0,S|0)|0;Q=ed(S|0,y|0,R|0,Q|0)|0;O=ed(Q|0,y|0,P|0,O|0)|0;p=ed(O|0,y|0,q|0,p|0)|0;l=p&33554431;p=cd(p|0,y|0,25)|0;q=y;K=ed(N|0,M|0,L|0,K|0)|0;I=ed(K|0,y|0,J|0,I|0)|0;G=ed(I|0,y|0,H|0,G|0)|0;E=ed(G|0,y|0,F|0,E|0)|0;C=ed(E|0,y|0,D|0,C|0)|0;q=ed(C|0,y|0,p|0,q|0)|0;m=q&67108863;q=cd(q|0,y|0,26)|0;p=y;x=ed(B|0,A|0,z|0,x|0)|0;v=ed(x|0,y|0,w|0,v|0)|0;t=ed(v|0,y|0,u|0,t|0)|0;r=ed(t|0,y|0,s|0,r|0)|0;p=ed(r|0,y|0,q|0,p|0)|0;b=p&33554431;p=cd(p|0,y|0,25)|0;p=bd(p|0,0,19,0)|0;n=ed(p|0,y|0,n&67108863|0,0)|0;e=n&67108863;n=cd(n|0,y|0,26)|0;f=(o&33554431)+n|0;d=d+-1|0}while((d|0)!=0);c[a>>2]=e;c[a+4>>2]=f;c[a+8>>2]=g;c[a+12>>2]=h;c[a+16>>2]=i;c[a+20>>2]=j;c[a+24>>2]=k;c[a+28>>2]=l;c[a+32>>2]=m;c[a+36>>2]=b;return}function _a(a){a=a|0;var b=0,c=0,d=0;b=l;l=l+96|0;c=b+48|0;d=b;Za(c,a,5);Xa(a,c,a);Za(c,a,10);Xa(d,c,a);Za(c,d,20);Xa(c,c,d);Za(c,c,10);Xa(a,c,a);Za(c,a,50);Xa(d,c,a);Za(c,d,100);Xa(c,c,d);Za(c,c,50);Xa(a,c,a);l=b;return}function $a(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;j=0;k=b;while(1){f=0;h=c[e+(j<<2)>>2]|0;g=k;while(1){a[g>>0]=h&15;h=h>>>4;f=f+1|0;if((f|0)==7)break;else g=g+1|0}i=0;f=c[e+((j|1)<<2)>>2]<<2|h;g=k+7|0;while(1){a[g>>0]=f&15;i=i+1|0;if((i|0)==8)break;else{f=f>>>4;g=g+1|0}}j=j+2|0;if(j>>>0>=8)break;else k=k+15|0}f=c[e+32>>2]|0;a[b+60>>0]=f&15;a[b+61>>0]=f>>>4&15;a[b+62>>0]=f>>>8&15;a[b+63>>0]=f>>>12&15;f=0;g=0;h=a[b>>0]|0;do{k=f+(h&255)|0;e=g;g=g+1|0;j=b+g|0;h=(k<<24>>28)+(d[j>>0]|0)&255;a[j>>0]=h;k=k&15;f=k>>>3;a[b+e>>0]=k-(f<<4)}while((g|0)!=63);b=b+63|0;a[b>>0]=f+(d[b>>0]|0);return}function ab(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0;ca=l;l=l+96|0;aa=ca;$=(e&255)>>>7;ba=0-$|0;$=(e<<24>>24)-$^ba;e=aa;f=e+96|0;do{c[e>>2]=0;e=e+4|0}while((e|0)<(f|0));a[aa>>0]=1;_=aa+32|0;a[_>>0]=1;g=d<<3;j=aa+4|0;m=aa+8|0;p=aa+12|0;s=aa+16|0;u=aa+20|0;x=aa+24|0;A=aa+28|0;B=aa+36|0;C=aa+40|0;D=aa+44|0;E=aa+48|0;F=aa+52|0;G=aa+56|0;H=aa+60|0;I=aa+64|0;J=aa+68|0;K=aa+72|0;L=aa+76|0;M=aa+80|0;N=aa+84|0;O=aa+88|0;P=aa+92|0;e=0;f=0;d=0;h=0;i=0;k=0;n=0;o=0;q=0;r=0;t=0;v=0;w=0;y=0;z=0;Q=c[aa>>2]|0;R=0;S=0;T=0;U=0;V=0;W=0;X=0;Y=c[_>>2]|0;Z=0;do{fa=e+g|0;e=e+1|0;ea=gb($,e)|0;da=ea+-1|0;ea=0-ea|0;Q=c[64+(fa*96|0)>>2]&ea|Q&da;R=c[64+(fa*96|0)+4>>2]&ea|R&da;S=c[64+(fa*96|0)+8>>2]&ea|S&da;T=c[64+(fa*96|0)+12>>2]&ea|T&da;U=c[64+(fa*96|0)+16>>2]&ea|U&da;V=c[64+(fa*96|0)+20>>2]&ea|V&da;W=c[64+(fa*96|0)+24>>2]&ea|W&da;X=c[64+(fa*96|0)+28>>2]&ea|X&da;Y=c[64+(fa*96|0)+32>>2]&ea|Y&da;Z=c[64+(fa*96|0)+36>>2]&ea|Z&da;f=c[64+(fa*96|0)+40>>2]&ea|f&da;d=c[64+(fa*96|0)+44>>2]&ea|d&da;h=c[64+(fa*96|0)+48>>2]&ea|h&da;i=c[64+(fa*96|0)+52>>2]&ea|i&da;k=c[64+(fa*96|0)+56>>2]&ea|k&da;n=c[64+(fa*96|0)+60>>2]&ea|n&da;o=c[64+(fa*96|0)+64>>2]&ea|o&da;q=c[64+(fa*96|0)+68>>2]&ea|q&da;r=c[64+(fa*96|0)+72>>2]&ea|r&da;t=c[64+(fa*96|0)+76>>2]&ea|t&da;v=c[64+(fa*96|0)+80>>2]&ea|v&da;w=c[64+(fa*96|0)+84>>2]&ea|w&da;y=c[64+(fa*96|0)+88>>2]&ea|y&da;z=c[64+(fa*96|0)+92>>2]&ea|z&da}while((e|0)!=8);c[aa>>2]=Q;c[j>>2]=R;c[m>>2]=S;c[p>>2]=T;c[s>>2]=U;c[u>>2]=V;c[x>>2]=W;c[A>>2]=X;c[_>>2]=Y;c[B>>2]=Z;c[C>>2]=f;c[D>>2]=d;c[E>>2]=h;c[F>>2]=i;c[G>>2]=k;c[H>>2]=n;c[I>>2]=o;c[J>>2]=q;c[K>>2]=r;c[L>>2]=t;c[M>>2]=v;c[N>>2]=w;c[O>>2]=y;c[P>>2]=z;hb(b,aa);H=b+40|0;hb(H,_);E=b+80|0;hb(E,I);D=c[b>>2]|0;G=c[H>>2]|0;F=(G^D)&ba;c[b>>2]=F^D;c[H>>2]=F^G;H=b+4|0;G=c[H>>2]|0;F=b+44|0;D=c[F>>2]|0;C=(D^G)&ba;c[H>>2]=C^G;c[F>>2]=C^D;F=b+8|0;D=c[F>>2]|0;C=b+48|0;H=c[C>>2]|0;G=(H^D)&ba;c[F>>2]=G^D;c[C>>2]=G^H;C=b+12|0;H=c[C>>2]|0;G=b+52|0;F=c[G>>2]|0;D=(F^H)&ba;c[C>>2]=D^H;c[G>>2]=D^F;G=b+16|0;F=c[G>>2]|0;D=b+56|0;C=c[D>>2]|0;H=(C^F)&ba;c[G>>2]=H^F;c[D>>2]=H^C;D=b+20|0;C=c[D>>2]|0;H=b+60|0;G=c[H>>2]|0;F=(G^C)&ba;c[D>>2]=F^C;c[H>>2]=F^G;H=b+24|0;G=c[H>>2]|0;F=b+64|0;D=c[F>>2]|0;C=(D^G)&ba;c[H>>2]=C^G;c[F>>2]=C^D;F=b+28|0;D=c[F>>2]|0;C=b+68|0;H=c[C>>2]|0;G=(H^D)&ba;c[F>>2]=G^D;c[C>>2]=G^H;C=b+32|0;H=c[C>>2]|0;G=b+72|0;F=c[G>>2]|0;D=(F^H)&ba;c[C>>2]=D^H;c[G>>2]=D^F;G=b+36|0;F=c[G>>2]|0;D=b+76|0;C=c[D>>2]|0;H=(C^F)&ba;c[G>>2]=H^F;c[D>>2]=H^C;D=c[E>>2]|0;C=134217690-D|0;H=b+84|0;G=c[H>>2]|0;F=67108862-G+(C>>>26)|0;K=b+88|0;J=c[K>>2]|0;I=(F>>>25)+(134217726-J)|0;N=b+92|0;M=c[N>>2]|0;L=(I>>>26)+(67108862-M)|0;Q=b+96|0;P=c[Q>>2]|0;O=(L>>>25)+(134217726-P)|0;T=b+100|0;S=c[T>>2]|0;R=(O>>>26)+(67108862-S)|0;W=b+104|0;V=c[W>>2]|0;U=(R>>>25)+(134217726-V)|0;Z=b+108|0;Y=c[Z>>2]|0;X=(U>>>26)+(67108862-Y)|0;aa=b+112|0;$=c[aa>>2]|0;_=(X>>>25)+(134217726-$)|0;fa=b+116|0;ea=c[fa>>2]|0;da=(_>>>26)+(67108862-ea)|0;c[E>>2]=(((da>>>25)*19|0)+(C&67108863)^D)&ba^D;c[H>>2]=(F&33554431^G)&ba^G;c[K>>2]=(I&67108863^J)&ba^J;c[N>>2]=(L&33554431^M)&ba^M;c[Q>>2]=(O&67108863^P)&ba^P;c[T>>2]=(R&33554431^S)&ba^S;c[W>>2]=(U&67108863^V)&ba^V;c[Z>>2]=(X&33554431^Y)&ba^Y;c[aa>>2]=(_&67108863^$)&ba^$;c[fa>>2]=(da&33554431^ea)&ba^ea;l=ca;return}function bb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;d=l;l=l+288|0;D=d+240|0;x=d+200|0;o=d+160|0;f=d+120|0;h=d+80|0;i=d+40|0;e=d;j=a+40|0;u=c[j>>2]|0;r=c[a>>2]|0;y=u+134217690-r|0;c[D>>2]=y&67108863;g=c[a+44>>2]|0;M=c[a+4>>2]|0;y=g+67108862+(y>>>26)-M|0;s=D+4|0;c[s>>2]=y&33554431;L=c[a+48>>2]|0;I=c[a+8>>2]|0;y=L+134217726-I+(y>>>25)|0;P=D+8|0;c[P>>2]=y&67108863;H=c[a+52>>2]|0;E=c[a+12>>2]|0;y=H+67108862-E+(y>>>26)|0;k=D+12|0;c[k>>2]=y&33554431;C=c[a+56>>2]|0;z=c[a+16>>2]|0;q=D+16|0;c[q>>2]=C+134217726-z+(y>>>25);y=c[a+60>>2]|0;v=c[a+20>>2]|0;w=D+20|0;c[w>>2]=y+67108862-v;t=c[a+64>>2]|0;p=c[a+24>>2]|0;B=D+24|0;c[B>>2]=t+134217726-p;n=c[a+68>>2]|0;O=c[a+28>>2]|0;F=D+28|0;c[F>>2]=n+67108862-O;m=c[a+72>>2]|0;J=c[a+32>>2]|0;K=D+32|0;c[K>>2]=m+134217726-J;G=c[a+76>>2]|0;A=c[a+36>>2]|0;N=D+36|0;c[N>>2]=G+67108862-A;c[x>>2]=r+u;c[x+4>>2]=M+g;c[x+8>>2]=I+L;c[x+12>>2]=E+H;c[x+16>>2]=z+C;c[x+20>>2]=v+y;c[x+24>>2]=p+t;c[x+28>>2]=O+n;c[x+32>>2]=J+m;c[x+36>>2]=A+G;Xa(D,D,b);Xa(f,x,b+40|0);x=c[f>>2]|0;D=c[D>>2]|0;c[e>>2]=D+x;G=f+4|0;A=c[G>>2]|0;s=c[s>>2]|0;c[e+4>>2]=s+A;m=f+8|0;J=c[m>>2]|0;P=c[P>>2]|0;c[e+8>>2]=P+J;n=f+12|0;O=c[n>>2]|0;k=c[k>>2]|0;c[e+12>>2]=k+O;t=f+16|0;p=c[t>>2]|0;q=c[q>>2]|0;c[e+16>>2]=q+p;y=f+20|0;v=c[y>>2]|0;w=c[w>>2]|0;c[e+20>>2]=w+v;C=f+24|0;z=c[C>>2]|0;B=c[B>>2]|0;c[e+24>>2]=B+z;H=f+28|0;E=c[H>>2]|0;F=c[F>>2]|0;c[e+28>>2]=F+E;L=f+32|0;I=c[L>>2]|0;K=c[K>>2]|0;c[e+32>>2]=K+I;g=f+36|0;M=c[g>>2]|0;N=c[N>>2]|0;c[e+36>>2]=N+M;D=x+134217690-D|0;c[f>>2]=D&67108863;s=A+67108862+(D>>>26)-s|0;c[G>>2]=s&33554431;s=J+134217726-P+(s>>>25)|0;c[m>>2]=s&67108863;s=O+67108862-k+(s>>>26)|0;c[n>>2]=s&33554431;c[t>>2]=p+134217726-q+(s>>>25);c[y>>2]=v+67108862-w;c[C>>2]=z+134217726-B;c[H>>2]=E+67108862-F;c[L>>2]=I+134217726-K;c[g>>2]=M+67108862-N;g=a+120|0;Xa(o,g,b+80|0);b=a+80|0;N=c[b>>2]<<1;c[h>>2]=N;M=c[a+84>>2]<<1;L=h+4|0;c[L>>2]=M;K=c[a+88>>2]<<1;I=h+8|0;c[I>>2]=K;H=c[a+92>>2]<<1;F=h+12|0;c[F>>2]=H;E=c[a+96>>2]<<1;C=h+16|0;c[C>>2]=E;B=c[a+100>>2]<<1;z=h+20|0;c[z>>2]=B;y=c[a+104>>2]<<1;w=h+24|0;c[w>>2]=y;v=c[a+108>>2]<<1;t=h+28|0;c[t>>2]=v;s=c[a+112>>2]<<1;q=h+32|0;c[q>>2]=s;p=c[a+116>>2]<<1;n=h+36|0;c[n>>2]=p;k=c[o>>2]|0;O=k+N|0;m=c[o+4>>2]|0;P=(O>>>26)+M+m|0;c[i+4>>2]=P&33554431;J=c[o+8>>2]|0;P=J+K+(P>>>25)|0;c[i+8>>2]=P&67108863;G=c[o+12>>2]|0;P=G+H+(P>>>26)|0;c[i+12>>2]=P&33554431;D=c[o+16>>2]|0;P=D+E+(P>>>25)|0;c[i+16>>2]=P&67108863;A=c[o+20>>2]|0;P=A+B+(P>>>26)|0;c[i+20>>2]=P&33554431;x=c[o+24>>2]|0;P=x+y+(P>>>25)|0;c[i+24>>2]=P&67108863;u=c[o+28>>2]|0;P=u+v+(P>>>26)|0;c[i+28>>2]=P&33554431;r=c[o+32>>2]|0;P=r+s+(P>>>25)|0;c[i+32>>2]=P&67108863;o=c[o+36>>2]|0;P=o+p+(P>>>26)|0;c[i+36>>2]=P&33554431;c[i>>2]=((P>>>25)*19|0)+(O&67108863);k=N+268435380-k|0;m=M+134217724+(k>>>26)-m|0;c[L>>2]=m&33554431;m=K+268435452-J+(m>>>25)|0;c[I>>2]=m&67108863;m=H+134217724-G+(m>>>26)|0;c[F>>2]=m&33554431;m=E+268435452-D+(m>>>25)|0;c[C>>2]=m&67108863;m=B+134217724-A+(m>>>26)|0;c[z>>2]=m&33554431;m=y+268435452-x+(m>>>25)|0;c[w>>2]=m&67108863;m=v+134217724-u+(m>>>26)|0;c[t>>2]=m&33554431;m=s+268435452-r+(m>>>25)|0;c[q>>2]=m&67108863;m=p+134217724-o+(m>>>26)|0;c[n>>2]=m&33554431;c[h>>2]=((m>>>25)*19|0)+(k&67108863);Xa(a,f,h);Xa(j,e,i);Xa(b,i,h);Xa(g,f,e);l=d;return}function cb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=l;l=l+160|0;e=c;eb(e,b);b=e+120|0;Xa(a,e,b);d=e+80|0;Xa(a+40|0,e+40|0,d);Xa(a+80|0,d,b);l=c;return}function db(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=l;l=l+160|0;d=c;eb(d,b);e=d+120|0;Xa(a,d,e);b=d+40|0;f=d+80|0;Xa(a+40|0,b,f);Xa(a+80|0,f,e);Xa(a+120|0,d,b);l=c;return}function eb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;d=l;l=l+128|0;g=d+80|0;R=d+40|0;x=d;fb(g,b);Q=b+40|0;fb(R,Q);fb(x,b+80|0);O=c[x>>2]|0;e=x+4|0;M=(c[e>>2]<<1)+(O>>>25&63)|0;c[e>>2]=M&33554431;u=x+8|0;M=(c[u>>2]<<1)+(M>>>25)|0;c[u>>2]=M&67108863;s=x+12|0;M=(c[s>>2]<<1)+(M>>>26)|0;c[s>>2]=M&33554431;q=x+16|0;M=(c[q>>2]<<1)+(M>>>25)|0;c[q>>2]=M&67108863;o=x+20|0;M=(c[o>>2]<<1)+(M>>>26)|0;c[o>>2]=M&33554431;m=x+24|0;M=(c[m>>2]<<1)+(M>>>25)|0;c[m>>2]=M&67108863;j=x+28|0;M=(c[j>>2]<<1)+(M>>>26)|0;c[j>>2]=M&33554431;h=x+32|0;M=(c[h>>2]<<1)+(M>>>25)|0;c[h>>2]=M&67108863;f=x+36|0;M=(c[f>>2]<<1)+(M>>>26)|0;c[f>>2]=M&33554431;c[x>>2]=((M>>>25)*19|0)+(O<<1&67108862);c[a>>2]=(c[Q>>2]|0)+(c[b>>2]|0);Q=a+4|0;c[Q>>2]=(c[b+44>>2]|0)+(c[b+4>>2]|0);O=a+8|0;c[O>>2]=(c[b+48>>2]|0)+(c[b+8>>2]|0);M=a+12|0;c[M>>2]=(c[b+52>>2]|0)+(c[b+12>>2]|0);K=a+16|0;c[K>>2]=(c[b+56>>2]|0)+(c[b+16>>2]|0);I=a+20|0;c[I>>2]=(c[b+60>>2]|0)+(c[b+20>>2]|0);G=a+24|0;c[G>>2]=(c[b+64>>2]|0)+(c[b+24>>2]|0);E=a+28|0;c[E>>2]=(c[b+68>>2]|0)+(c[b+28>>2]|0);C=a+32|0;c[C>>2]=(c[b+72>>2]|0)+(c[b+32>>2]|0);A=a+36|0;c[A>>2]=(c[b+76>>2]|0)+(c[b+36>>2]|0);fb(a,a);b=c[R>>2]|0;w=c[g>>2]|0;y=w+b|0;c[a+40>>2]=y;_=c[R+4>>2]|0;r=c[g+4>>2]|0;z=r+_|0;c[a+44>>2]=z;Z=c[R+8>>2]|0;v=c[g+8>>2]|0;P=v+Z|0;c[a+48>>2]=P;Y=c[R+12>>2]|0;t=c[g+12>>2]|0;N=t+Y|0;c[a+52>>2]=N;X=c[R+16>>2]|0;W=c[g+16>>2]|0;L=W+X|0;c[a+56>>2]=L;V=c[R+20>>2]|0;p=c[g+20>>2]|0;J=p+V|0;c[a+60>>2]=J;U=c[R+24>>2]|0;n=c[g+24>>2]|0;H=n+U|0;c[a+64>>2]=H;T=c[R+28>>2]|0;k=c[g+28>>2]|0;F=k+T|0;c[a+68>>2]=F;S=c[R+32>>2]|0;i=c[g+32>>2]|0;D=i+S|0;c[a+72>>2]=D;R=c[R+36>>2]|0;g=c[g+36>>2]|0;B=g+R|0;c[a+76>>2]=B;w=b+134217690-w|0;b=w&67108863;c[a+80>>2]=b;r=_+67108862+(w>>>26)-r|0;w=r&33554431;c[a+84>>2]=w;r=Z+134217726-v+(r>>>25)|0;v=r&67108863;c[a+88>>2]=v;r=Y+67108862-t+(r>>>26)|0;t=r&33554431;c[a+92>>2]=t;r=X+134217726-W+(r>>>25)|0;c[a+96>>2]=r;p=V+67108862-p|0;c[a+100>>2]=p;n=U+134217726-n|0;c[a+104>>2]=n;k=T+67108862-k|0;c[a+108>>2]=k;i=S+134217726-i|0;c[a+112>>2]=i;g=R+67108862-g|0;c[a+116>>2]=g;y=268435380-y+(c[a>>2]|0)|0;z=134217724-z+(c[Q>>2]|0)+(y>>>26)|0;c[Q>>2]=z&33554431;z=268435452-P+(c[O>>2]|0)+(z>>>25)|0;c[O>>2]=z&67108863;z=134217724-N+(c[M>>2]|0)+(z>>>26)|0;c[M>>2]=z&33554431;z=268435452-L+(c[K>>2]|0)+(z>>>25)|0;c[K>>2]=z&67108863;z=134217724-J+(c[I>>2]|0)+(z>>>26)|0;c[I>>2]=z&33554431;z=268435452-H+(c[G>>2]|0)+(z>>>25)|0;c[G>>2]=z&67108863;z=134217724-F+(c[E>>2]|0)+(z>>>26)|0;c[E>>2]=z&33554431;z=268435452-D+(c[C>>2]|0)+(z>>>25)|0;c[C>>2]=z&67108863;z=134217724-B+(c[A>>2]|0)+(z>>>26)|0;c[A>>2]=z&33554431;c[a>>2]=((z>>>25)*19|0)+(y&67108863);b=268435380-b+(c[x>>2]|0)|0;e=134217724-w+(c[e>>2]|0)+(b>>>26)|0;c[a+124>>2]=e&33554431;e=268435452-v+(c[u>>2]|0)+(e>>>25)|0;c[a+128>>2]=e&67108863;e=134217724-t+(c[s>>2]|0)+(e>>>26)|0;c[a+132>>2]=e&33554431;e=268435452-r+(c[q>>2]|0)+(e>>>25)|0;c[a+136>>2]=e&67108863;e=134217724-p+(c[o>>2]|0)+(e>>>26)|0;c[a+140>>2]=e&33554431;e=268435452-n+(c[m>>2]|0)+(e>>>25)|0;c[a+144>>2]=e&67108863;e=134217724-k+(c[j>>2]|0)+(e>>>26)|0;c[a+148>>2]=e&33554431;e=268435452-i+(c[h>>2]|0)+(e>>>25)|0;c[a+152>>2]=e&67108863;e=134217724-g+(c[f>>2]|0)+(e>>>26)|0;c[a+156>>2]=e&33554431;c[a+120>>2]=((e>>>25)*19|0)+(b&67108863);l=d;return}function fb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0;o=c[b>>2]|0;Ma=c[b+4>>2]|0;Pa=c[b+8>>2]|0;aa=c[b+12>>2]|0;va=c[b+16>>2]|0;Fa=c[b+20>>2]|0;ba=c[b+24>>2]|0;oa=c[b+28>>2]|0;J=c[b+32>>2]|0;x=c[b+36>>2]|0;i=bd(o|0,0,o|0,0)|0;Wa=y;o=o<<1;Va=bd(o|0,0,Ma|0,0)|0;Ua=y;Oa=bd(Pa|0,0,o|0,0)|0;Na=y;k=Ma<<1;Ma=bd(k|0,0,Ma|0,0)|0;La=y;Da=bd(aa|0,0,o|0,0)|0;Ca=y;Ba=bd(k|0,0,Pa|0,0)|0;Aa=y;qa=bd(va|0,0,o|0,0)|0;pa=y;Ea=aa<<1;ua=bd(Ea|0,0,k|0,0)|0;ta=y;sa=bd(Pa|0,0,Pa|0,0)|0;ra=y;Ra=Pa<<1;fa=bd(Fa|0,0,o|0,0)|0;ea=y;ja=bd(va|0,0,k|0,0)|0;ia=y;ha=bd(Ra|0,0,aa|0,0)|0;ga=y;W=bd(ba|0,0,o|0,0)|0;V=y;ka=Fa<<1;Y=bd(ka|0,0,k|0,0)|0;X=y;_=bd(va|0,0,Ra|0,0)|0;Z=y;aa=bd(Ea|0,0,aa|0,0)|0;$=y;L=bd(oa|0,0,o|0,0)|0;K=y;N=bd(ba|0,0,k|0,0)|0;M=y;R=bd(Fa|0,0,Ra|0,0)|0;Q=y;P=bd(Ea|0,0,va|0,0)|0;O=y;A=bd(J|0,0,o|0,0)|0;z=y;S=oa<<1;C=bd(S|0,0,k|0,0)|0;B=y;I=bd(ba|0,0,Ra|0,0)|0;H=y;E=bd(ka|0,0,Ea|0,0)|0;D=y;G=bd(va|0,0,va|0,0)|0;F=y;o=bd(x|0,0,o|0,0)|0;n=y;q=bd(J|0,0,k|0,0)|0;p=y;s=bd(oa|0,0,Ra|0,0)|0;r=y;u=bd(ba|0,0,Ea|0,0)|0;t=y;w=bd(ka|0,0,va|0,0)|0;v=y;Ka=ba*19|0;na=oa*38|0;U=J*19|0;b=x*38|0;k=bd(b|0,0,k|0,0)|0;m=y;Ra=bd(U|0,0,Ra|0,0)|0;j=y;Ta=bd(na|0,0,Ea|0,0)|0;Qa=y;Ga=va<<1;Xa=bd(Ka|0,0,Ga|0,0)|0;Sa=y;Fa=bd(Fa*38|0,0,Fa|0,0)|0;Wa=ed(Fa|0,y|0,i|0,Wa|0)|0;Sa=ed(Wa|0,y|0,Xa|0,Sa|0)|0;Qa=ed(Sa|0,y|0,Ta|0,Qa|0)|0;j=ed(Qa|0,y|0,Ra|0,j|0)|0;m=ed(j|0,y|0,k|0,m|0)|0;k=y;Pa=bd(b|0,0,Pa&2147483647|0,0)|0;j=y;Ra=bd(U|0,0,Ea|0,0)|0;Qa=y;Ta=bd(na|0,0,va|0,0)|0;Sa=y;Xa=bd(Ka|0,0,ka|0,0)|0;Wa=y;Ea=bd(b|0,0,Ea|0,0)|0;i=y;Ga=bd(U|0,0,Ga|0,0)|0;Fa=y;Ia=bd(na|0,0,ka|0,0)|0;Ha=y;Ka=bd(Ka|0,0,ba|0,0)|0;Ja=y;va=bd(b|0,0,va|0,0)|0;h=y;xa=bd(U|0,0,ka|0,0)|0;wa=y;za=bd(na|0,0,ba|0,0)|0;ya=y;ka=bd(b|0,0,ka|0,0)|0;g=y;ma=bd(U|0,0,ba<<1|0,0)|0;la=y;oa=bd(na|0,0,oa|0,0)|0;na=y;ba=bd(b|0,0,ba|0,0)|0;f=y;da=bd(U|0,0,S|0,0)|0;ca=y;S=bd(b|0,0,S|0,0)|0;e=y;U=bd(U|0,0,J|0,0)|0;T=y;J=bd(b|0,0,J|0,0)|0;d=y;x=bd(b|0,0,x|0,0)|0;b=y;k=cd(m|0,k|0,26)|0;l=y;Ua=ed(Xa|0,Wa|0,Va|0,Ua|0)|0;Sa=ed(Ua|0,y|0,Ta|0,Sa|0)|0;Qa=ed(Sa|0,y|0,Ra|0,Qa|0)|0;j=ed(Qa|0,y|0,Pa|0,j|0)|0;l=ed(j|0,y|0,k|0,l|0)|0;k=cd(l|0,y|0,25)|0;j=y;La=ed(Oa|0,Na|0,Ma|0,La|0)|0;Ja=ed(La|0,y|0,Ka|0,Ja|0)|0;Ha=ed(Ja|0,y|0,Ia|0,Ha|0)|0;Fa=ed(Ha|0,y|0,Ga|0,Fa|0)|0;i=ed(Fa|0,y|0,Ea|0,i|0)|0;j=ed(i|0,y|0,k|0,j|0)|0;k=cd(j|0,y|0,26)|0;i=y;Aa=ed(Da|0,Ca|0,Ba|0,Aa|0)|0;ya=ed(Aa|0,y|0,za|0,ya|0)|0;wa=ed(ya|0,y|0,xa|0,wa|0)|0;h=ed(wa|0,y|0,va|0,h|0)|0;i=ed(h|0,y|0,k|0,i|0)|0;k=cd(i|0,y|0,25)|0;h=y;ra=ed(ua|0,ta|0,sa|0,ra|0)|0;pa=ed(ra|0,y|0,qa|0,pa|0)|0;na=ed(pa|0,y|0,oa|0,na|0)|0;la=ed(na|0,y|0,ma|0,la|0)|0;g=ed(la|0,y|0,ka|0,g|0)|0;h=ed(g|0,y|0,k|0,h|0)|0;k=cd(h|0,y|0,26)|0;g=y;ga=ed(ja|0,ia|0,ha|0,ga|0)|0;ea=ed(ga|0,y|0,fa|0,ea|0)|0;ca=ed(ea|0,y|0,da|0,ca|0)|0;f=ed(ca|0,y|0,ba|0,f|0)|0;g=ed(f|0,y|0,k|0,g|0)|0;k=cd(g|0,y|0,25)|0;f=y;Z=ed(aa|0,$|0,_|0,Z|0)|0;X=ed(Z|0,y|0,Y|0,X|0)|0;V=ed(X|0,y|0,W|0,V|0)|0;T=ed(V|0,y|0,U|0,T|0)|0;e=ed(T|0,y|0,S|0,e|0)|0;f=ed(e|0,y|0,k|0,f|0)|0;k=cd(f|0,y|0,26)|0;e=y;O=ed(R|0,Q|0,P|0,O|0)|0;M=ed(O|0,y|0,N|0,M|0)|0;K=ed(M|0,y|0,L|0,K|0)|0;d=ed(K|0,y|0,J|0,d|0)|0;e=ed(d|0,y|0,k|0,e|0)|0;k=cd(e|0,y|0,25)|0;d=y;F=ed(I|0,H|0,G|0,F|0)|0;D=ed(F|0,y|0,E|0,D|0)|0;B=ed(D|0,y|0,C|0,B|0)|0;z=ed(B|0,y|0,A|0,z|0)|0;b=ed(z|0,y|0,x|0,b|0)|0;d=ed(b|0,y|0,k|0,d|0)|0;k=cd(d|0,y|0,26)|0;b=y;t=ed(w|0,v|0,u|0,t|0)|0;r=ed(t|0,y|0,s|0,r|0)|0;p=ed(r|0,y|0,q|0,p|0)|0;n=ed(p|0,y|0,o|0,n|0)|0;b=ed(n|0,y|0,k|0,b|0)|0;k=cd(b|0,y|0,25)|0;k=bd(k|0,0,19,0)|0;m=ed(k|0,y|0,m&67108863|0,0)|0;k=cd(m|0,y|0,26)|0;c[a>>2]=m&67108863;c[a+4>>2]=(l&33554431)+k;c[a+8>>2]=j&67108863;c[a+12>>2]=i&33554431;c[a+16>>2]=h&67108863;c[a+20>>2]=g&33554431;c[a+24>>2]=f&67108863;c[a+28>>2]=e&33554431;c[a+32>>2]=d&67108863;c[a+36>>2]=b&33554431;return}function gb(a,b){a=a|0;b=b|0;return ((b^a)+-1|0)>>>31|0}function hb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;j=c[b>>2]|0;h=c[b+12>>2]|0;g=c[b+16>>2]|0;d=c[b+28>>2]|0;e=c[b+24>>2]|0;f=c[b+20>>2]|0;i=c[b+8>>2]|0;b=c[b+4>>2]|0;c[a>>2]=j&67108863;j=cd(j|0,b|0,26)|0;c[a+4>>2]=j&33554431;b=cd(b|0,i|0,19)|0;c[a+8>>2]=b&67108863;b=cd(i|0,h|0,13)|0;c[a+12>>2]=b&33554431;c[a+16>>2]=h>>>6;c[a+20>>2]=g&33554431;b=cd(g|0,f|0,25)|0;c[a+24>>2]=b&67108863;b=cd(f|0,e|0,19)|0;c[a+28>>2]=b&33554431;b=cd(e|0,d|0,12)|0;c[a+32>>2]=b&67108863;c[a+36>>2]=d>>>6&33554431;return}function ib(a){a=a|0;return (d[a+1>>0]|0)<<8|(d[a>>0]|0)|(d[a+2>>0]|0)<<16|(d[a+3>>0]|0)<<24|0}function jb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;u=c[b+28>>2]|0;g=bd(u|0,0,170660635,0)|0;j=y;o=c[b+24>>2]|0;q=bd(o|0,0,913544844,0)|0;m=y;i=c[b+20>>2]|0;A=bd(i|0,0,103979646,0)|0;E=y;r=c[b+16>>2]|0;F=bd(r|0,0,25712450,0)|0;p=y;n=c[b+12>>2]|0;f=bd(n|0,0,1073736481,0)|0;t=y;h=c[b+8>>2]|0;s=bd(h|0,0,1073741823,0)|0;B=y;C=c[b+4>>2]|0;x=bd(C|0,0,1073741823,0)|0;e=y;D=c[b>>2]|0;v=bd(D|0,0,1073741823,0)|0;k=y;l=ed(x|0,e|0,s|0,B|0)|0;j=ed(l|0,y|0,g|0,j|0)|0;m=ed(j|0,y|0,q|0,m|0)|0;E=ed(m|0,y|0,A|0,E|0)|0;p=ed(E|0,y|0,F|0,p|0)|0;t=ed(p|0,y|0,f|0,t|0)|0;k=ed(t|0,y|0,v|0,k|0)|0;k=cd(k|0,y|0,30)|0;v=y;t=c[b+32>>2]|0;f=bd(t|0,0,170660635,0)|0;p=y;F=bd(u|0,0,913544844,0)|0;E=y;A=bd(o|0,0,103979646,0)|0;m=y;b=bd(i|0,0,25712450,0)|0;q=y;j=bd(r|0,0,1073736481,0)|0;g=y;l=bd(n|0,0,1073741823,0)|0;z=y;D=bd(D|0,0,1048575,0)|0;w=y;G=ed(s|0,B|0,l|0,z|0)|0;E=ed(G|0,y|0,F|0,E|0)|0;m=ed(E|0,y|0,A|0,m|0)|0;q=ed(m|0,y|0,b|0,q|0)|0;g=ed(q|0,y|0,j|0,g|0)|0;e=ed(g|0,y|0,x|0,e|0)|0;w=ed(e|0,y|0,D|0,w|0)|0;p=ed(w|0,y|0,f|0,p|0)|0;v=ed(p|0,y|0,k|0,v|0)|0;k=cd(v|0,y|0,30)|0;p=y;f=bd(t|0,0,913544844,0)|0;w=y;D=bd(u|0,0,103979646,0)|0;e=y;x=bd(o|0,0,25712450,0)|0;g=y;j=bd(i|0,0,1073736481,0)|0;q=y;b=bd(r|0,0,1073741823,0)|0;m=y;C=bd(C|0,0,1048575,0)|0;A=y;E=ed(l|0,z|0,b|0,m|0)|0;e=ed(E|0,y|0,D|0,e|0)|0;g=ed(e|0,y|0,x|0,g|0)|0;q=ed(g|0,y|0,j|0,q|0)|0;B=ed(q|0,y|0,s|0,B|0)|0;A=ed(B|0,y|0,C|0,A|0)|0;w=ed(A|0,y|0,f|0,w|0)|0;p=ed(w|0,y|0,k|0,p|0)|0;v=p<<6&1073741760|v>>>24&63;k=cd(p|0,y|0,30)|0;w=y;f=bd(t|0,0,103979646,0)|0;A=y;C=bd(u|0,0,25712450,0)|0;B=y;s=bd(o|0,0,1073736481,0)|0;q=y;j=bd(i|0,0,1073741823,0)|0;g=y;h=bd(h|0,0,1048575,0)|0;x=y;e=ed(b|0,m|0,j|0,g|0)|0;B=ed(e|0,y|0,C|0,B|0)|0;q=ed(B|0,y|0,s|0,q|0)|0;z=ed(q|0,y|0,l|0,z|0)|0;x=ed(z|0,y|0,h|0,x|0)|0;A=ed(x|0,y|0,f|0,A|0)|0;w=ed(A|0,y|0,k|0,w|0)|0;p=w<<6&1073741760|p>>>24&63;k=cd(w|0,y|0,30)|0;A=y;f=bd(t|0,0,25712450,0)|0;x=y;h=bd(u|0,0,1073736481,0)|0;z=y;l=bd(o|0,0,1073741823,0)|0;q=y;n=bd(n|0,0,1048575,0)|0;s=y;g=ed(j|0,g|0,l|0,q|0)|0;j=y;z=ed(g|0,j|0,h|0,z|0)|0;m=ed(z|0,y|0,b|0,m|0)|0;s=ed(m|0,y|0,n|0,s|0)|0;x=ed(s|0,y|0,f|0,x|0)|0;A=ed(x|0,y|0,k|0,A|0)|0;w=A<<6&1073741760|w>>>24&63;k=cd(A|0,y|0,30)|0;x=y;f=bd(t|0,0,1073736481,0)|0;s=y;n=bd(u|0,0,1073741823,0)|0;m=y;r=bd(r|0,0,1048575,0)|0;b=y;j=ed(g|0,j|0,n|0,m|0)|0;b=ed(j|0,y|0,r|0,b|0)|0;s=ed(b|0,y|0,f|0,s|0)|0;x=ed(s|0,y|0,k|0,x|0)|0;A=x<<6&1073741760|A>>>24&63;k=cd(x|0,y|0,30)|0;s=y;f=bd(t|0,0,1073741823,0)|0;b=y;m=ed(f|0,b|0,n|0,m|0)|0;n=y;i=bd(i|0,0,1048575,0)|0;q=ed(i|0,y|0,l|0,q|0)|0;q=ed(q|0,y|0,m|0,n|0)|0;s=ed(q|0,y|0,k|0,s|0)|0;x=s<<6&1073741760|x>>>24&63;k=cd(s|0,y|0,30)|0;q=y;o=bd(o|0,0,1048575,0)|0;o=ed(m|0,n|0,o|0,y|0)|0;q=ed(o|0,y|0,k|0,q|0)|0;s=q<<6&1073741760|s>>>24&63;k=cd(q|0,y|0,30)|0;o=y;u=bd(u|0,0,1048575,0)|0;u=ed(f|0,b|0,u|0,y|0)|0;o=ed(u|0,y|0,k|0,o|0)|0;q=o<<6&1073741760|q>>>24&63;k=cd(o|0,y|0,30)|0;u=y;t=bd(t|0,0,1048575,0)|0;t=ed(k|0,u|0,t|0,y|0)|0;o=t<<6&1073741760|o>>>24&63;t=cd(t|0,y|0,24)|0;u=y;k=bd(v|0,0,485872621,0)|0;b=(N(v,485872621)|0)&1073741823;k=cd(k|0,y|0,30)|0;f=y;n=bd(p|0,0,485872621,0)|0;m=y;l=bd(v|0,0,541690985,0)|0;l=ed(k|0,f|0,l|0,y|0)|0;m=ed(l|0,y|0,n|0,m|0)|0;n=cd(m|0,y|0,30)|0;l=y;f=bd(w|0,0,485872621,0)|0;k=y;i=bd(p|0,0,541690985,0)|0;r=y;j=bd(v|0,0,796511589,0)|0;j=ed(i|0,r|0,j|0,y|0)|0;k=ed(j|0,y|0,f|0,k|0)|0;l=ed(k|0,y|0,n|0,l|0)|0;n=cd(l|0,y|0,30)|0;k=y;f=bd(A|0,0,485872621,0)|0;j=y;r=bd(w|0,0,541690985,0)|0;i=y;g=bd(p|0,0,796511589,0)|0;z=y;h=bd(v|0,0,935229352,0)|0;h=ed(g|0,z|0,h|0,y|0)|0;i=ed(h|0,y|0,r|0,i|0)|0;j=ed(i|0,y|0,f|0,j|0)|0;k=ed(j|0,y|0,n|0,k|0)|0;n=cd(k|0,y|0,30)|0;j=y;f=bd(x|0,0,485872621,0)|0;i=y;r=bd(A|0,0,541690985,0)|0;h=y;z=bd(w|0,0,796511589,0)|0;g=y;B=bd(p|0,0,935229352,0)|0;C=y;e=bd(v|0,0,20,0)|0;e=ed(B|0,C|0,e|0,y|0)|0;g=ed(e|0,y|0,z|0,g|0)|0;h=ed(g|0,y|0,r|0,h|0)|0;i=ed(h|0,y|0,f|0,i|0)|0;j=ed(i|0,y|0,n|0,j|0)|0;n=cd(j|0,y|0,30)|0;i=y;f=bd(s|0,0,485872621,0)|0;h=y;r=bd(x|0,0,541690985,0)|0;g=y;z=bd(A|0,0,796511589,0)|0;e=y;C=bd(w|0,0,935229352,0)|0;B=y;p=bd(p|0,0,20,0)|0;p=ed(C|0,B|0,p|0,y|0)|0;e=ed(p|0,y|0,z|0,e|0)|0;g=ed(e|0,y|0,r|0,g|0)|0;h=ed(g|0,y|0,f|0,h|0)|0;i=ed(h|0,y|0,n|0,i|0)|0;n=cd(i|0,y|0,30)|0;h=y;f=bd(q|0,0,485872621,0)|0;g=y;r=bd(s|0,0,541690985,0)|0;e=y;z=bd(x|0,0,796511589,0)|0;p=y;B=bd(A|0,0,935229352,0)|0;C=y;w=bd(w|0,0,20,0)|0;w=ed(B|0,C|0,w|0,y|0)|0;p=ed(w|0,y|0,z|0,p|0)|0;e=ed(p|0,y|0,r|0,e|0)|0;g=ed(e|0,y|0,f|0,g|0)|0;h=ed(g|0,y|0,n|0,h|0)|0;n=cd(h|0,y|0,30)|0;g=y;f=bd(o|0,0,485872621,0)|0;e=y;r=bd(q|0,0,541690985,0)|0;p=y;z=bd(s|0,0,796511589,0)|0;w=y;C=bd(x|0,0,935229352,0)|0;B=y;A=bd(A|0,0,20,0)|0;A=ed(C|0,B|0,A|0,y|0)|0;w=ed(A|0,y|0,z|0,w|0)|0;p=ed(w|0,y|0,r|0,p|0)|0;e=ed(p|0,y|0,f|0,e|0)|0;g=ed(e|0,y|0,n|0,g|0)|0;n=cd(g|0,y|0,30)|0;e=y;u=bd(t|0,u|0,485872621,0)|0;t=y;o=bd(o|0,0,541690985,0)|0;f=y;q=bd(q|0,0,796511589,0)|0;p=y;s=bd(s|0,0,935229352,0)|0;r=y;x=bd(x|0,0,20,0)|0;w=y;v=dd(v|0,0,12)|0;v=ed(x|0,w|0,v|0,y|0)|0;t=ed(v|0,y|0,u|0,t|0)|0;r=ed(t|0,y|0,s|0,r|0)|0;p=ed(r|0,y|0,q|0,p|0)|0;f=ed(p|0,y|0,o|0,f|0)|0;e=ed(f|0,y|0,n|0,e|0)|0;n=c[d>>2]|0;f=kb(n,b)|0;c[a>>2]=(f<<30)+n-b;f=(m&1073741823)+f|0;m=c[d+4>>2]|0;b=kb(m,f)|0;c[a+4>>2]=(b<<30)+m-f;b=(l&1073741823)+b|0;l=c[d+8>>2]|0;f=kb(l,b)|0;c[a+8>>2]=(f<<30)+l-b;f=(k&1073741823)+f|0;k=c[d+12>>2]|0;b=kb(k,f)|0;c[a+12>>2]=(b<<30)+k-f;b=(j&1073741823)+b|0;j=c[d+16>>2]|0;f=kb(j,b)|0;c[a+16>>2]=(f<<30)+j-b;f=(i&1073741823)+f|0;i=c[d+20>>2]|0;b=kb(i,f)|0;c[a+20>>2]=(b<<30)+i-f;b=(h&1073741823)+b|0;h=c[d+24>>2]|0;f=kb(h,b)|0;c[a+24>>2]=(f<<30)+h-b;f=(g&1073741823)+f|0;g=c[d+28>>2]|0;b=kb(g,f)|0;c[a+28>>2]=(b<<30)+g-f;b=(e&16777215)+b|0;d=c[d+32>>2]|0;c[a+32>>2]=((kb(d,b)|0)<<24)+d-b;lb(a);lb(a);return}function kb(a,b){a=a|0;b=b|0;return (a-b|0)>>>31|0}function lb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;C=c[a>>2]|0;B=kb(C,485872621)|0;z=a+4|0;A=c[z>>2]|0;y=kb(A,B+541690985|0)|0;w=a+8|0;x=c[w>>2]|0;v=kb(x,y+796511589|0)|0;t=a+12|0;u=c[t>>2]|0;s=kb(u,v+935229352|0)|0;q=a+16|0;r=c[q>>2]|0;p=kb(r,s+20|0)|0;n=a+20|0;o=c[n>>2]|0;m=kb(o,p)|0;k=a+24|0;l=c[k>>2]|0;j=kb(l,m)|0;h=a+28|0;i=c[h>>2]|0;g=kb(i,j)|0;b=a+32|0;d=c[b>>2]|0;f=kb(d,g+4096|0)|0;e=f+-1|0;c[a>>2]=e&(C+-485872621+(B<<30)^C)^C;c[z>>2]=e&(A+(-541690985-B)+(y<<30)^A)^A;c[w>>2]=e&(x+(-796511589-y)+(v<<30)^x)^x;c[t>>2]=e&(u+(-935229352-v)+(s<<30)^u)^u;c[q>>2]=e&(r+(-20-s)+(p<<30)^r)^r;c[n>>2]=e&(o-p+(m<<30)^o)^o;c[k>>2]=e&(l-m+(j<<30)^l)^l;c[h>>2]=e&(i-j+(g<<30)^i)^i;c[b>>2]=(d+(-4096-g)+(f<<16)^d)&e^d;return}function mb(b,c,d,e,f,g,h){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;s=l;l=l+672|0;o=s+160|0;p=s+440|0;q=s+404|0;i=s+368|0;j=s;k=s+608|0;m=s+544|0;n=s+480|0;r=k;d=f;e=r+64|0;do{a[r>>0]=a[d>>0]|0;r=r+1|0;d=d+1|0}while((r|0)<(e|0));nb(o);ob(o,k+32|0,32);ob(o,b,c);pb(o,m);Ta(p,m,64);Ua(j,p);Va(h,j);qb(n,h,g,b,c);Ta(q,n,64);Ta(i,k,32);rb(q,q,i);sb(q,q,p);tb(h+32|0,q);l=s;return}function nb(a){a=a|0;dc(a);return}function ob(a,b,c){a=a|0;b=b|0;c=c|0;ec(a,b,c);return}function pb(a,b){a=a|0;b=b|0;kc(a,b);return}function qb(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;f=l;l=l+208|0;g=f;nb(g);ob(g,b,32);ob(g,c,32);ob(g,d,e);pb(g,a);l=f;return}function rb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;e=l;l=l+80|0;f=e+36|0;g=e;G=c[b>>2]|0;E=c[d>>2]|0;D=bd(E|0,0,G|0,0)|0;c[f>>2]=D&1073741823;D=cd(D|0,y|0,30)|0;r=y;o=c[d+4>>2]|0;L=bd(o|0,0,G|0,0)|0;Q=y;J=c[b+4>>2]|0;i=bd(J|0,0,E|0,0)|0;h=y;r=ed(L|0,Q|0,D|0,r|0)|0;h=ed(r|0,y|0,i|0,h|0)|0;c[f+4>>2]=h&1073741823;h=cd(h|0,y|0,30)|0;i=y;r=c[d+8>>2]|0;D=bd(r|0,0,G|0,0)|0;Q=y;L=bd(J|0,0,o|0,0)|0;L=ed(D|0,Q|0,L|0,y|0)|0;Q=y;D=c[b+8>>2]|0;B=bd(D|0,0,E|0,0)|0;B=ed(L|0,Q|0,B|0,y|0)|0;i=ed(B|0,y|0,h|0,i|0)|0;c[f+8>>2]=i&1073741823;i=cd(i|0,y|0,30)|0;h=y;B=c[d+12>>2]|0;Q=bd(B|0,0,G|0,0)|0;L=y;M=bd(r|0,0,J|0,0)|0;N=y;j=bd(D|0,0,o|0,0)|0;A=y;z=c[b+12>>2]|0;I=bd(z|0,0,E|0,0)|0;u=y;N=ed(j|0,A|0,M|0,N|0)|0;L=ed(N|0,y|0,Q|0,L|0)|0;u=ed(L|0,y|0,I|0,u|0)|0;h=ed(u|0,y|0,i|0,h|0)|0;c[f+12>>2]=h&1073741823;h=cd(h|0,y|0,30)|0;i=y;u=c[d+16>>2]|0;I=bd(u|0,0,G|0,0)|0;L=y;Q=bd(B|0,0,J|0,0)|0;N=y;M=bd(D|0,0,r|0,0)|0;A=y;j=bd(z|0,0,o|0,0)|0;v=y;w=c[b+16>>2]|0;C=bd(w|0,0,E|0,0)|0;p=y;A=ed(Q|0,N|0,M|0,A|0)|0;v=ed(A|0,y|0,j|0,v|0)|0;L=ed(v|0,y|0,I|0,L|0)|0;p=ed(L|0,y|0,C|0,p|0)|0;i=ed(p|0,y|0,h|0,i|0)|0;c[f+16>>2]=i&1073741823;i=cd(i|0,y|0,30)|0;h=y;p=c[d+20>>2]|0;C=bd(p|0,0,G|0,0)|0;L=y;I=bd(u|0,0,J|0,0)|0;v=y;j=bd(B|0,0,D|0,0)|0;A=y;M=bd(z|0,0,r|0,0)|0;N=y;Q=bd(w|0,0,o|0,0)|0;H=y;s=c[b+20>>2]|0;O=bd(s|0,0,E|0,0)|0;k=y;A=ed(M|0,N|0,j|0,A|0)|0;v=ed(A|0,y|0,I|0,v|0)|0;H=ed(v|0,y|0,Q|0,H|0)|0;L=ed(H|0,y|0,C|0,L|0)|0;k=ed(L|0,y|0,O|0,k|0)|0;h=ed(k|0,y|0,i|0,h|0)|0;c[f+20>>2]=h&1073741823;h=cd(h|0,y|0,30)|0;i=y;k=c[d+24>>2]|0;O=bd(k|0,0,G|0,0)|0;L=y;C=bd(p|0,0,J|0,0)|0;H=y;Q=bd(u|0,0,D|0,0)|0;v=y;I=bd(z|0,0,B|0,0)|0;A=y;j=bd(w|0,0,r|0,0)|0;N=y;M=bd(s|0,0,o|0,0)|0;P=y;q=c[b+24>>2]|0;x=bd(q|0,0,E|0,0)|0;n=y;A=ed(Q|0,v|0,I|0,A|0)|0;N=ed(A|0,y|0,j|0,N|0)|0;H=ed(N|0,y|0,C|0,H|0)|0;P=ed(H|0,y|0,M|0,P|0)|0;L=ed(P|0,y|0,O|0,L|0)|0;n=ed(L|0,y|0,x|0,n|0)|0;i=ed(n|0,y|0,h|0,i|0)|0;c[f+24>>2]=i&1073741823;i=cd(i|0,y|0,30)|0;h=y;n=c[d+28>>2]|0;x=bd(n|0,0,G|0,0)|0;L=y;O=bd(k|0,0,J|0,0)|0;P=y;M=bd(p|0,0,D|0,0)|0;H=y;C=bd(u|0,0,z|0,0)|0;N=y;j=bd(w|0,0,B|0,0)|0;A=y;I=bd(s|0,0,r|0,0)|0;v=y;Q=bd(q|0,0,o|0,0)|0;F=y;m=c[b+28>>2]|0;K=bd(m|0,0,E|0,0)|0;t=y;N=ed(j|0,A|0,C|0,N|0)|0;H=ed(N|0,y|0,M|0,H|0)|0;v=ed(H|0,y|0,I|0,v|0)|0;P=ed(v|0,y|0,O|0,P|0)|0;F=ed(P|0,y|0,Q|0,F|0)|0;L=ed(F|0,y|0,x|0,L|0)|0;t=ed(L|0,y|0,K|0,t|0)|0;h=ed(t|0,y|0,i|0,h|0)|0;c[f+28>>2]=h&1073741823;h=cd(h|0,y|0,30)|0;i=y;d=c[d+32>>2]|0;G=bd(d|0,0,G|0,0)|0;t=y;K=bd(n|0,0,J|0,0)|0;L=y;x=bd(k|0,0,D|0,0)|0;F=y;Q=bd(p|0,0,z|0,0)|0;P=y;O=bd(w|0,0,u|0,0)|0;v=y;I=bd(s|0,0,B|0,0)|0;H=y;M=bd(q|0,0,r|0,0)|0;N=y;C=bd(m|0,0,o|0,0)|0;A=y;j=c[b+32>>2]|0;E=bd(j|0,0,E|0,0)|0;b=y;v=ed(Q|0,P|0,O|0,v|0)|0;H=ed(v|0,y|0,I|0,H|0)|0;F=ed(H|0,y|0,x|0,F|0)|0;N=ed(F|0,y|0,M|0,N|0)|0;L=ed(N|0,y|0,K|0,L|0)|0;A=ed(L|0,y|0,C|0,A|0)|0;t=ed(A|0,y|0,G|0,t|0)|0;b=ed(t|0,y|0,E|0,b|0)|0;i=ed(b|0,y|0,h|0,i|0)|0;c[f+32>>2]=i&16777215;h=cd(i|0,y|0,30)|0;b=y;J=bd(d|0,0,J|0,0)|0;E=y;t=bd(n|0,0,D|0,0)|0;G=y;A=bd(k|0,0,z|0,0)|0;C=y;L=bd(p|0,0,w|0,0)|0;K=y;N=bd(s|0,0,u|0,0)|0;M=y;F=bd(q|0,0,B|0,0)|0;x=y;H=bd(m|0,0,r|0,0)|0;I=y;o=bd(j|0,0,o|0,0)|0;v=y;K=ed(N|0,M|0,L|0,K|0)|0;C=ed(K|0,y|0,A|0,C|0)|0;x=ed(C|0,y|0,F|0,x|0)|0;G=ed(x|0,y|0,t|0,G|0)|0;I=ed(G|0,y|0,H|0,I|0)|0;E=ed(I|0,y|0,J|0,E|0)|0;v=ed(E|0,y|0,o|0,v|0)|0;b=ed(v|0,y|0,h|0,b|0)|0;c[g>>2]=b<<22&1069547520|i>>>8&4194303;i=cd(b|0,y|0,30)|0;h=y;D=bd(d|0,0,D|0,0)|0;v=y;o=bd(n|0,0,z|0,0)|0;E=y;J=bd(k|0,0,w|0,0)|0;I=y;H=bd(s|0,0,p|0,0)|0;G=y;t=bd(q|0,0,u|0,0)|0;x=y;F=bd(m|0,0,B|0,0)|0;C=y;r=bd(j|0,0,r|0,0)|0;A=y;G=ed(J|0,I|0,H|0,G|0)|0;x=ed(G|0,y|0,t|0,x|0)|0;E=ed(x|0,y|0,o|0,E|0)|0;C=ed(E|0,y|0,F|0,C|0)|0;v=ed(C|0,y|0,D|0,v|0)|0;A=ed(v|0,y|0,r|0,A|0)|0;h=ed(A|0,y|0,i|0,h|0)|0;c[g+4>>2]=h<<22&1069547520|b>>>8&4194303;b=cd(h|0,y|0,30)|0;i=y;z=bd(d|0,0,z|0,0)|0;A=y;r=bd(n|0,0,w|0,0)|0;v=y;D=bd(k|0,0,s|0,0)|0;C=y;F=bd(q|0,0,p|0,0)|0;E=y;o=bd(m|0,0,u|0,0)|0;x=y;B=bd(j|0,0,B|0,0)|0;t=y;C=ed(F|0,E|0,D|0,C|0)|0;v=ed(C|0,y|0,r|0,v|0)|0;x=ed(v|0,y|0,o|0,x|0)|0;A=ed(x|0,y|0,z|0,A|0)|0;t=ed(A|0,y|0,B|0,t|0)|0;i=ed(t|0,y|0,b|0,i|0)|0;c[g+8>>2]=i<<22&1069547520|h>>>8&4194303;h=cd(i|0,y|0,30)|0;b=y;w=bd(d|0,0,w|0,0)|0;t=y;B=bd(n|0,0,s|0,0)|0;A=y;z=bd(q|0,0,k|0,0)|0;x=y;o=bd(m|0,0,p|0,0)|0;v=y;u=bd(j|0,0,u|0,0)|0;r=y;x=ed(B|0,A|0,z|0,x|0)|0;v=ed(x|0,y|0,o|0,v|0)|0;t=ed(v|0,y|0,w|0,t|0)|0;r=ed(t|0,y|0,u|0,r|0)|0;b=ed(r|0,y|0,h|0,b|0)|0;c[g+12>>2]=b<<22&1069547520|i>>>8&4194303;i=cd(b|0,y|0,30)|0;h=y;s=bd(d|0,0,s|0,0)|0;r=y;u=bd(n|0,0,q|0,0)|0;t=y;w=bd(m|0,0,k|0,0)|0;v=y;p=bd(j|0,0,p|0,0)|0;o=y;t=ed(w|0,v|0,u|0,t|0)|0;r=ed(t|0,y|0,s|0,r|0)|0;o=ed(r|0,y|0,p|0,o|0)|0;h=ed(o|0,y|0,i|0,h|0)|0;c[g+16>>2]=h<<22&1069547520|b>>>8&4194303;b=cd(h|0,y|0,30)|0;i=y;q=bd(d|0,0,q|0,0)|0;o=y;p=bd(m|0,0,n|0,0)|0;p=ed(q|0,o|0,p|0,y|0)|0;o=y;k=bd(j|0,0,k|0,0)|0;k=ed(p|0,o|0,k|0,y|0)|0;i=ed(k|0,y|0,b|0,i|0)|0;c[g+20>>2]=i<<22&1069547520|h>>>8&4194303;h=cd(i|0,y|0,30)|0;b=y;m=bd(d|0,0,m|0,0)|0;k=y;n=bd(j|0,0,n|0,0)|0;k=ed(n|0,y|0,m|0,k|0)|0;b=ed(k|0,y|0,h|0,b|0)|0;c[g+24>>2]=b<<22&1069547520|i>>>8&4194303;i=cd(b|0,y|0,30)|0;h=y;d=bd(j|0,0,d|0,0)|0;d=ed(i|0,h|0,d|0,y|0)|0;c[g+28>>2]=d<<22&1069547520|b>>>8&4194303;c[g+32>>2]=d>>>8&4194303;jb(a,g,f);l=e;return}function sb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=(c[d>>2]|0)+(c[b>>2]|0)|0;c[a>>2]=e&1073741823;e=(e>>>30)+(c[b+4>>2]|0)+(c[d+4>>2]|0)|0;c[a+4>>2]=e&1073741823;e=(c[d+8>>2]|0)+(c[b+8>>2]|0)+(e>>>30)|0;c[a+8>>2]=e&1073741823;e=(c[d+12>>2]|0)+(c[b+12>>2]|0)+(e>>>30)|0;c[a+12>>2]=e&1073741823;e=(c[d+16>>2]|0)+(c[b+16>>2]|0)+(e>>>30)|0;c[a+16>>2]=e&1073741823;e=(c[d+20>>2]|0)+(c[b+20>>2]|0)+(e>>>30)|0;c[a+20>>2]=e&1073741823;e=(c[d+24>>2]|0)+(c[b+24>>2]|0)+(e>>>30)|0;c[a+24>>2]=e&1073741823;e=(c[d+28>>2]|0)+(c[b+28>>2]|0)+(e>>>30)|0;c[a+28>>2]=e&1073741823;c[a+32>>2]=(c[d+32>>2]|0)+(c[b+32>>2]|0)+(e>>>30);lb(a);return}function tb(a,b){a=a|0;b=b|0;var d=0,e=0;d=b+4|0;ub(a,c[d>>2]<<30|c[b>>2]);e=b+8|0;ub(a+4|0,c[e>>2]<<28|(c[d>>2]|0)>>>2);d=b+12|0;ub(a+8|0,c[d>>2]<<26|(c[e>>2]|0)>>>4);e=b+16|0;ub(a+12|0,c[e>>2]<<24|(c[d>>2]|0)>>>6);d=b+20|0;ub(a+16|0,c[d>>2]<<22|(c[e>>2]|0)>>>8);e=b+24|0;ub(a+20|0,c[e>>2]<<20|(c[d>>2]|0)>>>10);d=b+28|0;ub(a+24|0,c[d>>2]<<18|(c[e>>2]|0)>>>12);ub(a+28|0,c[b+32>>2]<<16|(c[d>>2]|0)>>>14);return}function ub(b,c){b=b|0;c=c|0;a[b>>0]=c;a[b+1>>0]=c>>>8;a[b+2>>0]=c>>>16;a[b+3>>0]=c>>>24;return}function vb(a,b,c,e){a=a|0;b=b|0;c=c|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0;m=l;l=l+496|0;f=m+160|0;g=m;h=m+424|0;i=m+356|0;j=m+320|0;k=m+392|0;if((d[e+63>>0]|0)<=31?(wb(g,c)|0)!=0:0){qb(h,e,c,a,b);Ta(i,h,64);Ta(j,e+32|0,32);xb(f,g,i,j);Va(k,f);a=((yb(e,k)|0)==0)<<31>>31}else a=-1;l=m;return a|0}function wb(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;N=l;l=l+240|0;I=N+200|0;J=N+160|0;K=N+120|0;L=N+80|0;r=N+40|0;s=N;G=(d[e+31>>0]|0)>>>7;H=b+40|0;hb(H,e);e=b+80|0;c[e>>2]=1;f=b+84|0;g=b+88|0;h=b+92|0;i=b+96|0;j=b+100|0;k=b+104|0;m=b+108|0;n=b+112|0;o=b+116|0;p=f;q=p+36|0;do{c[p>>2]=0;p=p+4|0}while((p|0)<(q|0));fb(L,H);Xa(r,L,16);e=c[e>>2]|0;O=(c[L>>2]|0)+268435380-e|0;P=L+4|0;A=c[f>>2]|0;z=(c[P>>2]|0)+134217724+(O>>>26)-A|0;c[P>>2]=z&33554431;u=L+8|0;y=c[g>>2]|0;z=(c[u>>2]|0)+268435452-y+(z>>>25)|0;c[u>>2]=z&67108863;p=L+12|0;x=c[h>>2]|0;z=(c[p>>2]|0)+134217724-x+(z>>>26)|0;c[p>>2]=z&33554431;q=L+16|0;v=c[i>>2]|0;z=(c[q>>2]|0)+268435452-v+(z>>>25)|0;c[q>>2]=z&67108863;t=L+20|0;j=c[j>>2]|0;z=(c[t>>2]|0)+134217724-j+(z>>>26)|0;c[t>>2]=z&33554431;w=L+24|0;i=c[k>>2]|0;k=(c[w>>2]|0)+268435452-i+(z>>>25)|0;c[w>>2]=k&67108863;z=L+28|0;h=c[m>>2]|0;k=(c[z>>2]|0)+134217724-h+(k>>>26)|0;c[z>>2]=k&33554431;C=L+32|0;g=c[n>>2]|0;k=(c[C>>2]|0)+268435452-g+(k>>>25)|0;c[C>>2]=k&67108863;F=L+36|0;f=c[o>>2]|0;k=(c[F>>2]|0)+134217724-f+(k>>>26)|0;c[F>>2]=k&33554431;O=((k>>>25)*19|0)+(O&67108863)|0;c[L>>2]=O;c[r>>2]=(c[r>>2]|0)+e;e=r+4|0;c[e>>2]=(c[e>>2]|0)+A;e=r+8|0;c[e>>2]=(c[e>>2]|0)+y;e=r+12|0;c[e>>2]=(c[e>>2]|0)+x;e=r+16|0;c[e>>2]=(c[e>>2]|0)+v;e=r+20|0;c[e>>2]=(c[e>>2]|0)+j;e=r+24|0;c[e>>2]=(c[e>>2]|0)+i;e=r+28|0;c[e>>2]=(c[e>>2]|0)+h;e=r+32|0;c[e>>2]=(c[e>>2]|0)+g;e=r+36|0;c[e>>2]=(c[e>>2]|0)+f;fb(J,r);Xa(s,J,r);fb(b,s);Xa(b,b,r);Xa(b,b,L);Eb(b,b);Xa(b,b,s);Xa(b,b,L);fb(J,b);Xa(J,J,r);O=(c[J>>2]|0)+268435380-O|0;e=J+4|0;f=c[e>>2]|0;g=c[P>>2]|0;P=f+134217724+(O>>>26)-g|0;c[K+4>>2]=P&33554431;h=J+8|0;i=c[h>>2]|0;j=c[u>>2]|0;P=i+268435452-j+(P>>>25)|0;c[K+8>>2]=P&67108863;k=J+12|0;m=c[k>>2]|0;n=c[p>>2]|0;P=m+134217724-n+(P>>>26)|0;c[K+12>>2]=P&33554431;o=J+16|0;p=c[o>>2]|0;q=c[q>>2]|0;P=p+268435452-q+(P>>>25)|0;c[K+16>>2]=P&67108863;r=J+20|0;s=c[r>>2]|0;t=c[t>>2]|0;P=s+134217724-t+(P>>>26)|0;c[K+20>>2]=P&33554431;u=J+24|0;v=c[u>>2]|0;w=c[w>>2]|0;P=v+268435452-w+(P>>>25)|0;c[K+24>>2]=P&67108863;x=J+28|0;y=c[x>>2]|0;z=c[z>>2]|0;P=y+134217724-z+(P>>>26)|0;c[K+28>>2]=P&33554431;A=J+32|0;B=c[A>>2]|0;C=c[C>>2]|0;P=B+268435452-C+(P>>>25)|0;c[K+32>>2]=P&67108863;D=J+36|0;E=c[D>>2]|0;F=c[F>>2]|0;P=E+134217724-F+(P>>>26)|0;c[K+36>>2]=P&33554431;c[K>>2]=((P>>>25)*19|0)+(O&67108863);Ya(I,K);if(!(yb(I,30598)|0)){P=(c[L>>2]|0)+(c[J>>2]|0)|0;O=(P>>>26)+f+g|0;c[e>>2]=O&33554431;O=(O>>>25)+i+j|0;c[h>>2]=O&67108863;O=n+m+(O>>>26)|0;c[k>>2]=O&33554431;O=q+p+(O>>>25)|0;c[o>>2]=O&67108863;O=t+s+(O>>>26)|0;c[r>>2]=O&33554431;O=w+v+(O>>>25)|0;c[u>>2]=O&67108863;O=z+y+(O>>>26)|0;c[x>>2]=O&33554431;O=C+B+(O>>>25)|0;c[A>>2]=O&67108863;O=F+E+(O>>>26)|0;c[D>>2]=O&33554431;c[J>>2]=((O>>>25)*19|0)+(P&67108863);Ya(I,J);if(!(yb(I,30598)|0))e=0;else{Xa(b,b,28528);M=4}}else M=4;if((M|0)==4){Ya(I,b);if((a[I>>0]&1)==G<<24>>24){P=c[b>>2]|0;c[J>>2]=P;q=b+4|0;O=c[q>>2]|0;c[e>>2]=O;t=b+8|0;s=c[t>>2]|0;c[h>>2]=s;w=b+12|0;v=c[w>>2]|0;c[k>>2]=v;z=b+16|0;y=c[z>>2]|0;c[o>>2]=y;C=b+20|0;B=c[C>>2]|0;c[r>>2]=B;F=b+24|0;E=c[F>>2]|0;c[u>>2]=E;I=b+28|0;G=c[I>>2]|0;c[x>>2]=G;K=b+32|0;J=c[K>>2]|0;c[A>>2]=J;M=b+36|0;L=c[M>>2]|0;c[D>>2]=L;P=134217690-P|0;O=67108862-O+(P>>>26)|0;c[q>>2]=O&33554431;O=134217726-s+(O>>>25)|0;c[t>>2]=O&67108863;O=67108862-v+(O>>>26)|0;c[w>>2]=O&33554431;O=134217726-y+(O>>>25)|0;c[z>>2]=O&67108863;O=67108862-B+(O>>>26)|0;c[C>>2]=O&33554431;O=134217726-E+(O>>>25)|0;c[F>>2]=O&67108863;O=67108862-G+(O>>>26)|0;c[I>>2]=O&33554431;O=134217726-J+(O>>>25)|0;c[K>>2]=O&67108863;O=67108862-L+(O>>>26)|0;c[M>>2]=O&33554431;c[b>>2]=((O>>>25)*19|0)+(P&67108863)}Xa(b+120|0,b,H);e=1}l=N;return e|0}function xb(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0;q=l;l=l+2112|0;m=q+1856|0;n=q+1600|0;o=q+320|0;g=q+160|0;p=q;zb(m,e,5);zb(n,f,7);db(g,d);Ab(o,d);d=0;do{k=d;d=d+1|0;Bb(o+(d*160|0)|0,g,o+(k*160|0)|0)}while((d|0)!=7);hd(b|0,0,160)|0;j=b+40|0;c[j>>2]=1;k=b+80|0;c[k>>2]=1;d=255;while(1){if((a[n+d>>0]|a[m+d>>0])<<24>>24){h=6;break}if(!d)break;else d=d+-1|0}if((h|0)==6?(d|0)>-1:0){f=p+120|0;g=p+40|0;h=p+80|0;i=b+120|0;while(1){eb(p,b);e=a[m+d>>0]|0;if(e<<24>>24){Xa(b,p,f);Xa(j,g,h);Xa(k,h,f);Xa(i,p,g);r=e<<24>>24;Cb(p,b,o+(((((r|0)>-1?r:0-r|0)|0)/2|0)*160|0)|0,(e&255)>>>7)}e=a[n+d>>0]|0;if(e<<24>>24){Xa(b,p,f);Xa(j,g,h);Xa(k,h,f);Xa(i,p,g);r=e<<24>>24;Db(p,b,24640+(((((r|0)>-1?r:0-r|0)|0)/2|0)*120|0)|0,(e&255)>>>7)}Xa(b,p,f);Xa(j,g,h);Xa(k,h,f);if((d|0)>0)d=d+-1|0;else break}}l=q;return}function yb(b,c){b=b|0;c=c|0;var d=0,e=0;d=0;e=32;while(1){e=e+-1|0;d=d|(a[c>>0]^a[b>>0])&255;if(!e)break;else{c=c+1|0;b=b+1|0}}return (d+511|0)>>>8&1|0}function zb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;n=1<<e+-1;e=b;f=0;while(1){g=0;h=c[d+(f<<2)>>2]|0;i=e;while(1){a[i>>0]=h&1;g=g+1|0;if((g|0)==30)break;else{h=h>>>1;i=i+1|0}}f=f+1|0;if((f|0)==8)break;else e=e+30|0}g=0;e=c[d+32>>2]|0;f=b+240|0;while(1){a[f>>0]=e&1;g=g+1|0;if((g|0)==16)break;else{e=e>>>1;f=f+1|0}}l=1-n|0;k=0;do{m=b+k|0;f=a[m>>0]|0;a:do if(f<<24>>24?(o=256-k|0,o>>>0>1):0){e=1;while(1){g=f<<24>>24;f=e+k|0;h=b+f|0;j=a[h>>0]|0;i=j<<24>>24<<e;d=i+g|0;b:do if((d|0)>=(n|0)){g=g-i|0;if((g|0)<(l|0))if(!(j<<24>>24))break;else break a;a[m>>0]=g;if(f>>>0<256){while(1){g=b+f|0;if(!(a[g>>0]|0))break;a[g>>0]=0;if(f>>>0<255)f=f+1|0;else break b}a[g>>0]=1}}else{a[m>>0]=d;a[h>>0]=0}while(0);e=e+1|0;if(!(e>>>0<o>>>0&e>>>0<7))break a;f=a[m>>0]|0}}while(0);k=k+1|0}while((k|0)!=256);return}function Ab(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;v=b+40|0;l=(c[v>>2]|0)+134217690-(c[b>>2]|0)|0;c[a>>2]=l&67108863;t=b+44|0;u=b+4|0;l=(c[t>>2]|0)+67108862+(l>>>26)-(c[u>>2]|0)|0;c[a+4>>2]=l&33554431;r=b+48|0;s=b+8|0;l=(c[r>>2]|0)+134217726-(c[s>>2]|0)+(l>>>25)|0;c[a+8>>2]=l&67108863;p=b+52|0;q=b+12|0;l=(c[p>>2]|0)+67108862-(c[q>>2]|0)+(l>>>26)|0;c[a+12>>2]=l&33554431;n=b+56|0;o=b+16|0;c[a+16>>2]=(c[n>>2]|0)+134217726-(c[o>>2]|0)+(l>>>25);l=b+60|0;m=b+20|0;c[a+20>>2]=(c[l>>2]|0)+67108862-(c[m>>2]|0);j=b+64|0;k=b+24|0;c[a+24>>2]=(c[j>>2]|0)+134217726-(c[k>>2]|0);h=b+68|0;i=b+28|0;c[a+28>>2]=(c[h>>2]|0)+67108862-(c[i>>2]|0);f=b+72|0;g=b+32|0;c[a+32>>2]=(c[f>>2]|0)+134217726-(c[g>>2]|0);d=b+76|0;e=b+36|0;c[a+36>>2]=(c[d>>2]|0)+67108862-(c[e>>2]|0);c[a+40>>2]=(c[b>>2]|0)+(c[v>>2]|0);c[a+44>>2]=(c[u>>2]|0)+(c[t>>2]|0);c[a+48>>2]=(c[s>>2]|0)+(c[r>>2]|0);c[a+52>>2]=(c[q>>2]|0)+(c[p>>2]|0);c[a+56>>2]=(c[o>>2]|0)+(c[n>>2]|0);c[a+60>>2]=(c[m>>2]|0)+(c[l>>2]|0);c[a+64>>2]=(c[k>>2]|0)+(c[j>>2]|0);c[a+68>>2]=(c[i>>2]|0)+(c[h>>2]|0);c[a+72>>2]=(c[g>>2]|0)+(c[f>>2]|0);c[a+76>>2]=(c[e>>2]|0)+(c[d>>2]|0);c[a+80>>2]=c[b+80>>2];c[a+84>>2]=c[b+84>>2];c[a+88>>2]=c[b+88>>2];c[a+92>>2]=c[b+92>>2];c[a+96>>2]=c[b+96>>2];c[a+100>>2]=c[b+100>>2];c[a+104>>2]=c[b+104>>2];c[a+108>>2]=c[b+108>>2];c[a+112>>2]=c[b+112>>2];c[a+116>>2]=c[b+116>>2];Xa(a+120|0,b+120|0,28480);return}function Bb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;e=l;l=l+288|0;j=e+240|0;N=e+200|0;t=e+160|0;z=e+120|0;G=e+80|0;w=e+40|0;D=e;O=c[b+40>>2]|0;P=c[b>>2]|0;r=O+134217690-P|0;c[j>>2]=r&67108863;K=c[b+44>>2]|0;J=c[b+4>>2]|0;r=K+67108862+(r>>>26)-J|0;A=j+4|0;c[A>>2]=r&33554431;v=c[b+48>>2]|0;E=c[b+8>>2]|0;r=v+134217726-E+(r>>>25)|0;s=j+8|0;c[s>>2]=r&67108863;y=c[b+52>>2]|0;C=c[b+12>>2]|0;r=y+67108862-C+(r>>>26)|0;M=j+12|0;c[M>>2]=r&33554431;h=c[b+56>>2]|0;g=c[b+16>>2]|0;x=j+16|0;c[x>>2]=h+134217726-g+(r>>>25);r=c[b+60>>2]|0;q=c[b+20>>2]|0;o=j+20|0;c[o>>2]=r+67108862-q;n=c[b+64>>2]|0;F=c[b+24>>2]|0;f=j+24|0;c[f>>2]=n+134217726-F;L=c[b+68>>2]|0;p=c[b+28>>2]|0;H=j+28|0;c[H>>2]=L+67108862-p;B=c[b+72>>2]|0;I=c[b+32>>2]|0;m=j+32|0;c[m>>2]=B+134217726-I;k=c[b+76>>2]|0;u=c[b+36>>2]|0;i=j+36|0;c[i>>2]=k+67108862-u;c[N>>2]=P+O;c[N+4>>2]=J+K;c[N+8>>2]=E+v;c[N+12>>2]=C+y;c[N+16>>2]=g+h;c[N+20>>2]=q+r;c[N+24>>2]=F+n;c[N+28>>2]=p+L;c[N+32>>2]=I+B;c[N+36>>2]=u+k;Xa(j,j,d);Xa(z,N,d+40|0);N=c[z>>2]|0;j=c[j>>2]|0;c[G>>2]=j+N;k=z+4|0;u=c[k>>2]|0;A=c[A>>2]|0;c[G+4>>2]=A+u;B=z+8|0;I=c[B>>2]|0;s=c[s>>2]|0;c[G+8>>2]=s+I;L=z+12|0;p=c[L>>2]|0;M=c[M>>2]|0;c[G+12>>2]=M+p;n=z+16|0;F=c[n>>2]|0;x=c[x>>2]|0;c[G+16>>2]=x+F;r=z+20|0;q=c[r>>2]|0;o=c[o>>2]|0;c[G+20>>2]=o+q;h=z+24|0;g=c[h>>2]|0;f=c[f>>2]|0;c[G+24>>2]=f+g;y=z+28|0;C=c[y>>2]|0;H=c[H>>2]|0;c[G+28>>2]=H+C;v=z+32|0;E=c[v>>2]|0;m=c[m>>2]|0;c[G+32>>2]=m+E;K=z+36|0;J=c[K>>2]|0;i=c[i>>2]|0;c[G+36>>2]=i+J;j=N+134217690-j|0;c[z>>2]=j&67108863;A=u+67108862+(j>>>26)-A|0;c[k>>2]=A&33554431;A=I+134217726-s+(A>>>25)|0;c[B>>2]=A&67108863;A=p+67108862-M+(A>>>26)|0;c[L>>2]=A&33554431;c[n>>2]=F+134217726-x+(A>>>25);c[r>>2]=q+67108862-o;c[h>>2]=g+134217726-f;c[y>>2]=C+67108862-H;c[v>>2]=E+134217726-m;c[K>>2]=J+67108862-i;Xa(t,b+120|0,d+120|0);Xa(D,b+80|0,d+80|0);K=c[D>>2]<<1;c[D>>2]=K;i=D+4|0;J=c[i>>2]<<1;c[i>>2]=J;v=D+8|0;m=c[v>>2]<<1;c[v>>2]=m;E=D+12|0;y=c[E>>2]<<1;c[E>>2]=y;H=D+16|0;C=c[H>>2]<<1;c[H>>2]=C;h=D+20|0;f=c[h>>2]<<1;c[h>>2]=f;g=D+24|0;b=c[g>>2]<<1;c[g>>2]=b;r=D+28|0;o=c[r>>2]<<1;c[r>>2]=o;q=D+32|0;n=c[q>>2]<<1;c[q>>2]=n;A=D+36|0;x=c[A>>2]<<1;c[A>>2]=x;F=c[t>>2]|0;L=F+K|0;d=c[t+4>>2]|0;M=(L>>>26)+J+d|0;c[w+4>>2]=M&33554431;p=c[t+8>>2]|0;M=p+m+(M>>>25)|0;c[w+8>>2]=M&67108863;B=c[t+12>>2]|0;M=B+y+(M>>>26)|0;c[w+12>>2]=M&33554431;s=c[t+16>>2]|0;M=s+C+(M>>>25)|0;c[w+16>>2]=M&67108863;I=c[t+20>>2]|0;M=I+f+(M>>>26)|0;c[w+20>>2]=M&33554431;k=c[t+24>>2]|0;M=k+b+(M>>>25)|0;c[w+24>>2]=M&67108863;j=c[t+28>>2]|0;M=j+o+(M>>>26)|0;c[w+28>>2]=M&33554431;u=c[t+32>>2]|0;M=u+n+(M>>>25)|0;c[w+32>>2]=M&67108863;t=c[t+36>>2]|0;M=t+x+(M>>>26)|0;c[w+36>>2]=M&33554431;c[w>>2]=((M>>>25)*19|0)+(L&67108863);F=K+268435380-F|0;d=J+134217724+(F>>>26)-d|0;c[i>>2]=d&33554431;d=m+268435452-p+(d>>>25)|0;c[v>>2]=d&67108863;d=y+134217724-B+(d>>>26)|0;c[E>>2]=d&33554431;d=C+268435452-s+(d>>>25)|0;c[H>>2]=d&67108863;d=f+134217724-I+(d>>>26)|0;c[h>>2]=d&33554431;d=b+268435452-k+(d>>>25)|0;c[g>>2]=d&67108863;d=o+134217724-j+(d>>>26)|0;c[r>>2]=d&33554431;d=n+268435452-u+(d>>>25)|0;c[q>>2]=d&67108863;d=x+134217724-t+(d>>>26)|0;c[A>>2]=d&33554431;c[D>>2]=((d>>>25)*19|0)+(F&67108863);F=a+40|0;Xa(F,z,D);Xa(a,G,w);Xa(a+80|0,w,D);d=a+120|0;Xa(d,z,G);G=c[a>>2]|0;z=a+4|0;D=c[z>>2]|0;w=a+8|0;A=c[w>>2]|0;t=a+12|0;x=c[t>>2]|0;q=a+16|0;u=c[q>>2]|0;n=a+20|0;r=c[n>>2]|0;j=a+24|0;o=c[j>>2]|0;g=a+28|0;k=c[g>>2]|0;b=a+32|0;h=c[b>>2]|0;I=a+36|0;f=c[I>>2]|0;H=c[F>>2]|0;s=G+134217690-H|0;c[a>>2]=s&67108863;C=a+44|0;E=c[C>>2]|0;s=D+67108862+(s>>>26)-E|0;c[z>>2]=s&33554431;z=a+48|0;B=c[z>>2]|0;s=A+134217726-B+(s>>>25)|0;c[w>>2]=s&67108863;w=a+52|0;y=c[w>>2]|0;s=x+67108862-y+(s>>>26)|0;c[t>>2]=s&33554431;t=a+56|0;v=c[t>>2]|0;c[q>>2]=u+134217726-v+(s>>>25);q=a+60|0;s=c[q>>2]|0;c[n>>2]=r+67108862-s;n=a+64|0;p=c[n>>2]|0;c[j>>2]=o+134217726-p;j=a+68|0;m=c[j>>2]|0;c[g>>2]=k+67108862-m;g=a+72|0;i=c[g>>2]|0;c[b>>2]=h+134217726-i;b=a+76|0;a=c[b>>2]|0;c[I>>2]=f+67108862-a;c[F>>2]=H+G;c[C>>2]=E+D;c[z>>2]=B+A;c[w>>2]=y+x;c[t>>2]=v+u;c[q>>2]=s+r;c[n>>2]=p+o;c[j>>2]=m+k;c[g>>2]=i+h;c[b>>2]=a+f;Xa(d,d,28480);l=e;return}function Cb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;f=l;l=l+128|0;J=f+80|0;L=f+40|0;q=f;t=c[b+40>>2]|0;M=c[b>>2]|0;B=t+134217690-M|0;c[J>>2]=B&67108863;i=c[b+44>>2]|0;r=c[b+4>>2]|0;B=i+67108862+(B>>>26)-r|0;z=J+4|0;c[z>>2]=B&33554431;n=c[b+48>>2]|0;s=c[b+8>>2]|0;B=n+134217726-s+(B>>>25)|0;G=J+8|0;c[G>>2]=B&67108863;u=c[b+52>>2]|0;j=c[b+12>>2]|0;B=u+67108862-j+(B>>>26)|0;D=J+12|0;c[D>>2]=B&33554431;x=c[b+56>>2]|0;o=c[b+16>>2]|0;A=J+16|0;c[A>>2]=x+134217726-o+(B>>>25);B=c[b+60>>2]|0;v=c[b+20>>2]|0;w=J+20|0;c[w>>2]=B+67108862-v;E=c[b+64>>2]|0;y=c[b+24>>2]|0;p=J+24|0;c[p>>2]=E+134217726-y;H=c[b+68>>2]|0;C=c[b+28>>2]|0;m=J+28|0;c[m>>2]=H+67108862-C;K=c[b+72>>2]|0;F=c[b+32>>2]|0;h=J+32|0;c[h>>2]=K+134217726-F;k=c[b+76>>2]|0;I=c[b+36>>2]|0;g=J+36|0;c[g>>2]=k+67108862-I;c[L>>2]=M+t;c[L+4>>2]=r+i;c[L+8>>2]=s+n;c[L+12>>2]=j+u;c[L+16>>2]=o+x;c[L+20>>2]=v+B;c[L+24>>2]=y+E;c[L+28>>2]=C+H;c[L+32>>2]=F+K;c[L+36>>2]=I+k;k=e&255;Xa(J,J,d+(k*40|0)|0);e=k^1;Xa(a,L,d+(e*40|0)|0);L=c[a>>2]|0;J=c[J>>2]|0;c[a+40>>2]=J+L;I=a+4|0;K=c[I>>2]|0;z=c[z>>2]|0;c[a+44>>2]=z+K;F=a+8|0;H=c[F>>2]|0;G=c[G>>2]|0;c[a+48>>2]=G+H;C=a+12|0;E=c[C>>2]|0;D=c[D>>2]|0;c[a+52>>2]=D+E;y=a+16|0;B=c[y>>2]|0;A=c[A>>2]|0;c[a+56>>2]=A+B;v=a+20|0;x=c[v>>2]|0;w=c[w>>2]|0;c[a+60>>2]=w+x;o=a+24|0;u=c[o>>2]|0;p=c[p>>2]|0;c[a+64>>2]=p+u;j=a+28|0;n=c[j>>2]|0;m=c[m>>2]|0;c[a+68>>2]=m+n;s=a+32|0;i=c[s>>2]|0;h=c[h>>2]|0;c[a+72>>2]=h+i;r=a+36|0;t=c[r>>2]|0;g=c[g>>2]|0;c[a+76>>2]=g+t;J=L+134217690-J|0;c[a>>2]=J&67108863;z=K+67108862+(J>>>26)-z|0;c[I>>2]=z&33554431;z=H+134217726-G+(z>>>25)|0;c[F>>2]=z&67108863;z=E+67108862-D+(z>>>26)|0;c[C>>2]=z&33554431;c[y>>2]=B+134217726-A+(z>>>25);c[v>>2]=x+67108862-w;c[o>>2]=u+134217726-p;c[j>>2]=n+67108862-m;c[s>>2]=i+134217726-h;c[r>>2]=t+67108862-g;Xa(q,b+120|0,d+120|0);r=a+120|0;Xa(r,b+80|0,d+80|0);g=c[r>>2]|0;t=a+124|0;s=(c[t>>2]<<1)+(g>>>25&63)|0;h=s&33554431;c[t>>2]=h;t=a+128|0;s=(c[t>>2]<<1)+(s>>>25)|0;i=s&67108863;c[t>>2]=i;t=a+132|0;s=(c[t>>2]<<1)+(s>>>26)|0;j=s&33554431;c[t>>2]=j;t=a+136|0;s=(c[t>>2]<<1)+(s>>>25)|0;m=s&67108863;c[t>>2]=m;t=a+140|0;s=(c[t>>2]<<1)+(s>>>26)|0;n=s&33554431;c[t>>2]=n;t=a+144|0;s=(c[t>>2]<<1)+(s>>>25)|0;o=s&67108863;c[t>>2]=o;t=a+148|0;s=(c[t>>2]<<1)+(s>>>26)|0;p=s&33554431;c[t>>2]=p;t=a+152|0;s=(c[t>>2]<<1)+(s>>>25)|0;d=s&67108863;c[t>>2]=d;t=a+156|0;s=(c[t>>2]<<1)+(s>>>26)|0;b=s&33554431;c[t>>2]=b;g=((s>>>25)*19|0)+(g<<1&67108862)|0;c[r>>2]=g;c[a+80>>2]=g;c[a+84>>2]=h;c[a+88>>2]=i;c[a+92>>2]=j;c[a+96>>2]=m;c[a+100>>2]=n;c[a+104>>2]=o;c[a+108>>2]=p;c[a+112>>2]=d;c[a+116>>2]=b;b=k+2|0;d=a+(b*40|0)|0;k=c[q>>2]|0;c[d>>2]=k+(c[d>>2]|0);d=a+(b*40|0)+4|0;p=c[q+4>>2]|0;c[d>>2]=p+(c[d>>2]|0);d=a+(b*40|0)+8|0;o=c[q+8>>2]|0;c[d>>2]=o+(c[d>>2]|0);d=a+(b*40|0)+12|0;n=c[q+12>>2]|0;c[d>>2]=n+(c[d>>2]|0);d=a+(b*40|0)+16|0;m=c[q+16>>2]|0;c[d>>2]=m+(c[d>>2]|0);d=a+(b*40|0)+20|0;j=c[q+20>>2]|0;c[d>>2]=j+(c[d>>2]|0);d=a+(b*40|0)+24|0;i=c[q+24>>2]|0;c[d>>2]=i+(c[d>>2]|0);d=a+(b*40|0)+28|0;h=c[q+28>>2]|0;c[d>>2]=h+(c[d>>2]|0);d=a+(b*40|0)+32|0;g=c[q+32>>2]|0;c[d>>2]=g+(c[d>>2]|0);b=a+(b*40|0)+36|0;d=c[q+36>>2]|0;c[b>>2]=d+(c[b>>2]|0);e=e+2|0;b=a+(e*40|0)|0;k=134217690-k+(c[b>>2]|0)|0;c[b>>2]=k&67108863;b=a+(e*40|0)+4|0;k=67108862-p+(c[b>>2]|0)+(k>>>26)|0;c[b>>2]=k&33554431;b=a+(e*40|0)+8|0;k=134217726-o+(c[b>>2]|0)+(k>>>25)|0;c[b>>2]=k&67108863;b=a+(e*40|0)+12|0;k=67108862-n+(c[b>>2]|0)+(k>>>26)|0;c[b>>2]=k&33554431;b=a+(e*40|0)+16|0;c[b>>2]=134217726-m+(c[b>>2]|0)+(k>>>25);b=a+(e*40|0)+20|0;c[b>>2]=67108862-j+(c[b>>2]|0);b=a+(e*40|0)+24|0;c[b>>2]=134217726-i+(c[b>>2]|0);b=a+(e*40|0)+28|0;c[b>>2]=67108862-h+(c[b>>2]|0);b=a+(e*40|0)+32|0;c[b>>2]=134217726-g+(c[b>>2]|0);e=a+(e*40|0)+36|0;c[e>>2]=67108862-d+(c[e>>2]|0);l=f;return}function Db(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;f=l;l=l+128|0;J=f+80|0;L=f+40|0;q=f;g=c[b+40>>2]|0;M=c[b>>2]|0;B=g+134217690-M|0;c[J>>2]=B&67108863;j=c[b+44>>2]|0;r=c[b+4>>2]|0;B=j+67108862+(B>>>26)-r|0;z=J+4|0;c[z>>2]=B&33554431;o=c[b+48>>2]|0;h=c[b+8>>2]|0;B=o+134217726-h+(B>>>25)|0;G=J+8|0;c[G>>2]=B&67108863;u=c[b+52>>2]|0;m=c[b+12>>2]|0;B=u+67108862-m+(B>>>26)|0;D=J+12|0;c[D>>2]=B&33554431;x=c[b+56>>2]|0;p=c[b+16>>2]|0;A=J+16|0;c[A>>2]=x+134217726-p+(B>>>25);B=c[b+60>>2]|0;v=c[b+20>>2]|0;w=J+20|0;c[w>>2]=B+67108862-v;E=c[b+64>>2]|0;y=c[b+24>>2]|0;t=J+24|0;c[t>>2]=E+134217726-y;H=c[b+68>>2]|0;C=c[b+28>>2]|0;n=J+28|0;c[n>>2]=H+67108862-C;K=c[b+72>>2]|0;F=c[b+32>>2]|0;i=J+32|0;c[i>>2]=K+134217726-F;k=c[b+76>>2]|0;I=c[b+36>>2]|0;s=J+36|0;c[s>>2]=k+67108862-I;c[L>>2]=M+g;c[L+4>>2]=r+j;c[L+8>>2]=h+o;c[L+12>>2]=m+u;c[L+16>>2]=p+x;c[L+20>>2]=v+B;c[L+24>>2]=y+E;c[L+28>>2]=C+H;c[L+32>>2]=F+K;c[L+36>>2]=I+k;k=e&255;Xa(J,J,d+(k*40|0)|0);e=k^1;Xa(a,L,d+(e*40|0)|0);L=c[a>>2]|0;J=c[J>>2]|0;c[a+40>>2]=J+L;I=a+4|0;K=c[I>>2]|0;z=c[z>>2]|0;c[a+44>>2]=z+K;F=a+8|0;H=c[F>>2]|0;G=c[G>>2]|0;c[a+48>>2]=G+H;C=a+12|0;E=c[C>>2]|0;D=c[D>>2]|0;c[a+52>>2]=D+E;y=a+16|0;B=c[y>>2]|0;A=c[A>>2]|0;c[a+56>>2]=A+B;v=a+20|0;x=c[v>>2]|0;w=c[w>>2]|0;c[a+60>>2]=w+x;p=a+24|0;u=c[p>>2]|0;t=c[t>>2]|0;c[a+64>>2]=t+u;m=a+28|0;o=c[m>>2]|0;n=c[n>>2]|0;c[a+68>>2]=n+o;h=a+32|0;j=c[h>>2]|0;i=c[i>>2]|0;c[a+72>>2]=i+j;r=a+36|0;g=c[r>>2]|0;s=c[s>>2]|0;c[a+76>>2]=s+g;J=L+134217690-J|0;c[a>>2]=J&67108863;z=K+67108862+(J>>>26)-z|0;c[I>>2]=z&33554431;z=H+134217726-G+(z>>>25)|0;c[F>>2]=z&67108863;z=E+67108862-D+(z>>>26)|0;c[C>>2]=z&33554431;c[y>>2]=B+134217726-A+(z>>>25);c[v>>2]=x+67108862-w;c[p>>2]=u+134217726-t;c[m>>2]=o+67108862-n;c[h>>2]=j+134217726-i;c[r>>2]=g+67108862-s;Xa(q,b+120|0,d+80|0);r=a+120|0;s=c[b+80>>2]|0;g=s<<1&67108862;c[r>>2]=g;s=(c[b+84>>2]<<1)+(s>>>25&63)|0;h=s&33554431;c[a+124>>2]=h;s=(c[b+88>>2]<<1)+(s>>>25)|0;i=s&67108863;c[a+128>>2]=i;s=(c[b+92>>2]<<1)+(s>>>26)|0;j=s&33554431;c[a+132>>2]=j;s=(c[b+96>>2]<<1)+(s>>>25)|0;m=s&67108863;c[a+136>>2]=m;s=(c[b+100>>2]<<1)+(s>>>26)|0;n=s&33554431;c[a+140>>2]=n;s=(c[b+104>>2]<<1)+(s>>>25)|0;o=s&67108863;c[a+144>>2]=o;s=(c[b+108>>2]<<1)+(s>>>26)|0;p=s&33554431;c[a+148>>2]=p;s=(c[b+112>>2]<<1)+(s>>>25)|0;d=s&67108863;c[a+152>>2]=d;s=(c[b+116>>2]<<1)+(s>>>26)|0;b=s&33554431;c[a+156>>2]=b;g=((s>>>25)*19|0)+g|0;c[r>>2]=g;c[a+80>>2]=g;c[a+84>>2]=h;c[a+88>>2]=i;c[a+92>>2]=j;c[a+96>>2]=m;c[a+100>>2]=n;c[a+104>>2]=o;c[a+108>>2]=p;c[a+112>>2]=d;c[a+116>>2]=b;b=k+2|0;d=a+(b*40|0)|0;k=c[q>>2]|0;c[d>>2]=k+(c[d>>2]|0);d=a+(b*40|0)+4|0;p=c[q+4>>2]|0;c[d>>2]=p+(c[d>>2]|0);d=a+(b*40|0)+8|0;o=c[q+8>>2]|0;c[d>>2]=o+(c[d>>2]|0);d=a+(b*40|0)+12|0;n=c[q+12>>2]|0;c[d>>2]=n+(c[d>>2]|0);d=a+(b*40|0)+16|0;m=c[q+16>>2]|0;c[d>>2]=m+(c[d>>2]|0);d=a+(b*40|0)+20|0;j=c[q+20>>2]|0;c[d>>2]=j+(c[d>>2]|0);d=a+(b*40|0)+24|0;i=c[q+24>>2]|0;c[d>>2]=i+(c[d>>2]|0);d=a+(b*40|0)+28|0;h=c[q+28>>2]|0;c[d>>2]=h+(c[d>>2]|0);d=a+(b*40|0)+32|0;g=c[q+32>>2]|0;c[d>>2]=g+(c[d>>2]|0);b=a+(b*40|0)+36|0;d=c[q+36>>2]|0;c[b>>2]=d+(c[b>>2]|0);e=e+2|0;b=a+(e*40|0)|0;k=134217690-k+(c[b>>2]|0)|0;c[b>>2]=k&67108863;b=a+(e*40|0)+4|0;k=67108862-p+(c[b>>2]|0)+(k>>>26)|0;c[b>>2]=k&33554431;b=a+(e*40|0)+8|0;k=134217726-o+(c[b>>2]|0)+(k>>>25)|0;c[b>>2]=k&67108863;b=a+(e*40|0)+12|0;k=67108862-n+(c[b>>2]|0)+(k>>>26)|0;c[b>>2]=k&33554431;b=a+(e*40|0)+16|0;c[b>>2]=134217726-m+(c[b>>2]|0)+(k>>>25);b=a+(e*40|0)+20|0;c[b>>2]=67108862-j+(c[b>>2]|0);b=a+(e*40|0)+24|0;c[b>>2]=134217726-i+(c[b>>2]|0);b=a+(e*40|0)+28|0;c[b>>2]=67108862-h+(c[b>>2]|0);b=a+(e*40|0)+32|0;c[b>>2]=134217726-g+(c[b>>2]|0);e=a+(e*40|0)+36|0;c[e>>2]=67108862-d+(c[e>>2]|0);l=f;return}function Eb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=l;l=l+144|0;d=c+96|0;f=c+48|0;e=c;Za(f,b,1);Za(e,f,2);Xa(d,e,b);Xa(f,d,f);Za(e,f,1);Xa(d,e,d);_a(d);Za(d,d,2);Xa(a,d,b);l=c;return}function Fb(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=l;l=l+80|0;e=d+36|0;f=d;Ta(e,a,32);Ta(f,b,32);sb(e,e,f);tb(c,e);l=d;return 0}function Gb(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;h=l;l=l+480|0;e=h+320|0;f=h+160|0;g=h;if((wb(f,b)|0)!=0?(wb(g,c)|0)!=0:0){Hb(e,f,g);Va(d,e);b=d+31|0;a[b>>0]=a[b>>0]^-128;b=0}else b=-1;l=h;return b|0}function Hb(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=l;l=l+160|0;e=d;Ib(e,b,c);b=e+120|0;Xa(a,e,b);c=e+40|0;f=e+80|0;Xa(a+40|0,c,f);Xa(a+80|0,f,b);Xa(a+120|0,e,c);l=d;return}function Ib(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=l;l=l+240|0;I=e+200|0;H=e+160|0;f=e+120|0;g=e+80|0;w=e+40|0;x=e;F=c[b+40>>2]|0;P=c[b>>2]|0;q=F+134217690-P|0;c[I>>2]=q&67108863;D=c[b+44>>2]|0;O=c[b+4>>2]|0;q=D+67108862+(q>>>26)-O|0;G=I+4|0;c[G>>2]=q&33554431;B=c[b+48>>2]|0;R=c[b+8>>2]|0;q=B+134217726-R+(q>>>25)|0;E=I+8|0;c[E>>2]=q&67108863;h=c[b+52>>2]|0;Q=c[b+12>>2]|0;q=h+67108862-Q+(q>>>26)|0;C=I+12|0;c[C>>2]=q&33554431;m=c[b+56>>2]|0;T=c[b+16>>2]|0;A=I+16|0;c[A>>2]=m+134217726-T+(q>>>25);q=c[b+60>>2]|0;S=c[b+20>>2]|0;j=I+20|0;c[j>>2]=q+67108862-S;u=c[b+64>>2]|0;V=c[b+24>>2]|0;o=I+24|0;c[o>>2]=u+134217726-V;K=c[b+68>>2]|0;U=c[b+28>>2]|0;s=I+28|0;c[s>>2]=K+67108862-U;J=c[b+72>>2]|0;M=c[b+32>>2]|0;z=I+32|0;c[z>>2]=J+134217726-M;W=c[b+76>>2]|0;X=c[b+36>>2]|0;y=I+36|0;c[y>>2]=W+67108862-X;c[H>>2]=P+F;F=H+4|0;c[F>>2]=O+D;D=H+8|0;c[D>>2]=R+B;B=H+12|0;c[B>>2]=Q+h;h=H+16|0;c[h>>2]=T+m;m=H+20|0;c[m>>2]=S+q;q=H+24|0;c[q>>2]=V+u;u=H+28|0;c[u>>2]=U+K;K=H+32|0;c[K>>2]=M+J;J=H+36|0;c[J>>2]=X+W;W=c[d+40>>2]|0;X=c[d>>2]|0;M=W+134217690-X|0;c[w>>2]=M&67108863;U=c[d+44>>2]|0;V=c[d+4>>2]|0;M=U+67108862+(M>>>26)-V|0;c[w+4>>2]=M&33554431;S=c[d+48>>2]|0;T=c[d+8>>2]|0;M=S+134217726-T+(M>>>25)|0;c[w+8>>2]=M&67108863;Q=c[d+52>>2]|0;R=c[d+12>>2]|0;M=Q+67108862-R+(M>>>26)|0;c[w+12>>2]=M&33554431;O=c[d+56>>2]|0;P=c[d+16>>2]|0;c[w+16>>2]=O+134217726-P+(M>>>25);M=c[d+60>>2]|0;N=c[d+20>>2]|0;c[w+20>>2]=M+67108862-N;i=c[d+64>>2]|0;L=c[d+24>>2]|0;c[w+24>>2]=i+134217726-L;n=c[d+68>>2]|0;k=c[d+28>>2]|0;c[w+28>>2]=n+67108862-k;r=c[d+72>>2]|0;p=c[d+32>>2]|0;c[w+32>>2]=r+134217726-p;v=c[d+76>>2]|0;t=c[d+36>>2]|0;c[w+36>>2]=v+67108862-t;c[x>>2]=X+W;c[x+4>>2]=V+U;c[x+8>>2]=T+S;c[x+12>>2]=R+Q;c[x+16>>2]=P+O;c[x+20>>2]=N+M;c[x+24>>2]=L+i;c[x+28>>2]=k+n;c[x+32>>2]=p+r;c[x+36>>2]=t+v;Xa(I,I,w);Xa(H,H,x);Xa(f,b+120|0,d+120|0);Xa(f,f,28480);Xa(g,b+80|0,d+80|0);x=c[g>>2]<<1;c[g>>2]=x;b=g+4|0;w=c[b>>2]<<1;c[b>>2]=w;b=g+8|0;v=c[b>>2]<<1;c[b>>2]=v;b=g+12|0;t=c[b>>2]<<1;c[b>>2]=t;b=g+16|0;r=c[b>>2]<<1;c[b>>2]=r;b=g+20|0;p=c[b>>2]<<1;c[b>>2]=p;b=g+24|0;n=c[b>>2]<<1;c[b>>2]=n;b=g+28|0;k=c[b>>2]<<1;c[b>>2]=k;b=g+32|0;i=c[b>>2]<<1;c[b>>2]=i;b=g+36|0;g=c[b>>2]<<1;c[b>>2]=g;H=c[H>>2]|0;I=c[I>>2]|0;b=H+134217690-I|0;c[a>>2]=b&67108863;F=c[F>>2]|0;G=c[G>>2]|0;b=F+67108862+(b>>>26)-G|0;c[a+4>>2]=b&33554431;D=c[D>>2]|0;E=c[E>>2]|0;b=D+134217726-E+(b>>>25)|0;c[a+8>>2]=b&67108863;B=c[B>>2]|0;C=c[C>>2]|0;b=B+67108862-C+(b>>>26)|0;c[a+12>>2]=b&33554431;h=c[h>>2]|0;A=c[A>>2]|0;c[a+16>>2]=h+134217726-A+(b>>>25);m=c[m>>2]|0;j=c[j>>2]|0;c[a+20>>2]=m+67108862-j;q=c[q>>2]|0;o=c[o>>2]|0;c[a+24>>2]=q+134217726-o;u=c[u>>2]|0;s=c[s>>2]|0;c[a+28>>2]=u+67108862-s;b=c[K>>2]|0;z=c[z>>2]|0;c[a+32>>2]=b+134217726-z;d=c[J>>2]|0;y=c[y>>2]|0;c[a+36>>2]=d+67108862-y;c[a+40>>2]=I+H;c[a+44>>2]=G+F;c[a+48>>2]=E+D;c[a+52>>2]=C+B;c[a+56>>2]=A+h;c[a+60>>2]=j+m;c[a+64>>2]=o+q;c[a+68>>2]=s+u;c[a+72>>2]=z+b;c[a+76>>2]=y+d;d=c[f>>2]|0;y=d+x|0;b=c[f+4>>2]|0;z=(y>>>26)+w+b|0;c[a+84>>2]=z&33554431;u=c[f+8>>2]|0;z=u+v+(z>>>25)|0;c[a+88>>2]=z&67108863;s=c[f+12>>2]|0;z=s+t+(z>>>26)|0;c[a+92>>2]=z&33554431;q=c[f+16>>2]|0;z=q+r+(z>>>25)|0;c[a+96>>2]=z&67108863;o=c[f+20>>2]|0;z=o+p+(z>>>26)|0;c[a+100>>2]=z&33554431;m=c[f+24>>2]|0;z=m+n+(z>>>25)|0;c[a+104>>2]=z&67108863;j=c[f+28>>2]|0;z=j+k+(z>>>26)|0;c[a+108>>2]=z&33554431;h=c[f+32>>2]|0;z=h+i+(z>>>25)|0;c[a+112>>2]=z&67108863;f=c[f+36>>2]|0;z=f+g+(z>>>26)|0;c[a+116>>2]=z&33554431;c[a+80>>2]=((z>>>25)*19|0)+(y&67108863);d=x+268435380-d|0;b=w+134217724+(d>>>26)-b|0;c[a+124>>2]=b&33554431;b=v+268435452-u+(b>>>25)|0;c[a+128>>2]=b&67108863;b=t+134217724-s+(b>>>26)|0;c[a+132>>2]=b&33554431;b=r+268435452-q+(b>>>25)|0;c[a+136>>2]=b&67108863;b=p+134217724-o+(b>>>26)|0;c[a+140>>2]=b&33554431;b=n+268435452-m+(b>>>25)|0;c[a+144>>2]=b&67108863;b=k+134217724-j+(b>>>26)|0;c[a+148>>2]=b&33554431;b=i+268435452-h+(b>>>25)|0;c[a+152>>2]=b&67108863;b=g+134217724-f+(b>>>26)|0;c[a+156>>2]=b&33554431;c[a+120>>2]=((b>>>25)*19|0)+(d&67108863);l=e;return}function Jb(b,c){b=b|0;c=c|0;Kb(c,b);a[c>>0]=a[c>>0]&-8;b=c+31|0;c=a[b>>0]|0;a[b>>0]=c&63|64;return (c&255)>>>5&1|0}function Kb(a,b){a=a|0;b=b|0;var c=0,d=0;c=l;l=l+208|0;d=c;dc(d);ec(d,b,32);kc(d,a);l=c;return}function Lb(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;b=(b|0)==32;h=b?29964:29980;c[a>>2]=Mb(h)|0;c[a+4>>2]=Mb(h+4|0)|0;c[a+8>>2]=Mb(h+8|0)|0;c[a+12>>2]=Mb(h+12|0)|0;c[a+16>>2]=Nb(d)|0;c[a+20>>2]=Nb(d+4|0)|0;c[a+24>>2]=Nb(d+8|0)|0;c[a+28>>2]=Nb(d+12|0)|0;d=b?d+16|0:d;c[a+32>>2]=Nb(d)|0;c[a+36>>2]=Nb(d+4|0)|0;c[a+40>>2]=Nb(d+8|0)|0;c[a+44>>2]=Nb(d+12|0)|0;c[a+48>>2]=0;switch(e|0){case 8:{c[a+52>>2]=0;b=4;d=Nb(f)|0;g=4;break}case 12:{c[a+52>>2]=Nb(f)|0;b=8;d=Nb(f+4|0)|0;g=4;break}default:{}}if((g|0)==4){c[a+56>>2]=d;c[a+60>>2]=Nb(f+b|0)|0}return}function Mb(a){a=a|0;return c[a>>2]|0}function Nb(a){a=a|0;return (d[a+1>>0]|0)<<8|(d[a>>0]|0)|(d[a+2>>0]|0)<<16|(d[a+3>>0]|0)<<24|0}function Ob(b,c,d,e,f,g){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;hd(b|0,0,136)|0;a[b+130>>0]=c;Lb(b,d,e,f,g);return}function Pb(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;t=l;l=l+64|0;r=t;do if(g|0){s=e+129|0;q=a[s>>0]|0;h=q&255;if(q<<24>>24){j=h>>>0<g>>>0?h:g;i=e+128|0;if((j|0)>0){h=0;do{a[b+h>>0]=a[h+(d[i>>0]|0)+(e+64)>>0]^a[f+h>>0];h=h+1|0}while(h>>>0<j>>>0)}hd((d[i>>0]|0)+(e+64)|0,0,j|0)|0;a[s>>0]=(d[s>>0]|0)-j;a[i>>0]=j+(d[i>>0]|0);g=g-j|0;if(!g)break;else{f=f+j|0;i=b+j|0}}else i=b;if(g>>>0>63){b=e+130|0;k=e+48|0;m=e+52|0;n=g+-64|0;o=n&-64;p=o+64|0;q=f+p|0;j=i;while(1){Qb(d[b>>0]|0,r,e);h=(c[k>>2]|0)+1|0;c[k>>2]=h;if(!h)c[m>>2]=(c[m>>2]|0)+1;h=0;do{a[j+h>>0]=a[r+h>>0]^a[f+h>>0];h=h+1|0}while((h|0)!=64);g=g+-64|0;if(g>>>0<=63)break;else{f=f+64|0;j=j+64|0}}g=n-o|0;if(!g)break;else{i=i+p|0;f=q}}Qb(d[e+130>>0]|0,r,e);p=e+48|0;q=(c[p>>2]|0)+1|0;c[p>>2]=q;if(!q){q=e+52|0;c[q>>2]=(c[q>>2]|0)+1}h=0;do{a[i+h>>0]=a[r+h>>0]^a[f+h>>0];h=h+1|0}while((h|0)!=(g|0));h=64-g|0;a[s>>0]=h;a[e+128>>0]=g;if(g>>>0<64)gd(e+64+g|0,r+g|0,h|0)|0}while(0);l=t;return}function Qb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;E=c[d>>2]|0;G=c[d+4>>2]|0;H=c[d+8>>2]|0;I=c[d+12>>2]|0;u=c[d+16>>2]|0;v=c[d+20>>2]|0;w=c[d+24>>2]|0;x=c[d+28>>2]|0;y=c[d+32>>2]|0;z=c[d+36>>2]|0;A=c[d+40>>2]|0;B=c[d+44>>2]|0;C=c[d+48>>2]|0;D=c[d+52>>2]|0;F=c[d+56>>2]|0;t=c[d+60>>2]|0;if((a|0)>0){f=t;h=F;l=D;o=C;r=B;s=A;q=z;p=y;n=x;m=w;j=v;i=u;k=I;g=H;e=G;d=E;while(1){d=i+d|0;o=Rb(o^d,16)|0;p=o+p|0;i=Rb(p^i,12)|0;d=i+d|0;o=Rb(d^o,8)|0;p=o+p|0;i=Rb(p^i,7)|0;e=j+e|0;l=Rb(l^e,16)|0;q=l+q|0;j=Rb(q^j,12)|0;e=j+e|0;l=Rb(e^l,8)|0;q=l+q|0;j=Rb(q^j,7)|0;g=m+g|0;h=Rb(h^g,16)|0;s=h+s|0;m=Rb(s^m,12)|0;g=m+g|0;h=Rb(g^h,8)|0;s=h+s|0;m=Rb(s^m,7)|0;k=n+k|0;f=Rb(f^k,16)|0;r=f+r|0;n=Rb(r^n,12)|0;k=n+k|0;f=Rb(k^f,8)|0;r=f+r|0;n=Rb(r^n,7)|0;d=j+d|0;f=Rb(f^d,16)|0;s=f+s|0;j=Rb(s^j,12)|0;d=j+d|0;f=Rb(d^f,8)|0;s=f+s|0;j=Rb(s^j,7)|0;e=m+e|0;o=Rb(e^o,16)|0;r=o+r|0;m=Rb(r^m,12)|0;e=m+e|0;o=Rb(e^o,8)|0;r=o+r|0;m=Rb(r^m,7)|0;g=n+g|0;l=Rb(g^l,16)|0;p=l+p|0;n=Rb(p^n,12)|0;g=n+g|0;l=Rb(g^l,8)|0;p=l+p|0;n=Rb(p^n,7)|0;k=k+i|0;h=Rb(k^h,16)|0;q=h+q|0;i=Rb(q^i,12)|0;k=i+k|0;h=Rb(k^h,8)|0;q=h+q|0;i=Rb(q^i,7)|0;if((a|0)>2)a=a+-2|0;else{a=k;break}}}else{f=t;h=F;l=D;o=C;r=B;s=A;q=z;p=y;n=x;m=w;j=v;i=u;a=I;g=H;e=G;d=E}c[b>>2]=d+E;c[b+4>>2]=e+G;c[b+8>>2]=g+H;c[b+12>>2]=a+I;c[b+16>>2]=i+u;c[b+20>>2]=j+v;c[b+24>>2]=m+w;c[b+28>>2]=n+x;c[b+32>>2]=p+y;c[b+36>>2]=q+z;c[b+40>>2]=s+A;c[b+44>>2]=r+B;c[b+48>>2]=o+C;c[b+52>>2]=l+D;c[b+56>>2]=h+F;c[b+60>>2]=f+t;return}function Rb(a,b){a=a|0;b=b|0;return a>>>(32-b|0)|a<<b|0}function Sb(a,b){a=a|0;b=b|0;ec(a,b,128);return}function Tb(b,c){b=b|0;c=c|0;a[b+3>>0]=c;a[b+2>>0]=c>>>8;a[b+1>>0]=c>>>16;a[b>>0]=c>>>24;return}function Ub(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=b+d|0;c=c+-4|0;hd(f|0,0,c-d|0)|0;a[f>>0]=-128;Tb(b+c|0,e<<3);return}function Vb(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;Wb(a,b,c,d,e,f,g);return}function Wb(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0;j=l;l=l+480|0;h=j;i=j+416|0;if(!e)X(29749,29760,363,29822);if(!((f|0)!=0&(g|0)!=0))X(29810,29760,363,29822);Xb(h,a,b);b=(g+63|0)>>>6;if(b|0){a=1;while(1){Yb(h,a,c,d,e,i);m=(a<<6)+-64|0;k=g-m|0;gd(f+m|0,i|0,(k>>>0<64?k:64)|0)|0;if(a>>>0<b>>>0)a=a+1|0;else break}}l=j;return}function Xb(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;h=l;l=l+384|0;e=h+256|0;f=h+128|0;g=h;if(d>>>0>128){dc(b);ec(b,c,d);kc(b,e);d=64;c=e}if((e|0)!=(c|0))gd(e|0,c|0,d|0)|0;if(d>>>0<128)hd(e+d|0,0,128-d|0)|0;c=0;do{d=a[e+c>>0]|0;a[f+c>>0]=d^54;a[g+c>>0]=d^92;c=c+1|0}while((c|0)!=128);dc(b);ec(b,f,128);f=b+208|0;dc(f);ec(f,g,128);l=h;return}function Yb(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;j=l;l=l+768|0;k=j+752|0;g=j+624|0;h=j+208|0;i=j;Tb(k,b);Ub(g,128,64,192);gd(h|0,a|0,416)|0;Zb(h,c,d);Zb(h,k,4);_b(h,g);c=h+208|0;gd(i|0,c|0,208)|0;if(e>>>0>1){d=a+208|0;b=1;do{ac(h,a);Sb(h,g);$b(h,g);ac(c,d);Sb(c,g);$b(c,g);bc(i,c);b=b+1|0}while((b|0)!=(e|0))}$b(i,f);l=j;return}function Zb(a,b,c){a=a|0;b=b|0;c=c|0;ec(a,b,c);return}function _b(a,b){a=a|0;b=b|0;kc(a,b);a=a+208|0;ec(a,b,64);kc(a,b);return}function $b(a,b){a=a|0;b=b|0;var d=0;d=a+144|0;cc(b,c[d>>2]|0,c[d+4>>2]|0);d=a+152|0;cc(b+8|0,c[d>>2]|0,c[d+4>>2]|0);d=a+160|0;cc(b+16|0,c[d>>2]|0,c[d+4>>2]|0);d=a+168|0;cc(b+24|0,c[d>>2]|0,c[d+4>>2]|0);d=a+176|0;cc(b+32|0,c[d>>2]|0,c[d+4>>2]|0);d=a+184|0;cc(b+40|0,c[d>>2]|0,c[d+4>>2]|0);d=a+192|0;cc(b+48|0,c[d>>2]|0,c[d+4>>2]|0);a=a+200|0;cc(b+56|0,c[a>>2]|0,c[a+4>>2]|0);return}function ac(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=b+144|0;d=c[f+4>>2]|0;e=a+144|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;e=b+152|0;d=c[e+4>>2]|0;f=a+152|0;c[f>>2]=c[e>>2];c[f+4>>2]=d;f=b+160|0;d=c[f+4>>2]|0;e=a+160|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;e=b+168|0;d=c[e+4>>2]|0;f=a+168|0;c[f>>2]=c[e>>2];c[f+4>>2]=d;f=b+176|0;d=c[f+4>>2]|0;e=a+176|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;e=b+184|0;d=c[e+4>>2]|0;f=a+184|0;c[f>>2]=c[e>>2];c[f+4>>2]=d;f=b+192|0;d=c[f+4>>2]|0;e=a+192|0;c[e>>2]=c[f>>2];c[e+4>>2]=d;e=b+200|0;d=c[e+4>>2]|0;b=a+200|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return}function bc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;e=b+144|0;g=a+144|0;d=g;f=c[d+4>>2]^c[e+4>>2];c[g>>2]=c[d>>2]^c[e>>2];c[g+4>>2]=f;g=b+152|0;f=a+152|0;e=f;d=c[e+4>>2]^c[g+4>>2];c[f>>2]=c[e>>2]^c[g>>2];c[f+4>>2]=d;f=b+160|0;d=a+160|0;g=d;e=c[g+4>>2]^c[f+4>>2];c[d>>2]=c[g>>2]^c[f>>2];c[d+4>>2]=e;d=b+168|0;e=a+168|0;f=e;g=c[f+4>>2]^c[d+4>>2];c[e>>2]=c[f>>2]^c[d>>2];c[e+4>>2]=g;e=b+176|0;g=a+176|0;d=g;f=c[d+4>>2]^c[e+4>>2];c[g>>2]=c[d>>2]^c[e>>2];c[g+4>>2]=f;g=b+184|0;f=a+184|0;e=f;d=c[e+4>>2]^c[g+4>>2];c[f>>2]=c[e>>2]^c[g>>2];c[f+4>>2]=d;f=b+192|0;d=a+192|0;g=d;e=c[g+4>>2]^c[f+4>>2];c[d>>2]=c[g>>2]^c[f>>2];c[d+4>>2]=e;d=b+200|0;b=a+200|0;e=b;a=c[e+4>>2]^c[d+4>>2];c[b>>2]=c[e>>2]^c[d>>2];c[b+4>>2]=a;return}function cc(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;a[b+7>>0]=c;e=cd(c|0,d|0,8)|0;a[b+6>>0]=e;e=cd(c|0,d|0,16)|0;a[b+5>>0]=e;e=cd(c|0,d|0,24)|0;a[b+4>>0]=e;a[b+3>>0]=d;e=cd(c|0,d|0,40)|0;a[b+2>>0]=e;e=cd(c|0,d|0,48)|0;a[b+1>>0]=e;d=cd(c|0,d|0,56)|0;a[b>>0]=d;return}function dc(a){a=a|0;var b=0;hd(a|0,0,144)|0;b=a+144|0;c[b>>2]=-205731576;c[b+4>>2]=1779033703;b=a+152|0;c[b>>2]=-2067093701;c[b+4>>2]=-1150833019;b=a+160|0;c[b>>2]=-23791573;c[b+4>>2]=1013904242;b=a+168|0;c[b>>2]=1595750129;c[b+4>>2]=-1521486534;b=a+176|0;c[b>>2]=-1377402159;c[b+4>>2]=1359893119;b=a+184|0;c[b>>2]=725511199;c[b+4>>2]=-1694144372;b=a+192|0;c[b>>2]=-79577749;c[b+4>>2]=528734635;a=a+200|0;c[a>>2]=327033209;c[a+4>>2]=1541459225;return}function ec(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0;p=l;l=l+128|0;o=p;n=b;m=c[n>>2]|0;f=m&127;g=128-f|0;n=ed(m|0,c[n+4>>2]|0,e|0,0)|0;m=y;k=b;c[k>>2]=n;c[k+4>>2]=m;if(m>>>0<0|(m|0)==0&n>>>0<e>>>0){n=b+8|0;m=n;m=ed(c[m>>2]|0,c[m+4>>2]|0,1,0)|0;c[n>>2]=m;c[n+4>>2]=y}if(!((f|0)==0|g>>>0>e>>>0)){gd(b+16+f|0,d|0,g|0)|0;fc(b,b+16|0);d=d+g|0;f=0;e=e-g|0}if(!(d&7)){if(e>>>0>127){i=e+-128|0;j=i&-128;h=j+128|0;g=d;while(1){fc(b,g);e=e+-128|0;if(e>>>0<=127)break;else g=g+128|0}d=d+h|0;e=i-j|0}}else if(e>>>0>127){m=e+-128|0;n=m&-128;k=n+128|0;g=d;while(1){h=o;i=g;j=h+128|0;do{a[h>>0]=a[i>>0]|0;h=h+1|0;i=i+1|0}while((h|0)<(j|0));fc(b,o);e=e+-128|0;if(e>>>0<=127)break;else g=g+128|0}d=d+k|0;e=m-n|0}if(e|0)gd(b+16+f|0,d|0,e|0)|0;l=p;return}function fc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0;T=l;l=l+640|0;S=T;gc(S,b);e=S;b=16;d=c[e>>2]|0;e=c[e+4>>2]|0;do{J=S+(b+-2<<3)|0;K=c[J>>2]|0;J=c[J+4>>2]|0;N=hc(K,J,19)|0;P=y;M=hc(K,J,61)|0;L=y;J=cd(K|0,J|0,6)|0;K=S+(b+-7<<3)|0;K=ed(J^N^M|0,y^P^L|0,c[K>>2]|0,c[K+4>>2]|0)|0;L=y;P=S+(b+-15<<3)|0;M=d;d=c[P>>2]|0;N=e;e=c[P+4>>2]|0;P=hc(d,e,1)|0;J=y;R=hc(d,e,8)|0;Q=y;O=cd(d|0,e|0,7)|0;Q=y^J^Q;N=ed(K|0,L|0,M|0,N|0)|0;Q=ed(N|0,y|0,O^P^R|0,Q|0)|0;R=S+(b<<3)|0;c[R>>2]=Q;c[R+4>>2]=y;b=b+1|0}while((b|0)!=80);E=a+144|0;G=E;F=c[G>>2]|0;G=c[G+4>>2]|0;H=a+152|0;J=H;I=c[J>>2]|0;J=c[J+4>>2]|0;K=a+160|0;M=K;L=c[M>>2]|0;M=c[M+4>>2]|0;N=a+168|0;P=N;O=c[P>>2]|0;P=c[P+4>>2]|0;Q=a+176|0;w=Q;R=c[w>>2]|0;w=c[w+4>>2]|0;x=a+184|0;A=x;z=c[A>>2]|0;A=c[A+4>>2]|0;B=a+192|0;D=B;C=c[D>>2]|0;D=c[D+4>>2]|0;d=a+200|0;a=d;e=c[a>>2]|0;a=c[a+4>>2]|0;b=0;f=R;g=w;h=z;i=C;j=A;k=D;m=e;n=a;o=F;p=G;q=I;r=J;s=L;t=M;u=O;v=P;do{pa=hc(f,g,14)|0;V=y;oa=hc(f,g,18)|0;V=y^V;ea=hc(f,g,41)|0;V=V^y;la=28576+(b<<3)|0;W=c[la>>2]|0;la=c[la+4>>2]|0;aa=S+(b<<3)|0;ka=c[aa>>2]|0;aa=c[aa+4>>2]|0;U=ed((i^h)&f^i|0,(k^j)&g^k|0,m|0,n|0)|0;V=ed(U|0,y|0,oa^pa^ea|0,V|0)|0;la=ed(V|0,y|0,W|0,la|0)|0;aa=ed(la|0,y|0,ka|0,aa|0)|0;ka=y;la=hc(o,p,28)|0;W=y;V=hc(o,p,34)|0;W=y^W;ea=hc(o,p,39)|0;W=W^y;pa=ed(aa|0,ka|0,u|0,v|0)|0;oa=y;ka=ed(aa|0,ka|0,(o|q)&s|o&q|0,(p|r)&t|p&r|0)|0;W=ed(ka|0,y|0,V^la^ea|0,W|0)|0;ea=y;la=hc(pa,oa,14)|0;V=y;ka=hc(pa,oa,18)|0;V=y^V;aa=hc(pa,oa,41)|0;V=V^y;U=b|1;ha=28576+(U<<3)|0;Z=c[ha>>2]|0;ha=c[ha+4>>2]|0;U=S+(U<<3)|0;ga=c[U>>2]|0;U=c[U+4>>2]|0;_=ed(pa&(h^f)^h|0,oa&(j^g)^j|0,i|0,k|0)|0;V=ed(_|0,y|0,ka^la^aa|0,V|0)|0;ha=ed(V|0,y|0,Z|0,ha|0)|0;U=ed(ha|0,y|0,ga|0,U|0)|0;ga=y;ha=hc(W,ea,28)|0;Z=y;V=hc(W,ea,34)|0;Z=y^Z;aa=hc(W,ea,39)|0;Z=Z^y;la=ed(U|0,ga|0,s|0,t|0)|0;ka=y;ga=ed(U|0,ga|0,(W|o)&q|W&o|0,(ea|p)&r|ea&p|0)|0;Z=ed(ga|0,y|0,V^ha^aa|0,Z|0)|0;aa=y;ha=hc(la,ka,14)|0;V=y;ga=hc(la,ka,18)|0;V=y^V;U=hc(la,ka,41)|0;V=V^y;_=b|2;da=28576+(_<<3)|0;Y=c[da>>2]|0;da=c[da+4>>2]|0;_=S+(_<<3)|0;ca=c[_>>2]|0;_=c[_+4>>2]|0;X=ed(la&(pa^f)^f|0,ka&(oa^g)^g|0,h|0,j|0)|0;V=ed(X|0,y|0,ga^ha^U|0,V|0)|0;da=ed(V|0,y|0,Y|0,da|0)|0;_=ed(da|0,y|0,ca|0,_|0)|0;ca=y;da=hc(Z,aa,28)|0;Y=y;V=hc(Z,aa,34)|0;Y=y^Y;U=hc(Z,aa,39)|0;Y=Y^y;ha=ed(_|0,ca|0,q|0,r|0)|0;ga=y;ca=ed(_|0,ca|0,(Z|W)&o|Z&W|0,(aa|ea)&p|aa&ea|0)|0;Y=ed(ca|0,y|0,V^da^U|0,Y|0)|0;U=y;da=hc(ha,ga,14)|0;V=y;ca=hc(ha,ga,18)|0;V=y^V;_=hc(ha,ga,41)|0;V=V^y;X=b|3;ma=28576+(X<<3)|0;$=c[ma>>2]|0;ma=c[ma+4>>2]|0;X=S+(X<<3)|0;na=c[X>>2]|0;X=c[X+4>>2]|0;fa=ed(ha&(la^pa)^pa|0,ga&(ka^oa)^oa|0,f|0,g|0)|0;V=ed(fa|0,y|0,ca^da^_|0,V|0)|0;ma=ed(V|0,y|0,$|0,ma|0)|0;X=ed(ma|0,y|0,na|0,X|0)|0;na=y;ma=hc(Y,U,28)|0;$=y;V=hc(Y,U,34)|0;$=y^$;_=hc(Y,U,39)|0;$=$^y;da=ed(X|0,na|0,o|0,p|0)|0;ca=y;na=ed(X|0,na|0,(Y|Z)&W|Y&Z|0,(U|aa)&ea|U&aa|0)|0;$=ed(na|0,y|0,V^ma^_|0,$|0)|0;_=y;ma=hc(da,ca,14)|0;V=y;na=hc(da,ca,18)|0;V=y^V;X=hc(da,ca,41)|0;V=V^y;fa=b|4;ja=28576+(fa<<3)|0;ia=c[ja>>2]|0;ja=c[ja+4>>2]|0;fa=S+(fa<<3)|0;ba=c[fa>>2]|0;fa=c[fa+4>>2]|0;oa=ed(da&(ha^la)^la|0,ca&(ga^ka)^ka|0,pa|0,oa|0)|0;V=ed(oa|0,y|0,na^ma^X|0,V|0)|0;ja=ed(V|0,y|0,ia|0,ja|0)|0;fa=ed(ja|0,y|0,ba|0,fa|0)|0;ba=y;ja=hc($,_,28)|0;ia=y;V=hc($,_,34)|0;ia=y^ia;X=hc($,_,39)|0;ia=ia^y;m=ed(fa|0,ba|0,W|0,ea|0)|0;n=y;ba=ed(fa|0,ba|0,($|Y)&Z|$&Y|0,(_|U)&aa|_&U|0)|0;u=ed(ba|0,y|0,V^ja^X|0,ia|0)|0;v=y;ia=hc(m,n,14)|0;X=y;ja=hc(m,n,18)|0;X=y^X;V=hc(m,n,41)|0;X=X^y;ba=b|5;fa=28576+(ba<<3)|0;ea=c[fa>>2]|0;fa=c[fa+4>>2]|0;ba=S+(ba<<3)|0;W=c[ba>>2]|0;ba=c[ba+4>>2]|0;ka=ed(m&(da^ha)^ha|0,n&(ca^ga)^ga|0,la|0,ka|0)|0;X=ed(ka|0,y|0,ja^ia^V|0,X|0)|0;fa=ed(X|0,y|0,ea|0,fa|0)|0;ba=ed(fa|0,y|0,W|0,ba|0)|0;W=y;fa=hc(u,v,28)|0;ea=y;X=hc(u,v,34)|0;ea=y^ea;V=hc(u,v,39)|0;ea=ea^y;i=ed(ba|0,W|0,Z|0,aa|0)|0;k=y;W=ed(ba|0,W|0,(u|$)&Y|u&$|0,(v|_)&U|v&_|0)|0;s=ed(W|0,y|0,X^fa^V|0,ea|0)|0;t=y;ea=hc(i,k,14)|0;V=y;fa=hc(i,k,18)|0;V=y^V;X=hc(i,k,41)|0;V=V^y;W=b|6;ba=28576+(W<<3)|0;aa=c[ba>>2]|0;ba=c[ba+4>>2]|0;W=S+(W<<3)|0;Z=c[W>>2]|0;W=c[W+4>>2]|0;ga=ed(i&(m^da)^da|0,k&(n^ca)^ca|0,ha|0,ga|0)|0;V=ed(ga|0,y|0,fa^ea^X|0,V|0)|0;ba=ed(V|0,y|0,aa|0,ba|0)|0;W=ed(ba|0,y|0,Z|0,W|0)|0;Z=y;ba=hc(s,t,28)|0;aa=y;V=hc(s,t,34)|0;aa=y^aa;X=hc(s,t,39)|0;aa=aa^y;h=ed(W|0,Z|0,Y|0,U|0)|0;j=y;Z=ed(W|0,Z|0,(s|u)&$|s&u|0,(t|v)&_|t&v|0)|0;q=ed(Z|0,y|0,V^ba^X|0,aa|0)|0;r=y;aa=hc(h,j,14)|0;X=y;ba=hc(h,j,18)|0;X=y^X;V=hc(h,j,41)|0;X=X^y;Z=b|7;W=28576+(Z<<3)|0;U=c[W>>2]|0;W=c[W+4>>2]|0;Z=S+(Z<<3)|0;Y=c[Z>>2]|0;Z=c[Z+4>>2]|0;ca=ed(h&(i^m)^m|0,j&(k^n)^n|0,da|0,ca|0)|0;X=ed(ca|0,y|0,ba^aa^V|0,X|0)|0;W=ed(X|0,y|0,U|0,W|0)|0;Z=ed(W|0,y|0,Y|0,Z|0)|0;Y=y;W=hc(q,r,28)|0;U=y;X=hc(q,r,34)|0;U=y^U;V=hc(q,r,39)|0;U=U^y;f=ed(Z|0,Y|0,$|0,_|0)|0;g=y;Y=ed(Z|0,Y|0,(q|s)&u|q&s|0,(r|t)&v|r&t|0)|0;o=ed(Y|0,y|0,X^W^V|0,U|0)|0;p=y;b=b+8|0}while(b>>>0<80);pa=ed(o|0,p|0,F|0,G|0)|0;oa=E;c[oa>>2]=pa;c[oa+4>>2]=y;oa=ed(q|0,r|0,I|0,J|0)|0;pa=H;c[pa>>2]=oa;c[pa+4>>2]=y;pa=ed(s|0,t|0,L|0,M|0)|0;oa=K;c[oa>>2]=pa;c[oa+4>>2]=y;oa=ed(u|0,v|0,O|0,P|0)|0;pa=N;c[pa>>2]=oa;c[pa+4>>2]=y;pa=ed(f|0,g|0,R|0,w|0)|0;oa=Q;c[oa>>2]=pa;c[oa+4>>2]=y;oa=ed(h|0,j|0,z|0,A|0)|0;pa=x;c[pa>>2]=oa;c[pa+4>>2]=y;pa=ed(i|0,k|0,C|0,D|0)|0;oa=B;c[oa>>2]=pa;c[oa+4>>2]=y;oa=ed(m|0,n|0,e|0,a|0)|0;pa=d;c[pa>>2]=oa;c[pa+4>>2]=y;l=T;return}function gc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=16;while(1){d=d+-1|0;f=b;f=ic(c[f>>2]|0,c[f+4>>2]|0)|0;e=a;c[e>>2]=f;c[e+4>>2]=y;if(!d)break;else{b=b+8|0;a=a+8|0}}return}function hc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=cd(a|0,b|0,c|0)|0;e=y;c=dd(a|0,b|0,64-c|0)|0;y=y|e;return c|d|0}function ic(a,b){a=a|0;b=b|0;b=jc(b)|0;y=jc(a)|0;return b|0}function jc(a){a=a|0;return fd(a|0)|0}function kc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;e=l;l=l+16|0;d=e;g=a+8|0;g=dd(c[g>>2]|0,c[g+4>>2]|0,3)|0;i=y;h=a;f=c[h>>2]|0;h=c[h+4>>2]|0;j=cd(f|0,h|0,61)|0;i=ic(j|g,y|i)|0;g=d;c[g>>2]=i;c[g+4>>2]=y;h=dd(f|0,h|0,3)|0;h=ic(h,y)|0;g=d+8|0;c[g>>2]=h;c[g+4>>2]=y;f=f&127;ec(a,29836,(f>>>0<112?112:240)-f|0);ec(a,d,16);d=0;do{j=a+144+(d<<3)|0;lc(b+(d<<3)|0,c[j>>2]|0,c[j+4>>2]|0);d=d+1|0}while((d|0)!=8);l=e;return}function lc(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;a[b+7>>0]=c;e=cd(c|0,d|0,8)|0;a[b+6>>0]=e;e=cd(c|0,d|0,16)|0;a[b+5>>0]=e;e=cd(c|0,d|0,24)|0;a[b+4>>0]=e;a[b+3>>0]=d;e=cd(c|0,d|0,40)|0;a[b+2>>0]=e;e=cd(c|0,d|0,48)|0;a[b+1>>0]=e;d=cd(c|0,d|0,56)|0;a[b>>0]=d;return}function mc(a,b){a=a|0;b=b|0;b=200-(b>>>3<<1)|0;hd(a|0,0,b+208|0)|0;c[a+4>>2]=b;return}function nc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=l;l=l+176|0;i=k;j=a+4|0;e=c[j>>2]|0;f=c[a>>2]|0;g=e-f|0;if((e|0)!=(f|0)){if(!(g>>>0>d>>>0|(f|0)==0)){gd(a+208+f|0,b|0,g|0)|0;oc(a+8|0,a+208|0,(c[j>>2]|0)>>>3);b=b+g|0;d=d-g|0;h=5}}else{oc(a+8|0,a+208|0,e>>>3);h=5}if((h|0)==5)c[a>>2]=0;if(!(b&7)){e=c[j>>2]|0;if(d>>>0>=e>>>0){f=a+8|0;do{oc(f,b,e>>>3);e=c[j>>2]|0;d=d-e|0;b=b+e|0}while(d>>>0>=e>>>0)}}else{e=c[j>>2]|0;if(d>>>0>=e>>>0){f=a+8|0;do{gd(i|0,b|0,e|0)|0;oc(f,i,e>>>3);e=c[j>>2]|0;d=d-e|0;b=b+e|0}while(d>>>0>=e>>>0)}}if(d|0){gd((c[a>>2]|0)+(a+208)|0,b|0,d|0)|0;c[a>>2]=(c[a>>2]|0)+d}l=k;return}function oc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;p=l;l=l+48|0;o=p;if((d|0)>0){e=0;do{k=b+(e<<3)|0;n=a+(e<<3)|0;j=n;m=c[j+4>>2]^c[k+4>>2];c[n>>2]=c[j>>2]^c[k>>2];c[n+4>>2]=m;e=e+1|0}while((e|0)!=(d|0))}i=a+8|0;j=o+8|0;k=o+16|0;m=o+24|0;n=o+32|0;h=0;do{e=0;do{r=a+(e<<3)|0;s=a+(e+5<<3)|0;q=a+(e+10<<3)|0;b=a+(e+15<<3)|0;d=a+(e+20<<3)|0;f=c[s+4>>2]^c[r+4>>2]^c[q+4>>2]^c[b+4>>2]^c[d+4>>2];g=o+(e<<3)|0;c[g>>2]=c[s>>2]^c[r>>2]^c[q>>2]^c[b>>2]^c[d>>2];c[g+4>>2]=f;e=e+1|0}while((e|0)!=5);b=0;do{g=o+((((b+4|0)>>>0)%5|0)<<3)|0;f=c[g>>2]|0;g=c[g+4>>2]|0;d=b;b=b+1|0;e=o+(((b|0)==5?0:b)<<3)|0;e=pc(c[e>>2]|0,c[e+4>>2]|0,1)|0;f=e^f;g=y^g;e=0;do{s=a+(e+d<<3)|0;q=s;r=g^c[q+4>>2];c[s>>2]=f^c[q>>2];c[s+4>>2]=r;e=e+5|0}while(e>>>0<25)}while((b|0)!=5);d=i;e=0;b=c[d>>2]|0;d=c[d+4>>2]|0;do{s=a+(c[29472+(e<<2)>>2]<<3)|0;g=s;q=b;b=c[g>>2]|0;r=d;d=c[g+4>>2]|0;r=pc(q,r,c[29568+(e<<2)>>2]|0)|0;c[s>>2]=r;c[s+4>>2]=y;e=e+1|0}while((e|0)!=24);e=o;c[e>>2]=b;c[e+4>>2]=d;e=0;b=0;while(1){d=o;f=a+(b*5<<3)|0;g=d+40|0;do{c[d>>2]=c[f>>2];d=d+4|0;f=f+4|0}while((d|0)<(g|0));d=j;g=c[d>>2]|0;d=c[d+4>>2]|0;t=k;r=c[t>>2]|0;t=c[t+4>>2]|0;q=a+(e<<3)|0;f=q;s=c[f+4>>2]^t&~d;c[q>>2]=c[f>>2]^r&~g;c[q+4>>2]=s;q=m;s=c[q>>2]|0;q=c[q+4>>2]|0;f=a+(e+1<<3)|0;u=f;t=c[u+4>>2]^q&~t;c[f>>2]=c[u>>2]^s&~r;c[f+4>>2]=t;f=n;t=c[f>>2]|0;f=c[f+4>>2]|0;r=a+(e+2<<3)|0;u=r;q=c[u+4>>2]^f&~q;c[r>>2]=c[u>>2]^t&~s;c[r+4>>2]=q;r=o;q=c[r>>2]|0;r=c[r+4>>2]|0;s=a+(e+3<<3)|0;u=s;f=c[u+4>>2]^r&~f;c[s>>2]=c[u>>2]^q&~t;c[s+4>>2]=f;s=a+(e+4<<3)|0;f=s;r=c[f+4>>2]^d&~r;c[s>>2]=c[f>>2]^g&~q;c[s+4>>2]=r;b=b+1|0;if((b|0)==5)break;else e=e+5|0}s=29216+(h<<3)|0;r=a;t=c[r+4>>2]^c[s+4>>2];u=a;c[u>>2]=c[r>>2]^c[s>>2];c[u+4>>2]=t;h=h+1|0}while((h|0)!=24);l=p;return}function pc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=dd(a|0,b|0,c|0)|0;e=y;c=cd(a|0,b|0,64-c|0)|0;y=y|e;return c|d|0}function qc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=c[b>>2]|0;h=b+4|0;if((e|0)==(c[h>>2]|0)){g=b+208|0;f=b+8|0;oc(f,g,e>>>3);c[b>>2]=0;e=1}else{f=b+8|0;g=b+208+e|0;e=e+1|0}c[b>>2]=e;a[g>>0]=d;d=c[b>>2]|0;hd(b+208+d|0,0,(c[h>>2]|0)-d|0)|0;d=(c[h>>2]|0)+-1+(b+208)|0;a[d>>0]=a[d>>0]|-128;oc(f,b+208|0,(c[h>>2]|0)>>>3);c[b>>2]=0;return}function rc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;j=l;l=l+208|0;i=j;h=a+4|0;k=c[h>>2]|0;e=c[a>>2]|0;f=k-e|0;if((k|0)!=(e|0)){if(!(f>>>0>d>>>0|(e|0)==0)){g=a+8|0;sc(i,g);gd(b|0,i+(c[a>>2]|0)|0,f|0)|0;oc(g,0,0);b=b+f|0;d=d-f|0;g=5}}else{oc(a+8|0,0,0);g=5}if((g|0)==5)c[a>>2]=0;if(d>>>0>(c[h>>2]|0)>>>0){e=a+8|0;do{sc(i,e);gd(b|0,i|0,c[h>>2]|0)|0;oc(e,0,0);k=c[h>>2]|0;d=d-k|0;b=b+k|0}while(d>>>0>k>>>0)}if(d|0){sc(i,a+8|0);gd(b|0,i+(c[a>>2]|0)|0,d|0)|0;c[a>>2]=(c[a>>2]|0)+d}l=j;return}function sc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=25;while(1){d=d+-1|0;g=b;f=c[g+4>>2]|0;e=a;c[e>>2]=c[g>>2];c[e+4>>2]=f;if(!d)break;else{b=b+8|0;a=a+8|0}}return}function tc(a,b,c){a=a|0;b=b|0;c=c|0;qc(a,6);rc(a,c,b>>>3);return}function uc(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;vc(a);e=0;do{h=wc(b+(e<<3)|0)|0;f=a+(e<<3)|0;i=f;g=c[i+4>>2]^y;c[f>>2]=c[i>>2]^h;c[f+4>>2]=g;e=e+1|0}while((e|0)!=8);c[a+228>>2]=d[b>>0];return 0}function vc(a){a=a|0;var b=0,d=0;hd(a+64|0,0,176)|0;b=29408;d=a+64|0;do{c[a>>2]=c[b>>2];a=a+4|0;b=b+4|0}while((a|0)<(d|0));return}function wc(a){a=a|0;var b=0,c=0,e=0,f=0,g=0,h=0,i=0;g=d[a>>0]|0;h=dd(d[a+1>>0]|0|0,0,8)|0;i=y;f=dd(d[a+2>>0]|0|0,0,16)|0;i=i|y;e=dd(d[a+3>>0]|0|0,0,24)|0;i=i|y|(d[a+4>>0]|0);c=dd(d[a+5>>0]|0|0,0,40)|0;i=i|y;b=dd(d[a+6>>0]|0|0,0,48)|0;i=i|y;a=dd(d[a+7>>0]|0|0,0,56)|0;y=i|y;return h|g|f|e|c|b|a|0}function xc(b,c){b=b|0;c=c|0;var d=0,e=0,f=0;f=l;l=l+64|0;e=f;if((c+-1|0)>>>0>63)c=-1;else{a[e>>0]=c;a[e+1>>0]=0;a[e+2>>0]=1;a[e+3>>0]=1;yc(e+4|0);yc(e+8|0);yc(e+12|0);c=e+16|0;d=c+48|0;do{a[c>>0]=0;c=c+1|0}while((c|0)<(d|0));uc(b,e)|0;c=0}l=f;return c|0}function yc(b){b=b|0;a[b>>0]=0;a[b+1>>0]=0;a[b+2>>0]=0;a[b+3>>0]=0;return}function zc(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;i=l;l=l+192|0;g=i+128|0;h=i;if((c+-1|0)>>>0<=63?!((d|0)==0|(e+-1|0)>>>0>63):0){a[g>>0]=c;a[g+1>>0]=e;a[g+2>>0]=1;a[g+3>>0]=1;yc(g+4|0);yc(g+8|0);yc(g+12|0);c=g+16|0;f=c+48|0;do{a[c>>0]=0;c=c+1|0}while((c|0)<(f|0));uc(b,g)|0;hd(h+e|0,0,128-e|0)|0;gd(h|0,d|0,e|0)|0;Ac(b,h,128)|0;Bc(h,128);c=0}else c=-1;l=i;return c|0}function Ac(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;if(d|0){j=a+224|0;f=c[j>>2]|0;e=128-f|0;if(e>>>0<d>>>0){c[j>>2]=0;gd(a+96+f|0,b|0,e|0)|0;Cc(a,128,0);Dc(a,a+96|0);i=b+e|0;e=d-e|0;if(e>>>0>128){d=f+d|0;g=d+-257&-128;h=g+256-f|0;f=d+-256|0;d=i;while(1){Cc(a,128,0);Dc(a,d);e=e+-128|0;if(e>>>0<=128)break;else d=d+128|0}e=f-g|0;b=b+h|0}else b=i}else e=d;gd((c[j>>2]|0)+(a+96)|0,b|0,e|0)|0;c[j>>2]=(c[j>>2]|0)+e}return 0}function Bc(a,b){a=a|0;b=b|0;$[c[7416]&1](a,0,b)|0;return}function Cc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;g=a+64|0;e=g;e=ed(c[e>>2]|0,c[e+4>>2]|0,b|0,d|0)|0;f=y;c[g>>2]=e;c[g+4>>2]=f;a=a+72|0;g=a;b=ed(c[g>>2]|0,c[g+4>>2]|0,(f>>>0<d>>>0|(f|0)==(d|0)&e>>>0<b>>>0)&1|0,0)|0;d=a;c[d>>2]=b;c[d+4>>2]=y;return}function Dc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0;h=l;l=l+256|0;f=h+128|0;g=h;d=0;do{i=wc(b+(d<<3)|0)|0;e=f+(d<<3)|0;c[e>>2]=i;c[e+4>>2]=y;d=d+1|0}while((d|0)!=16);d=g;b=a;e=d+64|0;do{c[d>>2]=c[b>>2];d=d+4|0;b=b+4|0}while((d|0)<(e|0));C=g+64|0;m=g+72|0;ga=g+80|0;S=g+88|0;W=S;c[W>>2]=1595750129;c[W+4>>2]=-1521486534;W=a+64|0;U=c[W>>2]^-1377402159;W=c[W+4>>2]^1359893119;V=g+96|0;G=a+72|0;E=c[G>>2]^725511199;G=c[G+4>>2]^-1694144372;F=g+104|0;p=a+80|0;o=c[p>>2]^-79577749;p=c[p+4>>2]^528734635;ha=a+88|0;ia=c[ha>>2]^327033209;ha=c[ha+4>>2]^1541459225;ja=g+120|0;la=g;e=g+32|0;Ea=e;j=c[Ea>>2]|0;Ea=c[Ea+4>>2]|0;la=ed(j|0,Ea|0,c[la>>2]|0,c[la+4>>2]|0)|0;_=f;Z=c[_>>2]|0;_=c[_+4>>2]|0;la=ed(la|0,y|0,Z|0,_|0)|0;aa=y;W=Ec(la^U,aa^W,32)|0;U=y;z=ed(W|0,U|0,-205731576,1779033703)|0;B=y;Ea=Ec(z^j,B^Ea,24)|0;j=y;aa=ed(Ea|0,j|0,la|0,aa|0)|0;la=f+8|0;ka=c[la>>2]|0;la=c[la+4>>2]|0;aa=ed(aa|0,y|0,ka|0,la|0)|0;ua=y;U=Ec(aa^W,ua^U,16)|0;W=y;Y=V;c[Y>>2]=U;c[Y+4>>2]=W;B=ed(U|0,W|0,z|0,B|0)|0;z=y;Y=C;c[Y>>2]=B;c[Y+4>>2]=z;j=Ec(B^Ea,z^j,63)|0;Ea=y;Y=e;c[Y>>2]=j;c[Y+4>>2]=Ea;Y=g+8|0;q=Y;ba=g+40|0;ea=ba;ca=c[ea>>2]|0;ea=c[ea+4>>2]|0;q=ed(ca|0,ea|0,c[q>>2]|0,c[q+4>>2]|0)|0;X=f+16|0;T=c[X>>2]|0;X=c[X+4>>2]|0;q=ed(q|0,y|0,T|0,X|0)|0;na=y;G=Ec(q^E,na^G,32)|0;E=y;d=ed(G|0,E|0,-2067093701,-1150833019)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;na=ed(ea|0,ca|0,q|0,na|0)|0;q=f+24|0;n=c[q>>2]|0;q=c[q+4>>2]|0;na=ed(na|0,y|0,n|0,q|0)|0;K=y;E=Ec(na^G,K^E,16)|0;G=y;I=F;c[I>>2]=E;c[I+4>>2]=G;k=ed(E|0,G|0,d|0,k|0)|0;d=y;I=m;c[I>>2]=k;c[I+4>>2]=d;ca=Ec(k^ea,d^ca,63)|0;ea=y;I=g+16|0;u=I;N=g+48|0;Q=N;O=c[Q>>2]|0;Q=c[Q+4>>2]|0;u=ed(O|0,Q|0,c[u>>2]|0,c[u+4>>2]|0)|0;ya=f+32|0;za=c[ya>>2]|0;ya=c[ya+4>>2]|0;u=ed(u|0,y|0,za|0,ya|0)|0;b=y;p=Ec(u^o,b^p,32)|0;o=y;da=ed(p|0,o|0,-23791573,1013904242)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;b=ed(Q|0,O|0,u|0,b|0)|0;u=f+40|0;v=c[u>>2]|0;u=c[u+4>>2]|0;b=ed(b|0,y|0,v|0,u|0)|0;qa=y;o=Ec(b^p,qa^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;r=g+24|0;H=r;w=g+56|0;A=w;x=c[A>>2]|0;A=c[A+4>>2]|0;H=ed(x|0,A|0,c[H>>2]|0,c[H+4>>2]|0)|0;s=f+48|0;t=c[s>>2]|0;s=c[s+4>>2]|0;H=ed(H|0,y|0,t|0,s|0)|0;Ba=y;ha=Ec(H^ia,Ba^ha,32)|0;ia=y;P=ed(ha|0,ia|0,1595750129,-1521486534)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;Ba=ed(A|0,x|0,H|0,Ba|0)|0;H=f+56|0;D=c[H>>2]|0;H=c[H+4>>2]|0;Ba=ed(Ba|0,y|0,D|0,H|0)|0;M=y;ia=Ec(Ba^ha,M^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;ua=ed(ca|0,ea|0,aa|0,ua|0)|0;aa=f+64|0;$=c[aa>>2]|0;aa=c[aa+4>>2]|0;ua=ed(ua|0,y|0,$|0,aa|0)|0;Da=y;ha=Ec(ua^ia,Da^ha,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(ea|0,ca|0,ua|0,Da|0)|0;ua=f+72|0;va=c[ua>>2]|0;ua=c[ua+4>>2]|0;Da=ed(Da|0,y|0,va|0,ua|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;ma=ja;c[ma>>2]=ia;c[ma+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ma=ga;c[ma>>2]=fa;c[ma+4>>2]=da;ca=Ec(fa^ea,da^ca,63)|0;ea=y;K=ed(O|0,Q|0,na|0,K|0)|0;na=f+80|0;ma=c[na>>2]|0;na=c[na+4>>2]|0;K=ed(K|0,y|0,ma|0,na|0)|0;wa=y;W=Ec(K^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(Q|0,O|0,K|0,wa|0)|0;K=f+88|0;J=c[K>>2]|0;K=c[K+4>>2]|0;wa=ed(wa|0,y|0,J|0,K|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;qa=ed(x|0,A|0,b|0,qa|0)|0;b=f+96|0;i=c[b>>2]|0;b=c[b+4>>2]|0;qa=ed(qa|0,y|0,i|0,b|0)|0;sa=y;G=Ec(qa^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(A|0,x|0,qa|0,sa|0)|0;qa=f+104|0;ra=c[qa>>2]|0;qa=c[qa+4>>2]|0;sa=ed(sa|0,y|0,ra|0,qa|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;M=ed(Ba|0,M|0,j|0,Ea|0)|0;Ba=f+112|0;Aa=c[Ba>>2]|0;Ba=c[Ba+4>>2]|0;M=ed(M|0,y|0,Aa|0,Ba|0)|0;oa=y;p=Ec(M^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;Ea=Ec(d^j,k^Ea,24)|0;j=y;oa=ed(Ea|0,j|0,M|0,oa|0)|0;M=f+120|0;L=c[M>>2]|0;M=c[M+4>>2]|0;oa=ed(oa|0,y|0,L|0,M|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^Ea,d^j,63)|0;j=y;Ca=ed(Aa|0,Ba|0,Da|0,Ca|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,ma|0,na|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,za|0,ya|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,$|0,aa|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,va|0,ua|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(L|0,M|0,ta|0,sa|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,ra|0,qa|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,t|0,s|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,ka|0,la|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,i|0,b|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,Z|0,_|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,T|0,X|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,J|0,K|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,D|0,H|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,v|0,u|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,n|0,q|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ca=ed(Da|0,Ca|0,J|0,K|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,$|0,aa|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,i|0,b|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,Z|0,_|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,v|0,u|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(ta|0,sa|0,T|0,X|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,L|0,M|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,ra|0,qa|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,ma|0,na|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,Aa|0,Ba|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,n|0,q|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,t|0,s|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,D|0,H|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,ka|0,la|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,va|0,ua|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,za|0,ya|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ca=ed(Da|0,Ca|0,D|0,H|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,va|0,ua|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,n|0,q|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,ka|0,la|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,ra|0,qa|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(ta|0,sa|0,i|0,b|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,J|0,K|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,Aa|0,Ba|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,T|0,X|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,t|0,s|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,v|0,u|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,ma|0,na|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,za|0,ya|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,Z|0,_|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,L|0,M|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,$|0,aa|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ca=ed(Da|0,Ca|0,va|0,ua|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,Z|0,_|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,v|0,u|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,D|0,H|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,T|0,X|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(ta|0,sa|0,za|0,ya|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,ma|0,na|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,L|0,M|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,Aa|0,Ba|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,ka|0,la|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,J|0,K|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,i|0,b|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,t|0,s|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,$|0,aa|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,n|0,q|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,ra|0,qa|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ca=ed(Da|0,Ca|0,T|0,X|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,i|0,b|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,t|0,s|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,ma|0,na|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,Z|0,_|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(ta|0,sa|0,J|0,K|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,$|0,aa|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,n|0,q|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,za|0,ya|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,ra|0,qa|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,D|0,H|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,v|0,u|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,L|0,M|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,Aa|0,Ba|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,ka|0,la|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,va|0,ua|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ca=ed(Da|0,Ca|0,i|0,b|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,v|0,u|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,ka|0,la|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,L|0,M|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,Aa|0,Ba|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(ta|0,sa|0,ra|0,qa|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,za|0,ya|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,ma|0,na|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,Z|0,_|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,D|0,H|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,t|0,s|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,n|0,q|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,va|0,ua|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,T|0,X|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,$|0,aa|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,J|0,K|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ca=ed(Da|0,Ca|0,ra|0,qa|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,J|0,K|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,D|0,H|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,Aa|0,Ba|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,i|0,b|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(ta|0,sa|0,ka|0,la|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,n|0,q|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,va|0,ua|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,v|0,u|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,Z|0,_|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,L|0,M|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,za|0,ya|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,$|0,aa|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,t|0,s|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,T|0,X|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,ma|0,na|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ca=ed(Da|0,Ca|0,t|0,s|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,L|0,M|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,Aa|0,Ba|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,va|0,ua|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,J|0,K|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(ta|0,sa|0,n|0,q|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,Z|0,_|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,$|0,aa|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,i|0,b|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,T|0,X|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,ra|0,qa|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,D|0,H|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,ka|0,la|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,za|0,ya|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,ma|0,na|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,v|0,u|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ca=ed(Da|0,Ca|0,ma|0,na|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,T|0,X|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,$|0,aa|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,za|0,ya|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,D|0,H|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(ta|0,sa|0,t|0,s|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,ka|0,la|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,v|0,u|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,L|0,M|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,J|0,K|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,va|0,ua|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,Aa|0,Ba|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,n|0,q|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,i|0,b|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,ra|0,qa|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,Z|0,_|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ca=ed(Da|0,Ca|0,Z|0,_|0)|0;Ca=ed(Ca|0,y|0,f|0,j|0)|0;Da=y;W=Ec(Ca^U,Da^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;Da=ed(Ca|0,Da|0,ka|0,la|0)|0;Da=ed(Da|0,y|0,j|0,f|0)|0;Ca=y;U=Ec(Da^W,Ca^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Ea=e;c[Ea>>2]=f;c[Ea+4>>2]=j;Ea=ed(ca|0,ea|0,T|0,X|0)|0;xa=ed(Ea|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;wa=ed(xa|0,wa|0,n|0,q|0)|0;wa=ed(wa|0,y|0,ea|0,ca|0)|0;xa=y;E=Ec(wa^G,xa^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;Ea=ed(O|0,Q|0,za|0,ya|0)|0;ta=ed(Ea|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;sa=ed(ta|0,sa|0,v|0,u|0)|0;sa=ed(sa|0,y|0,Q|0,O|0)|0;ta=y;o=Ec(sa^p,ta^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;Ea=ed(x|0,A|0,t|0,s|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;oa=ed(pa|0,oa|0,D|0,H|0)|0;oa=ed(oa|0,y|0,A|0,x|0)|0;pa=y;ia=Ec(oa^ha,pa^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;Ca=ed(Da|0,Ca|0,$|0,aa|0)|0;Ca=ed(Ca|0,y|0,ca|0,ea|0)|0;Da=y;ha=Ec(ia^Ca,ha^Da,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;Da=ed(Ca|0,Da|0,va|0,ua|0)|0;Da=ed(Da|0,y|0,ea|0,ca|0)|0;Ca=y;ia=Ec(Da^ha,Ca^ia,16)|0;ha=y;Ea=ja;c[Ea>>2]=ia;c[Ea+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;ca=Ec(fa^ea,da^ca,63)|0;ea=y;xa=ed(wa|0,xa|0,ma|0,na|0)|0;xa=ed(xa|0,y|0,O|0,Q|0)|0;wa=y;W=Ec(xa^U,wa^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;wa=ed(xa|0,wa|0,J|0,K|0)|0;wa=ed(wa|0,y|0,Q|0,O|0)|0;xa=y;U=Ec(wa^W,xa^U,16)|0;W=y;R=ed(U|0,W|0,P|0,R|0)|0;P=y;O=Ec(R^Q,P^O,63)|0;Q=y;ta=ed(sa|0,ta|0,i|0,b|0)|0;ta=ed(ta|0,y|0,x|0,A|0)|0;sa=y;G=Ec(ta^E,sa^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;sa=ed(ta|0,sa|0,ra|0,qa|0)|0;sa=ed(sa|0,y|0,A|0,x|0)|0;ta=y;E=Ec(sa^G,ta^E,16)|0;G=y;B=ed(E|0,G|0,z|0,B|0)|0;z=y;x=Ec(B^A,z^x,63)|0;A=y;Ea=ed(f|0,j|0,Aa|0,Ba|0)|0;pa=ed(Ea|0,y|0,oa|0,pa|0)|0;oa=y;p=Ec(pa^o,oa^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;oa=ed(pa|0,oa|0,L|0,M|0)|0;oa=ed(oa|0,y|0,j|0,f|0)|0;pa=y;o=Ec(oa^p,pa^o,16)|0;p=y;k=ed(o|0,p|0,d|0,k|0)|0;d=y;f=Ec(k^j,d^f,63)|0;j=y;Ba=ed(Da|0,Ca|0,Aa|0,Ba|0)|0;Ba=ed(Ba|0,y|0,f|0,j|0)|0;Aa=y;W=Ec(Ba^U,Aa^W,32)|0;U=y;z=ed(W|0,U|0,B|0,z|0)|0;B=y;j=Ec(z^f,B^j,24)|0;f=y;na=ed(Ba|0,Aa|0,ma|0,na|0)|0;na=ed(na|0,y|0,j|0,f|0)|0;ma=y;U=Ec(na^W,ma^U,16)|0;W=y;B=ed(U|0,W|0,z|0,B|0)|0;z=y;f=Ec(B^j,z^f,63)|0;j=y;Aa=e;c[Aa>>2]=f;c[Aa+4>>2]=j;ya=ed(ca|0,ea|0,za|0,ya|0)|0;xa=ed(ya|0,y|0,wa|0,xa|0)|0;wa=y;G=Ec(E^xa,G^wa,32)|0;E=y;d=ed(G|0,E|0,k|0,d|0)|0;k=y;ea=Ec(d^ca,k^ea,24)|0;ca=y;aa=ed(xa|0,wa|0,$|0,aa|0)|0;aa=ed(aa|0,y|0,ea|0,ca|0)|0;$=y;E=Ec(aa^G,$^E,16)|0;G=y;k=ed(E|0,G|0,d|0,k|0)|0;d=y;ca=Ec(k^ea,d^ca,63)|0;ea=y;ua=ed(O|0,Q|0,va|0,ua|0)|0;ta=ed(ua|0,y|0,sa|0,ta|0)|0;sa=y;p=Ec(o^ta,p^sa,32)|0;o=y;da=ed(p|0,o|0,fa|0,da|0)|0;fa=y;Q=Ec(da^O,fa^Q,24)|0;O=y;M=ed(ta|0,sa|0,L|0,M|0)|0;M=ed(M|0,y|0,Q|0,O|0)|0;L=y;o=Ec(M^p,L^o,16)|0;p=y;fa=ed(o|0,p|0,da|0,fa|0)|0;da=y;O=Ec(fa^Q,da^O,63)|0;Q=y;qa=ed(x|0,A|0,ra|0,qa|0)|0;pa=ed(qa|0,y|0,oa|0,pa|0)|0;oa=y;ha=Ec(pa^ia,oa^ha,32)|0;ia=y;P=ed(ha|0,ia|0,R|0,P|0)|0;R=y;A=Ec(P^x,R^A,24)|0;x=y;s=ed(pa|0,oa|0,t|0,s|0)|0;s=ed(s|0,y|0,A|0,x|0)|0;t=y;ia=Ec(s^ha,t^ia,16)|0;ha=y;R=ed(ia|0,ha|0,P|0,R|0)|0;P=y;x=Ec(R^A,P^x,63)|0;A=y;la=ed(na|0,ma|0,ka|0,la|0)|0;la=ed(la|0,y|0,ca|0,ea|0)|0;ka=y;ha=Ec(ia^la,ha^ka,32)|0;ia=y;da=ed(ha|0,ia|0,fa|0,da|0)|0;fa=y;ea=Ec(da^ca,fa^ea,24)|0;ca=y;b=ed(la|0,ka|0,i|0,b|0)|0;b=ed(b|0,y|0,ea|0,ca|0)|0;i=y;ka=g;c[ka>>2]=b;c[ka+4>>2]=i;ia=Ec(b^ha,i^ia,16)|0;ha=y;c[ja>>2]=ia;c[ja+4>>2]=ha;fa=ed(ia|0,ha|0,da|0,fa|0)|0;da=y;c[ga>>2]=fa;c[ga+4>>2]=da;ca=Ec(fa^ea,da^ca,63)|0;c[ba>>2]=ca;c[ba+4>>2]=y;_=ed(aa|0,$|0,Z|0,_|0)|0;_=ed(_|0,y|0,O|0,Q|0)|0;Z=y;W=Ec(_^U,Z^W,32)|0;U=y;P=ed(W|0,U|0,R|0,P|0)|0;R=y;Q=Ec(P^O,R^Q,24)|0;O=y;X=ed(_|0,Z|0,T|0,X|0)|0;X=ed(X|0,y|0,Q|0,O|0)|0;T=y;c[Y>>2]=X;c[Y+4>>2]=T;U=Ec(X^W,T^U,16)|0;T=y;c[V>>2]=U;c[V+4>>2]=T;R=ed(U|0,T|0,P|0,R|0)|0;P=y;c[S>>2]=R;c[S+4>>2]=P;O=Ec(R^Q,P^O,63)|0;c[N>>2]=O;c[N+4>>2]=y;K=ed(M|0,L|0,J|0,K|0)|0;K=ed(K|0,y|0,x|0,A|0)|0;J=y;G=Ec(K^E,J^G,32)|0;E=y;z=ed(G|0,E|0,B|0,z|0)|0;B=y;A=Ec(z^x,B^A,24)|0;x=y;H=ed(K|0,J|0,D|0,H|0)|0;H=ed(H|0,y|0,A|0,x|0)|0;D=y;c[I>>2]=H;c[I+4>>2]=D;E=Ec(H^G,D^E,16)|0;D=y;c[F>>2]=E;c[F+4>>2]=D;B=ed(E|0,D|0,z|0,B|0)|0;z=y;c[C>>2]=B;c[C+4>>2]=z;x=Ec(B^A,z^x,63)|0;c[w>>2]=x;c[w+4>>2]=y;u=ed(f|0,j|0,v|0,u|0)|0;t=ed(u|0,y|0,s|0,t|0)|0;s=y;p=Ec(t^o,s^p,32)|0;o=y;d=ed(p|0,o|0,k|0,d|0)|0;k=y;j=Ec(d^f,k^j,24)|0;f=y;q=ed(t|0,s|0,n|0,q|0)|0;q=ed(q|0,y|0,j|0,f|0)|0;n=y;c[r>>2]=q;c[r+4>>2]=n;o=Ec(q^p,n^o,16)|0;n=y;p=g+112|0;c[p>>2]=o;c[p+4>>2]=n;k=ed(o|0,n|0,d|0,k|0)|0;d=y;c[m>>2]=k;c[m+4>>2]=d;f=Ec(k^j,d^f,63)|0;c[e>>2]=f;c[e+4>>2]=y;e=a;f=g+64|0;i=i^c[e+4>>2]^c[f+4>>2];d=a;c[d>>2]=b^c[e>>2]^c[f>>2];c[d+4>>2]=i;d=1;do{Aa=g+(d<<3)|0;Ea=a+(d<<3)|0;Ba=Ea;Ca=g+(d+8<<3)|0;Da=c[Aa+4>>2]^c[Ba+4>>2]^c[Ca+4>>2];c[Ea>>2]=c[Aa>>2]^c[Ba>>2]^c[Ca>>2];c[Ea+4>>2]=Da;d=d+1|0}while((d|0)!=8);l=h;return}function Ec(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=cd(a|0,b|0,c|0)|0;e=y;c=dd(a|0,b|0,64-c|0)|0;y=y|e;return c|d|0}function Fc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;j=l;l=l+64|0;h=j;f=h;g=f+64|0;do{a[f>>0]=0;f=f+1|0}while((f|0)<(g|0));if(((d|0)!=0?(i=b+228|0,(c[i>>2]|0)>>>0<=e>>>0):0)?(Gc(b)|0)==0:0){e=b+224|0;Cc(b,c[e>>2]|0,0);Hc(b);e=c[e>>2]|0;hd(b+96+e|0,0,128-e|0)|0;Dc(b,b+96|0);e=0;do{g=b+(e<<3)|0;Ic(h+(e<<3)|0,c[g>>2]|0,c[g+4>>2]|0);e=e+1|0}while((e|0)!=8);gd(d|0,h|0,c[i>>2]|0)|0;Bc(h,64);e=0}else e=-1;l=j;return e|0}function Gc(a){a=a|0;a=a+80|0;return ((c[a>>2]|0)!=0|(c[a+4>>2]|0)!=0)&1|0}function Hc(b){b=b|0;if(a[b+232>>0]|0)Jc(b);b=b+80|0;c[b>>2]=-1;c[b+4>>2]=-1;return}function Ic(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;a[b>>0]=c;e=cd(c|0,d|0,8)|0;a[b+1>>0]=e;e=cd(c|0,d|0,16)|0;a[b+2>>0]=e;e=cd(c|0,d|0,24)|0;a[b+3>>0]=e;a[b+4>>0]=d;e=cd(c|0,d|0,40)|0;a[b+5>>0]=e;e=cd(c|0,d|0,48)|0;a[b+6>>0]=e;d=cd(c|0,d|0,56)|0;a[b+7>>0]=d;return}function Jc(a){a=a|0;a=a+88|0;c[a>>2]=-1;c[a+4>>2]=-1;return}
function Kc(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;i=l;l=l+240|0;h=i;do if(!((a|0)==0|(c|0)==0&(d|0)!=0)?(g=(f|0)!=0,!(f>>>0>64|((b+-1|0)>>>0>63|(e|0)==0&g))):0){if(g){if((zc(h,b,e,f)|0)<0){a=-1;break}}else if((xc(h,b)|0)<0){a=-1;break}Ac(h,c,d)|0;Fc(h,a,b)|0;a=0}else a=-1;while(0);l=i;return a|0}function Lc(b,e,f){b=b|0;e=e|0;f=f|0;c[b+16>>2]=d[e+1>>0]<<8|d[e>>0]|d[e+2>>0]<<16|d[e+3>>0]<<24;c[b+20>>2]=d[e+5>>0]<<8|d[e+4>>0]|d[e+6>>0]<<16|d[e+7>>0]<<24;c[b+24>>2]=d[e+9>>0]<<8|d[e+8>>0]|d[e+10>>0]<<16|d[e+11>>0]<<24;c[b+28>>2]=d[e+13>>0]<<8|d[e+12>>0]|d[e+14>>0]<<16|d[e+15>>0]<<24;f=(f|0)==256;e=f?e+16|0:e;f=f?29964:29980;c[b+32>>2]=d[e+1>>0]<<8|d[e>>0]|d[e+2>>0]<<16|d[e+3>>0]<<24;c[b+36>>2]=d[e+5>>0]<<8|d[e+4>>0]|d[e+6>>0]<<16|d[e+7>>0]<<24;c[b+40>>2]=d[e+9>>0]<<8|d[e+8>>0]|d[e+10>>0]<<16|d[e+11>>0]<<24;c[b+44>>2]=d[e+13>>0]<<8|d[e+12>>0]|d[e+14>>0]<<16|d[e+15>>0]<<24;c[b>>2]=a[f+1>>0]<<8|a[f>>0]|a[f+2>>0]<<16|d[f+3>>0]<<24;c[b+4>>2]=a[f+5>>0]<<8|a[f+4>>0]|a[f+6>>0]<<16|d[f+7>>0]<<24;c[b+8>>2]=a[f+9>>0]<<8|a[f+8>>0]|a[f+10>>0]<<16|d[f+11>>0]<<24;c[b+12>>2]=a[f+13>>0]<<8|a[f+12>>0]|a[f+14>>0]<<16|d[f+15>>0]<<24;return}function Mc(a,b,e){a=a|0;b=b|0;e=e|0;if(!e)e=0;else e=(d[e+1>>0]|0)<<8|(d[e>>0]|0)|(d[e+2>>0]|0)<<16|(d[e+3>>0]|0)<<24;c[a+48>>2]=e;c[a+52>>2]=(d[b+1>>0]|0)<<8|(d[b>>0]|0)|(d[b+2>>0]|0)<<16|(d[b+3>>0]|0)<<24;c[a+56>>2]=(d[b+5>>0]|0)<<8|(d[b+4>>0]|0)|(d[b+6>>0]|0)<<16|(d[b+7>>0]|0)<<24;c[a+60>>2]=(d[b+9>>0]|0)<<8|(d[b+8>>0]|0)|(d[b+10>>0]|0)<<16|(d[b+11>>0]|0)<<24;return}function Nc(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0;T=l;l=l+64|0;Q=T;if(g|0){R=c[b>>2]|0;S=c[b+4>>2]|0;D=c[b+8>>2]|0;E=c[b+12>>2]|0;F=c[b+16>>2]|0;G=c[b+20>>2]|0;H=c[b+24>>2]|0;I=c[b+28>>2]|0;J=c[b+32>>2]|0;K=c[b+36>>2]|0;L=c[b+40>>2]|0;M=c[b+44>>2]|0;N=b+48|0;O=b+52|0;P=c[b+56>>2]|0;C=c[b+60>>2]|0;i=0;b=c[O>>2]|0;h=c[N>>2]|0;while(1){B=g>>>0<64;if(B){gd(Q|0,e|0,g|0)|0;i=f;e=Q;f=Q}j=R;k=S;m=D;n=E;o=F;p=G;q=H;r=I;s=J;t=K;u=L;v=C;w=P;x=b;y=h;z=M;A=20;do{ha=j+o|0;ca=ha^y;ca=ca<<16|ca>>>16;Z=ca+s|0;U=Z^o;U=U<<12|U>>>20;ha=U+ha|0;ca=ha^ca;ca=ca<<8|ca>>>24;Z=ca+Z|0;U=Z^U;U=U<<7|U>>>25;da=k+p|0;_=da^x;_=_<<16|_>>>16;V=_+t|0;ea=V^p;ea=ea<<12|ea>>>20;da=ea+da|0;_=da^_;_=_<<8|_>>>24;V=_+V|0;ea=V^ea;ea=ea<<7|ea>>>25;$=m+q|0;W=$^w;W=W<<16|W>>>16;fa=W+u|0;aa=fa^q;aa=aa<<12|aa>>>20;$=aa+$|0;W=$^W;W=W<<8|W>>>24;fa=W+fa|0;aa=fa^aa;aa=aa<<7|aa>>>25;X=n+r|0;ga=X^v;ga=ga<<16|ga>>>16;ba=ga+z|0;Y=ba^r;Y=Y<<12|Y>>>20;X=Y+X|0;ga=X^ga;ga=ga<<8|ga>>>24;ba=ga+ba|0;Y=ba^Y;Y=Y<<7|Y>>>25;ha=ea+ha|0;ga=ha^ga;ga=ga<<16|ga>>>16;fa=ga+fa|0;ea=fa^ea;ea=ea<<12|ea>>>20;j=ea+ha|0;ga=j^ga;v=ga<<8|ga>>>24;u=v+fa|0;ea=u^ea;p=ea<<7|ea>>>25;da=aa+da|0;ca=da^ca;ca=ca<<16|ca>>>16;ba=ca+ba|0;aa=ba^aa;aa=aa<<12|aa>>>20;k=aa+da|0;ca=k^ca;y=ca<<8|ca>>>24;z=y+ba|0;aa=z^aa;q=aa<<7|aa>>>25;$=Y+$|0;_=$^_;_=_<<16|_>>>16;Z=_+Z|0;Y=Z^Y;Y=Y<<12|Y>>>20;m=Y+$|0;_=m^_;x=_<<8|_>>>24;s=x+Z|0;Y=s^Y;r=Y<<7|Y>>>25;X=U+X|0;W=X^W;W=W<<16|W>>>16;V=W+V|0;U=V^U;U=U<<12|U>>>20;n=U+X|0;W=n^W;w=W<<8|W>>>24;t=w+V|0;U=t^U;o=U<<7|U>>>25;A=A+-2|0}while((A|0)!=0);U=((d[e+1>>0]|0)<<8|(d[e>>0]|0)|(d[e+2>>0]|0)<<16|(d[e+3>>0]|0)<<24)^j+R;V=((d[e+5>>0]|0)<<8|(d[e+4>>0]|0)|(d[e+6>>0]|0)<<16|(d[e+7>>0]|0)<<24)^k+S;W=((d[e+9>>0]|0)<<8|(d[e+8>>0]|0)|(d[e+10>>0]|0)<<16|(d[e+11>>0]|0)<<24)^m+D;X=((d[e+13>>0]|0)<<8|(d[e+12>>0]|0)|(d[e+14>>0]|0)<<16|(d[e+15>>0]|0)<<24)^n+E;Y=((d[e+17>>0]|0)<<8|(d[e+16>>0]|0)|(d[e+18>>0]|0)<<16|(d[e+19>>0]|0)<<24)^o+F;Z=((d[e+21>>0]|0)<<8|(d[e+20>>0]|0)|(d[e+22>>0]|0)<<16|(d[e+23>>0]|0)<<24)^p+G;_=((d[e+25>>0]|0)<<8|(d[e+24>>0]|0)|(d[e+26>>0]|0)<<16|(d[e+27>>0]|0)<<24)^q+H;$=((d[e+29>>0]|0)<<8|(d[e+28>>0]|0)|(d[e+30>>0]|0)<<16|(d[e+31>>0]|0)<<24)^r+I;aa=((d[e+33>>0]|0)<<8|(d[e+32>>0]|0)|(d[e+34>>0]|0)<<16|(d[e+35>>0]|0)<<24)^s+J;ba=((d[e+37>>0]|0)<<8|(d[e+36>>0]|0)|(d[e+38>>0]|0)<<16|(d[e+39>>0]|0)<<24)^t+K;ca=((d[e+41>>0]|0)<<8|(d[e+40>>0]|0)|(d[e+42>>0]|0)<<16|(d[e+43>>0]|0)<<24)^u+L;da=((d[e+45>>0]|0)<<8|(d[e+44>>0]|0)|(d[e+46>>0]|0)<<16|(d[e+47>>0]|0)<<24)^z+M;ea=((d[e+49>>0]|0)<<8|(d[e+48>>0]|0)|(d[e+50>>0]|0)<<16|(d[e+51>>0]|0)<<24)^y+h;fa=((d[e+53>>0]|0)<<8|(d[e+52>>0]|0)|(d[e+54>>0]|0)<<16|(d[e+55>>0]|0)<<24)^x+b;ga=((d[e+57>>0]|0)<<8|(d[e+56>>0]|0)|(d[e+58>>0]|0)<<16|(d[e+59>>0]|0)<<24)^w+P;ha=((d[e+61>>0]|0)<<8|(d[e+60>>0]|0)|(d[e+62>>0]|0)<<16|(d[e+63>>0]|0)<<24)^v+C;h=h+1|0;b=b+((h|0)==0&1)|0;a[f>>0]=U;a[f+1>>0]=U>>>8;a[f+2>>0]=U>>>16;a[f+3>>0]=U>>>24;a[f+4>>0]=V;a[f+5>>0]=V>>>8;a[f+6>>0]=V>>>16;a[f+7>>0]=V>>>24;a[f+8>>0]=W;a[f+9>>0]=W>>>8;a[f+10>>0]=W>>>16;a[f+11>>0]=W>>>24;a[f+12>>0]=X;a[f+13>>0]=X>>>8;a[f+14>>0]=X>>>16;a[f+15>>0]=X>>>24;a[f+16>>0]=Y;a[f+17>>0]=Y>>>8;a[f+18>>0]=Y>>>16;a[f+19>>0]=Y>>>24;a[f+20>>0]=Z;a[f+21>>0]=Z>>>8;a[f+22>>0]=Z>>>16;a[f+23>>0]=Z>>>24;a[f+24>>0]=_;a[f+25>>0]=_>>>8;a[f+26>>0]=_>>>16;a[f+27>>0]=_>>>24;a[f+28>>0]=$;a[f+29>>0]=$>>>8;a[f+30>>0]=$>>>16;a[f+31>>0]=$>>>24;a[f+32>>0]=aa;a[f+33>>0]=aa>>>8;a[f+34>>0]=aa>>>16;a[f+35>>0]=aa>>>24;a[f+36>>0]=ba;a[f+37>>0]=ba>>>8;a[f+38>>0]=ba>>>16;a[f+39>>0]=ba>>>24;a[f+40>>0]=ca;a[f+41>>0]=ca>>>8;a[f+42>>0]=ca>>>16;a[f+43>>0]=ca>>>24;a[f+44>>0]=da;a[f+45>>0]=da>>>8;a[f+46>>0]=da>>>16;a[f+47>>0]=da>>>24;a[f+48>>0]=ea;a[f+49>>0]=ea>>>8;a[f+50>>0]=ea>>>16;a[f+51>>0]=ea>>>24;a[f+52>>0]=fa;a[f+53>>0]=fa>>>8;a[f+54>>0]=fa>>>16;a[f+55>>0]=fa>>>24;a[f+56>>0]=ga;a[f+57>>0]=ga>>>8;a[f+58>>0]=ga>>>16;a[f+59>>0]=ga>>>24;a[f+60>>0]=ha;a[f+61>>0]=ha>>>8;a[f+62>>0]=ha>>>16;a[f+63>>0]=ha>>>24;if(g>>>0<65)break;e=e+64|0;f=f+64|0;g=g+-64|0}if(B)gd(i|0,f|0,g|0)|0;c[N>>2]=h;c[O>>2]=b}l=T;return}function Oc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;switch(d|0){case 128:case 256:{e=a;f=e+64|0;do{c[e>>2]=0;e=e+4|0}while((e|0)<(f|0));Lc(a,b,d);return 0}default:X(29996,30029,102,30066)}return 0}function Pc(b,c,d,e,f,g,h,i,j,k){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var m=0,n=0,o=0,p=0,q=0;q=l;l=l+80|0;o=q+16|0;p=q;m=o;n=m+64|0;do{a[m>>0]=0;m=m+1|0}while((m|0)<(n|0));Mc(b,c,0);Nc(b,o,o,64);m=(j|0)!=0;if(m&(k|0)==0?(Qc(o,d,e,f,g,p),(Rc(p,i,j)|0)!=0):0)m=-1;else{Mc(b,c,30082);Nc(b,f,h,g);if(m&(k|0)!=0){Qc(o,d,e,h,g,p);gd(i|0,p|0,j|0)|0;m=0}else m=0}l=q;return m|0}function Qc(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,m=0,n=0;n=l;l=l+112|0;j=n+8|0;k=n;m=n+88|0;Sc(j,b);b=m;i=b+16|0;do{a[b>>0]=0;b=b+1|0}while((b|0)<(i|0));Xc(j,d,e);b=(e|0)%16|0;if(b|0)Xc(j,m,16-b|0);Xc(j,f,g);b=(g|0)%16|0;if(b|0)Xc(j,m,16-b|0);m=k;c[m>>2]=e;c[m+4>>2]=((e|0)<0)<<31>>31;Xc(j,k,8);m=k;c[m>>2]=g;c[m+4>>2]=((g|0)<0)<<31>>31;Xc(j,k,8);Uc(j,h);l=n;return}function Rc(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;if((d|0)>0){e=0;f=0;while(1){e=a[c>>0]^a[b>>0]|e;f=f+1|0;if((f|0)==(d|0))break;else{c=c+1|0;b=b+1|0}}}else e=0;return e&255|0}function Sc(b,d){b=b|0;d=d|0;var e=0;c[b>>2]=(Tc(d)|0)&67108863;c[b+4>>2]=(Tc(d+3|0)|0)>>>2&67108611;c[b+8>>2]=(Tc(d+6|0)|0)>>>4&67092735;c[b+12>>2]=(Tc(d+9|0)|0)>>>6&66076671;c[b+16>>2]=(Tc(d+12|0)|0)>>>8&1048575;e=b+20|0;c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=0;c[b+40>>2]=Tc(d+16|0)|0;c[b+44>>2]=Tc(d+20|0)|0;c[b+48>>2]=Tc(d+24|0)|0;c[b+52>>2]=Tc(d+28|0)|0;c[b+56>>2]=0;a[b+76>>0]=0;return}function Tc(a){a=a|0;return (d[a+1>>0]|0)<<8|(d[a>>0]|0)|(d[a+2>>0]|0)<<16|(d[a+3>>0]|0)<<24|0}function Uc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=c[b+56>>2]|0;if(f|0){a[b+60+f>>0]=1;e=f+1|0;if(e>>>0<16)hd(b+60+e|0,0,15-f|0)|0;a[b+76>>0]=1;Vc(b,b+60|0,16)}q=c[b+24>>2]|0;j=(c[b+28>>2]|0)+(q>>>26)|0;p=j&67108863;j=(j>>>26)+(c[b+32>>2]|0)|0;o=j&67108863;j=(j>>>26)+(c[b+36>>2]|0)|0;h=((j>>>26)*5|0)+(c[b+20>>2]|0)|0;n=h&67108863;q=(h>>>26)+(q&67108863)|0;h=n+5|0;f=(h>>>26)+q|0;e=(f>>>26)+p|0;i=(e>>>26)+o|0;l=(j|-67108864)+(i>>>26)|0;m=(l>>>31)+-1|0;g=m&67108863;k=l>>31;f=k&q|g&f;e=k&p|g&e;i=k&o|g&i;h=ed(k&n|g&h|f<<26|0,0,c[b+40>>2]|0,0)|0;g=y;f=ed(f>>>6|e<<20|0,0,c[b+44>>2]|0,0)|0;g=ed(f|0,y|0,g|0,0)|0;f=y;e=ed(e>>>12|i<<14|0,0,c[b+48>>2]|0,0)|0;f=ed(e|0,y|0,f|0,0)|0;e=y;i=ed((m&l|k&j)<<8|i>>>18|0,0,c[b+52>>2]|0,0)|0;e=ed(i|0,y|0,e|0,0)|0;Wc(d,h);Wc(d+4|0,g);Wc(d+8|0,f);Wc(d+12|0,e);e=b+56|0;do{c[b>>2]=0;b=b+4|0}while((b|0)<(e|0));return}function Vc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;s=(a[b+76>>0]|0)==0?16777216:0;t=c[b+4>>2]|0;l=c[b+8>>2]|0;m=c[b+12>>2]|0;n=c[b+16>>2]|0;u=b+20|0;j=c[u>>2]|0;v=b+24|0;i=c[v>>2]|0;w=b+28|0;h=c[w>>2]|0;x=b+32|0;g=c[x>>2]|0;z=b+36|0;f=c[z>>2]|0;if(e>>>0>15){o=n*5|0;p=m*5|0;q=l*5|0;r=t*5|0;k=c[b>>2]|0;b=d;while(1){j=((Tc(b)|0)&67108863)+j|0;H=((Tc(b+3|0)|0)>>>2&67108863)+i|0;F=((Tc(b+6|0)|0)>>>4&67108863)+h|0;E=((Tc(b+9|0)|0)>>>6)+g|0;A=((Tc(b+12|0)|0)>>>8|s)+f|0;i=bd(j|0,0,k|0,0)|0;h=y;d=bd(H|0,0,o|0,0)|0;h=ed(d|0,y|0,i|0,h|0)|0;i=y;d=bd(F|0,0,p|0,0)|0;d=ed(h|0,i|0,d|0,y|0)|0;i=y;h=bd(E|0,0,q|0,0)|0;h=ed(d|0,i|0,h|0,y|0)|0;i=y;d=bd(A|0,0,r|0,0)|0;d=ed(h|0,i|0,d|0,y|0)|0;i=y;h=bd(j|0,0,t|0,0)|0;g=y;D=bd(H|0,0,k|0,0)|0;g=ed(D|0,y|0,h|0,g|0)|0;h=y;D=bd(F|0,0,o|0,0)|0;D=ed(g|0,h|0,D|0,y|0)|0;h=y;g=bd(E|0,0,p|0,0)|0;g=ed(D|0,h|0,g|0,y|0)|0;h=y;D=bd(A|0,0,q|0,0)|0;D=ed(g|0,h|0,D|0,y|0)|0;h=y;g=bd(j|0,0,l|0,0)|0;f=y;C=bd(H|0,0,t|0,0)|0;f=ed(C|0,y|0,g|0,f|0)|0;g=y;C=bd(F|0,0,k|0,0)|0;C=ed(f|0,g|0,C|0,y|0)|0;g=y;f=bd(E|0,0,o|0,0)|0;f=ed(C|0,g|0,f|0,y|0)|0;g=y;C=bd(A|0,0,p|0,0)|0;C=ed(f|0,g|0,C|0,y|0)|0;g=y;f=bd(j|0,0,m|0,0)|0;G=y;B=bd(H|0,0,l|0,0)|0;G=ed(B|0,y|0,f|0,G|0)|0;f=y;B=bd(F|0,0,t|0,0)|0;B=ed(G|0,f|0,B|0,y|0)|0;f=y;G=bd(E|0,0,k|0,0)|0;G=ed(B|0,f|0,G|0,y|0)|0;f=y;B=bd(A|0,0,o|0,0)|0;B=ed(G|0,f|0,B|0,y|0)|0;f=y;j=bd(j|0,0,n|0,0)|0;G=y;H=bd(H|0,0,m|0,0)|0;G=ed(H|0,y|0,j|0,G|0)|0;j=y;F=bd(F|0,0,l|0,0)|0;F=ed(G|0,j|0,F|0,y|0)|0;j=y;E=bd(E|0,0,t|0,0)|0;E=ed(F|0,j|0,E|0,y|0)|0;j=y;A=bd(A|0,0,k|0,0)|0;A=ed(E|0,j|0,A|0,y|0)|0;j=y;i=cd(d|0,i|0,26)|0;i=ed(D|0,h|0,i|0,0)|0;h=cd(i|0,y|0,26)|0;h=ed(C|0,g|0,h|0,0)|0;g=cd(h|0,y|0,26)|0;h=h&67108863;g=ed(B|0,f|0,g|0,0)|0;f=cd(g|0,y|0,26)|0;g=g&67108863;f=ed(A|0,j|0,f|0,0)|0;j=cd(f|0,y|0,26)|0;f=f&67108863;d=(j*5|0)+(d&67108863)|0;j=d&67108863;i=(d>>>26)+(i&67108863)|0;e=e+-16|0;if(e>>>0<=15)break;else b=b+16|0}}c[u>>2]=j;c[v>>2]=i;c[w>>2]=h;c[x>>2]=g;c[z>>2]=f;return}function Wc(b,c){b=b|0;c=c|0;a[b>>0]=c;a[b+1>>0]=c>>>8;a[b+2>>0]=c>>>16;a[b+3>>0]=c>>>24;return}function Xc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;j=b+56|0;f=c[j>>2]|0;if(f){h=16-f|0;h=h>>>0>e>>>0?e:h;if(h){g=0;do{a[f+g+(b+60)>>0]=a[d+g>>0]|0;g=g+1|0;f=c[j>>2]|0}while(g>>>0<h>>>0)}g=f+h|0;c[j>>2]=g;if(g>>>0>=16){Vc(b,b+60|0,16);c[j>>2]=0;d=d+h|0;e=e-h|0;i=7}}else i=7;if((i|0)==7){f=e&-16;if(e>>>0>15){Vc(b,d,f);d=d+f|0;e=e-f|0}if(e|0){gd((c[j>>2]|0)+(b+60)|0,d|0,e|0)|0;c[j>>2]=(c[j>>2]|0)+e}}return}function Yc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;x=l;l=l+16|0;o=x;do if(a>>>0<245){k=a>>>0<11?16:a+11&-8;a=k>>>3;n=c[7524]|0;d=n>>>a;if(d&3|0){b=(d&1^1)+a|0;a=30136+(b<<1<<2)|0;d=a+8|0;e=c[d>>2]|0;f=e+8|0;g=c[f>>2]|0;if((g|0)==(a|0))c[7524]=n&~(1<<b);else{c[g+12>>2]=a;c[d>>2]=g}w=b<<3;c[e+4>>2]=w|3;w=e+w+4|0;c[w>>2]=c[w>>2]|1;w=f;l=x;return w|0}m=c[7526]|0;if(k>>>0>m>>>0){if(d|0){b=2<<a;b=d<<a&(b|0-b);b=(b&0-b)+-1|0;i=b>>>12&16;b=b>>>i;d=b>>>5&8;b=b>>>d;g=b>>>2&4;b=b>>>g;a=b>>>1&2;b=b>>>a;e=b>>>1&1;e=(d|i|g|a|e)+(b>>>e)|0;b=30136+(e<<1<<2)|0;a=b+8|0;g=c[a>>2]|0;i=g+8|0;d=c[i>>2]|0;if((d|0)==(b|0)){a=n&~(1<<e);c[7524]=a}else{c[d+12>>2]=b;c[a>>2]=d;a=n}w=e<<3;h=w-k|0;c[g+4>>2]=k|3;f=g+k|0;c[f+4>>2]=h|1;c[g+w>>2]=h;if(m|0){e=c[7529]|0;b=m>>>3;d=30136+(b<<1<<2)|0;b=1<<b;if(!(a&b)){c[7524]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=e;c[b+12>>2]=e;c[e+8>>2]=b;c[e+12>>2]=d}c[7526]=h;c[7529]=f;w=i;l=x;return w|0}g=c[7525]|0;if(g){d=(g&0-g)+-1|0;f=d>>>12&16;d=d>>>f;e=d>>>5&8;d=d>>>e;h=d>>>2&4;d=d>>>h;i=d>>>1&2;d=d>>>i;j=d>>>1&1;j=c[30400+((e|f|h|i|j)+(d>>>j)<<2)>>2]|0;d=j;i=j;j=(c[j+4>>2]&-8)-k|0;while(1){a=c[d+16>>2]|0;if(!a){a=c[d+20>>2]|0;if(!a)break}h=(c[a+4>>2]&-8)-k|0;f=h>>>0<j>>>0;d=a;i=f?a:i;j=f?h:j}h=i+k|0;if(h>>>0>i>>>0){f=c[i+24>>2]|0;b=c[i+12>>2]|0;do if((b|0)==(i|0)){a=i+20|0;b=c[a>>2]|0;if(!b){a=i+16|0;b=c[a>>2]|0;if(!b){d=0;break}}while(1){e=b+20|0;d=c[e>>2]|0;if(!d){e=b+16|0;d=c[e>>2]|0;if(!d)break;else{b=d;a=e}}else{b=d;a=e}}c[a>>2]=0;d=b}else{d=c[i+8>>2]|0;c[d+12>>2]=b;c[b+8>>2]=d;d=b}while(0);do if(f|0){b=c[i+28>>2]|0;a=30400+(b<<2)|0;if((i|0)==(c[a>>2]|0)){c[a>>2]=d;if(!d){c[7525]=g&~(1<<b);break}}else{w=f+16|0;c[((c[w>>2]|0)==(i|0)?w:f+20|0)>>2]=d;if(!d)break}c[d+24>>2]=f;b=c[i+16>>2]|0;if(b|0){c[d+16>>2]=b;c[b+24>>2]=d}b=c[i+20>>2]|0;if(b|0){c[d+20>>2]=b;c[b+24>>2]=d}}while(0);if(j>>>0<16){w=j+k|0;c[i+4>>2]=w|3;w=i+w+4|0;c[w>>2]=c[w>>2]|1}else{c[i+4>>2]=k|3;c[h+4>>2]=j|1;c[h+j>>2]=j;if(m|0){e=c[7529]|0;b=m>>>3;d=30136+(b<<1<<2)|0;b=1<<b;if(!(b&n)){c[7524]=b|n;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=e;c[b+12>>2]=e;c[e+8>>2]=b;c[e+12>>2]=d}c[7526]=j;c[7529]=h}w=i+8|0;l=x;return w|0}else n=k}else n=k}else n=k}else if(a>>>0<=4294967231){a=a+11|0;k=a&-8;e=c[7525]|0;if(e){f=0-k|0;a=a>>>8;if(a)if(k>>>0>16777215)j=31;else{n=(a+1048320|0)>>>16&8;r=a<<n;i=(r+520192|0)>>>16&4;r=r<<i;j=(r+245760|0)>>>16&2;j=14-(i|n|j)+(r<<j>>>15)|0;j=k>>>(j+7|0)&1|j<<1}else j=0;d=c[30400+(j<<2)>>2]|0;a:do if(!d){d=0;a=0;r=61}else{a=0;i=k<<((j|0)==31?0:25-(j>>>1)|0);g=0;while(1){h=(c[d+4>>2]&-8)-k|0;if(h>>>0<f>>>0)if(!h){a=d;f=0;r=65;break a}else{a=d;f=h}r=c[d+20>>2]|0;d=c[d+16+(i>>>31<<2)>>2]|0;g=(r|0)==0|(r|0)==(d|0)?g:r;if(!d){d=g;r=61;break}else i=i<<1}}while(0);if((r|0)==61){if((d|0)==0&(a|0)==0){a=2<<j;a=(a|0-a)&e;if(!a){n=k;break}n=(a&0-a)+-1|0;h=n>>>12&16;n=n>>>h;g=n>>>5&8;n=n>>>g;i=n>>>2&4;n=n>>>i;j=n>>>1&2;n=n>>>j;d=n>>>1&1;a=0;d=c[30400+((g|h|i|j|d)+(n>>>d)<<2)>>2]|0}if(!d){i=a;h=f}else r=65}if((r|0)==65){g=d;while(1){n=(c[g+4>>2]&-8)-k|0;d=n>>>0<f>>>0;f=d?n:f;a=d?g:a;d=c[g+16>>2]|0;if(!d)d=c[g+20>>2]|0;if(!d){i=a;h=f;break}else g=d}}if(((i|0)!=0?h>>>0<((c[7526]|0)-k|0)>>>0:0)?(m=i+k|0,m>>>0>i>>>0):0){g=c[i+24>>2]|0;b=c[i+12>>2]|0;do if((b|0)==(i|0)){a=i+20|0;b=c[a>>2]|0;if(!b){a=i+16|0;b=c[a>>2]|0;if(!b){b=0;break}}while(1){f=b+20|0;d=c[f>>2]|0;if(!d){f=b+16|0;d=c[f>>2]|0;if(!d)break;else{b=d;a=f}}else{b=d;a=f}}c[a>>2]=0}else{w=c[i+8>>2]|0;c[w+12>>2]=b;c[b+8>>2]=w}while(0);do if(g){a=c[i+28>>2]|0;d=30400+(a<<2)|0;if((i|0)==(c[d>>2]|0)){c[d>>2]=b;if(!b){e=e&~(1<<a);c[7525]=e;break}}else{w=g+16|0;c[((c[w>>2]|0)==(i|0)?w:g+20|0)>>2]=b;if(!b)break}c[b+24>>2]=g;a=c[i+16>>2]|0;if(a|0){c[b+16>>2]=a;c[a+24>>2]=b}a=c[i+20>>2]|0;if(a){c[b+20>>2]=a;c[a+24>>2]=b}}while(0);b:do if(h>>>0<16){w=h+k|0;c[i+4>>2]=w|3;w=i+w+4|0;c[w>>2]=c[w>>2]|1}else{c[i+4>>2]=k|3;c[m+4>>2]=h|1;c[m+h>>2]=h;b=h>>>3;if(h>>>0<256){d=30136+(b<<1<<2)|0;a=c[7524]|0;b=1<<b;if(!(a&b)){c[7524]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=m;c[b+12>>2]=m;c[m+8>>2]=b;c[m+12>>2]=d;break}b=h>>>8;if(b)if(h>>>0>16777215)d=31;else{v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;d=(w+245760|0)>>>16&2;d=14-(u|v|d)+(w<<d>>>15)|0;d=h>>>(d+7|0)&1|d<<1}else d=0;b=30400+(d<<2)|0;c[m+28>>2]=d;a=m+16|0;c[a+4>>2]=0;c[a>>2]=0;a=1<<d;if(!(e&a)){c[7525]=e|a;c[b>>2]=m;c[m+24>>2]=b;c[m+12>>2]=m;c[m+8>>2]=m;break}b=c[b>>2]|0;c:do if((c[b+4>>2]&-8|0)!=(h|0)){e=h<<((d|0)==31?0:25-(d>>>1)|0);while(1){d=b+16+(e>>>31<<2)|0;a=c[d>>2]|0;if(!a)break;if((c[a+4>>2]&-8|0)==(h|0)){b=a;break c}else{e=e<<1;b=a}}c[d>>2]=m;c[m+24>>2]=b;c[m+12>>2]=m;c[m+8>>2]=m;break b}while(0);v=b+8|0;w=c[v>>2]|0;c[w+12>>2]=m;c[v>>2]=m;c[m+8>>2]=w;c[m+12>>2]=b;c[m+24>>2]=0}while(0);w=i+8|0;l=x;return w|0}else n=k}else n=k}else n=-1;while(0);d=c[7526]|0;if(d>>>0>=n>>>0){b=d-n|0;a=c[7529]|0;if(b>>>0>15){w=a+n|0;c[7529]=w;c[7526]=b;c[w+4>>2]=b|1;c[a+d>>2]=b;c[a+4>>2]=n|3}else{c[7526]=0;c[7529]=0;c[a+4>>2]=d|3;w=a+d+4|0;c[w>>2]=c[w>>2]|1}w=a+8|0;l=x;return w|0}h=c[7527]|0;if(h>>>0>n>>>0){u=h-n|0;c[7527]=u;w=c[7530]|0;v=w+n|0;c[7530]=v;c[v+4>>2]=u|1;c[w+4>>2]=n|3;w=w+8|0;l=x;return w|0}if(!(c[7642]|0)){c[7644]=4096;c[7643]=4096;c[7645]=-1;c[7646]=-1;c[7647]=0;c[7635]=0;c[7642]=o&-16^1431655768;a=4096}else a=c[7644]|0;i=n+48|0;j=n+47|0;g=a+j|0;f=0-a|0;k=g&f;if(k>>>0<=n>>>0){w=0;l=x;return w|0}a=c[7634]|0;if(a|0?(m=c[7632]|0,o=m+k|0,o>>>0<=m>>>0|o>>>0>a>>>0):0){w=0;l=x;return w|0}d:do if(!(c[7635]&4)){d=c[7530]|0;e:do if(d){e=30544;while(1){o=c[e>>2]|0;if(o>>>0<=d>>>0?(o+(c[e+4>>2]|0)|0)>>>0>d>>>0:0)break;a=c[e+8>>2]|0;if(!a){r=128;break e}else e=a}b=g-h&f;if(b>>>0<2147483647){a=id(b|0)|0;if((a|0)==((c[e>>2]|0)+(c[e+4>>2]|0)|0)){if((a|0)!=(-1|0)){h=b;g=a;r=145;break d}}else{e=a;r=136}}else b=0}else r=128;while(0);do if((r|0)==128){d=id(0)|0;if((d|0)!=(-1|0)?(b=d,p=c[7643]|0,q=p+-1|0,b=((q&b|0)==0?0:(q+b&0-p)-b|0)+k|0,p=c[7632]|0,q=b+p|0,b>>>0>n>>>0&b>>>0<2147483647):0){o=c[7634]|0;if(o|0?q>>>0<=p>>>0|q>>>0>o>>>0:0){b=0;break}a=id(b|0)|0;if((a|0)==(d|0)){h=b;g=d;r=145;break d}else{e=a;r=136}}else b=0}while(0);do if((r|0)==136){d=0-b|0;if(!(i>>>0>b>>>0&(b>>>0<2147483647&(e|0)!=(-1|0))))if((e|0)==(-1|0)){b=0;break}else{h=b;g=e;r=145;break d}a=c[7644]|0;a=j-b+a&0-a;if(a>>>0>=2147483647){h=b;g=e;r=145;break d}if((id(a|0)|0)==(-1|0)){id(d|0)|0;b=0;break}else{h=a+b|0;g=e;r=145;break d}}while(0);c[7635]=c[7635]|4;r=143}else{b=0;r=143}while(0);if(((r|0)==143?k>>>0<2147483647:0)?(u=id(k|0)|0,q=id(0)|0,s=q-u|0,t=s>>>0>(n+40|0)>>>0,!((u|0)==(-1|0)|t^1|u>>>0<q>>>0&((u|0)!=(-1|0)&(q|0)!=(-1|0))^1)):0){h=t?s:b;g=u;r=145}if((r|0)==145){b=(c[7632]|0)+h|0;c[7632]=b;if(b>>>0>(c[7633]|0)>>>0)c[7633]=b;j=c[7530]|0;f:do if(j){b=30544;while(1){a=c[b>>2]|0;d=c[b+4>>2]|0;if((g|0)==(a+d|0)){r=154;break}e=c[b+8>>2]|0;if(!e)break;else b=e}if(((r|0)==154?(v=b+4|0,(c[b+12>>2]&8|0)==0):0)?g>>>0>j>>>0&a>>>0<=j>>>0:0){c[v>>2]=d+h;w=(c[7527]|0)+h|0;u=j+8|0;u=(u&7|0)==0?0:0-u&7;v=j+u|0;u=w-u|0;c[7530]=v;c[7527]=u;c[v+4>>2]=u|1;c[j+w+4>>2]=40;c[7531]=c[7646];break}if(g>>>0<(c[7528]|0)>>>0)c[7528]=g;d=g+h|0;b=30544;while(1){if((c[b>>2]|0)==(d|0)){r=162;break}a=c[b+8>>2]|0;if(!a)break;else b=a}if((r|0)==162?(c[b+12>>2]&8|0)==0:0){c[b>>2]=g;m=b+4|0;c[m>>2]=(c[m>>2]|0)+h;m=g+8|0;m=g+((m&7|0)==0?0:0-m&7)|0;b=d+8|0;b=d+((b&7|0)==0?0:0-b&7)|0;k=m+n|0;i=b-m-n|0;c[m+4>>2]=n|3;g:do if((j|0)==(b|0)){w=(c[7527]|0)+i|0;c[7527]=w;c[7530]=k;c[k+4>>2]=w|1}else{if((c[7529]|0)==(b|0)){w=(c[7526]|0)+i|0;c[7526]=w;c[7529]=k;c[k+4>>2]=w|1;c[k+w>>2]=w;break}a=c[b+4>>2]|0;if((a&3|0)==1){h=a&-8;e=a>>>3;h:do if(a>>>0<256){a=c[b+8>>2]|0;d=c[b+12>>2]|0;if((d|0)==(a|0)){c[7524]=c[7524]&~(1<<e);break}else{c[a+12>>2]=d;c[d+8>>2]=a;break}}else{g=c[b+24>>2]|0;a=c[b+12>>2]|0;do if((a|0)==(b|0)){d=b+16|0;e=d+4|0;a=c[e>>2]|0;if(!a){a=c[d>>2]|0;if(!a){a=0;break}}else d=e;while(1){f=a+20|0;e=c[f>>2]|0;if(!e){f=a+16|0;e=c[f>>2]|0;if(!e)break;else{a=e;d=f}}else{a=e;d=f}}c[d>>2]=0}else{w=c[b+8>>2]|0;c[w+12>>2]=a;c[a+8>>2]=w}while(0);if(!g)break;d=c[b+28>>2]|0;e=30400+(d<<2)|0;do if((c[e>>2]|0)!=(b|0)){w=g+16|0;c[((c[w>>2]|0)==(b|0)?w:g+20|0)>>2]=a;if(!a)break h}else{c[e>>2]=a;if(a|0)break;c[7525]=c[7525]&~(1<<d);break h}while(0);c[a+24>>2]=g;d=b+16|0;e=c[d>>2]|0;if(e|0){c[a+16>>2]=e;c[e+24>>2]=a}d=c[d+4>>2]|0;if(!d)break;c[a+20>>2]=d;c[d+24>>2]=a}while(0);b=b+h|0;f=h+i|0}else f=i;b=b+4|0;c[b>>2]=c[b>>2]&-2;c[k+4>>2]=f|1;c[k+f>>2]=f;b=f>>>3;if(f>>>0<256){d=30136+(b<<1<<2)|0;a=c[7524]|0;b=1<<b;if(!(a&b)){c[7524]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=k;c[b+12>>2]=k;c[k+8>>2]=b;c[k+12>>2]=d;break}b=f>>>8;do if(!b)e=0;else{if(f>>>0>16777215){e=31;break}v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;e=(w+245760|0)>>>16&2;e=14-(u|v|e)+(w<<e>>>15)|0;e=f>>>(e+7|0)&1|e<<1}while(0);b=30400+(e<<2)|0;c[k+28>>2]=e;a=k+16|0;c[a+4>>2]=0;c[a>>2]=0;a=c[7525]|0;d=1<<e;if(!(a&d)){c[7525]=a|d;c[b>>2]=k;c[k+24>>2]=b;c[k+12>>2]=k;c[k+8>>2]=k;break}b=c[b>>2]|0;i:do if((c[b+4>>2]&-8|0)!=(f|0)){e=f<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=b+16+(e>>>31<<2)|0;a=c[d>>2]|0;if(!a)break;if((c[a+4>>2]&-8|0)==(f|0)){b=a;break i}else{e=e<<1;b=a}}c[d>>2]=k;c[k+24>>2]=b;c[k+12>>2]=k;c[k+8>>2]=k;break g}while(0);v=b+8|0;w=c[v>>2]|0;c[w+12>>2]=k;c[v>>2]=k;c[k+8>>2]=w;c[k+12>>2]=b;c[k+24>>2]=0}while(0);w=m+8|0;l=x;return w|0}b=30544;while(1){a=c[b>>2]|0;if(a>>>0<=j>>>0?(w=a+(c[b+4>>2]|0)|0,w>>>0>j>>>0):0)break;b=c[b+8>>2]|0}f=w+-47|0;a=f+8|0;a=f+((a&7|0)==0?0:0-a&7)|0;f=j+16|0;a=a>>>0<f>>>0?j:a;b=a+8|0;d=h+-40|0;u=g+8|0;u=(u&7|0)==0?0:0-u&7;v=g+u|0;u=d-u|0;c[7530]=v;c[7527]=u;c[v+4>>2]=u|1;c[g+d+4>>2]=40;c[7531]=c[7646];d=a+4|0;c[d>>2]=27;c[b>>2]=c[7636];c[b+4>>2]=c[7637];c[b+8>>2]=c[7638];c[b+12>>2]=c[7639];c[7636]=g;c[7637]=h;c[7639]=0;c[7638]=b;b=a+24|0;do{v=b;b=b+4|0;c[b>>2]=7}while((v+8|0)>>>0<w>>>0);if((a|0)!=(j|0)){g=a-j|0;c[d>>2]=c[d>>2]&-2;c[j+4>>2]=g|1;c[a>>2]=g;b=g>>>3;if(g>>>0<256){d=30136+(b<<1<<2)|0;a=c[7524]|0;b=1<<b;if(!(a&b)){c[7524]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=j;c[b+12>>2]=j;c[j+8>>2]=b;c[j+12>>2]=d;break}b=g>>>8;if(b)if(g>>>0>16777215)e=31;else{v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;e=(w+245760|0)>>>16&2;e=14-(u|v|e)+(w<<e>>>15)|0;e=g>>>(e+7|0)&1|e<<1}else e=0;d=30400+(e<<2)|0;c[j+28>>2]=e;c[j+20>>2]=0;c[f>>2]=0;b=c[7525]|0;a=1<<e;if(!(b&a)){c[7525]=b|a;c[d>>2]=j;c[j+24>>2]=d;c[j+12>>2]=j;c[j+8>>2]=j;break}b=c[d>>2]|0;j:do if((c[b+4>>2]&-8|0)!=(g|0)){e=g<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=b+16+(e>>>31<<2)|0;a=c[d>>2]|0;if(!a)break;if((c[a+4>>2]&-8|0)==(g|0)){b=a;break j}else{e=e<<1;b=a}}c[d>>2]=j;c[j+24>>2]=b;c[j+12>>2]=j;c[j+8>>2]=j;break f}while(0);v=b+8|0;w=c[v>>2]|0;c[w+12>>2]=j;c[v>>2]=j;c[j+8>>2]=w;c[j+12>>2]=b;c[j+24>>2]=0}}else{w=c[7528]|0;if((w|0)==0|g>>>0<w>>>0)c[7528]=g;c[7636]=g;c[7637]=h;c[7639]=0;c[7533]=c[7642];c[7532]=-1;c[7537]=30136;c[7536]=30136;c[7539]=30144;c[7538]=30144;c[7541]=30152;c[7540]=30152;c[7543]=30160;c[7542]=30160;c[7545]=30168;c[7544]=30168;c[7547]=30176;c[7546]=30176;c[7549]=30184;c[7548]=30184;c[7551]=30192;c[7550]=30192;c[7553]=30200;c[7552]=30200;c[7555]=30208;c[7554]=30208;c[7557]=30216;c[7556]=30216;c[7559]=30224;c[7558]=30224;c[7561]=30232;c[7560]=30232;c[7563]=30240;c[7562]=30240;c[7565]=30248;c[7564]=30248;c[7567]=30256;c[7566]=30256;c[7569]=30264;c[7568]=30264;c[7571]=30272;c[7570]=30272;c[7573]=30280;c[7572]=30280;c[7575]=30288;c[7574]=30288;c[7577]=30296;c[7576]=30296;c[7579]=30304;c[7578]=30304;c[7581]=30312;c[7580]=30312;c[7583]=30320;c[7582]=30320;c[7585]=30328;c[7584]=30328;c[7587]=30336;c[7586]=30336;c[7589]=30344;c[7588]=30344;c[7591]=30352;c[7590]=30352;c[7593]=30360;c[7592]=30360;c[7595]=30368;c[7594]=30368;c[7597]=30376;c[7596]=30376;c[7599]=30384;c[7598]=30384;w=h+-40|0;u=g+8|0;u=(u&7|0)==0?0:0-u&7;v=g+u|0;u=w-u|0;c[7530]=v;c[7527]=u;c[v+4>>2]=u|1;c[g+w+4>>2]=40;c[7531]=c[7646]}while(0);b=c[7527]|0;if(b>>>0>n>>>0){u=b-n|0;c[7527]=u;w=c[7530]|0;v=w+n|0;c[7530]=v;c[v+4>>2]=u|1;c[w+4>>2]=n|3;w=w+8|0;l=x;return w|0}}c[(_c()|0)>>2]=12;w=0;l=x;return w|0}function Zc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;if(!a)return;d=a+-8|0;f=c[7528]|0;a=c[a+-4>>2]|0;b=a&-8;j=d+b|0;do if(!(a&1)){e=c[d>>2]|0;if(!(a&3))return;h=d+(0-e)|0;g=e+b|0;if(h>>>0<f>>>0)return;if((c[7529]|0)==(h|0)){a=j+4|0;b=c[a>>2]|0;if((b&3|0)!=3){i=h;b=g;break}c[7526]=g;c[a>>2]=b&-2;c[h+4>>2]=g|1;c[h+g>>2]=g;return}d=e>>>3;if(e>>>0<256){a=c[h+8>>2]|0;b=c[h+12>>2]|0;if((b|0)==(a|0)){c[7524]=c[7524]&~(1<<d);i=h;b=g;break}else{c[a+12>>2]=b;c[b+8>>2]=a;i=h;b=g;break}}f=c[h+24>>2]|0;a=c[h+12>>2]|0;do if((a|0)==(h|0)){b=h+16|0;d=b+4|0;a=c[d>>2]|0;if(!a){a=c[b>>2]|0;if(!a){a=0;break}}else b=d;while(1){e=a+20|0;d=c[e>>2]|0;if(!d){e=a+16|0;d=c[e>>2]|0;if(!d)break;else{a=d;b=e}}else{a=d;b=e}}c[b>>2]=0}else{i=c[h+8>>2]|0;c[i+12>>2]=a;c[a+8>>2]=i}while(0);if(f){b=c[h+28>>2]|0;d=30400+(b<<2)|0;if((c[d>>2]|0)==(h|0)){c[d>>2]=a;if(!a){c[7525]=c[7525]&~(1<<b);i=h;b=g;break}}else{i=f+16|0;c[((c[i>>2]|0)==(h|0)?i:f+20|0)>>2]=a;if(!a){i=h;b=g;break}}c[a+24>>2]=f;b=h+16|0;d=c[b>>2]|0;if(d|0){c[a+16>>2]=d;c[d+24>>2]=a}b=c[b+4>>2]|0;if(b){c[a+20>>2]=b;c[b+24>>2]=a;i=h;b=g}else{i=h;b=g}}else{i=h;b=g}}else{i=d;h=d}while(0);if(h>>>0>=j>>>0)return;a=j+4|0;e=c[a>>2]|0;if(!(e&1))return;if(!(e&2)){if((c[7530]|0)==(j|0)){j=(c[7527]|0)+b|0;c[7527]=j;c[7530]=i;c[i+4>>2]=j|1;if((i|0)!=(c[7529]|0))return;c[7529]=0;c[7526]=0;return}if((c[7529]|0)==(j|0)){j=(c[7526]|0)+b|0;c[7526]=j;c[7529]=h;c[i+4>>2]=j|1;c[h+j>>2]=j;return}f=(e&-8)+b|0;d=e>>>3;do if(e>>>0<256){b=c[j+8>>2]|0;a=c[j+12>>2]|0;if((a|0)==(b|0)){c[7524]=c[7524]&~(1<<d);break}else{c[b+12>>2]=a;c[a+8>>2]=b;break}}else{g=c[j+24>>2]|0;a=c[j+12>>2]|0;do if((a|0)==(j|0)){b=j+16|0;d=b+4|0;a=c[d>>2]|0;if(!a){a=c[b>>2]|0;if(!a){d=0;break}}else b=d;while(1){e=a+20|0;d=c[e>>2]|0;if(!d){e=a+16|0;d=c[e>>2]|0;if(!d)break;else{a=d;b=e}}else{a=d;b=e}}c[b>>2]=0;d=a}else{d=c[j+8>>2]|0;c[d+12>>2]=a;c[a+8>>2]=d;d=a}while(0);if(g|0){a=c[j+28>>2]|0;b=30400+(a<<2)|0;if((c[b>>2]|0)==(j|0)){c[b>>2]=d;if(!d){c[7525]=c[7525]&~(1<<a);break}}else{e=g+16|0;c[((c[e>>2]|0)==(j|0)?e:g+20|0)>>2]=d;if(!d)break}c[d+24>>2]=g;a=j+16|0;b=c[a>>2]|0;if(b|0){c[d+16>>2]=b;c[b+24>>2]=d}a=c[a+4>>2]|0;if(a|0){c[d+20>>2]=a;c[a+24>>2]=d}}}while(0);c[i+4>>2]=f|1;c[h+f>>2]=f;if((i|0)==(c[7529]|0)){c[7526]=f;return}}else{c[a>>2]=e&-2;c[i+4>>2]=b|1;c[h+b>>2]=b;f=b}a=f>>>3;if(f>>>0<256){d=30136+(a<<1<<2)|0;b=c[7524]|0;a=1<<a;if(!(b&a)){c[7524]=b|a;a=d;b=d+8|0}else{b=d+8|0;a=c[b>>2]|0}c[b>>2]=i;c[a+12>>2]=i;c[i+8>>2]=a;c[i+12>>2]=d;return}a=f>>>8;if(a)if(f>>>0>16777215)e=31;else{h=(a+1048320|0)>>>16&8;j=a<<h;g=(j+520192|0)>>>16&4;j=j<<g;e=(j+245760|0)>>>16&2;e=14-(g|h|e)+(j<<e>>>15)|0;e=f>>>(e+7|0)&1|e<<1}else e=0;a=30400+(e<<2)|0;c[i+28>>2]=e;c[i+20>>2]=0;c[i+16>>2]=0;b=c[7525]|0;d=1<<e;a:do if(!(b&d)){c[7525]=b|d;c[a>>2]=i;c[i+24>>2]=a;c[i+12>>2]=i;c[i+8>>2]=i}else{a=c[a>>2]|0;b:do if((c[a+4>>2]&-8|0)!=(f|0)){e=f<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=a+16+(e>>>31<<2)|0;b=c[d>>2]|0;if(!b)break;if((c[b+4>>2]&-8|0)==(f|0)){a=b;break b}else{e=e<<1;a=b}}c[d>>2]=i;c[i+24>>2]=a;c[i+12>>2]=i;c[i+8>>2]=i;break a}while(0);h=a+8|0;j=c[h>>2]|0;c[j+12>>2]=i;c[h>>2]=i;c[i+8>>2]=j;c[i+12>>2]=a;c[i+24>>2]=0}while(0);j=(c[7532]|0)+-1|0;c[7532]=j;if(j|0)return;a=30552;while(1){a=c[a>>2]|0;if(!a)break;else a=a+8|0}c[7532]=-1;return}function _c(){return 30592}function $c(){}function ad(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=a&65535;e=b&65535;c=N(e,f)|0;d=a>>>16;a=(c>>>16)+(N(e,d)|0)|0;e=b>>>16;b=N(e,f)|0;return (y=(a>>>16)+(N(e,d)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|c&65535|0)|0}function bd(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;f=c;c=ad(e,f)|0;a=y;return (y=(N(b,f)|0)+(N(d,e)|0)+a|a&0,c|0|0)|0}function cd(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){y=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}y=0;return b>>>c-32|0}function dd(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){y=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}y=a<<c-32;return 0}function ed(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=a+c>>>0;return (y=b+d+(c>>>0<a>>>0|0)>>>0,c|0)|0}function fd(a){a=a|0;return (a&255)<<24|(a>>8&255)<<16|(a>>16&255)<<8|a>>>24|0}function gd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((e|0)>=8192)return Z(b|0,d|0,e|0)|0;h=b|0;g=b+e|0;if((b&3)==(d&3)){while(b&3){if(!e)return h|0;a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0}e=g&-4|0;f=e-64|0;while((b|0)<=(f|0)){c[b>>2]=c[d>>2];c[b+4>>2]=c[d+4>>2];c[b+8>>2]=c[d+8>>2];c[b+12>>2]=c[d+12>>2];c[b+16>>2]=c[d+16>>2];c[b+20>>2]=c[d+20>>2];c[b+24>>2]=c[d+24>>2];c[b+28>>2]=c[d+28>>2];c[b+32>>2]=c[d+32>>2];c[b+36>>2]=c[d+36>>2];c[b+40>>2]=c[d+40>>2];c[b+44>>2]=c[d+44>>2];c[b+48>>2]=c[d+48>>2];c[b+52>>2]=c[d+52>>2];c[b+56>>2]=c[d+56>>2];c[b+60>>2]=c[d+60>>2];b=b+64|0;d=d+64|0}while((b|0)<(e|0)){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0}}else{e=g-4|0;while((b|0)<(e|0)){a[b>>0]=a[d>>0]|0;a[b+1>>0]=a[d+1>>0]|0;a[b+2>>0]=a[d+2>>0]|0;a[b+3>>0]=a[d+3>>0]|0;b=b+4|0;d=d+4|0}}while((b|0)<(g|0)){a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0}return h|0}function hd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=b+e|0;d=d&255;if((e|0)>=67){while(b&3){a[b>>0]=d;b=b+1|0}f=h&-4|0;g=f-64|0;i=d|d<<8|d<<16|d<<24;while((b|0)<=(g|0)){c[b>>2]=i;c[b+4>>2]=i;c[b+8>>2]=i;c[b+12>>2]=i;c[b+16>>2]=i;c[b+20>>2]=i;c[b+24>>2]=i;c[b+28>>2]=i;c[b+32>>2]=i;c[b+36>>2]=i;c[b+40>>2]=i;c[b+44>>2]=i;c[b+48>>2]=i;c[b+52>>2]=i;c[b+56>>2]=i;c[b+60>>2]=i;b=b+64|0}while((b|0)<(f|0)){c[b>>2]=i;b=b+4|0}}while((b|0)<(h|0)){a[b>>0]=d;b=b+1|0}return h-e|0}function id(a){a=a|0;var b=0,d=0;d=c[i>>2]|0;b=d+a|0;if((a|0)>0&(b|0)<(d|0)|(b|0)<0){V()|0;Y(12);return -1}c[i>>2]=b;if((b|0)>(U()|0)?(T()|0)==0:0){c[i>>2]=d;Y(12);return -1}return d|0}function jd(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return $[a&1](b|0,c|0,d|0)|0}function kd(a,b,c){a=a|0;b=b|0;c=c|0;R(0);return 0}function ld(a,b,c){a=a|0;b=b|0;c=c|0;return hd(a|0,b|0,c|0)|0}

// EMSCRIPTEN_END_FUNCS
var $=[kd,ld];return{___errno_location:_c,___muldi3:bd,_bitshift64Lshr:cd,_bitshift64Shl:dd,_emscripten_blake2b:Fa,_emscripten_cardano_memory_combine:Ha,_emscripten_chacha20poly1305_enc:Ia,_emscripten_derive_private:Da,_emscripten_derive_public:Ea,_emscripten_hmac_sha512_final:Ma,_emscripten_hmac_sha512_init:Ka,_emscripten_hmac_sha512_update:La,_emscripten_sha3_256:Ga,_emscripten_sign:za,_emscripten_size_of_hmac_sha512_ctx:Ja,_emscripten_to_public:Ba,_emscripten_verify:Aa,_emscripten_wallet_secret_from_seed:Ca,_free:Zc,_i64Add:ed,_llvm_bswap_i32:fd,_malloc:Yc,_memcpy:gd,_memset:hd,_sbrk:id,dynCall_iiii:jd,establishStackSpace:da,getTempRet0:ga,runPostSets:$c,setTempRet0:fa,setThrew:ea,stackAlloc:aa,stackRestore:ca,stackSave:ba}})


// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg,Module.asmLibraryArg,buffer);var ___errno_location=Module["___errno_location"]=asm["___errno_location"];var ___muldi3=Module["___muldi3"]=asm["___muldi3"];var _bitshift64Lshr=Module["_bitshift64Lshr"]=asm["_bitshift64Lshr"];var _bitshift64Shl=Module["_bitshift64Shl"]=asm["_bitshift64Shl"];var _emscripten_blake2b=Module["_emscripten_blake2b"]=asm["_emscripten_blake2b"];var _emscripten_cardano_memory_combine=Module["_emscripten_cardano_memory_combine"]=asm["_emscripten_cardano_memory_combine"];var _emscripten_chacha20poly1305_enc=Module["_emscripten_chacha20poly1305_enc"]=asm["_emscripten_chacha20poly1305_enc"];var _emscripten_derive_private=Module["_emscripten_derive_private"]=asm["_emscripten_derive_private"];var _emscripten_derive_public=Module["_emscripten_derive_public"]=asm["_emscripten_derive_public"];var _emscripten_hmac_sha512_final=Module["_emscripten_hmac_sha512_final"]=asm["_emscripten_hmac_sha512_final"];var _emscripten_hmac_sha512_init=Module["_emscripten_hmac_sha512_init"]=asm["_emscripten_hmac_sha512_init"];var _emscripten_hmac_sha512_update=Module["_emscripten_hmac_sha512_update"]=asm["_emscripten_hmac_sha512_update"];var _emscripten_sha3_256=Module["_emscripten_sha3_256"]=asm["_emscripten_sha3_256"];var _emscripten_sign=Module["_emscripten_sign"]=asm["_emscripten_sign"];var _emscripten_size_of_hmac_sha512_ctx=Module["_emscripten_size_of_hmac_sha512_ctx"]=asm["_emscripten_size_of_hmac_sha512_ctx"];var _emscripten_to_public=Module["_emscripten_to_public"]=asm["_emscripten_to_public"];var _emscripten_verify=Module["_emscripten_verify"]=asm["_emscripten_verify"];var _emscripten_wallet_secret_from_seed=Module["_emscripten_wallet_secret_from_seed"]=asm["_emscripten_wallet_secret_from_seed"];var _free=Module["_free"]=asm["_free"];var _i64Add=Module["_i64Add"]=asm["_i64Add"];var _llvm_bswap_i32=Module["_llvm_bswap_i32"]=asm["_llvm_bswap_i32"];var _malloc=Module["_malloc"]=asm["_malloc"];var _memcpy=Module["_memcpy"]=asm["_memcpy"];var _memset=Module["_memset"]=asm["_memset"];var _sbrk=Module["_sbrk"]=asm["_sbrk"];var establishStackSpace=Module["establishStackSpace"]=asm["establishStackSpace"];var getTempRet0=Module["getTempRet0"]=asm["getTempRet0"];var runPostSets=Module["runPostSets"]=asm["runPostSets"];var setTempRet0=Module["setTempRet0"]=asm["setTempRet0"];var setThrew=Module["setThrew"]=asm["setThrew"];var stackAlloc=Module["stackAlloc"]=asm["stackAlloc"];var stackRestore=Module["stackRestore"]=asm["stackRestore"];var stackSave=Module["stackSave"]=asm["stackSave"];var dynCall_iiii=Module["dynCall_iiii"]=asm["dynCall_iiii"];Module["asm"]=asm;if(memoryInitializer){if(!isDataURI(memoryInitializer)){if(typeof Module["locateFile"]==="function"){memoryInitializer=Module["locateFile"](memoryInitializer)}else if(Module["memoryInitializerPrefixURL"]){memoryInitializer=Module["memoryInitializerPrefixURL"]+memoryInitializer}}if(ENVIRONMENT_IS_NODE||ENVIRONMENT_IS_SHELL){var data=Module["readBinary"](memoryInitializer);HEAPU8.set(data,GLOBAL_BASE)}else{addRunDependency("memory initializer");var applyMemoryInitializer=(function(data){if(data.byteLength)data=new Uint8Array(data);HEAPU8.set(data,GLOBAL_BASE);if(Module["memoryInitializerRequest"])delete Module["memoryInitializerRequest"].response;removeRunDependency("memory initializer")});function doBrowserLoad(){Module["readAsync"](memoryInitializer,applyMemoryInitializer,(function(){throw"could not load memory initializer "+memoryInitializer}))}var memoryInitializerBytes=tryParseAsDataURI(memoryInitializer);if(memoryInitializerBytes){applyMemoryInitializer(memoryInitializerBytes.buffer)}else if(Module["memoryInitializerRequest"]){function useRequest(){var request=Module["memoryInitializerRequest"];var response=request.response;if(request.status!==200&&request.status!==0){var data=tryParseAsDataURI(Module["memoryInitializerRequestURL"]);if(data){response=data.buffer}else{console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: "+request.status+", retrying "+memoryInitializer);doBrowserLoad();return}}applyMemoryInitializer(response)}if(Module["memoryInitializerRequest"].response){setTimeout(useRequest,0)}else{Module["memoryInitializerRequest"].addEventListener("load",useRequest)}}else{doBrowserLoad()}}}function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status}ExitStatus.prototype=new Error;ExitStatus.prototype.constructor=ExitStatus;var initialStackTop;dependenciesFulfilled=function runCaller(){if(!Module["calledRun"])run();if(!Module["calledRun"])dependenciesFulfilled=runCaller};function run(args){args=args||Module["arguments"];if(runDependencies>0){return}preRun();if(runDependencies>0)return;if(Module["calledRun"])return;function doRun(){if(Module["calledRun"])return;Module["calledRun"]=true;if(ABORT)return;ensureInitRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout((function(){setTimeout((function(){Module["setStatus"]("")}),1);doRun()}),1)}else{doRun()}}Module["run"]=run;function abort(what){if(Module["onAbort"]){Module["onAbort"](what)}if(what!==undefined){out(what);err(what);what=JSON.stringify(what)}else{what=""}ABORT=true;EXITSTATUS=1;throw"abort("+what+"). Build with -s ASSERTIONS=1 for more info."}Module["abort"]=abort;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}Module["noExitRuntime"]=true;run()




if (typeof module !== "undefined") {  module["exports"] = Module; }
}).call(this)}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":10,"buffer":4,"fs":1,"path":9}],60:[function(require,module,exports){
'use strict'
var ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

// pre-compute lookup table
var ALPHABET_MAP = {}
for (var z = 0; z < ALPHABET.length; z++) {
  var x = ALPHABET.charAt(z)

  if (ALPHABET_MAP[x] !== undefined) throw new TypeError(x + ' is ambiguous')
  ALPHABET_MAP[x] = z
}

function polymodStep (pre) {
  var b = pre >> 25
  return ((pre & 0x1FFFFFF) << 5) ^
    (-((b >> 0) & 1) & 0x3b6a57b2) ^
    (-((b >> 1) & 1) & 0x26508e6d) ^
    (-((b >> 2) & 1) & 0x1ea119fa) ^
    (-((b >> 3) & 1) & 0x3d4233dd) ^
    (-((b >> 4) & 1) & 0x2a1462b3)
}

function prefixChk (prefix) {
  var chk = 1
  for (var i = 0; i < prefix.length; ++i) {
    var c = prefix.charCodeAt(i)
    if (c < 33 || c > 126) return 'Invalid prefix (' + prefix + ')'

    chk = polymodStep(chk) ^ (c >> 5)
  }
  chk = polymodStep(chk)

  for (i = 0; i < prefix.length; ++i) {
    var v = prefix.charCodeAt(i)
    chk = polymodStep(chk) ^ (v & 0x1f)
  }
  return chk
}

function encode (prefix, words, LIMIT) {
  LIMIT = LIMIT || 90
  if ((prefix.length + 7 + words.length) > LIMIT) throw new TypeError('Exceeds length limit')

  prefix = prefix.toLowerCase()

  // determine chk mod
  var chk = prefixChk(prefix)
  if (typeof chk === 'string') throw new Error(chk)

  var result = prefix + '1'
  for (var i = 0; i < words.length; ++i) {
    var x = words[i]
    if ((x >> 5) !== 0) throw new Error('Non 5-bit word')

    chk = polymodStep(chk) ^ x
    result += ALPHABET.charAt(x)
  }

  for (i = 0; i < 6; ++i) {
    chk = polymodStep(chk)
  }
  chk ^= 1

  for (i = 0; i < 6; ++i) {
    var v = (chk >> ((5 - i) * 5)) & 0x1f
    result += ALPHABET.charAt(v)
  }

  return result
}

function __decode (str, LIMIT) {
  LIMIT = LIMIT || 90
  if (str.length < 8) return str + ' too short'
  if (str.length > LIMIT) return 'Exceeds length limit'

  // don't allow mixed case
  var lowered = str.toLowerCase()
  var uppered = str.toUpperCase()
  if (str !== lowered && str !== uppered) return 'Mixed-case string ' + str
  str = lowered

  var split = str.lastIndexOf('1')
  if (split === -1) return 'No separator character for ' + str
  if (split === 0) return 'Missing prefix for ' + str

  var prefix = str.slice(0, split)
  var wordChars = str.slice(split + 1)
  if (wordChars.length < 6) return 'Data too short'

  var chk = prefixChk(prefix)
  if (typeof chk === 'string') return chk

  var words = []
  for (var i = 0; i < wordChars.length; ++i) {
    var c = wordChars.charAt(i)
    var v = ALPHABET_MAP[c]
    if (v === undefined) return 'Unknown character ' + c
    chk = polymodStep(chk) ^ v

    // not in the checksum?
    if (i + 6 >= wordChars.length) continue
    words.push(v)
  }

  if (chk !== 1) return 'Invalid checksum for ' + str
  return { prefix: prefix, words: words }
}

function decodeUnsafe () {
  var res = __decode.apply(null, arguments)
  if (typeof res === 'object') return res
}

function decode (str) {
  var res = __decode.apply(null, arguments)
  if (typeof res === 'object') return res

  throw new Error(res)
}

function convert (data, inBits, outBits, pad) {
  var value = 0
  var bits = 0
  var maxV = (1 << outBits) - 1

  var result = []
  for (var i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i]
    bits += inBits

    while (bits >= outBits) {
      bits -= outBits
      result.push((value >> bits) & maxV)
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((value << (outBits - bits)) & maxV)
    }
  } else {
    if (bits >= inBits) return 'Excess padding'
    if ((value << (outBits - bits)) & maxV) return 'Non-zero padding'
  }

  return result
}

function toWordsUnsafe (bytes) {
  var res = convert(bytes, 8, 5, true)
  if (Array.isArray(res)) return res
}

function toWords (bytes) {
  var res = convert(bytes, 8, 5, true)
  if (Array.isArray(res)) return res

  throw new Error(res)
}

function fromWordsUnsafe (words) {
  var res = convert(words, 5, 8, false)
  if (Array.isArray(res)) return res
}

function fromWords (words) {
  var res = convert(words, 5, 8, false)
  if (Array.isArray(res)) return res

  throw new Error(res)
}

module.exports = {
  decodeUnsafe: decodeUnsafe,
  decode: decode,
  encode: encode,
  toWordsUnsafe: toWordsUnsafe,
  toWords: toWords,
  fromWordsUnsafe: fromWordsUnsafe,
  fromWords: fromWords
}

},{}],61:[function(require,module,exports){
(function (Buffer){(function (){
const cbor = require('borc')
module.exports = class CborIndefiniteLengthArray {
  constructor(elements) {
    this.elements = elements
  }

  encodeCBOR(encoder) {
    return encoder.push(
      Buffer.concat([
        Buffer.from([0x9f]), // indefinite array prefix
        ...this.elements.map((e) => cbor.encode(e)),
        Buffer.from([0xff]), // end of array
      ])
    )
  }
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"borc":49,"buffer":4}],62:[function(require,module,exports){
(function (Buffer){(function (){
// taken from: https://github.com/cryptocoinjs/base-x/blob/master/index.js

function base(ALPHABET) {
  const ALPHABET_MAP = {}
  const BASE = ALPHABET.length
  const LEADER = ALPHABET.charAt(0)

  // pre-compute lookup table
  for (let z = 0; z < ALPHABET.length; z++) {
    const x = ALPHABET.charAt(z)

    if (ALPHABET_MAP[x] !== undefined) throw new TypeError(`${x} is ambiguous`)
    ALPHABET_MAP[x] = z
  }

  function encode(source) {
    if (source.length === 0) return ''

    const digits = [0]
    for (let i = 0; i < source.length; ++i) {
      for (var j = 0, carry = source[i]; j < digits.length; ++j) {
        carry += digits[j] << 8
        digits[j] = carry % BASE
        carry = (carry / BASE) | 0
      }

      while (carry > 0) {
        digits.push(carry % BASE)
        carry = (carry / BASE) | 0
      }
    }

    let string = ''

    // deal with leading zeros
    for (let k = 0; source[k] === 0 && k < source.length - 1; ++k) string += LEADER
    // convert digits to a string
    for (let q = digits.length - 1; q >= 0; --q) string += ALPHABET[digits[q]]

    return string
  }

  function decodeUnsafe(string) {
    if (typeof string !== 'string') throw new TypeError('Expected String')
    if (string.length === 0) return Buffer.allocUnsafe(0)

    const bytes = [0]
    for (let i = 0; i < string.length; i++) {
      const value = ALPHABET_MAP[string[i]]
      if (value === undefined) return

      for (var j = 0, carry = value; j < bytes.length; ++j) {
        carry += bytes[j] * BASE
        bytes[j] = carry & 0xff
        carry >>= 8
      }

      while (carry > 0) {
        bytes.push(carry & 0xff)
        carry >>= 8
      }
    }

    // deal with leading zeros
    for (let k = 0; string[k] === LEADER && k < string.length - 1; ++k) {
      bytes.push(0)
    }

    return Buffer.from(bytes.reverse())
  }

  function decode(string) {
    const buffer = decodeUnsafe(string)
    if (buffer) return buffer

    throw new Error(`Non-base${BASE} character`)
  }

  return {
    encode,
    decodeUnsafe,
    decode,
  }
}

module.exports = base

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":4}],63:[function(require,module,exports){
const base58 = require('./base-x')('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz')

module.exports = base58

},{"./base-x":62}],64:[function(require,module,exports){
(function (Buffer){(function (){
const bech32 = require('bech32')
const {validateString, validateBuffer} = require('./validation')

function encode(prefix, data) {
  validateString(prefix)
  validateBuffer(data)

  const words = bech32.toWords(data)
  // we need longer than default length for privkeys and 1000 should suffice
  return bech32.encode(prefix, words, 1000)
}

function decode(str) {
  validateString(str)

  const tmp = bech32.decode(str, 1000)
  return {
    prefix: tmp.prefix,
    data: Buffer.from(bech32.fromWords(tmp.words)),
  }
}

module.exports = {
  encode,
  decode
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"./validation":68,"bech32":60,"buffer":4}],65:[function(require,module,exports){
// taken from: https://github.com/SheetJS/js-crc32/blob/master/crc32.js

function signed_crc_table() {
  let c = 0,
    table = new Array(256)

  for (let n = 0; n != 256; ++n) {
    c = n
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }

  return typeof Int32Array !== 'undefined' ? new Int32Array(table) : table
}

const T = signed_crc_table()

function crc32_buf(buf, seed) {
  if (buf.length > 10000) return crc32_buf_8(buf, seed)
  let C = seed ^ -1,
    L = buf.length - 3
  for (var i = 0; i < L;) {
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
  }
  while (i < L + 3) C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
  return C ^ -1
}

function crc32_buf_8(buf, seed) {
  let C = seed ^ -1,
    L = buf.length - 7
  for (var i = 0; i < L;) {
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
  }
  while (i < L + 7) C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff]
  return C ^ -1
}

function crc32(buf) {
  return crc32_buf(buf) >>> 0
}

module.exports = crc32

},{}],66:[function(require,module,exports){
const {pbkdf2: pbkdf2Async, pbkdf2Sync} = require('pbkdf2')

const promisifiedPbkdf2 = (password, salt, iterations, length, algo) =>
  new Promise((resolveFunction, rejectFunction) => {
    pbkdf2Async(password, salt, iterations, length, algo, (error, response) => {
      if (error) {
        rejectFunction(error)
      }
      resolveFunction(response)
    })
  })

const pbkdf2 = async (password, salt, iterations, length, algo) => {
  try {
    const result = await promisifiedPbkdf2(password, salt, iterations, length, algo)
    return result
  } catch (e) {
    // falback to sync since on Firefox promisifiedPbkdf2 fails for empty password
    return pbkdf2Sync(password, salt, iterations, length, algo)
  }
}

module.exports = pbkdf2

},{"pbkdf2":80}],67:[function(require,module,exports){
(function (setImmediate){(function (){
/*!
 * Fast "async" scrypt implementation in JavaScript.
 * Copyright (c) 2013-2016 Dmitry Chestnykh | BSD License
 * https://github.com/dchest/scrypt-async-js
 * Copyright (c) 2013-2016 Dmitry Chestnykh. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

   * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

/**
 * scrypt(password, salt, options, callback)
 *
 * where
 *
 * password and salt are strings or arrays of bytes (Array of Uint8Array)
 * options is
 *
 * {
 *    N:      // CPU/memory cost parameter, must be power of two
 *            // (alternatively, you can specify logN)
 *    r:      // block size
 *    p:      // parallelization parameter
 *    dkLen:  // length of derived key, default = 32
 *    encoding: // optional encoding:
 *                    "base64" - standard Base64 encoding
 *                    "hex" — hex encoding,
 *                    "binary" — Uint8Array,
 *                    undefined/null - Array of bytes
 *    interruptStep: // optional, steps to split calculations (default is 0)
 * }
 *
 * Derives a key from password and salt and calls callback
 * with derived key as the only argument.
 *
 * Calculations are interrupted with setImmediate (or zero setTimeout) at the
 * given interruptSteps to avoid freezing the browser. If it's undefined or zero,
 * the callback is called immediately after the calculation, avoiding setImmediate.
 *
 * Legacy way (only supports p = 1) to call this function is:
 *
 * scrypt(password, salt, logN, r, dkLen, [interruptStep], callback, [encoding])
 *
 * In legacy API, if interruptStep is not given, it defaults to 1000.
 * Pass 0 to have callback called immediately.
 *
 */
function scrypt(password, salt, logN, r, dkLen, interruptStep, callback, encoding) {
  'use strict';

  function SHA256(m) {
    /** @const */ var K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
      0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
      0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
      0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
      0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
      0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
      0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
      0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
      0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
      0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
      0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
        h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19,
        w = new Array(64);

    function blocks(p) {
      var off = 0, len = p.length;
      while (len >= 64) {
        var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7,
            u, i, j, t1, t2;

        for (i = 0; i < 16; i++) {
          j = off + i*4;
          w[i] = ((p[j] & 0xff)<<24) | ((p[j+1] & 0xff)<<16) |
                 ((p[j+2] & 0xff)<<8) | (p[j+3] & 0xff);
        }

        for (i = 16; i < 64; i++) {
          u = w[i-2];
          t1 = ((u>>>17) | (u<<(32-17))) ^ ((u>>>19) | (u<<(32-19))) ^ (u>>>10);

          u = w[i-15];
          t2 = ((u>>>7) | (u<<(32-7))) ^ ((u>>>18) | (u<<(32-18))) ^ (u>>>3);

          w[i] = (((t1 + w[i-7]) | 0) + ((t2 + w[i-16]) | 0)) | 0;
        }

        for (i = 0; i < 64; i++) {
          t1 = ((((((e>>>6) | (e<<(32-6))) ^ ((e>>>11) | (e<<(32-11))) ^
               ((e>>>25) | (e<<(32-25)))) + ((e & f) ^ (~e & g))) | 0) +
               ((h + ((K[i] + w[i]) | 0)) | 0)) | 0;

          t2 = ((((a>>>2) | (a<<(32-2))) ^ ((a>>>13) | (a<<(32-13))) ^
               ((a>>>22) | (a<<(32-22)))) + ((a & b) ^ (a & c) ^ (b & c))) | 0;

          h = g;
          g = f;
          f = e;
          e = (d + t1) | 0;
          d = c;
          c = b;
          b = a;
          a = (t1 + t2) | 0;
        }

        h0 = (h0 + a) | 0;
        h1 = (h1 + b) | 0;
        h2 = (h2 + c) | 0;
        h3 = (h3 + d) | 0;
        h4 = (h4 + e) | 0;
        h5 = (h5 + f) | 0;
        h6 = (h6 + g) | 0;
        h7 = (h7 + h) | 0;

        off += 64;
        len -= 64;
      }
    }

    blocks(m);

    var i, bytesLeft = m.length % 64,
        bitLenHi = (m.length / 0x20000000) | 0,
        bitLenLo = m.length << 3,
        numZeros = (bytesLeft < 56) ? 56 : 120,
        p = m.slice(m.length - bytesLeft, m.length);

    p.push(0x80);
    for (i = bytesLeft + 1; i < numZeros; i++) p.push(0);
    p.push((bitLenHi>>>24) & 0xff);
    p.push((bitLenHi>>>16) & 0xff);
    p.push((bitLenHi>>>8)  & 0xff);
    p.push((bitLenHi>>>0)  & 0xff);
    p.push((bitLenLo>>>24) & 0xff);
    p.push((bitLenLo>>>16) & 0xff);
    p.push((bitLenLo>>>8)  & 0xff);
    p.push((bitLenLo>>>0)  & 0xff);

    blocks(p);

    return [
      (h0>>>24) & 0xff, (h0>>>16) & 0xff, (h0>>>8) & 0xff, (h0>>>0) & 0xff,
      (h1>>>24) & 0xff, (h1>>>16) & 0xff, (h1>>>8) & 0xff, (h1>>>0) & 0xff,
      (h2>>>24) & 0xff, (h2>>>16) & 0xff, (h2>>>8) & 0xff, (h2>>>0) & 0xff,
      (h3>>>24) & 0xff, (h3>>>16) & 0xff, (h3>>>8) & 0xff, (h3>>>0) & 0xff,
      (h4>>>24) & 0xff, (h4>>>16) & 0xff, (h4>>>8) & 0xff, (h4>>>0) & 0xff,
      (h5>>>24) & 0xff, (h5>>>16) & 0xff, (h5>>>8) & 0xff, (h5>>>0) & 0xff,
      (h6>>>24) & 0xff, (h6>>>16) & 0xff, (h6>>>8) & 0xff, (h6>>>0) & 0xff,
      (h7>>>24) & 0xff, (h7>>>16) & 0xff, (h7>>>8) & 0xff, (h7>>>0) & 0xff
    ];
  }

  function PBKDF2_HMAC_SHA256_OneIter(password, salt, dkLen) {
    // compress password if it's longer than hash block length
    password = password.length <= 64 ? password : SHA256(password);

    var i, innerLen = 64 + salt.length + 4,
        inner = new Array(innerLen),
        outerKey = new Array(64),
        dk = [];

    // inner = (password ^ ipad) || salt || counter
    for (i = 0; i < 64; i++) inner[i] = 0x36;
    for (i = 0; i < password.length; i++) inner[i] ^= password[i];
    for (i = 0; i < salt.length; i++) inner[64+i] = salt[i];
    for (i = innerLen - 4; i < innerLen; i++) inner[i] = 0;

    // outerKey = password ^ opad
    for (i = 0; i < 64; i++) outerKey[i] = 0x5c;
    for (i = 0; i < password.length; i++) outerKey[i] ^= password[i];

    // increments counter inside inner
    function incrementCounter() {
      for (var i = innerLen-1; i >= innerLen-4; i--) {
        inner[i]++;
        if (inner[i] <= 0xff) return;
        inner[i] = 0;
      }
    }

    // output blocks = SHA256(outerKey || SHA256(inner)) ...
    while (dkLen >= 32) {
      incrementCounter();
      dk = dk.concat(SHA256(outerKey.concat(SHA256(inner))));
      dkLen -= 32;
    }
    if (dkLen > 0) {
      incrementCounter();
      dk = dk.concat(SHA256(outerKey.concat(SHA256(inner))).slice(0, dkLen));
    }
    return dk;
  }

  function salsaXOR(tmp, B, bin, bout) {
    var j0  = tmp[0]  ^ B[bin++],
        j1  = tmp[1]  ^ B[bin++],
        j2  = tmp[2]  ^ B[bin++],
        j3  = tmp[3]  ^ B[bin++],
        j4  = tmp[4]  ^ B[bin++],
        j5  = tmp[5]  ^ B[bin++],
        j6  = tmp[6]  ^ B[bin++],
        j7  = tmp[7]  ^ B[bin++],
        j8  = tmp[8]  ^ B[bin++],
        j9  = tmp[9]  ^ B[bin++],
        j10 = tmp[10] ^ B[bin++],
        j11 = tmp[11] ^ B[bin++],
        j12 = tmp[12] ^ B[bin++],
        j13 = tmp[13] ^ B[bin++],
        j14 = tmp[14] ^ B[bin++],
        j15 = tmp[15] ^ B[bin++],
        u, i;

    var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
        x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
        x15 = j15;

    for (i = 0; i < 8; i += 2) {
      u =  x0 + x12;   x4 ^= u<<7  | u>>>(32-7);
      u =  x4 +  x0;   x8 ^= u<<9  | u>>>(32-9);
      u =  x8 +  x4;  x12 ^= u<<13 | u>>>(32-13);
      u = x12 +  x8;   x0 ^= u<<18 | u>>>(32-18);

      u =  x5 +  x1;   x9 ^= u<<7  | u>>>(32-7);
      u =  x9 +  x5;  x13 ^= u<<9  | u>>>(32-9);
      u = x13 +  x9;   x1 ^= u<<13 | u>>>(32-13);
      u =  x1 + x13;   x5 ^= u<<18 | u>>>(32-18);

      u = x10 +  x6;  x14 ^= u<<7  | u>>>(32-7);
      u = x14 + x10;   x2 ^= u<<9  | u>>>(32-9);
      u =  x2 + x14;   x6 ^= u<<13 | u>>>(32-13);
      u =  x6 +  x2;  x10 ^= u<<18 | u>>>(32-18);

      u = x15 + x11;   x3 ^= u<<7  | u>>>(32-7);
      u =  x3 + x15;   x7 ^= u<<9  | u>>>(32-9);
      u =  x7 +  x3;  x11 ^= u<<13 | u>>>(32-13);
      u = x11 +  x7;  x15 ^= u<<18 | u>>>(32-18);

      u =  x0 +  x3;   x1 ^= u<<7  | u>>>(32-7);
      u =  x1 +  x0;   x2 ^= u<<9  | u>>>(32-9);
      u =  x2 +  x1;   x3 ^= u<<13 | u>>>(32-13);
      u =  x3 +  x2;   x0 ^= u<<18 | u>>>(32-18);

      u =  x5 +  x4;   x6 ^= u<<7  | u>>>(32-7);
      u =  x6 +  x5;   x7 ^= u<<9  | u>>>(32-9);
      u =  x7 +  x6;   x4 ^= u<<13 | u>>>(32-13);
      u =  x4 +  x7;   x5 ^= u<<18 | u>>>(32-18);

      u = x10 +  x9;  x11 ^= u<<7  | u>>>(32-7);
      u = x11 + x10;   x8 ^= u<<9  | u>>>(32-9);
      u =  x8 + x11;   x9 ^= u<<13 | u>>>(32-13);
      u =  x9 +  x8;  x10 ^= u<<18 | u>>>(32-18);

      u = x15 + x14;  x12 ^= u<<7  | u>>>(32-7);
      u = x12 + x15;  x13 ^= u<<9  | u>>>(32-9);
      u = x13 + x12;  x14 ^= u<<13 | u>>>(32-13);
      u = x14 + x13;  x15 ^= u<<18 | u>>>(32-18);
    }

    B[bout++] = tmp[0]  = (x0  + j0)  | 0;
    B[bout++] = tmp[1]  = (x1  + j1)  | 0;
    B[bout++] = tmp[2]  = (x2  + j2)  | 0;
    B[bout++] = tmp[3]  = (x3  + j3)  | 0;
    B[bout++] = tmp[4]  = (x4  + j4)  | 0;
    B[bout++] = tmp[5]  = (x5  + j5)  | 0;
    B[bout++] = tmp[6]  = (x6  + j6)  | 0;
    B[bout++] = tmp[7]  = (x7  + j7)  | 0;
    B[bout++] = tmp[8]  = (x8  + j8)  | 0;
    B[bout++] = tmp[9]  = (x9  + j9)  | 0;
    B[bout++] = tmp[10] = (x10 + j10) | 0;
    B[bout++] = tmp[11] = (x11 + j11) | 0;
    B[bout++] = tmp[12] = (x12 + j12) | 0;
    B[bout++] = tmp[13] = (x13 + j13) | 0;
    B[bout++] = tmp[14] = (x14 + j14) | 0;
    B[bout++] = tmp[15] = (x15 + j15) | 0;
  }

  function blockCopy(dst, di, src, si, len) {
    while (len--) dst[di++] = src[si++];
  }

  function blockXOR(dst, di, src, si, len) {
    while (len--) dst[di++] ^= src[si++];
  }

  function blockMix(tmp, B, bin, bout, r) {
    blockCopy(tmp, 0, B, bin + (2*r-1)*16, 16);
    for (var i = 0; i < 2*r; i += 2) {
      salsaXOR(tmp, B, bin + i*16,      bout + i*8);
      salsaXOR(tmp, B, bin + i*16 + 16, bout + i*8 + r*16);
    }
  }

  function integerify(B, bi, r) {
    return B[bi+(2*r-1)*16];
  }

  function stringToUTF8Bytes(s) {
    var arr = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) {
        arr.push(c);
      } else if (c < 0x800) {
        arr.push(0xc0 | c >> 6);
        arr.push(0x80 | c & 0x3f);
      } else if (c < 0xd800) {
        arr.push(0xe0 | c >> 12);
        arr.push(0x80 | (c >> 6) & 0x3f);
        arr.push(0x80 | c & 0x3f);
      } else {
        if (i >= s.length - 1) {
          throw new Error('invalid string');
        }
        i++; // get one more character
        c = (c & 0x3ff) << 10;
        c |= s.charCodeAt(i) & 0x3ff;
        c += 0x10000;

        arr.push(0xf0 | c >> 18);
        arr.push(0x80 | (c >> 12) & 0x3f);
        arr.push(0x80 | (c >> 6) & 0x3f);
        arr.push(0x80 | c & 0x3f);
      }
    }
    return arr;
  }

  function bytesToHex(p) {
    /** @const */
    var enc = '0123456789abcdef'.split('');

    var len = p.length,
        arr = [],
        i = 0;

    for (; i < len; i++) {
        arr.push(enc[(p[i]>>>4) & 15]);
        arr.push(enc[(p[i]>>>0) & 15]);
    }
    return arr.join('');
  }

  function bytesToBase64(p) {
    /** @const */
    var enc = ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
              '0123456789+/').split('');

    var len = p.length,
        arr = [],
        i = 0,
        a, b, c, t;

    while (i < len) {
      a = i < len ? p[i++] : 0;
      b = i < len ? p[i++] : 0;
      c = i < len ? p[i++] : 0;
      t = (a << 16) + (b << 8) + c;
      arr.push(enc[(t >>> 3 * 6) & 63]);
      arr.push(enc[(t >>> 2 * 6) & 63]);
      arr.push(enc[(t >>> 1 * 6) & 63]);
      arr.push(enc[(t >>> 0 * 6) & 63]);
    }
    if (len % 3 > 0) {
      arr[arr.length-1] = '=';
      if (len % 3 === 1) arr[arr.length-2] = '=';
    }
    return arr.join('');
  }


  // Generate key.

  var MAX_UINT = (-1)>>>0,
      p = 1;

  if (typeof logN === "object") {
    // Called as: scrypt(password, salt, opts, callback)
    if (arguments.length > 4) {
      throw new Error('scrypt: incorrect number of arguments');
    }

    var opts = logN;

    callback = r;
    logN = opts.logN;
    if (typeof logN === 'undefined') {
      if (typeof opts.N !== 'undefined') {
        if (opts.N < 2 || opts.N > MAX_UINT)
          throw new Error('scrypt: N is out of range');

        if ((opts.N & (opts.N - 1)) !== 0)
          throw new Error('scrypt: N is not a power of 2');

        logN = Math.log(opts.N) / Math.LN2;
      } else {
        throw new Error('scrypt: missing N parameter');
      }
    }
    p = opts.p || 1;
    r = opts.r;
    dkLen = opts.dkLen || 32;
    interruptStep = opts.interruptStep || 0;
    encoding = opts.encoding;
  }

  if (p < 1)
    throw new Error('scrypt: invalid p');

  if (r <= 0)
    throw new Error('scrypt: invalid r');

  if (logN < 1 || logN > 31)
    throw new Error('scrypt: logN must be between 1 and 31');


  var N = (1<<logN)>>>0,
      XY, V, B, tmp;

  if (r*p >= 1<<30 || r > MAX_UINT/128/p || r > MAX_UINT/256 || N > MAX_UINT/128/r)
    throw new Error('scrypt: parameters are too large');

  // Decode strings.
  if (typeof password === 'string')
    password = stringToUTF8Bytes(password);
  if (typeof salt === 'string')
    salt = stringToUTF8Bytes(salt);

  if (typeof Int32Array !== 'undefined') {
    //XXX We can use Uint32Array, but Int32Array is faster in Safari.
    XY = new Int32Array(64*r);
    V = new Int32Array(32*N*r);
    tmp = new Int32Array(16);
  } else {
    XY = [];
    V = [];
    tmp = new Array(16);
  }
  B = PBKDF2_HMAC_SHA256_OneIter(password, salt, p*128*r);

  var xi = 0, yi = 32 * r;

  function smixStart(pos) {
    for (var i = 0; i < 32*r; i++) {
      var j = pos + i*4;
      XY[xi+i] = ((B[j+3] & 0xff)<<24) | ((B[j+2] & 0xff)<<16) |
                 ((B[j+1] & 0xff)<<8)  | ((B[j+0] & 0xff)<<0);
    }
  }

  function smixStep1(start, end) {
    for (var i = start; i < end; i += 2) {
      blockCopy(V, i*(32*r), XY, xi, 32*r);
      blockMix(tmp, XY, xi, yi, r);

      blockCopy(V, (i+1)*(32*r), XY, yi, 32*r);
      blockMix(tmp, XY, yi, xi, r);
    }
  }

  function smixStep2(start, end) {
    for (var i = start; i < end; i += 2) {
      var j = integerify(XY, xi, r) & (N-1);
      blockXOR(XY, xi, V, j*(32*r), 32*r);
      blockMix(tmp, XY, xi, yi, r);

      j = integerify(XY, yi, r) & (N-1);
      blockXOR(XY, yi, V, j*(32*r), 32*r);
      blockMix(tmp, XY, yi, xi, r);
    }
  }

  function smixFinish(pos) {
    for (var i = 0; i < 32*r; i++) {
      var j = XY[xi+i];
      B[pos + i*4 + 0] = (j>>>0)  & 0xff;
      B[pos + i*4 + 1] = (j>>>8)  & 0xff;
      B[pos + i*4 + 2] = (j>>>16) & 0xff;
      B[pos + i*4 + 3] = (j>>>24) & 0xff;
    }
  }

  var nextTick = (typeof setImmediate !== 'undefined') ? setImmediate : setTimeout;

  function interruptedFor(start, end, step, fn, donefn) {
    (function performStep() {
      nextTick(function() {
        fn(start, start + step < end ? start + step : end);
        start += step;
        if (start < end)
          performStep();
        else
          donefn();
        });
    })();
  }

  function getResult(enc) {
      var result = PBKDF2_HMAC_SHA256_OneIter(password, B, dkLen);
      if (enc === 'base64')
        return bytesToBase64(result);
      else if (enc === 'hex')
        return bytesToHex(result);
      else if (enc === 'binary')
        return new Uint8Array(result);
      else
        return result;
  }

  // Blocking variant.
  function calculateSync() {
    for (var i = 0; i < p; i++) {
      smixStart(i*128*r);
      smixStep1(0, N);
      smixStep2(0, N);
      smixFinish(i*128*r);
    }
    callback(getResult(encoding));
  }

  // Async variant.
  function calculateAsync(i) {
      smixStart(i*128*r);
      interruptedFor(0, N, interruptStep*2, smixStep1, function() {
        interruptedFor(0, N, interruptStep*2, smixStep2, function () {
          smixFinish(i*128*r);
          if (i + 1 < p) {
            nextTick(function() { calculateAsync(i + 1); });
          } else {
            callback(getResult(encoding));
          }
        });
      });
  }

  if (typeof interruptStep === 'function') {
    // Called as: scrypt(...,      callback, [encoding])
    //  shifting: scrypt(..., interruptStep,  callback, [encoding])
    encoding = callback;
    callback = interruptStep;
    interruptStep = 1000;
  }

  if (interruptStep <= 0) {
    calculateSync();
  } else {
    calculateAsync(0);
  }
}

if (typeof module !== 'undefined') module.exports = scrypt;

}).call(this)}).call(this,require("timers").setImmediate)
},{"timers":28}],68:[function(require,module,exports){
(function (Buffer){(function (){
const bip39 = require('bip39')

function validateBuffer(input, expectedLength) {
  if (!Buffer.isBuffer(input)) {
    throw new Error('not buffer!')
  }

  if (expectedLength && input.length !== expectedLength) {
    throw new Error('Invalid buffer length')
  }
}

function validateArray(input) {
  if (typeof input !== typeof []) {
    throw new Error('not an array!')
  }
}

function validateDerivationIndex(input) {
  if (!Number.isInteger(input)) {
    throw new Error('invalid derivation index!')
  }
}

function validateString(input) {
  if (typeof input !== typeof 'aa') {
    throw new Error('not a string!')
  }
}

function validateDerivationScheme(input) {
  if (input !== 1 && input !== 2) {
    throw new Error('invalid derivation scheme!')
  }
}

function validateMnemonic(input) {
  if (!bip39.validateMnemonic(input)) {
    const e = new Error('Invalid or unsupported mnemonic format:')
    e.name = 'InvalidArgumentException'
    throw e
  }
}

function validateMnemonicWords(input) {
  const wordlist = bip39.wordlists.EN
  const words = input.split(' ')

  const valid = words.reduce((result, word) => {
    return result && wordlist.indexOf(word) !== -1
  }, true)

  if (!valid) {
    throw new Error('Invalid mnemonic words')
  }
}

function validatePaperWalletMnemonic(input) {
  validateMnemonicWords(input)

  const mnemonicLength = input.split(' ').length

  if (mnemonicLength !== 27) {
    throw Error(
      `Paper Wallet Mnemonic must be 27 words, got ${mnemonicLength} instead`
    )
  }
}

function validateNetworkId(input) {
  if (!Number.isInteger(input) || input < 0 || input > 15) {
    throw Error(
      'Network id must be an integer between 0 and 15'
    )
  }
}

function validateUint32(input) {
  if (!Number.isInteger(input) || input < 0 || input >= Math.pow(2, 32)) {
    throw Error(
      'Value must be uint32'
    )
  }
}

module.exports = {
  validateBuffer,
  validateArray,
  validateString,
  validateDerivationIndex,
  validateDerivationScheme,
  validateMnemonic,
  validateMnemonicWords,
  validatePaperWalletMnemonic,
  validateNetworkId,
  validateUint32
}

}).call(this)}).call(this,{"isBuffer":require("../../../AppData/Roaming/npm/node_modules/browserify/node_modules/is-buffer/index.js")})
},{"../../../AppData/Roaming/npm/node_modules/browserify/node_modules/is-buffer/index.js":8,"bip39":33}],69:[function(require,module,exports){
(function (Buffer){(function (){
function variableLengthEncode(number) {
  if (number < 0) {
    throw new Error("Negative numbers not supported. Number supplied: " + number)
  }

  let encoded = []
  let bitLength = number.toString(2).length
  encoded.push(number & 127)

  while (bitLength > 7) {
    number >>= 7
    bitLength -= 7
    encoded.unshift((number & 127) + 128)
  }
  return Buffer.from(encoded)
}

module.exports = variableLengthEncode

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":4}],70:[function(require,module,exports){
var Buffer = require('safe-buffer').Buffer
var Transform = require('stream').Transform
var StringDecoder = require('string_decoder').StringDecoder
var inherits = require('inherits')

function CipherBase (hashMode) {
  Transform.call(this)
  this.hashMode = typeof hashMode === 'string'
  if (this.hashMode) {
    this[hashMode] = this._finalOrDigest
  } else {
    this.final = this._finalOrDigest
  }
  if (this._final) {
    this.__final = this._final
    this._final = null
  }
  this._decoder = null
  this._encoding = null
}
inherits(CipherBase, Transform)

CipherBase.prototype.update = function (data, inputEnc, outputEnc) {
  if (typeof data === 'string') {
    data = Buffer.from(data, inputEnc)
  }

  var outData = this._update(data)
  if (this.hashMode) return this

  if (outputEnc) {
    outData = this._toString(outData, outputEnc)
  }

  return outData
}

CipherBase.prototype.setAutoPadding = function () {}
CipherBase.prototype.getAuthTag = function () {
  throw new Error('trying to get auth tag in unsupported state')
}

CipherBase.prototype.setAuthTag = function () {
  throw new Error('trying to set auth tag in unsupported state')
}

CipherBase.prototype.setAAD = function () {
  throw new Error('trying to set aad in unsupported state')
}

CipherBase.prototype._transform = function (data, _, next) {
  var err
  try {
    if (this.hashMode) {
      this._update(data)
    } else {
      this.push(this._update(data))
    }
  } catch (e) {
    err = e
  } finally {
    next(err)
  }
}
CipherBase.prototype._flush = function (done) {
  var err
  try {
    this.push(this.__final())
  } catch (e) {
    err = e
  }

  done(err)
}
CipherBase.prototype._finalOrDigest = function (outputEnc) {
  var outData = this.__final() || Buffer.alloc(0)
  if (outputEnc) {
    outData = this._toString(outData, outputEnc, true)
  }
  return outData
}

CipherBase.prototype._toString = function (value, enc, fin) {
  if (!this._decoder) {
    this._decoder = new StringDecoder(enc)
    this._encoding = enc
  }

  if (this._encoding !== enc) throw new Error('can\'t switch encodings')

  var out = this._decoder.write(value)
  if (fin) {
    out += this._decoder.end()
  }

  return out
}

module.exports = CipherBase

},{"inherits":75,"safe-buffer":103,"stream":12,"string_decoder":27}],71:[function(require,module,exports){
'use strict'
var inherits = require('inherits')
var MD5 = require('md5.js')
var RIPEMD160 = require('ripemd160')
var sha = require('sha.js')
var Base = require('cipher-base')

function Hash (hash) {
  Base.call(this, 'digest')

  this._hash = hash
}

inherits(Hash, Base)

Hash.prototype._update = function (data) {
  this._hash.update(data)
}

Hash.prototype._final = function () {
  return this._hash.digest()
}

module.exports = function createHash (alg) {
  alg = alg.toLowerCase()
  if (alg === 'md5') return new MD5()
  if (alg === 'rmd160' || alg === 'ripemd160') return new RIPEMD160()

  return new Hash(sha(alg))
}

},{"cipher-base":70,"inherits":75,"md5.js":79,"ripemd160":102,"sha.js":105}],72:[function(require,module,exports){
var MD5 = require('md5.js')

module.exports = function (buffer) {
  return new MD5().update(buffer).digest()
}

},{"md5.js":79}],73:[function(require,module,exports){
'use strict'
var Buffer = require('safe-buffer').Buffer
var Transform = require('readable-stream').Transform
var inherits = require('inherits')

function throwIfNotStringOrBuffer (val, prefix) {
  if (!Buffer.isBuffer(val) && typeof val !== 'string') {
    throw new TypeError(prefix + ' must be a string or a buffer')
  }
}

function HashBase (blockSize) {
  Transform.call(this)

  this._block = Buffer.allocUnsafe(blockSize)
  this._blockSize = blockSize
  this._blockOffset = 0
  this._length = [0, 0, 0, 0]

  this._finalized = false
}

inherits(HashBase, Transform)

HashBase.prototype._transform = function (chunk, encoding, callback) {
  var error = null
  try {
    this.update(chunk, encoding)
  } catch (err) {
    error = err
  }

  callback(error)
}

HashBase.prototype._flush = function (callback) {
  var error = null
  try {
    this.push(this.digest())
  } catch (err) {
    error = err
  }

  callback(error)
}

HashBase.prototype.update = function (data, encoding) {
  throwIfNotStringOrBuffer(data, 'Data')
  if (this._finalized) throw new Error('Digest already called')
  if (!Buffer.isBuffer(data)) data = Buffer.from(data, encoding)

  // consume data
  var block = this._block
  var offset = 0
  while (this._blockOffset + data.length - offset >= this._blockSize) {
    for (var i = this._blockOffset; i < this._blockSize;) block[i++] = data[offset++]
    this._update()
    this._blockOffset = 0
  }
  while (offset < data.length) block[this._blockOffset++] = data[offset++]

  // update length
  for (var j = 0, carry = data.length * 8; carry > 0; ++j) {
    this._length[j] += carry
    carry = (this._length[j] / 0x0100000000) | 0
    if (carry > 0) this._length[j] -= 0x0100000000 * carry
  }

  return this
}

HashBase.prototype._update = function () {
  throw new Error('_update is not implemented')
}

HashBase.prototype.digest = function (encoding) {
  if (this._finalized) throw new Error('Digest already called')
  this._finalized = true

  var digest = this._digest()
  if (encoding !== undefined) digest = digest.toString(encoding)

  // reset state
  this._block.fill(0)
  this._blockOffset = 0
  for (var i = 0; i < 4; ++i) this._length[i] = 0

  return digest
}

HashBase.prototype._digest = function () {
  throw new Error('_digest is not implemented')
}

module.exports = HashBase

},{"inherits":75,"readable-stream":101,"safe-buffer":103}],74:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],75:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],76:[function(require,module,exports){
'use strict';

const {
    URLWithLegacySupport,
    format,
    URLSearchParams,
    defaultBase
} = require('./src/url');
const relative = require('./src/relative');

module.exports = {
    URL: URLWithLegacySupport,
    URLSearchParams,
    format,
    relative,
    defaultBase
};

},{"./src/relative":77,"./src/url":78}],77:[function(require,module,exports){
'use strict';

const { URLWithLegacySupport, format } = require('./url');

module.exports = (url, location = {}, protocolMap = {}, defaultProtocol) => {
    let protocol = location.protocol ?
        location.protocol.replace(':', '') :
        'http';

    // Check protocol map
    protocol = (protocolMap[protocol] || defaultProtocol || protocol) + ':';
    let urlParsed;

    try {
        urlParsed = new URLWithLegacySupport(url);
    } catch (err) {
        urlParsed = {};
    }

    const base = Object.assign({}, location, {
        protocol: protocol || urlParsed.protocol,
        host: location.host || urlParsed.host
    });

    return new URLWithLegacySupport(url, format(base)).toString();
};

},{"./url":78}],78:[function(require,module,exports){
'use strict';

const defaultBase = self.location ?
    self.location.protocol + '//' + self.location.host :
    '';
const URL = self.URL;

class URLWithLegacySupport {
    constructor(url = '', base = defaultBase) {
        this.super = new URL(url, base);
        this.path = this.pathname + this.search;
        this.auth =
            this.username && this.password ?
                this.username + ':' + this.password :
                null;

        this.query =
            this.search && this.search.startsWith('?') ?
                this.search.slice(1) :
                null;
    }

    get hash() {
        return this.super.hash;
    }
    get host() {
        return this.super.host;
    }
    get hostname() {
        return this.super.hostname;
    }
    get href() {
        return this.super.href;
    }
    get origin() {
        return this.super.origin;
    }
    get password() {
        return this.super.password;
    }
    get pathname() {
        return this.super.pathname;
    }
    get port() {
        return this.super.port;
    }
    get protocol() {
        return this.super.protocol;
    }
    get search() {
        return this.super.search;
    }
    get searchParams() {
        return this.super.searchParams;
    }
    get username() {
        return this.super.username;
    }

    set hash(hash) {
        this.super.hash = hash;
    }
    set host(host) {
        this.super.host = host;
    }
    set hostname(hostname) {
        this.super.hostname = hostname;
    }
    set href(href) {
        this.super.href = href;
    }
    set origin(origin) {
        this.super.origin = origin;
    }
    set password(password) {
        this.super.password = password;
    }
    set pathname(pathname) {
        this.super.pathname = pathname;
    }
    set port(port) {
        this.super.port = port;
    }
    set protocol(protocol) {
        this.super.protocol = protocol;
    }
    set search(search) {
        this.super.search = search;
    }
    set searchParams(searchParams) {
        this.super.searchParams = searchParams;
    }
    set username(username) {
        this.super.username = username;
    }

    createObjectURL(o) {
        return this.super.createObjectURL(o);
    }
    revokeObjectURL(o) {
        this.super.revokeObjectURL(o);
    }
    toJSON() {
        return this.super.toJSON();
    }
    toString() {
        return this.super.toString();
    }
    format() {
        return this.toString();
    }
}

function format(obj) {
    if (typeof obj === 'string') {
        const url = new URL(obj);

        return url.toString();
    }

    if (!(obj instanceof URL)) {
        const userPass =
            obj.username && obj.password ?
                `${obj.username}:${obj.password}@` :
                '';
        const auth = obj.auth ? obj.auth + '@' : '';
        const port = obj.port ? ':' + obj.port : '';
        const protocol = obj.protocol ? obj.protocol + '//' : '';
        const host = obj.host || '';
        const hostname = obj.hostname || '';
        const search = obj.search || (obj.query ? '?' + obj.query : '');
        const hash = obj.hash || '';
        const pathname = obj.pathname || '';
        const path = obj.path || pathname + search;

        return `${protocol}${userPass || auth}${host ||
            hostname + port}${path}${hash}`;
    }
}

module.exports = {
    URLWithLegacySupport,
    URLSearchParams: self.URLSearchParams,
    defaultBase,
    format
};

},{}],79:[function(require,module,exports){
'use strict'
var inherits = require('inherits')
var HashBase = require('hash-base')
var Buffer = require('safe-buffer').Buffer

var ARRAY16 = new Array(16)

function MD5 () {
  HashBase.call(this, 64)

  // state
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
}

inherits(MD5, HashBase)

MD5.prototype._update = function () {
  var M = ARRAY16
  for (var i = 0; i < 16; ++i) M[i] = this._block.readInt32LE(i * 4)

  var a = this._a
  var b = this._b
  var c = this._c
  var d = this._d

  a = fnF(a, b, c, d, M[0], 0xd76aa478, 7)
  d = fnF(d, a, b, c, M[1], 0xe8c7b756, 12)
  c = fnF(c, d, a, b, M[2], 0x242070db, 17)
  b = fnF(b, c, d, a, M[3], 0xc1bdceee, 22)
  a = fnF(a, b, c, d, M[4], 0xf57c0faf, 7)
  d = fnF(d, a, b, c, M[5], 0x4787c62a, 12)
  c = fnF(c, d, a, b, M[6], 0xa8304613, 17)
  b = fnF(b, c, d, a, M[7], 0xfd469501, 22)
  a = fnF(a, b, c, d, M[8], 0x698098d8, 7)
  d = fnF(d, a, b, c, M[9], 0x8b44f7af, 12)
  c = fnF(c, d, a, b, M[10], 0xffff5bb1, 17)
  b = fnF(b, c, d, a, M[11], 0x895cd7be, 22)
  a = fnF(a, b, c, d, M[12], 0x6b901122, 7)
  d = fnF(d, a, b, c, M[13], 0xfd987193, 12)
  c = fnF(c, d, a, b, M[14], 0xa679438e, 17)
  b = fnF(b, c, d, a, M[15], 0x49b40821, 22)

  a = fnG(a, b, c, d, M[1], 0xf61e2562, 5)
  d = fnG(d, a, b, c, M[6], 0xc040b340, 9)
  c = fnG(c, d, a, b, M[11], 0x265e5a51, 14)
  b = fnG(b, c, d, a, M[0], 0xe9b6c7aa, 20)
  a = fnG(a, b, c, d, M[5], 0xd62f105d, 5)
  d = fnG(d, a, b, c, M[10], 0x02441453, 9)
  c = fnG(c, d, a, b, M[15], 0xd8a1e681, 14)
  b = fnG(b, c, d, a, M[4], 0xe7d3fbc8, 20)
  a = fnG(a, b, c, d, M[9], 0x21e1cde6, 5)
  d = fnG(d, a, b, c, M[14], 0xc33707d6, 9)
  c = fnG(c, d, a, b, M[3], 0xf4d50d87, 14)
  b = fnG(b, c, d, a, M[8], 0x455a14ed, 20)
  a = fnG(a, b, c, d, M[13], 0xa9e3e905, 5)
  d = fnG(d, a, b, c, M[2], 0xfcefa3f8, 9)
  c = fnG(c, d, a, b, M[7], 0x676f02d9, 14)
  b = fnG(b, c, d, a, M[12], 0x8d2a4c8a, 20)

  a = fnH(a, b, c, d, M[5], 0xfffa3942, 4)
  d = fnH(d, a, b, c, M[8], 0x8771f681, 11)
  c = fnH(c, d, a, b, M[11], 0x6d9d6122, 16)
  b = fnH(b, c, d, a, M[14], 0xfde5380c, 23)
  a = fnH(a, b, c, d, M[1], 0xa4beea44, 4)
  d = fnH(d, a, b, c, M[4], 0x4bdecfa9, 11)
  c = fnH(c, d, a, b, M[7], 0xf6bb4b60, 16)
  b = fnH(b, c, d, a, M[10], 0xbebfbc70, 23)
  a = fnH(a, b, c, d, M[13], 0x289b7ec6, 4)
  d = fnH(d, a, b, c, M[0], 0xeaa127fa, 11)
  c = fnH(c, d, a, b, M[3], 0xd4ef3085, 16)
  b = fnH(b, c, d, a, M[6], 0x04881d05, 23)
  a = fnH(a, b, c, d, M[9], 0xd9d4d039, 4)
  d = fnH(d, a, b, c, M[12], 0xe6db99e5, 11)
  c = fnH(c, d, a, b, M[15], 0x1fa27cf8, 16)
  b = fnH(b, c, d, a, M[2], 0xc4ac5665, 23)

  a = fnI(a, b, c, d, M[0], 0xf4292244, 6)
  d = fnI(d, a, b, c, M[7], 0x432aff97, 10)
  c = fnI(c, d, a, b, M[14], 0xab9423a7, 15)
  b = fnI(b, c, d, a, M[5], 0xfc93a039, 21)
  a = fnI(a, b, c, d, M[12], 0x655b59c3, 6)
  d = fnI(d, a, b, c, M[3], 0x8f0ccc92, 10)
  c = fnI(c, d, a, b, M[10], 0xffeff47d, 15)
  b = fnI(b, c, d, a, M[1], 0x85845dd1, 21)
  a = fnI(a, b, c, d, M[8], 0x6fa87e4f, 6)
  d = fnI(d, a, b, c, M[15], 0xfe2ce6e0, 10)
  c = fnI(c, d, a, b, M[6], 0xa3014314, 15)
  b = fnI(b, c, d, a, M[13], 0x4e0811a1, 21)
  a = fnI(a, b, c, d, M[4], 0xf7537e82, 6)
  d = fnI(d, a, b, c, M[11], 0xbd3af235, 10)
  c = fnI(c, d, a, b, M[2], 0x2ad7d2bb, 15)
  b = fnI(b, c, d, a, M[9], 0xeb86d391, 21)

  this._a = (this._a + a) | 0
  this._b = (this._b + b) | 0
  this._c = (this._c + c) | 0
  this._d = (this._d + d) | 0
}

MD5.prototype._digest = function () {
  // create padding and handle blocks
  this._block[this._blockOffset++] = 0x80
  if (this._blockOffset > 56) {
    this._block.fill(0, this._blockOffset, 64)
    this._update()
    this._blockOffset = 0
  }

  this._block.fill(0, this._blockOffset, 56)
  this._block.writeUInt32LE(this._length[0], 56)
  this._block.writeUInt32LE(this._length[1], 60)
  this._update()

  // produce result
  var buffer = Buffer.allocUnsafe(16)
  buffer.writeInt32LE(this._a, 0)
  buffer.writeInt32LE(this._b, 4)
  buffer.writeInt32LE(this._c, 8)
  buffer.writeInt32LE(this._d, 12)
  return buffer
}

function rotl (x, n) {
  return (x << n) | (x >>> (32 - n))
}

function fnF (a, b, c, d, m, k, s) {
  return (rotl((a + ((b & c) | ((~b) & d)) + m + k) | 0, s) + b) | 0
}

function fnG (a, b, c, d, m, k, s) {
  return (rotl((a + ((b & d) | (c & (~d))) + m + k) | 0, s) + b) | 0
}

function fnH (a, b, c, d, m, k, s) {
  return (rotl((a + (b ^ c ^ d) + m + k) | 0, s) + b) | 0
}

function fnI (a, b, c, d, m, k, s) {
  return (rotl((a + ((c ^ (b | (~d)))) + m + k) | 0, s) + b) | 0
}

module.exports = MD5

},{"hash-base":73,"inherits":75,"safe-buffer":103}],80:[function(require,module,exports){
exports.pbkdf2 = require('./lib/async')
exports.pbkdf2Sync = require('./lib/sync')

},{"./lib/async":81,"./lib/sync":84}],81:[function(require,module,exports){
(function (global){(function (){
var Buffer = require('safe-buffer').Buffer

var checkParameters = require('./precondition')
var defaultEncoding = require('./default-encoding')
var sync = require('./sync')
var toBuffer = require('./to-buffer')

var ZERO_BUF
var subtle = global.crypto && global.crypto.subtle
var toBrowser = {
  sha: 'SHA-1',
  'sha-1': 'SHA-1',
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  'sha-256': 'SHA-256',
  sha384: 'SHA-384',
  'sha-384': 'SHA-384',
  'sha-512': 'SHA-512',
  sha512: 'SHA-512'
}
var checks = []
function checkNative (algo) {
  if (global.process && !global.process.browser) {
    return Promise.resolve(false)
  }
  if (!subtle || !subtle.importKey || !subtle.deriveBits) {
    return Promise.resolve(false)
  }
  if (checks[algo] !== undefined) {
    return checks[algo]
  }
  ZERO_BUF = ZERO_BUF || Buffer.alloc(8)
  var prom = browserPbkdf2(ZERO_BUF, ZERO_BUF, 10, 128, algo)
    .then(function () {
      return true
    }).catch(function () {
      return false
    })
  checks[algo] = prom
  return prom
}
var nextTick
function getNextTick () {
  if (nextTick) {
    return nextTick
  }
  if (global.process && global.process.nextTick) {
    nextTick = global.process.nextTick
  } else if (global.queueMicrotask) {
    nextTick = global.queueMicrotask
  } else if (global.setImmediate) {
    nextTick = global.setImmediate
  } else {
    nextTick = global.setTimeout
  }
  return nextTick
}
function browserPbkdf2 (password, salt, iterations, length, algo) {
  return subtle.importKey(
    'raw', password, { name: 'PBKDF2' }, false, ['deriveBits']
  ).then(function (key) {
    return subtle.deriveBits({
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: {
        name: algo
      }
    }, key, length << 3)
  }).then(function (res) {
    return Buffer.from(res)
  })
}

function resolvePromise (promise, callback) {
  promise.then(function (out) {
    getNextTick()(function () {
      callback(null, out)
    })
  }, function (e) {
    getNextTick()(function () {
      callback(e)
    })
  })
}
module.exports = function (password, salt, iterations, keylen, digest, callback) {
  if (typeof digest === 'function') {
    callback = digest
    digest = undefined
  }

  digest = digest || 'sha1'
  var algo = toBrowser[digest.toLowerCase()]

  if (!algo || typeof global.Promise !== 'function') {
    getNextTick()(function () {
      var out
      try {
        out = sync(password, salt, iterations, keylen, digest)
      } catch (e) {
        return callback(e)
      }
      callback(null, out)
    })
    return
  }

  checkParameters(iterations, keylen)
  password = toBuffer(password, defaultEncoding, 'Password')
  salt = toBuffer(salt, defaultEncoding, 'Salt')
  if (typeof callback !== 'function') throw new Error('No callback provided to pbkdf2')

  resolvePromise(checkNative(algo).then(function (resp) {
    if (resp) return browserPbkdf2(password, salt, iterations, keylen, algo)

    return sync(password, salt, iterations, keylen, digest)
  }), callback)
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./default-encoding":82,"./precondition":83,"./sync":84,"./to-buffer":85,"safe-buffer":103}],82:[function(require,module,exports){
(function (process,global){(function (){
var defaultEncoding
/* istanbul ignore next */
if (global.process && global.process.browser) {
  defaultEncoding = 'utf-8'
} else if (global.process && global.process.version) {
  var pVersionMajor = parseInt(process.version.split('.')[0].slice(1), 10)

  defaultEncoding = pVersionMajor >= 6 ? 'utf-8' : 'binary'
} else {
  defaultEncoding = 'utf-8'
}
module.exports = defaultEncoding

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":10}],83:[function(require,module,exports){
var MAX_ALLOC = Math.pow(2, 30) - 1 // default in iojs

module.exports = function (iterations, keylen) {
  if (typeof iterations !== 'number') {
    throw new TypeError('Iterations not a number')
  }

  if (iterations < 0) {
    throw new TypeError('Bad iterations')
  }

  if (typeof keylen !== 'number') {
    throw new TypeError('Key length not a number')
  }

  if (keylen < 0 || keylen > MAX_ALLOC || keylen !== keylen) { /* eslint no-self-compare: 0 */
    throw new TypeError('Bad key length')
  }
}

},{}],84:[function(require,module,exports){
var md5 = require('create-hash/md5')
var RIPEMD160 = require('ripemd160')
var sha = require('sha.js')
var Buffer = require('safe-buffer').Buffer

var checkParameters = require('./precondition')
var defaultEncoding = require('./default-encoding')
var toBuffer = require('./to-buffer')

var ZEROS = Buffer.alloc(128)
var sizes = {
  md5: 16,
  sha1: 20,
  sha224: 28,
  sha256: 32,
  sha384: 48,
  sha512: 64,
  rmd160: 20,
  ripemd160: 20
}

function Hmac (alg, key, saltLen) {
  var hash = getDigest(alg)
  var blocksize = (alg === 'sha512' || alg === 'sha384') ? 128 : 64

  if (key.length > blocksize) {
    key = hash(key)
  } else if (key.length < blocksize) {
    key = Buffer.concat([key, ZEROS], blocksize)
  }

  var ipad = Buffer.allocUnsafe(blocksize + sizes[alg])
  var opad = Buffer.allocUnsafe(blocksize + sizes[alg])
  for (var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var ipad1 = Buffer.allocUnsafe(blocksize + saltLen + 4)
  ipad.copy(ipad1, 0, 0, blocksize)
  this.ipad1 = ipad1
  this.ipad2 = ipad
  this.opad = opad
  this.alg = alg
  this.blocksize = blocksize
  this.hash = hash
  this.size = sizes[alg]
}

Hmac.prototype.run = function (data, ipad) {
  data.copy(ipad, this.blocksize)
  var h = this.hash(ipad)
  h.copy(this.opad, this.blocksize)
  return this.hash(this.opad)
}

function getDigest (alg) {
  function shaFunc (data) {
    return sha(alg).update(data).digest()
  }
  function rmd160Func (data) {
    return new RIPEMD160().update(data).digest()
  }

  if (alg === 'rmd160' || alg === 'ripemd160') return rmd160Func
  if (alg === 'md5') return md5
  return shaFunc
}

function pbkdf2 (password, salt, iterations, keylen, digest) {
  checkParameters(iterations, keylen)
  password = toBuffer(password, defaultEncoding, 'Password')
  salt = toBuffer(salt, defaultEncoding, 'Salt')

  digest = digest || 'sha1'

  var hmac = new Hmac(digest, password, salt.length)

  var DK = Buffer.allocUnsafe(keylen)
  var block1 = Buffer.allocUnsafe(salt.length + 4)
  salt.copy(block1, 0, 0, salt.length)

  var destPos = 0
  var hLen = sizes[digest]
  var l = Math.ceil(keylen / hLen)

  for (var i = 1; i <= l; i++) {
    block1.writeUInt32BE(i, salt.length)

    var T = hmac.run(block1, hmac.ipad1)
    var U = T

    for (var j = 1; j < iterations; j++) {
      U = hmac.run(U, hmac.ipad2)
      for (var k = 0; k < hLen; k++) T[k] ^= U[k]
    }

    T.copy(DK, destPos)
    destPos += hLen
  }

  return DK
}

module.exports = pbkdf2

},{"./default-encoding":82,"./precondition":83,"./to-buffer":85,"create-hash/md5":72,"ripemd160":102,"safe-buffer":103,"sha.js":105}],85:[function(require,module,exports){
var Buffer = require('safe-buffer').Buffer

module.exports = function (thing, encoding, name) {
  if (Buffer.isBuffer(thing)) {
    return thing
  } else if (typeof thing === 'string') {
    return Buffer.from(thing, encoding)
  } else if (ArrayBuffer.isView(thing)) {
    return Buffer.from(thing.buffer)
  } else {
    throw new TypeError(name + ' must be a string, a Buffer, a typed array or a DataView')
  }
}

},{"safe-buffer":103}],86:[function(require,module,exports){
(function (process,global){(function (){
'use strict'

// limit of Crypto.getRandomValues()
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
var MAX_BYTES = 65536

// Node supports requesting up to this number of bytes
// https://github.com/nodejs/node/blob/master/lib/internal/crypto/random.js#L48
var MAX_UINT32 = 4294967295

function oldBrowser () {
  throw new Error('Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11')
}

var Buffer = require('safe-buffer').Buffer
var crypto = global.crypto || global.msCrypto

if (crypto && crypto.getRandomValues) {
  module.exports = randomBytes
} else {
  module.exports = oldBrowser
}

function randomBytes (size, cb) {
  // phantomjs needs to throw
  if (size > MAX_UINT32) throw new RangeError('requested too many random bytes')

  var bytes = Buffer.allocUnsafe(size)

  if (size > 0) {  // getRandomValues fails on IE if size == 0
    if (size > MAX_BYTES) { // this is the max bytes crypto.getRandomValues
      // can do at once see https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
      for (var generated = 0; generated < size; generated += MAX_BYTES) {
        // buffer.slice automatically checks if the end is past the end of
        // the buffer so we don't have to here
        crypto.getRandomValues(bytes.slice(generated, generated + MAX_BYTES))
      }
    } else {
      crypto.getRandomValues(bytes)
    }
  }

  if (typeof cb === 'function') {
    return process.nextTick(function () {
      cb(null, bytes)
    })
  }

  return bytes
}

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":10,"safe-buffer":103}],87:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13}],88:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"./_stream_readable":90,"./_stream_writable":92,"_process":10,"dup":14,"inherits":75}],89:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./_stream_transform":91,"dup":15,"inherits":75}],90:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"../errors":87,"./_stream_duplex":88,"./internal/streams/async_iterator":93,"./internal/streams/buffer_list":94,"./internal/streams/destroy":95,"./internal/streams/from":97,"./internal/streams/state":99,"./internal/streams/stream":100,"_process":10,"buffer":4,"dup":16,"events":5,"inherits":75,"string_decoder/":112,"util":3}],91:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"../errors":87,"./_stream_duplex":88,"dup":17,"inherits":75}],92:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"../errors":87,"./_stream_duplex":88,"./internal/streams/destroy":95,"./internal/streams/state":99,"./internal/streams/stream":100,"_process":10,"buffer":4,"dup":18,"inherits":75,"util-deprecate":113}],93:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./end-of-stream":96,"_process":10,"dup":19}],94:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"buffer":4,"dup":20,"util":3}],95:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"_process":10,"dup":21}],96:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"../../../errors":87,"dup":22}],97:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],98:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"../../../errors":87,"./end-of-stream":96,"dup":24}],99:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"../../../errors":87,"dup":25}],100:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"events":5}],101:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');
exports.finished = require('./lib/internal/streams/end-of-stream.js');
exports.pipeline = require('./lib/internal/streams/pipeline.js');

},{"./lib/_stream_duplex.js":88,"./lib/_stream_passthrough.js":89,"./lib/_stream_readable.js":90,"./lib/_stream_transform.js":91,"./lib/_stream_writable.js":92,"./lib/internal/streams/end-of-stream.js":96,"./lib/internal/streams/pipeline.js":98}],102:[function(require,module,exports){
'use strict'
var Buffer = require('buffer').Buffer
var inherits = require('inherits')
var HashBase = require('hash-base')

var ARRAY16 = new Array(16)

var zl = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
]

var zr = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
]

var sl = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
]

var sr = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
]

var hl = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]
var hr = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]

function RIPEMD160 () {
  HashBase.call(this, 64)

  // state
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0
}

inherits(RIPEMD160, HashBase)

RIPEMD160.prototype._update = function () {
  var words = ARRAY16
  for (var j = 0; j < 16; ++j) words[j] = this._block.readInt32LE(j * 4)

  var al = this._a | 0
  var bl = this._b | 0
  var cl = this._c | 0
  var dl = this._d | 0
  var el = this._e | 0

  var ar = this._a | 0
  var br = this._b | 0
  var cr = this._c | 0
  var dr = this._d | 0
  var er = this._e | 0

  // computation
  for (var i = 0; i < 80; i += 1) {
    var tl
    var tr
    if (i < 16) {
      tl = fn1(al, bl, cl, dl, el, words[zl[i]], hl[0], sl[i])
      tr = fn5(ar, br, cr, dr, er, words[zr[i]], hr[0], sr[i])
    } else if (i < 32) {
      tl = fn2(al, bl, cl, dl, el, words[zl[i]], hl[1], sl[i])
      tr = fn4(ar, br, cr, dr, er, words[zr[i]], hr[1], sr[i])
    } else if (i < 48) {
      tl = fn3(al, bl, cl, dl, el, words[zl[i]], hl[2], sl[i])
      tr = fn3(ar, br, cr, dr, er, words[zr[i]], hr[2], sr[i])
    } else if (i < 64) {
      tl = fn4(al, bl, cl, dl, el, words[zl[i]], hl[3], sl[i])
      tr = fn2(ar, br, cr, dr, er, words[zr[i]], hr[3], sr[i])
    } else { // if (i<80) {
      tl = fn5(al, bl, cl, dl, el, words[zl[i]], hl[4], sl[i])
      tr = fn1(ar, br, cr, dr, er, words[zr[i]], hr[4], sr[i])
    }

    al = el
    el = dl
    dl = rotl(cl, 10)
    cl = bl
    bl = tl

    ar = er
    er = dr
    dr = rotl(cr, 10)
    cr = br
    br = tr
  }

  // update state
  var t = (this._b + cl + dr) | 0
  this._b = (this._c + dl + er) | 0
  this._c = (this._d + el + ar) | 0
  this._d = (this._e + al + br) | 0
  this._e = (this._a + bl + cr) | 0
  this._a = t
}

RIPEMD160.prototype._digest = function () {
  // create padding and handle blocks
  this._block[this._blockOffset++] = 0x80
  if (this._blockOffset > 56) {
    this._block.fill(0, this._blockOffset, 64)
    this._update()
    this._blockOffset = 0
  }

  this._block.fill(0, this._blockOffset, 56)
  this._block.writeUInt32LE(this._length[0], 56)
  this._block.writeUInt32LE(this._length[1], 60)
  this._update()

  // produce result
  var buffer = Buffer.alloc ? Buffer.alloc(20) : new Buffer(20)
  buffer.writeInt32LE(this._a, 0)
  buffer.writeInt32LE(this._b, 4)
  buffer.writeInt32LE(this._c, 8)
  buffer.writeInt32LE(this._d, 12)
  buffer.writeInt32LE(this._e, 16)
  return buffer
}

function rotl (x, n) {
  return (x << n) | (x >>> (32 - n))
}

function fn1 (a, b, c, d, e, m, k, s) {
  return (rotl((a + (b ^ c ^ d) + m + k) | 0, s) + e) | 0
}

function fn2 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b & c) | ((~b) & d)) + m + k) | 0, s) + e) | 0
}

function fn3 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b | (~c)) ^ d) + m + k) | 0, s) + e) | 0
}

function fn4 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b & d) | (c & (~d))) + m + k) | 0, s) + e) | 0
}

function fn5 (a, b, c, d, e, m, k, s) {
  return (rotl((a + (b ^ (c | (~d))) + m + k) | 0, s) + e) | 0
}

module.exports = RIPEMD160

},{"buffer":4,"hash-base":73,"inherits":75}],103:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"buffer":4,"dup":11}],104:[function(require,module,exports){
var Buffer = require('safe-buffer').Buffer

// prototype class for hash functions
function Hash (blockSize, finalSize) {
  this._block = Buffer.alloc(blockSize)
  this._finalSize = finalSize
  this._blockSize = blockSize
  this._len = 0
}

Hash.prototype.update = function (data, enc) {
  if (typeof data === 'string') {
    enc = enc || 'utf8'
    data = Buffer.from(data, enc)
  }

  var block = this._block
  var blockSize = this._blockSize
  var length = data.length
  var accum = this._len

  for (var offset = 0; offset < length;) {
    var assigned = accum % blockSize
    var remainder = Math.min(length - offset, blockSize - assigned)

    for (var i = 0; i < remainder; i++) {
      block[assigned + i] = data[offset + i]
    }

    accum += remainder
    offset += remainder

    if ((accum % blockSize) === 0) {
      this._update(block)
    }
  }

  this._len += length
  return this
}

Hash.prototype.digest = function (enc) {
  var rem = this._len % this._blockSize

  this._block[rem] = 0x80

  // zero (rem + 1) trailing bits, where (rem + 1) is the smallest
  // non-negative solution to the equation (length + 1 + (rem + 1)) === finalSize mod blockSize
  this._block.fill(0, rem + 1)

  if (rem >= this._finalSize) {
    this._update(this._block)
    this._block.fill(0)
  }

  var bits = this._len * 8

  // uint32
  if (bits <= 0xffffffff) {
    this._block.writeUInt32BE(bits, this._blockSize - 4)

  // uint64
  } else {
    var lowBits = (bits & 0xffffffff) >>> 0
    var highBits = (bits - lowBits) / 0x100000000

    this._block.writeUInt32BE(highBits, this._blockSize - 8)
    this._block.writeUInt32BE(lowBits, this._blockSize - 4)
  }

  this._update(this._block)
  var hash = this._hash()

  return enc ? hash.toString(enc) : hash
}

Hash.prototype._update = function () {
  throw new Error('_update must be implemented by subclass')
}

module.exports = Hash

},{"safe-buffer":103}],105:[function(require,module,exports){
var exports = module.exports = function SHA (algorithm) {
  algorithm = algorithm.toLowerCase()

  var Algorithm = exports[algorithm]
  if (!Algorithm) throw new Error(algorithm + ' is not supported (we accept pull requests)')

  return new Algorithm()
}

exports.sha = require('./sha')
exports.sha1 = require('./sha1')
exports.sha224 = require('./sha224')
exports.sha256 = require('./sha256')
exports.sha384 = require('./sha384')
exports.sha512 = require('./sha512')

},{"./sha":106,"./sha1":107,"./sha224":108,"./sha256":109,"./sha384":110,"./sha512":111}],106:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-0, as defined
 * in FIPS PUB 180-1
 * This source code is derived from sha1.js of the same repository.
 * The difference between SHA-0 and SHA-1 is just a bitwise rotate left
 * operation was added.
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha, Hash)

Sha.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha

},{"./hash":104,"inherits":75,"safe-buffer":103}],107:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha1 () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha1, Hash)

Sha1.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl1 (num) {
  return (num << 1) | (num >>> 31)
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha1.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = rotl1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16])

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha1.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha1

},{"./hash":104,"inherits":75,"safe-buffer":103}],108:[function(require,module,exports){
/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Sha256 = require('./sha256')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var W = new Array(64)

function Sha224 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha224, Sha256)

Sha224.prototype.init = function () {
  this._a = 0xc1059ed8
  this._b = 0x367cd507
  this._c = 0x3070dd17
  this._d = 0xf70e5939
  this._e = 0xffc00b31
  this._f = 0x68581511
  this._g = 0x64f98fa7
  this._h = 0xbefa4fa4

  return this
}

Sha224.prototype._hash = function () {
  var H = Buffer.allocUnsafe(28)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)

  return H
}

module.exports = Sha224

},{"./hash":104,"./sha256":109,"inherits":75,"safe-buffer":103}],109:[function(require,module,exports){
/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
]

var W = new Array(64)

function Sha256 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha256, Hash)

Sha256.prototype.init = function () {
  this._a = 0x6a09e667
  this._b = 0xbb67ae85
  this._c = 0x3c6ef372
  this._d = 0xa54ff53a
  this._e = 0x510e527f
  this._f = 0x9b05688c
  this._g = 0x1f83d9ab
  this._h = 0x5be0cd19

  return this
}

function ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x) {
  return (x >>> 2 | x << 30) ^ (x >>> 13 | x << 19) ^ (x >>> 22 | x << 10)
}

function sigma1 (x) {
  return (x >>> 6 | x << 26) ^ (x >>> 11 | x << 21) ^ (x >>> 25 | x << 7)
}

function gamma0 (x) {
  return (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)
}

function gamma1 (x) {
  return (x >>> 17 | x << 15) ^ (x >>> 19 | x << 13) ^ (x >>> 10)
}

Sha256.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0
  var f = this._f | 0
  var g = this._g | 0
  var h = this._h | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 64; ++i) W[i] = (gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16]) | 0

  for (var j = 0; j < 64; ++j) {
    var T1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) | 0
    var T2 = (sigma0(a) + maj(a, b, c)) | 0

    h = g
    g = f
    f = e
    e = (d + T1) | 0
    d = c
    c = b
    b = a
    a = (T1 + T2) | 0
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
  this._f = (f + this._f) | 0
  this._g = (g + this._g) | 0
  this._h = (h + this._h) | 0
}

Sha256.prototype._hash = function () {
  var H = Buffer.allocUnsafe(32)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)
  H.writeInt32BE(this._h, 28)

  return H
}

module.exports = Sha256

},{"./hash":104,"inherits":75,"safe-buffer":103}],110:[function(require,module,exports){
var inherits = require('inherits')
var SHA512 = require('./sha512')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var W = new Array(160)

function Sha384 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha384, SHA512)

Sha384.prototype.init = function () {
  this._ah = 0xcbbb9d5d
  this._bh = 0x629a292a
  this._ch = 0x9159015a
  this._dh = 0x152fecd8
  this._eh = 0x67332667
  this._fh = 0x8eb44a87
  this._gh = 0xdb0c2e0d
  this._hh = 0x47b5481d

  this._al = 0xc1059ed8
  this._bl = 0x367cd507
  this._cl = 0x3070dd17
  this._dl = 0xf70e5939
  this._el = 0xffc00b31
  this._fl = 0x68581511
  this._gl = 0x64f98fa7
  this._hl = 0xbefa4fa4

  return this
}

Sha384.prototype._hash = function () {
  var H = Buffer.allocUnsafe(48)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)

  return H
}

module.exports = Sha384

},{"./hash":104,"./sha512":111,"inherits":75,"safe-buffer":103}],111:[function(require,module,exports){
var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
]

var W = new Array(160)

function Sha512 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha512, Hash)

Sha512.prototype.init = function () {
  this._ah = 0x6a09e667
  this._bh = 0xbb67ae85
  this._ch = 0x3c6ef372
  this._dh = 0xa54ff53a
  this._eh = 0x510e527f
  this._fh = 0x9b05688c
  this._gh = 0x1f83d9ab
  this._hh = 0x5be0cd19

  this._al = 0xf3bcc908
  this._bl = 0x84caa73b
  this._cl = 0xfe94f82b
  this._dl = 0x5f1d36f1
  this._el = 0xade682d1
  this._fl = 0x2b3e6c1f
  this._gl = 0xfb41bd6b
  this._hl = 0x137e2179

  return this
}

function Ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x, xl) {
  return (x >>> 28 | xl << 4) ^ (xl >>> 2 | x << 30) ^ (xl >>> 7 | x << 25)
}

function sigma1 (x, xl) {
  return (x >>> 14 | xl << 18) ^ (x >>> 18 | xl << 14) ^ (xl >>> 9 | x << 23)
}

function Gamma0 (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7)
}

function Gamma0l (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7 | xl << 25)
}

function Gamma1 (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6)
}

function Gamma1l (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6 | xl << 26)
}

function getCarry (a, b) {
  return (a >>> 0) < (b >>> 0) ? 1 : 0
}

Sha512.prototype._update = function (M) {
  var W = this._w

  var ah = this._ah | 0
  var bh = this._bh | 0
  var ch = this._ch | 0
  var dh = this._dh | 0
  var eh = this._eh | 0
  var fh = this._fh | 0
  var gh = this._gh | 0
  var hh = this._hh | 0

  var al = this._al | 0
  var bl = this._bl | 0
  var cl = this._cl | 0
  var dl = this._dl | 0
  var el = this._el | 0
  var fl = this._fl | 0
  var gl = this._gl | 0
  var hl = this._hl | 0

  for (var i = 0; i < 32; i += 2) {
    W[i] = M.readInt32BE(i * 4)
    W[i + 1] = M.readInt32BE(i * 4 + 4)
  }
  for (; i < 160; i += 2) {
    var xh = W[i - 15 * 2]
    var xl = W[i - 15 * 2 + 1]
    var gamma0 = Gamma0(xh, xl)
    var gamma0l = Gamma0l(xl, xh)

    xh = W[i - 2 * 2]
    xl = W[i - 2 * 2 + 1]
    var gamma1 = Gamma1(xh, xl)
    var gamma1l = Gamma1l(xl, xh)

    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
    var Wi7h = W[i - 7 * 2]
    var Wi7l = W[i - 7 * 2 + 1]

    var Wi16h = W[i - 16 * 2]
    var Wi16l = W[i - 16 * 2 + 1]

    var Wil = (gamma0l + Wi7l) | 0
    var Wih = (gamma0 + Wi7h + getCarry(Wil, gamma0l)) | 0
    Wil = (Wil + gamma1l) | 0
    Wih = (Wih + gamma1 + getCarry(Wil, gamma1l)) | 0
    Wil = (Wil + Wi16l) | 0
    Wih = (Wih + Wi16h + getCarry(Wil, Wi16l)) | 0

    W[i] = Wih
    W[i + 1] = Wil
  }

  for (var j = 0; j < 160; j += 2) {
    Wih = W[j]
    Wil = W[j + 1]

    var majh = maj(ah, bh, ch)
    var majl = maj(al, bl, cl)

    var sigma0h = sigma0(ah, al)
    var sigma0l = sigma0(al, ah)
    var sigma1h = sigma1(eh, el)
    var sigma1l = sigma1(el, eh)

    // t1 = h + sigma1 + ch + K[j] + W[j]
    var Kih = K[j]
    var Kil = K[j + 1]

    var chh = Ch(eh, fh, gh)
    var chl = Ch(el, fl, gl)

    var t1l = (hl + sigma1l) | 0
    var t1h = (hh + sigma1h + getCarry(t1l, hl)) | 0
    t1l = (t1l + chl) | 0
    t1h = (t1h + chh + getCarry(t1l, chl)) | 0
    t1l = (t1l + Kil) | 0
    t1h = (t1h + Kih + getCarry(t1l, Kil)) | 0
    t1l = (t1l + Wil) | 0
    t1h = (t1h + Wih + getCarry(t1l, Wil)) | 0

    // t2 = sigma0 + maj
    var t2l = (sigma0l + majl) | 0
    var t2h = (sigma0h + majh + getCarry(t2l, sigma0l)) | 0

    hh = gh
    hl = gl
    gh = fh
    gl = fl
    fh = eh
    fl = el
    el = (dl + t1l) | 0
    eh = (dh + t1h + getCarry(el, dl)) | 0
    dh = ch
    dl = cl
    ch = bh
    cl = bl
    bh = ah
    bl = al
    al = (t1l + t2l) | 0
    ah = (t1h + t2h + getCarry(al, t1l)) | 0
  }

  this._al = (this._al + al) | 0
  this._bl = (this._bl + bl) | 0
  this._cl = (this._cl + cl) | 0
  this._dl = (this._dl + dl) | 0
  this._el = (this._el + el) | 0
  this._fl = (this._fl + fl) | 0
  this._gl = (this._gl + gl) | 0
  this._hl = (this._hl + hl) | 0

  this._ah = (this._ah + ah + getCarry(this._al, al)) | 0
  this._bh = (this._bh + bh + getCarry(this._bl, bl)) | 0
  this._ch = (this._ch + ch + getCarry(this._cl, cl)) | 0
  this._dh = (this._dh + dh + getCarry(this._dl, dl)) | 0
  this._eh = (this._eh + eh + getCarry(this._el, el)) | 0
  this._fh = (this._fh + fh + getCarry(this._fl, fl)) | 0
  this._gh = (this._gh + gh + getCarry(this._gl, gl)) | 0
  this._hh = (this._hh + hh + getCarry(this._hl, hl)) | 0
}

Sha512.prototype._hash = function () {
  var H = Buffer.allocUnsafe(64)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)
  writeInt64BE(this._gh, this._gl, 48)
  writeInt64BE(this._hh, this._hl, 56)

  return H
}

module.exports = Sha512

},{"./hash":104,"inherits":75,"safe-buffer":103}],112:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"safe-buffer":103}],113:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"dup":29}]},{},[30]);
