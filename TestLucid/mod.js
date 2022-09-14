// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function equalsNaive(a, b) {
    if (a.length !== b.length) return false;
    for(let i = 0; i < b.length; i++){
        if (a[i] !== b[i]) return false;
    }
    return true;
}
function equals32Bit(a, b) {
    if (a.length !== b.length) return false;
    const len = a.length;
    const compressable = Math.floor(len / 4);
    const compressedA = new Uint32Array(a.buffer, 0, compressable);
    const compressedB = new Uint32Array(b.buffer, 0, compressable);
    for(let i = compressable * 4; i < len; i++){
        if (a[i] !== b[i]) return false;
    }
    for(let i1 = 0; i1 < compressedA.length; i1++){
        if (compressedA[i1] !== compressedB[i1]) return false;
    }
    return true;
}
function equals(a, b) {
    if (a.length < 1000) return equalsNaive(a, b);
    return equals32Bit(a, b);
}
function concat(...buf) {
    let length = 0;
    for (const b of buf){
        length += b.length;
    }
    const output = new Uint8Array(length);
    let index = 0;
    for (const b1 of buf){
        output.set(b1, index);
        index += b1.length;
    }
    return output;
}
const HEX_CHARS = "0123456789abcdef".split("");
const EXTRA = [
    -2147483648,
    8388608,
    32768,
    128
];
const SHIFT = [
    24,
    16,
    8,
    0
];
const K = [
    0x428a2f98,
    0x71374491,
    0xb5c0fbcf,
    0xe9b5dba5,
    0x3956c25b,
    0x59f111f1,
    0x923f82a4,
    0xab1c5ed5,
    0xd807aa98,
    0x12835b01,
    0x243185be,
    0x550c7dc3,
    0x72be5d74,
    0x80deb1fe,
    0x9bdc06a7,
    0xc19bf174,
    0xe49b69c1,
    0xefbe4786,
    0x0fc19dc6,
    0x240ca1cc,
    0x2de92c6f,
    0x4a7484aa,
    0x5cb0a9dc,
    0x76f988da,
    0x983e5152,
    0xa831c66d,
    0xb00327c8,
    0xbf597fc7,
    0xc6e00bf3,
    0xd5a79147,
    0x06ca6351,
    0x14292967,
    0x27b70a85,
    0x2e1b2138,
    0x4d2c6dfc,
    0x53380d13,
    0x650a7354,
    0x766a0abb,
    0x81c2c92e,
    0x92722c85,
    0xa2bfe8a1,
    0xa81a664b,
    0xc24b8b70,
    0xc76c51a3,
    0xd192e819,
    0xd6990624,
    0xf40e3585,
    0x106aa070,
    0x19a4c116,
    0x1e376c08,
    0x2748774c,
    0x34b0bcb5,
    0x391c0cb3,
    0x4ed8aa4a,
    0x5b9cca4f,
    0x682e6ff3,
    0x748f82ee,
    0x78a5636f,
    0x84c87814,
    0x8cc70208,
    0x90befffa,
    0xa4506ceb,
    0xbef9a3f7,
    0xc67178f2, 
];
const blocks = [];
class Sha256 {
    #block;
    #blocks;
    #bytes;
    #finalized;
    #first;
    #h0;
    #h1;
    #h2;
    #h3;
    #h4;
    #h5;
    #h6;
    #h7;
    #hashed;
    #hBytes;
    #is224;
    #lastByteIndex = 0;
    #start;
    constructor(is224 = false, sharedMemory = false){
        this.init(is224, sharedMemory);
    }
    init(is224, sharedMemory) {
        if (sharedMemory) {
            blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            this.#blocks = blocks;
        } else {
            this.#blocks = [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ];
        }
        if (is224) {
            this.#h0 = 0xc1059ed8;
            this.#h1 = 0x367cd507;
            this.#h2 = 0x3070dd17;
            this.#h3 = 0xf70e5939;
            this.#h4 = 0xffc00b31;
            this.#h5 = 0x68581511;
            this.#h6 = 0x64f98fa7;
            this.#h7 = 0xbefa4fa4;
        } else {
            this.#h0 = 0x6a09e667;
            this.#h1 = 0xbb67ae85;
            this.#h2 = 0x3c6ef372;
            this.#h3 = 0xa54ff53a;
            this.#h4 = 0x510e527f;
            this.#h5 = 0x9b05688c;
            this.#h6 = 0x1f83d9ab;
            this.#h7 = 0x5be0cd19;
        }
        this.#block = this.#start = this.#bytes = this.#hBytes = 0;
        this.#finalized = this.#hashed = false;
        this.#first = true;
        this.#is224 = is224;
    }
    update(message) {
        if (this.#finalized) {
            return this;
        }
        let msg;
        if (message instanceof ArrayBuffer) {
            msg = new Uint8Array(message);
        } else {
            msg = message;
        }
        let index = 0;
        const length = msg.length;
        const blocks = this.#blocks;
        while(index < length){
            let i;
            if (this.#hashed) {
                this.#hashed = false;
                blocks[0] = this.#block;
                blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            }
            if (typeof msg !== "string") {
                for(i = this.#start; index < length && i < 64; ++index){
                    blocks[i >> 2] |= msg[index] << SHIFT[i++ & 3];
                }
            } else {
                for(i = this.#start; index < length && i < 64; ++index){
                    let code = msg.charCodeAt(index);
                    if (code < 0x80) {
                        blocks[i >> 2] |= code << SHIFT[i++ & 3];
                    } else if (code < 0x800) {
                        blocks[i >> 2] |= (0xc0 | code >> 6) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                    } else if (code < 0xd800 || code >= 0xe000) {
                        blocks[i >> 2] |= (0xe0 | code >> 12) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                    } else {
                        code = 0x10000 + ((code & 0x3ff) << 10 | msg.charCodeAt(++index) & 0x3ff);
                        blocks[i >> 2] |= (0xf0 | code >> 18) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code >> 12 & 0x3f) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                    }
                }
            }
            this.#lastByteIndex = i;
            this.#bytes += i - this.#start;
            if (i >= 64) {
                this.#block = blocks[16];
                this.#start = i - 64;
                this.hash();
                this.#hashed = true;
            } else {
                this.#start = i;
            }
        }
        if (this.#bytes > 4294967295) {
            this.#hBytes += this.#bytes / 4294967296 << 0;
            this.#bytes = this.#bytes % 4294967296;
        }
        return this;
    }
    finalize() {
        if (this.#finalized) {
            return;
        }
        this.#finalized = true;
        const blocks = this.#blocks;
        const i = this.#lastByteIndex;
        blocks[16] = this.#block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.#block = blocks[16];
        if (i >= 56) {
            if (!this.#hashed) {
                this.hash();
            }
            blocks[0] = this.#block;
            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
        }
        blocks[14] = this.#hBytes << 3 | this.#bytes >>> 29;
        blocks[15] = this.#bytes << 3;
        this.hash();
    }
    hash() {
        let a = this.#h0;
        let b = this.#h1;
        let c = this.#h2;
        let d = this.#h3;
        let e = this.#h4;
        let f = this.#h5;
        let g = this.#h6;
        let h = this.#h7;
        const blocks = this.#blocks;
        let s0;
        let s1;
        let maj;
        let t1;
        let t2;
        let ch;
        let ab;
        let da;
        let cd;
        let bc;
        for(let j = 16; j < 64; ++j){
            t1 = blocks[j - 15];
            s0 = (t1 >>> 7 | t1 << 25) ^ (t1 >>> 18 | t1 << 14) ^ t1 >>> 3;
            t1 = blocks[j - 2];
            s1 = (t1 >>> 17 | t1 << 15) ^ (t1 >>> 19 | t1 << 13) ^ t1 >>> 10;
            blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
        }
        bc = b & c;
        for(let j1 = 0; j1 < 64; j1 += 4){
            if (this.#first) {
                if (this.#is224) {
                    ab = 300032;
                    t1 = blocks[0] - 1413257819;
                    h = t1 - 150054599 << 0;
                    d = t1 + 24177077 << 0;
                } else {
                    ab = 704751109;
                    t1 = blocks[0] - 210244248;
                    h = t1 - 1521486534 << 0;
                    d = t1 + 143694565 << 0;
                }
                this.#first = false;
            } else {
                s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
                s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
                ab = a & b;
                maj = ab ^ a & c ^ bc;
                ch = e & f ^ ~e & g;
                t1 = h + s1 + ch + K[j1] + blocks[j1];
                t2 = s0 + maj;
                h = d + t1 << 0;
                d = t1 + t2 << 0;
            }
            s0 = (d >>> 2 | d << 30) ^ (d >>> 13 | d << 19) ^ (d >>> 22 | d << 10);
            s1 = (h >>> 6 | h << 26) ^ (h >>> 11 | h << 21) ^ (h >>> 25 | h << 7);
            da = d & a;
            maj = da ^ d & b ^ ab;
            ch = h & e ^ ~h & f;
            t1 = g + s1 + ch + K[j1 + 1] + blocks[j1 + 1];
            t2 = s0 + maj;
            g = c + t1 << 0;
            c = t1 + t2 << 0;
            s0 = (c >>> 2 | c << 30) ^ (c >>> 13 | c << 19) ^ (c >>> 22 | c << 10);
            s1 = (g >>> 6 | g << 26) ^ (g >>> 11 | g << 21) ^ (g >>> 25 | g << 7);
            cd = c & d;
            maj = cd ^ c & a ^ da;
            ch = g & h ^ ~g & e;
            t1 = f + s1 + ch + K[j1 + 2] + blocks[j1 + 2];
            t2 = s0 + maj;
            f = b + t1 << 0;
            b = t1 + t2 << 0;
            s0 = (b >>> 2 | b << 30) ^ (b >>> 13 | b << 19) ^ (b >>> 22 | b << 10);
            s1 = (f >>> 6 | f << 26) ^ (f >>> 11 | f << 21) ^ (f >>> 25 | f << 7);
            bc = b & c;
            maj = bc ^ b & d ^ cd;
            ch = f & g ^ ~f & h;
            t1 = e + s1 + ch + K[j1 + 3] + blocks[j1 + 3];
            t2 = s0 + maj;
            e = a + t1 << 0;
            a = t1 + t2 << 0;
        }
        this.#h0 = this.#h0 + a << 0;
        this.#h1 = this.#h1 + b << 0;
        this.#h2 = this.#h2 + c << 0;
        this.#h3 = this.#h3 + d << 0;
        this.#h4 = this.#h4 + e << 0;
        this.#h5 = this.#h5 + f << 0;
        this.#h6 = this.#h6 + g << 0;
        this.#h7 = this.#h7 + h << 0;
    }
    hex() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        const h5 = this.#h5;
        const h6 = this.#h6;
        const h7 = this.#h7;
        let hex = HEX_CHARS[h0 >> 28 & 0x0f] + HEX_CHARS[h0 >> 24 & 0x0f] + HEX_CHARS[h0 >> 20 & 0x0f] + HEX_CHARS[h0 >> 16 & 0x0f] + HEX_CHARS[h0 >> 12 & 0x0f] + HEX_CHARS[h0 >> 8 & 0x0f] + HEX_CHARS[h0 >> 4 & 0x0f] + HEX_CHARS[h0 & 0x0f] + HEX_CHARS[h1 >> 28 & 0x0f] + HEX_CHARS[h1 >> 24 & 0x0f] + HEX_CHARS[h1 >> 20 & 0x0f] + HEX_CHARS[h1 >> 16 & 0x0f] + HEX_CHARS[h1 >> 12 & 0x0f] + HEX_CHARS[h1 >> 8 & 0x0f] + HEX_CHARS[h1 >> 4 & 0x0f] + HEX_CHARS[h1 & 0x0f] + HEX_CHARS[h2 >> 28 & 0x0f] + HEX_CHARS[h2 >> 24 & 0x0f] + HEX_CHARS[h2 >> 20 & 0x0f] + HEX_CHARS[h2 >> 16 & 0x0f] + HEX_CHARS[h2 >> 12 & 0x0f] + HEX_CHARS[h2 >> 8 & 0x0f] + HEX_CHARS[h2 >> 4 & 0x0f] + HEX_CHARS[h2 & 0x0f] + HEX_CHARS[h3 >> 28 & 0x0f] + HEX_CHARS[h3 >> 24 & 0x0f] + HEX_CHARS[h3 >> 20 & 0x0f] + HEX_CHARS[h3 >> 16 & 0x0f] + HEX_CHARS[h3 >> 12 & 0x0f] + HEX_CHARS[h3 >> 8 & 0x0f] + HEX_CHARS[h3 >> 4 & 0x0f] + HEX_CHARS[h3 & 0x0f] + HEX_CHARS[h4 >> 28 & 0x0f] + HEX_CHARS[h4 >> 24 & 0x0f] + HEX_CHARS[h4 >> 20 & 0x0f] + HEX_CHARS[h4 >> 16 & 0x0f] + HEX_CHARS[h4 >> 12 & 0x0f] + HEX_CHARS[h4 >> 8 & 0x0f] + HEX_CHARS[h4 >> 4 & 0x0f] + HEX_CHARS[h4 & 0x0f] + HEX_CHARS[h5 >> 28 & 0x0f] + HEX_CHARS[h5 >> 24 & 0x0f] + HEX_CHARS[h5 >> 20 & 0x0f] + HEX_CHARS[h5 >> 16 & 0x0f] + HEX_CHARS[h5 >> 12 & 0x0f] + HEX_CHARS[h5 >> 8 & 0x0f] + HEX_CHARS[h5 >> 4 & 0x0f] + HEX_CHARS[h5 & 0x0f] + HEX_CHARS[h6 >> 28 & 0x0f] + HEX_CHARS[h6 >> 24 & 0x0f] + HEX_CHARS[h6 >> 20 & 0x0f] + HEX_CHARS[h6 >> 16 & 0x0f] + HEX_CHARS[h6 >> 12 & 0x0f] + HEX_CHARS[h6 >> 8 & 0x0f] + HEX_CHARS[h6 >> 4 & 0x0f] + HEX_CHARS[h6 & 0x0f];
        if (!this.#is224) {
            hex += HEX_CHARS[h7 >> 28 & 0x0f] + HEX_CHARS[h7 >> 24 & 0x0f] + HEX_CHARS[h7 >> 20 & 0x0f] + HEX_CHARS[h7 >> 16 & 0x0f] + HEX_CHARS[h7 >> 12 & 0x0f] + HEX_CHARS[h7 >> 8 & 0x0f] + HEX_CHARS[h7 >> 4 & 0x0f] + HEX_CHARS[h7 & 0x0f];
        }
        return hex;
    }
    toString() {
        return this.hex();
    }
    digest() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        const h5 = this.#h5;
        const h6 = this.#h6;
        const h7 = this.#h7;
        const arr = [
            h0 >> 24 & 0xff,
            h0 >> 16 & 0xff,
            h0 >> 8 & 0xff,
            h0 & 0xff,
            h1 >> 24 & 0xff,
            h1 >> 16 & 0xff,
            h1 >> 8 & 0xff,
            h1 & 0xff,
            h2 >> 24 & 0xff,
            h2 >> 16 & 0xff,
            h2 >> 8 & 0xff,
            h2 & 0xff,
            h3 >> 24 & 0xff,
            h3 >> 16 & 0xff,
            h3 >> 8 & 0xff,
            h3 & 0xff,
            h4 >> 24 & 0xff,
            h4 >> 16 & 0xff,
            h4 >> 8 & 0xff,
            h4 & 0xff,
            h5 >> 24 & 0xff,
            h5 >> 16 & 0xff,
            h5 >> 8 & 0xff,
            h5 & 0xff,
            h6 >> 24 & 0xff,
            h6 >> 16 & 0xff,
            h6 >> 8 & 0xff,
            h6 & 0xff, 
        ];
        if (!this.#is224) {
            arr.push(h7 >> 24 & 0xff, h7 >> 16 & 0xff, h7 >> 8 & 0xff, h7 & 0xff);
        }
        return arr;
    }
    array() {
        return this.digest();
    }
    arrayBuffer() {
        this.finalize();
        const buffer = new ArrayBuffer(this.#is224 ? 28 : 32);
        const dataView = new DataView(buffer);
        dataView.setUint32(0, this.#h0);
        dataView.setUint32(4, this.#h1);
        dataView.setUint32(8, this.#h2);
        dataView.setUint32(12, this.#h3);
        dataView.setUint32(16, this.#h4);
        dataView.setUint32(20, this.#h5);
        dataView.setUint32(24, this.#h6);
        if (!this.#is224) {
            dataView.setUint32(28, this.#h7);
        }
        return buffer;
    }
}
const importMeta = {
    url: "https://deno.land/x/lucid@0.6.0/src/core/core.ts",
    main: false
};
const isNode = typeof window === "undefined";
if (isNode) {
    const fetch1 = await import("node-fetch");
    const { Crypto  } = await import("@peculiar/webcrypto");
    global.crypto = new Crypto();
    global.fetch = fetch1.default;
    global.Headers = fetch1.Headers;
    global.Request = fetch1.Request;
    global.Response = fetch1.Response;
}
async function importForEnvironmentCore() {
    try {
        if (isNode) {
            return await import("./wasm_modules/cardano_multiplatform_lib_nodejs/cardano_multiplatform_lib.js");
        }
        const pkg = await import("./wasm_modules/cardano_multiplatform_lib_web/cardano_multiplatform_lib.js");
        await pkg.default(await fetch(new URL("./wasm_modules/cardano_multiplatform_lib_web/cardano_multiplatform_lib_bg.wasm", importMeta.url)));
        return pkg;
    } catch (_e) {
        return null;
    }
}
async function importForEnvironmentMessage() {
    try {
        if (isNode) {
            return await import("./wasm_modules/cardano_message_signing_nodejs/cardano_message_signing.js");
        }
        const pkg = await import("./wasm_modules/cardano_message_signing_web/cardano_message_signing.js");
        await pkg.default(await fetch(new URL("./wasm_modules/cardano_message_signing_web/cardano_message_signing_bg.wasm", importMeta.url)));
        return pkg;
    } catch (_e) {
        return null;
    }
}
const C = await importForEnvironmentCore();
const M = await importForEnvironmentMessage();
export { C as C };
export { M as M };
const hexTable = new TextEncoder().encode("0123456789abcdef");
function errInvalidByte(__byte) {
    return new Error("encoding/hex: invalid byte: " + new TextDecoder().decode(new Uint8Array([
        __byte
    ])));
}
function errLength() {
    return new Error("encoding/hex: odd length hex string");
}
function fromHexChar(__byte) {
    if (48 <= __byte && __byte <= 57) return __byte - 48;
    if (97 <= __byte && __byte <= 102) return __byte - 97 + 10;
    if (65 <= __byte && __byte <= 70) return __byte - 65 + 10;
    throw errInvalidByte(__byte);
}
function encodedLen(n) {
    return n * 2;
}
function encode(src) {
    const dst = new Uint8Array(encodedLen(src.length));
    for(let i = 0; i < dst.length; i++){
        const v = src[i];
        dst[i * 2] = hexTable[v >> 4];
        dst[i * 2 + 1] = hexTable[v & 0x0f];
    }
    return dst;
}
function encodeToString(src) {
    return new TextDecoder().decode(encode(src));
}
function decode(src) {
    const dst = new Uint8Array(decodedLen(src.length));
    for(let i = 0; i < dst.length; i++){
        const a = fromHexChar(src[i * 2]);
        const b = fromHexChar(src[i * 2 + 1]);
        dst[i] = a << 4 | b;
    }
    if (src.length % 2 == 1) {
        fromHexChar(src[dst.length * 2]);
        throw errLength();
    }
    return dst;
}
function decodedLen(x) {
    return x >>> 1;
}
function decodeString(s) {
    return decode(new TextEncoder().encode(s));
}
function createCostModels(costModels) {
    const costmdls = C.Costmdls.new();
    const costmdlV1 = C.CostModel.new();
    Object.values(costModels.PlutusV1).forEach((cost, index)=>{
        costmdlV1.set(index, C.Int.new(C.BigNum.from_str(cost.toString())));
    });
    costmdls.insert(C.Language.new_plutus_v1(), costmdlV1);
    const costmdlV2 = C.CostModel.new_plutus_v2();
    Object.values(costModels.PlutusV2 || []).forEach((cost, index)=>{
        costmdlV2.set(index, C.Int.new(C.BigNum.from_str(cost.toString())));
    });
    costmdls.insert(C.Language.new_plutus_v2(), costmdlV2);
    return costmdls;
}
export { createCostModels as createCostModels };
const INVALID_MNEMONIC = "Invalid mnemonic";
const INVALID_ENTROPY = "Invalid entropy";
const INVALID_CHECKSUM = "Invalid mnemonic checksum";
const WORDLIST_REQUIRED = "A wordlist is required but a default could not be found.\n" + "Please pass a 2048 word array explicitly.";
function generateMnemonic(strength, rng, wordlist) {
    strength = strength || 128;
    if (strength % 32 !== 0) {
        throw new TypeError(INVALID_ENTROPY);
    }
    rng = rng || randomBytes;
    return entropyToMnemonic(rng(strength / 8), wordlist);
}
class Utils {
    lucid;
    constructor(lucid){
        this.lucid = lucid;
    }
    validatorToAddress(validator, stakeCredential) {
        const validatorHash = this.validatorToScriptHash(validator);
        if (stakeCredential) {
            return C.BaseAddress.new(networkToId(this.lucid.network), C.StakeCredential.from_scripthash(C.ScriptHash.from_hex(validatorHash)), stakeCredential.type === "Key" ? C.StakeCredential.from_keyhash(C.Ed25519KeyHash.from_hex(stakeCredential.hash)) : C.StakeCredential.from_scripthash(C.ScriptHash.from_hex(stakeCredential.hash))).to_address().to_bech32(undefined);
        } else {
            return C.EnterpriseAddress.new(networkToId(this.lucid.network), C.StakeCredential.from_scripthash(C.ScriptHash.from_hex(validatorHash))).to_address().to_bech32(undefined);
        }
    }
    validatorToScriptHash(validator) {
        if (validator.type === "Native") {
            return C.NativeScript.from_bytes(fromHex(validator.script)).hash(C.ScriptHashNamespace.NativeScript).to_hex();
        } else if (validator.type === "PlutusV1") {
            return C.PlutusScript.from_bytes(fromHex(validator.script)).hash(C.ScriptHashNamespace.PlutusV1).to_hex();
        } else if (validator.type === "PlutusV2") {
            return C.PlutusScript.from_bytes(fromHex(validator.script)).hash(C.ScriptHashNamespace.PlutusV2).to_hex();
        }
        throw new Error("No variant matched");
    }
    mintingPolicyToId(mintingPolicy) {
        return this.validatorToScriptHash(mintingPolicy);
    }
    datumToHash(datum) {
        return C.hash_plutus_data(C.PlutusData.from_bytes(fromHex(datum))).to_hex();
    }
    scriptHashToCredential(scriptHash) {
        return {
            type: "Script",
            hash: scriptHash
        };
    }
    keyHashToCredential(keyHash) {
        return {
            type: "Key",
            hash: keyHash
        };
    }
    generatePrivateKey() {
        return C.PrivateKey.generate_ed25519().to_bech32();
    }
    generateSeedPhrase() {
        return generateMnemonic(256);
    }
    unixTimeToSlot(unixTime) {
        return unixTimeToEnclosingSlot(unixTime, {
            slotLength: DEFAULT_SLOT_LENGTH,
            zeroTime: zeroTimeNetwork[this.lucid.network]
        });
    }
    slotToUnixTime(slot) {
        return slotToBeginUnixTime(slot, {
            slotLength: DEFAULT_SLOT_LENGTH,
            zeroTime: zeroTimeNetwork[this.lucid.network]
        });
    }
    getAddressDetails(address) {
        return getAddressDetails(address);
    }
    nativeScriptFromJson(nativeScript) {
        return nativeScriptFromJson(nativeScript);
    }
}
const getAddressDetails = (address)=>{
    try {
        const parsedAddress = C.BaseAddress.from_address(C.Address.from_bytes(fromHex(address)));
        const paymentCredential = parsedAddress.payment_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress.payment_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress.payment_cred().to_scripthash().to_bytes())
        };
        const stakeCredential = parsedAddress.stake_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress.stake_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress.stake_cred().to_scripthash().to_bytes())
        };
        return {
            address: {
                type: "Base",
                address: parsedAddress.to_address().to_bech32(undefined),
                bech32: parsedAddress.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress.to_address().to_bytes())
            },
            paymentCredential,
            stakeCredential
        };
    } catch (_e) {}
    try {
        const parsedAddress1 = C.BaseAddress.from_address(C.Address.from_bech32(address));
        const paymentCredential1 = parsedAddress1.payment_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress1.payment_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress1.payment_cred().to_scripthash().to_bytes())
        };
        const stakeCredential1 = parsedAddress1.stake_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress1.stake_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress1.stake_cred().to_scripthash().to_bytes())
        };
        return {
            address: {
                type: "Base",
                address: parsedAddress1.to_address().to_bech32(undefined),
                bech32: parsedAddress1.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress1.to_address().to_bytes())
            },
            paymentCredential: paymentCredential1,
            stakeCredential: stakeCredential1
        };
    } catch (_e1) {}
    try {
        const parsedAddress2 = C.EnterpriseAddress.from_address(C.Address.from_bytes(fromHex(address)));
        const paymentCredential2 = parsedAddress2.payment_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress2.payment_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress2.payment_cred().to_scripthash().to_bytes())
        };
        return {
            address: {
                type: "Enterprise",
                address: parsedAddress2.to_address().to_bech32(undefined),
                bech32: parsedAddress2.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress2.to_address().to_bytes())
            },
            paymentCredential: paymentCredential2
        };
    } catch (_e2) {}
    try {
        const parsedAddress3 = C.EnterpriseAddress.from_address(C.Address.from_bech32(address));
        const paymentCredential3 = parsedAddress3.payment_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress3.payment_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress3.payment_cred().to_scripthash().to_bytes())
        };
        return {
            address: {
                type: "Enterprise",
                address: parsedAddress3.to_address().to_bech32(undefined),
                bech32: parsedAddress3.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress3.to_address().to_bytes())
            },
            paymentCredential: paymentCredential3
        };
    } catch (_e3) {}
    try {
        const parsedAddress4 = C.PointerAddress.from_address(C.Address.from_bytes(fromHex(address)));
        const paymentCredential4 = parsedAddress4.payment_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress4.payment_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress4.payment_cred().to_scripthash().to_bytes())
        };
        return {
            address: {
                type: "Pointer",
                address: parsedAddress4.to_address().to_bech32(undefined),
                bech32: parsedAddress4.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress4.to_address().to_bytes())
            },
            paymentCredential: paymentCredential4
        };
    } catch (_e4) {}
    try {
        const parsedAddress5 = C.PointerAddress.from_address(C.Address.from_bech32(address));
        const paymentCredential5 = parsedAddress5.payment_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress5.payment_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress5.payment_cred().to_scripthash().to_bytes())
        };
        return {
            address: {
                type: "Pointer",
                address: parsedAddress5.to_address().to_bech32(undefined),
                bech32: parsedAddress5.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress5.to_address().to_bytes())
            },
            paymentCredential: paymentCredential5
        };
    } catch (_e5) {}
    try {
        const parsedAddress6 = C.RewardAddress.from_address(C.Address.from_bytes(fromHex(address)));
        const stakeCredential2 = parsedAddress6.payment_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress6.payment_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress6.payment_cred().to_scripthash().to_bytes())
        };
        return {
            address: {
                type: "Reward",
                address: parsedAddress6.to_address().to_bech32(undefined),
                bech32: parsedAddress6.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress6.to_address().to_bytes())
            },
            stakeCredential: stakeCredential2
        };
    } catch (_e6) {}
    try {
        const parsedAddress7 = C.RewardAddress.from_address(C.Address.from_bech32(address));
        const stakeCredential3 = parsedAddress7.payment_cred().kind() === 0 ? {
            type: "Key",
            hash: toHex(parsedAddress7.payment_cred().to_keyhash().to_bytes())
        } : {
            type: "Script",
            hash: toHex(parsedAddress7.payment_cred().to_scripthash().to_bytes())
        };
        return {
            address: {
                type: "Reward",
                address: parsedAddress7.to_address().to_bech32(undefined),
                bech32: parsedAddress7.to_address().to_bech32(undefined),
                hex: toHex(parsedAddress7.to_address().to_bytes())
            },
            stakeCredential: stakeCredential3
        };
    } catch (_e7) {}
    throw new Error("No address type matched for: " + address);
};
export { getAddressDetails as getAddressDetails };
function valueToAssets(value) {
    const assets = {};
    assets["lovelace"] = BigInt(value.coin().to_str());
    const ma = value.multiasset();
    if (ma) {
        const multiAssets = ma.keys();
        for(let j = 0; j < multiAssets.len(); j++){
            const policy = multiAssets.get(j);
            const policyAssets = ma.get(policy);
            const assetNames = policyAssets.keys();
            for(let k = 0; k < assetNames.len(); k++){
                const policyAsset = assetNames.get(k);
                const quantity = policyAssets.get(policyAsset);
                const unit = toHex(policy.to_bytes()) + toHex(policyAsset.name());
                assets[unit] = BigInt(quantity.to_str());
            }
        }
    }
    return assets;
}
function assetsToValue(assets) {
    const multiAsset = C.MultiAsset.new();
    const lovelace = assets["lovelace"];
    const units = Object.keys(assets);
    const policies = Array.from(new Set(units.filter((unit)=>unit !== "lovelace").map((unit)=>unit.slice(0, 56))));
    policies.forEach((policy)=>{
        const policyUnits = units.filter((unit)=>unit.slice(0, 56) === policy);
        const assetsValue = C.Assets.new();
        policyUnits.forEach((unit)=>{
            assetsValue.insert(C.AssetName.new(fromHex(unit.slice(56))), C.BigNum.from_str(assets[unit].toString()));
        });
        multiAsset.insert(C.ScriptHash.from_bytes(fromHex(policy)), assetsValue);
    });
    const value = C.Value.new(C.BigNum.from_str(lovelace ? lovelace.toString() : "0"));
    if (units.length > 1 || !lovelace) value.set_multiasset(multiAsset);
    return value;
}
function utxoToCore(utxo) {
    const address = (()=>{
        try {
            return C.Address.from_bech32(utxo.address);
        } catch (_e) {
            return C.ByronAddress.from_base58(utxo.address).to_address();
        }
    })();
    const output = C.TransactionOutput.new(address, assetsToValue(utxo.assets));
    if (utxo.datumHash) {
        output.set_datum(C.Datum.new_data_hash(C.DataHash.from_bytes(fromHex(utxo.datumHash))));
    }
    if (!utxo.datumHash && utxo.datum) {
        output.set_datum(C.Datum.new_data(C.Data.new(C.PlutusData.from_bytes(fromHex(utxo.datum)))));
    }
    if (utxo.scriptRef) {
        output.set_script_ref(C.ScriptRef.from_bytes(fromHex(utxo.scriptRef)));
    }
    return C.TransactionUnspentOutput.new(C.TransactionInput.new(C.TransactionHash.from_bytes(fromHex(utxo.txHash)), C.BigNum.from_str(utxo.outputIndex.toString())), output);
}
function coreToUtxo(coreUtxo) {
    return {
        txHash: toHex(coreUtxo.input().transaction_id().to_bytes()),
        outputIndex: parseInt(coreUtxo.input().index().to_str()),
        assets: valueToAssets(coreUtxo.output().amount()),
        address: coreUtxo.output().address().as_byron() ? coreUtxo.output().address().as_byron()?.to_base58() : coreUtxo.output().address().to_bech32(undefined),
        datumHash: coreUtxo.output()?.datum()?.as_data_hash()?.to_hex(),
        datum: coreUtxo.output()?.datum()?.as_data() && toHex(coreUtxo.output().datum().as_data().to_bytes()),
        scriptRef: coreUtxo.output()?.script_ref() && toHex(coreUtxo.output().script_ref().to_bytes())
    };
}
function networkToId(network) {
    switch(network){
        case "Testnet":
            return 0;
        case "Preview":
            return 0;
        case "Preprod":
            return 0;
        case "Mainnet":
            return 1;
        default:
            throw new Error("Network not found");
    }
}
function fromHex(hex) {
    return decodeString(hex);
}
function toHex(bytes) {
    return encodeToString(bytes);
}
export { toHex as toHex };
function mnemonicToEntropy(mnemonic, wordlist) {
    wordlist = wordlist || DEFAULT_WORDLIST;
    if (!wordlist) {
        throw new Error(WORDLIST_REQUIRED);
    }
    const words = normalize(mnemonic).split(" ");
    if (words.length % 3 !== 0) {
        throw new Error(INVALID_MNEMONIC);
    }
    const bits = words.map((word)=>{
        const index = wordlist.indexOf(word);
        if (index === -1) {
            throw new Error(INVALID_MNEMONIC);
        }
        return lpad(index.toString(2), "0", 11);
    }).join("");
    const dividerIndex = Math.floor(bits.length / 33) * 32;
    const entropyBits = bits.slice(0, dividerIndex);
    const checksumBits = bits.slice(dividerIndex);
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
    const entropy = new Uint8Array(entropyBytes);
    const newChecksum = deriveChecksumBits(entropy);
    if (newChecksum !== checksumBits) {
        throw new Error(INVALID_CHECKSUM);
    }
    return toHex(entropy);
}
function randomBytes(size) {
    const MAX_BYTES = 65536;
    const bytes = new Uint8Array(size);
    if (size > 4294967295) {
        throw new RangeError("requested too many random bytes");
    }
    if (size > 0) {
        if (size > 65536) {
            for(let generated = 0; generated < size; generated += MAX_BYTES){
                crypto.getRandomValues(bytes.slice(generated, generated + 65536));
            }
        } else {
            crypto.getRandomValues(bytes);
        }
    }
    return bytes;
}
class Constr {
    index;
    fields;
    constructor(index, fields){
        this.index = index;
        this.fields = fields;
    }
}
class MerkleTree {
    root;
    constructor(data){
        this.root = MerkleTree.buildRecursively(data.map((d)=>sha256(d)));
    }
    static fromHashes(hashes) {
        return new this(hashes);
    }
    static buildRecursively(hashes) {
        if (hashes.length <= 0) return null;
        if (hashes.length === 1) {
            return {
                node: hashes[0],
                left: null,
                right: null
            };
        }
        const cutoff = Math.floor(hashes.length / 2);
        const [left, right] = [
            hashes.slice(0, cutoff),
            hashes.slice(cutoff)
        ];
        const lnode = this.buildRecursively(left);
        const rnode = this.buildRecursively(right);
        if (lnode === null || rnode === null) return null;
        return {
            node: combineHash(lnode.node, rnode.node),
            left: lnode,
            right: rnode
        };
    }
    rootHash() {
        if (this.root === null) throw new Error("Merkle tree root hash not found.");
        return this.root.node;
    }
    getProof(data) {
        const hash = sha256(data);
        const proof = [];
        const searchRecursively = (tree)=>{
            if (tree && equals(tree.node, hash)) return true;
            if (tree?.right) {
                if (searchRecursively(tree.left)) {
                    proof.push({
                        right: tree.right.node
                    });
                    return true;
                }
            }
            if (tree?.left) {
                if (searchRecursively(tree.right)) {
                    proof.push({
                        left: tree.left.node
                    });
                    return true;
                }
            }
        };
        searchRecursively(this.root);
        return proof;
    }
    size() {
        const searchRecursively = (tree)=>{
            if (tree === null) return 0;
            return 1 + searchRecursively(tree.left) + searchRecursively(tree.right);
        };
        return searchRecursively(this.root);
    }
    static verify(data, rootHash, proof) {
        const hash = sha256(data);
        const searchRecursively = (rootHash2, proof)=>{
            if (proof.length <= 0) return equals(rootHash, rootHash2);
            const [h, t] = [
                proof[0],
                proof.slice(1)
            ];
            if (h.left) {
                return searchRecursively(combineHash(h.left, rootHash2), t);
            }
            if (h.right) {
                return searchRecursively(combineHash(rootHash2, h.right), t);
            }
            return false;
        };
        return searchRecursively(hash, proof);
    }
    toString() {
        const searchRecursively = (tree)=>{
            if (tree === null) return null;
            return {
                node: toHex(tree.node),
                left: searchRecursively(tree.left),
                right: searchRecursively(tree.right)
            };
        };
        return JSON.stringify(searchRecursively(this.root), null, 2);
    }
}
const zeroTimeNetwork = {
    Mainnet: 1596059091000,
    Testnet: 1595967616000,
    Preview: 1660003200000,
    Preprod: 1654041600000
};
const DEFAULT_SLOT_LENGTH = 1000;
function slotToBeginUnixTime(slot, slotConfig) {
    const msAfterBegin = slot * slotConfig.slotLength;
    return slotConfig.zeroTime + msAfterBegin;
}
function unixTimeToEnclosingSlot(unixTime, slotConfig) {
    const timePassed = unixTime - slotConfig.zeroTime;
    const slotsPassed = Math.floor(timePassed / slotConfig.slotLength);
    return slotsPassed;
}
function hexToUtf8(hex) {
    return new TextDecoder().decode(decode(new TextEncoder().encode(hex)));
}
function utf8ToHex(utf8) {
    return toHex(new TextEncoder().encode(utf8));
}
function checksum(num) {
    return num.toString(16).split("").reduce((acc, curr)=>acc + parseInt(curr, 16), 0x0).toString(16).padStart(2, "0");
}
function toLabel(num) {
    if (num < 0 || num > 65535) {
        throw new Error(`Label ${num} out of range: min label 0 - max label 65535.`);
    }
    return "0" + num.toString(16).padStart(4, "0") + checksum(num) + "0";
}
function fromLabel(label) {
    if (label.length !== 8 || !(label[0] === "0" && label[7] === "0")) {
        return null;
    }
    const num = parseInt(label.slice(1, 5), 16);
    const check = label.slice(5, 7);
    return check === checksum(num) ? num : null;
}
function toUnit(policyId, name, label) {
    const hexLabel = Number.isInteger(label) ? toLabel(label) : "";
    const hexName = name ? toHex(new TextEncoder().encode(name)) : "";
    if ((hexName + hexLabel).length > 64) {
        throw new Error("Asset name size exceeds 32 bytes.");
    }
    if (policyId.length !== 56) {
        throw new Error(`Policy Id invalid: ${policyId}.`);
    }
    return policyId + hexLabel + hexName;
}
function fromUnit(unit) {
    const policyId = unit.slice(0, 56);
    const label = fromLabel(unit.slice(56, 64));
    const name = (()=>{
        const hexName = Number.isInteger(label) ? unit.slice(64) : unit.slice(56);
        if (!hexName) return null;
        try {
            return hexToUtf8(hexName);
        } catch (_e) {
            return hexName;
        }
    })();
    return {
        policyId,
        name,
        label
    };
}
function nativeScriptFromJson(nativeScript) {
    return {
        type: "Native",
        script: toHex(C.encode_json_str_to_native_script(JSON.stringify(nativeScript), "", C.ScriptSchema.Node).to_bytes())
    };
}
function entropyToMnemonic(entropy, wordlist) {
    wordlist = wordlist || DEFAULT_WORDLIST;
    if (!wordlist) {
        throw new Error(WORDLIST_REQUIRED);
    }
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
    const words = chunks.map((binary)=>{
        const index = binaryToByte(binary);
        return wordlist[index];
    });
    return wordlist[0] === "\u3042\u3044\u3053\u304f\u3057\u3093" ? words.join("\u3000") : words.join(" ");
}
function deriveChecksumBits(entropyBuffer) {
    const ENT = entropyBuffer.length * 8;
    const CS = ENT / 32;
    const hash = new Sha256().update(entropyBuffer).digest();
    return bytesToBinary(Array.from(hash)).slice(0, CS);
}
function lpad(str, padString, length) {
    while(str.length < length){
        str = padString + str;
    }
    return str;
}
function bytesToBinary(bytes) {
    return bytes.map((x)=>lpad(x.toString(2), "0", 8)).join("");
}
function normalize(str) {
    return (str || "").normalize("NFKD");
}
function binaryToByte(bin) {
    return parseInt(bin, 2);
}
const DEFAULT_WORDLIST = [
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
    "zoo", 
];
class Data {
    static to(plutusData) {
        function serialize(data) {
            try {
                if (typeof data === "bigint" || typeof data === "number" || typeof data === "string" && !isNaN(parseInt(data)) && data.slice(-1) === "n") {
                    const bigint = typeof data === "string" ? BigInt(data.slice(0, -1)) : data;
                    return C.PlutusData.new_integer(C.BigInt.from_str(bigint.toString()));
                } else if (typeof data === "string") {
                    return C.PlutusData.new_bytes(fromHex(data));
                } else if (data instanceof Uint8Array) {
                    return C.PlutusData.new_bytes(data);
                } else if (data instanceof Constr) {
                    const { index , fields  } = data;
                    const plutusList = C.PlutusList.new();
                    fields.forEach((field)=>plutusList.add(serialize(field)));
                    return C.PlutusData.new_constr_plutus_data(C.ConstrPlutusData.new(C.BigNum.from_str(index.toString()), plutusList));
                } else if (data instanceof Array) {
                    const plutusList1 = C.PlutusList.new();
                    data.forEach((arg)=>plutusList1.add(serialize(arg)));
                    return C.PlutusData.new_list(plutusList1);
                } else if (data instanceof Map) {
                    const plutusMap = C.PlutusMap.new();
                    for (const [key, value] of data.entries()){
                        plutusMap.insert(serialize(key), serialize(value));
                    }
                    return C.PlutusData.new_map(plutusMap);
                }
                throw new Error("Unsupported type");
            } catch (error) {
                throw new Error("Could not serialize the data: " + error);
            }
        }
        return toHex(serialize(plutusData).to_bytes());
    }
    static from(data) {
        const plutusData = C.PlutusData.from_bytes(fromHex(data));
        function deserialize(data) {
            if (data.kind() === 0) {
                const constr = data.as_constr_plutus_data();
                const l = constr.data();
                const desL = [];
                for(let i = 0; i < l.len(); i++){
                    desL.push(deserialize(l.get(i)));
                }
                return new Constr(parseInt(constr.alternative().to_str()), desL);
            } else if (data.kind() === 1) {
                const m = data.as_map();
                const desM = new Map();
                const keys = m.keys();
                for(let i1 = 0; i1 < keys.len(); i1++){
                    desM.set(deserialize(keys.get(i1)), deserialize(m.get(keys.get(i1))));
                }
                return desM;
            } else if (data.kind() === 2) {
                const l1 = data.as_list();
                const desL1 = [];
                for(let i2 = 0; i2 < l1.len(); i2++){
                    desL1.push(deserialize(l1.get(i2)));
                }
                return desL1;
            } else if (data.kind() === 3) {
                return BigInt(data.as_integer().to_str());
            } else if (data.kind() === 4) {
                return toHex(data.as_bytes());
            }
            throw new Error("Unsupported type");
        }
        return deserialize(plutusData);
    }
    static fromJson(json) {
        function toPlutusData(json) {
            if (typeof json === "string") {
                return toHex(new TextEncoder().encode(json));
            }
            if (typeof json === "number") return BigInt(json);
            if (typeof json === "bigint") return json;
            if (json instanceof Array) return json.map((v)=>toPlutusData(v));
            if (json instanceof Object) {
                const tempMap = new Map();
                Object.entries(json).forEach(([key, value])=>{
                    tempMap.set(toPlutusData(key), toPlutusData(value));
                });
                return tempMap;
            }
            throw new Error("Unsupported type");
        }
        return toPlutusData(json);
    }
    static toJson(plutusData) {
        function fromPlutusData(data) {
            if (typeof data === "bigint" || typeof data === "number" || typeof data === "string" && !isNaN(parseInt(data)) && data.slice(-1) === "n") {
                const bigint = typeof data === "string" ? BigInt(data.slice(0, -1)) : data;
                return parseInt(bigint.toString());
            }
            if (typeof data === "string") {
                return new TextDecoder().decode(fromHex(data));
            }
            if (data instanceof Array) return data.map((v)=>fromPlutusData(v));
            if (data instanceof Map) {
                const tempJson = {};
                data.forEach((value, key)=>{
                    const convertedKey = fromPlutusData(key);
                    if (typeof convertedKey !== "string" && typeof convertedKey !== "number") {
                        throw new Error("Unsupported type (Note: Only bytes or integers can be keys of a JSON object)");
                    }
                    tempJson[convertedKey] = fromPlutusData(value);
                });
                return tempJson;
            }
            throw new Error("Unsupported type (Note: Constructor cannot be converted to JSON)");
        }
        return fromPlutusData(plutusData);
    }
    static empty() {
        return "d87980";
    }
}
export { concat as concat, equals as equals };
function sha256(data) {
    return new Uint8Array(new Sha256().update(data).arrayBuffer());
}
function combineHash(hash1, hash2) {
    return sha256(concat(hash1, hash2));
}
export { Utils as Utils };
export { valueToAssets as valueToAssets };
export { assetsToValue as assetsToValue };
export { utxoToCore as utxoToCore };
export { coreToUtxo as coreToUtxo };
export { networkToId as networkToId };
export { fromHex as fromHex };
export { hexToUtf8 as hexToUtf8 };
export { utf8ToHex as utf8ToHex };
export { toLabel as toLabel };
export { fromLabel as fromLabel };
export { toUnit as toUnit };
export { fromUnit as fromUnit };
export { nativeScriptFromJson as nativeScriptFromJson };
export { Constr as Constr };
export { Data as Data };
export { MerkleTree as MerkleTree };
export { sha256 as sha256 };
export { combineHash as combineHash };
class TxSigned {
    txSigned;
    lucid;
    constructor(lucid, tx){
        this.lucid = lucid;
        this.txSigned = tx;
    }
    async submit() {
        return await (this.lucid.wallet || this.lucid.provider).submitTx(this.txSigned);
    }
    toString() {
        return toHex(this.txSigned.to_bytes());
    }
    toHash() {
        return C.hash_transaction(this.txSigned.body()).to_hex();
    }
}
export { TxSigned as TxSigned };
class TxComplete {
    txComplete;
    witnessSetBuilder;
    tasks;
    lucid;
    constructor(lucid, tx){
        this.lucid = lucid;
        this.txComplete = tx;
        this.witnessSetBuilder = C.TransactionWitnessSetBuilder.new();
        this.tasks = [];
    }
    sign() {
        this.tasks.push(async ()=>{
            const witnesses = await this.lucid.wallet.signTx(this.txComplete);
            this.witnessSetBuilder.add_existing(witnesses);
        });
        return this;
    }
    signWithPrivateKey(privateKey) {
        const priv = C.PrivateKey.from_bech32(privateKey);
        const witness = C.make_vkey_witness(C.hash_transaction(this.txComplete.body()), priv);
        this.witnessSetBuilder.add_vkey(witness);
        return this;
    }
    async partialSign() {
        const witnesses = await this.lucid.wallet.signTx(this.txComplete);
        this.witnessSetBuilder.add_existing(witnesses);
        return toHex(witnesses.to_bytes());
    }
    partialSignWithPrivateKey(privateKey) {
        const priv = C.PrivateKey.from_bech32(privateKey);
        const witness = C.make_vkey_witness(C.hash_transaction(this.txComplete.body()), priv);
        this.witnessSetBuilder.add_vkey(witness);
        const witnesses = C.TransactionWitnessSetBuilder.new();
        witnesses.add_vkey(witness);
        return toHex(witnesses.build().to_bytes());
    }
    assemble(witnesses) {
        witnesses.forEach((witness)=>{
            const witnessParsed = C.TransactionWitnessSet.from_bytes(fromHex(witness));
            this.witnessSetBuilder.add_existing(witnessParsed);
        });
        return this;
    }
    async complete() {
        for (const task of this.tasks){
            await task();
        }
        this.witnessSetBuilder.add_existing(this.txComplete.witness_set());
        const signedTx = C.Transaction.new(this.txComplete.body(), this.witnessSetBuilder.build(), this.txComplete.auxiliary_data());
        return new TxSigned(this.lucid, signedTx);
    }
    toObject() {
        console.info("toObject is unstable and not ready yet");
        const body = this.txComplete.body();
        this.txComplete.witness_set();
        this.txComplete.auxiliary_data();
        const inputs = body.inputs().to_js_value().map((i)=>({
                txHash: i.transaction_id,
                outputIndex: parseInt(i.index)
            }));
        const outputs = (()=>{
            const dummyInput = C.TransactionInput.from_json(JSON.stringify({
                transaction_id: "0".repeat(64),
                index: "0"
            }));
            const outputs = [];
            const coreOutputs = body.outputs();
            for(let i = 0; i < body.outputs().len(); i++){
                const o = coreOutputs.get(i);
                const coreUtxo = C.TransactionUnspentOutput.new(dummyInput, o);
                const utxo = coreToUtxo(coreUtxo);
                delete utxo["txHash"];
                delete utxo["outputIndex"];
                outputs.push(utxo);
            }
            return outputs;
        })();
        const fee = BigInt(body.fee().to_str());
        const validTo = body.ttl() ? parseInt(body.ttl().to_str()) : "always";
        const certificates = {};
        const withdrawals = {};
        const validFrom = body.validity_start_interval() ? parseInt(body.validity_start_interval().to_str()) : "always";
        return {
            inputs,
            outputs,
            fee,
            validTo,
            certificates,
            withdrawals,
            validFrom
        };
    }
    toString() {
        return toHex(this.txComplete.to_bytes());
    }
    toHash() {
        return C.hash_transaction(this.txComplete.body()).to_hex();
    }
}
export { TxComplete as TxComplete };
class Tx {
    txBuilder;
    tasks;
    lucid;
    constructor(lucid){
        this.lucid = lucid;
        this.txBuilder = C.TransactionBuilder.new(this.lucid.txBuilderConfig);
        this.tasks = [];
    }
    readFrom(utxos) {
        this.tasks.push(async ()=>{
            for (const utxo of utxos){
                if (utxo.datumHash && !utxo.datum) {
                    utxo.datum = await this.lucid.datumOf(utxo);
                    const plutusData = C.PlutusData.from_bytes(fromHex(utxo.datum));
                    this.txBuilder.add_plutus_data(plutusData);
                }
                const coreUtxo = utxoToCore(utxo);
                this.txBuilder.add_reference_input(coreUtxo);
            }
        });
        return this;
    }
    collectFrom(utxos, redeemer) {
        this.tasks.push(async ()=>{
            for (const utxo of utxos){
                if (utxo.datumHash && !utxo.datum) {
                    utxo.datum = await this.lucid.datumOf(utxo);
                }
                const coreUtxo = utxoToCore(utxo);
                this.txBuilder.add_input(coreUtxo, redeemer && C.ScriptWitness.new_plutus_witness(C.PlutusWitness.new(C.PlutusData.from_bytes(fromHex(redeemer)), utxo.datumHash && utxo.datum ? C.PlutusData.from_bytes(fromHex(utxo.datum)) : undefined, undefined)));
            }
        });
        return this;
    }
    mintAssets(assets, redeemer) {
        const units = Object.keys(assets);
        const policyId = units[0].slice(0, 56);
        const mintAssets = C.MintAssets.new();
        units.forEach((unit)=>{
            if (unit.slice(0, 56) !== policyId) {
                throw new Error("Only one Policy Id allowed. You can chain multiple mintAssets events together if you need to mint assets with different Policy Ids.");
            }
            mintAssets.insert(C.AssetName.new(fromHex(unit.slice(56))), C.Int.from_str(assets[unit].toString()));
        });
        const scriptHash = C.ScriptHash.from_bytes(fromHex(policyId));
        this.txBuilder.add_mint(scriptHash, mintAssets, redeemer ? C.ScriptWitness.new_plutus_witness(C.PlutusWitness.new(C.PlutusData.from_bytes(fromHex(redeemer)), undefined, undefined)) : undefined);
        return this;
    }
    payToAddress(address, assets) {
        const output = C.TransactionOutput.new(C.Address.from_bech32(address), assetsToValue(assets));
        this.txBuilder.add_output(output);
        return this;
    }
    payToAddressWithData(address, outputData, assets) {
        if (typeof outputData === "string") {
            outputData = {
                asHash: outputData
            };
        }
        if (outputData.asHash && outputData.inline) {
            throw new Error("Not allowed to set asHash and inline at the same time.");
        }
        const output = C.TransactionOutput.new(C.Address.from_bech32(address), assetsToValue(assets));
        if (outputData.asHash) {
            const plutusData = C.PlutusData.from_bytes(fromHex(outputData.asHash));
            output.set_datum(C.Datum.new_data_hash(C.hash_plutus_data(plutusData)));
            this.txBuilder.add_plutus_data(plutusData);
        } else if (outputData.inline) {
            const plutusData1 = C.PlutusData.from_bytes(fromHex(outputData.inline));
            output.set_datum(C.Datum.new_data(C.Data.new(plutusData1)));
        }
        const script = outputData.scriptRef;
        if (script) {
            if (script.type === "Native") {
                output.set_script_ref(C.ScriptRef.new(C.Script.new_native(C.NativeScript.from_bytes(fromHex(script.script)))));
            } else if (script.type === "PlutusV1") {
                output.set_script_ref(C.ScriptRef.new(C.Script.new_plutus_v1(C.PlutusScript.from_bytes(fromHex(script.script)))));
            } else if (script.type === "PlutusV2") {
                output.set_script_ref(C.ScriptRef.new(C.Script.new_plutus_v2(C.PlutusScript.from_bytes(fromHex(script.script)))));
            }
        }
        this.txBuilder.add_output(output);
        return this;
    }
    payToContract(address, outputData, assets) {
        if (typeof outputData === "string") {
            outputData = {
                asHash: outputData
            };
        }
        if (!(outputData.asHash || outputData.inline)) {
            throw new Error("No datum set. Script output becomes unspendable without datum.");
        }
        return this.payToAddressWithData(address, outputData, assets);
    }
    delegateTo(rewardAddress, poolId, redeemer) {
        const addressDetails = this.lucid.utils.getAddressDetails(rewardAddress);
        if (addressDetails.address.type !== "Reward" || !addressDetails.stakeCredential) {
            throw new Error("Not a reward address provided.");
        }
        const credential = addressDetails.stakeCredential.type === "Key" ? C.StakeCredential.from_keyhash(C.Ed25519KeyHash.from_bytes(fromHex(addressDetails.stakeCredential.hash))) : C.StakeCredential.from_scripthash(C.ScriptHash.from_bytes(fromHex(addressDetails.stakeCredential.hash)));
        this.txBuilder.add_certificate(C.Certificate.new_stake_delegation(C.StakeDelegation.new(credential, C.Ed25519KeyHash.from_bech32(poolId))), redeemer ? C.ScriptWitness.new_plutus_witness(C.PlutusWitness.new(C.PlutusData.from_bytes(fromHex(redeemer)), undefined, undefined)) : undefined);
        return this;
    }
    registerStake(rewardAddress) {
        const addressDetails = this.lucid.utils.getAddressDetails(rewardAddress);
        if (addressDetails.address.type !== "Reward" || !addressDetails.stakeCredential) {
            throw new Error("Not a reward address provided.");
        }
        const credential = addressDetails.stakeCredential.type === "Key" ? C.StakeCredential.from_keyhash(C.Ed25519KeyHash.from_bytes(fromHex(addressDetails.stakeCredential.hash))) : C.StakeCredential.from_scripthash(C.ScriptHash.from_bytes(fromHex(addressDetails.stakeCredential.hash)));
        this.txBuilder.add_certificate(C.Certificate.new_stake_registration(C.StakeRegistration.new(credential)), undefined);
        return this;
    }
    deregisterStake(rewardAddress, redeemer) {
        const addressDetails = this.lucid.utils.getAddressDetails(rewardAddress);
        if (addressDetails.address.type !== "Reward" || !addressDetails.stakeCredential) {
            throw new Error("Not a reward address provided.");
        }
        const credential = addressDetails.stakeCredential.type === "Key" ? C.StakeCredential.from_keyhash(C.Ed25519KeyHash.from_bytes(fromHex(addressDetails.stakeCredential.hash))) : C.StakeCredential.from_scripthash(C.ScriptHash.from_bytes(fromHex(addressDetails.stakeCredential.hash)));
        this.txBuilder.add_certificate(C.Certificate.new_stake_deregistration(C.StakeDeregistration.new(credential)), redeemer ? C.ScriptWitness.new_plutus_witness(C.PlutusWitness.new(C.PlutusData.from_bytes(fromHex(redeemer)), undefined, undefined)) : undefined);
        return this;
    }
    registerPool(poolParams) {
        this.tasks.push(async ()=>{
            const poolRegistration = await createPoolRegistration(poolParams, this.lucid);
            const certificate = C.Certificate.new_pool_registration(poolRegistration);
            this.txBuilder.add_certificate(certificate, undefined);
        });
        return this;
    }
    updatePool(poolParams) {
        this.tasks.push(async ()=>{
            const poolRegistration = await createPoolRegistration(poolParams, this.lucid);
            poolRegistration.set_is_update(true);
            const certificate = C.Certificate.new_pool_registration(poolRegistration);
            this.txBuilder.add_certificate(certificate, undefined);
        });
        return this;
    }
    retirePool(poolId, epoch) {
        const certificate = C.Certificate.new_pool_retirement(C.PoolRetirement.new(C.Ed25519KeyHash.from_bech32(poolId), epoch));
        this.txBuilder.add_certificate(certificate, undefined);
        return this;
    }
    withdraw(rewardAddress, amount, redeemer) {
        this.txBuilder.add_withdrawal(C.RewardAddress.from_address(C.Address.from_bech32(rewardAddress)), C.BigNum.from_str(amount.toString()), redeemer ? C.ScriptWitness.new_plutus_witness(C.PlutusWitness.new(C.PlutusData.from_bytes(fromHex(redeemer)), undefined, undefined)) : undefined);
        return this;
    }
    addSigner(address) {
        const addressDetails = this.lucid.utils.getAddressDetails(address);
        if (!addressDetails.paymentCredential && !addressDetails.stakeCredential) {
            throw new Error("Not a valid address.");
        }
        const credential = addressDetails.address.type === "Reward" ? addressDetails.stakeCredential : addressDetails.paymentCredential;
        if (credential.type === "Script") {
            throw new Error("Only key hashes are allowed as signers.");
        }
        return this.addSignerKey(credential.hash);
    }
    addSignerKey(keyHash) {
        this.txBuilder.add_required_signer(C.Ed25519KeyHash.from_bytes(fromHex(keyHash)));
        return this;
    }
    validFrom(unixTime) {
        const slot = this.lucid.utils.unixTimeToSlot(unixTime);
        this.txBuilder.set_validity_start_interval(C.BigNum.from_str(slot.toString()));
        return this;
    }
    validTo(unixTime) {
        const slot = this.lucid.utils.unixTimeToSlot(unixTime);
        this.txBuilder.set_ttl(C.BigNum.from_str(slot.toString()));
        return this;
    }
    attachMetadata(label, metadata) {
        this.txBuilder.add_json_metadatum(C.BigNum.from_str(label.toString()), JSON.stringify(metadata));
        return this;
    }
    attachMetadataWithConversion(label, metadata) {
        this.txBuilder.add_json_metadatum_with_schema(C.BigNum.from_str(label.toString()), JSON.stringify(metadata), C.MetadataJsonSchema.BasicConversions);
        return this;
    }
    attachSpendingValidator(spendingValidator) {
        attachScript(this, spendingValidator);
        return this;
    }
    attachMintingPolicy(mintingPolicy) {
        attachScript(this, mintingPolicy);
        return this;
    }
    attachCertificateValidator(certValidator) {
        attachScript(this, certValidator);
        return this;
    }
    attachWithdrawalValidator(withdrawalValidator) {
        attachScript(this, withdrawalValidator);
        return this;
    }
    applyIf(condition, callback) {
        if (condition) this.tasks.push(()=>callback(this));
        return this;
    }
    async complete(options) {
        if (options?.datum?.asHash && options?.datum?.inline) {
            throw new Error("Not allowed to set asHash and inline at the same time.");
        }
        for (const task of this.tasks){
            await task();
        }
        const utxos = await this.lucid.wallet.getUtxosCore();
        const changeAddress = C.Address.from_bech32(options?.changeAddress || await this.lucid.wallet.address());
        if (options?.coinSelection || options?.coinSelection === undefined) {
            this.txBuilder.add_inputs_from(utxos, changeAddress);
        }
        this.txBuilder.balance(changeAddress, options?.datum?.asHash ? C.Datum.new_data_hash(C.hash_plutus_data(C.PlutusData.from_bytes(fromHex(options.datum.asHash)))) : options?.datum?.inline ? C.Datum.new_data(C.Data.new(C.PlutusData.from_bytes(fromHex(options.datum.inline)))) : undefined);
        if (options?.datum?.asHash) {
            this.txBuilder.add_plutus_data(C.PlutusData.from_bytes(fromHex(options.datum.asHash)));
        }
        return new TxComplete(this.lucid, await this.txBuilder.construct(utxos, changeAddress));
    }
}
function attachScript(tx, script) {
    if (script.type === "Native") {
        return tx.txBuilder.add_native_script(C.NativeScript.from_bytes(fromHex(script.script)));
    } else if (script.type === "PlutusV1") {
        return tx.txBuilder.add_plutus_script(C.PlutusScript.from_bytes(fromHex(script.script)));
    } else if (script.type === "PlutusV2") {
        return tx.txBuilder.add_plutus_v2_script(C.PlutusScript.from_bytes(fromHex(script.script)));
    }
    throw new Error("No variant matched.");
}
async function createPoolRegistration(poolParams, lucid) {
    const poolOwners = C.Ed25519KeyHashes.new();
    poolParams.owners.forEach((owner)=>{
        const { stakeCredential  } = lucid.utils.getAddressDetails(owner);
        if (stakeCredential?.type === "Key") {
            poolOwners.add(C.Ed25519KeyHash.from_hex(stakeCredential.hash));
        } else throw new Error("Only key hashes allowed for pool owners.");
    });
    const metadata = poolParams.metadataUrl ? await fetch(poolParams.metadataUrl).then((res)=>res.arrayBuffer()) : null;
    const metadataHash = metadata ? C.PoolMetadataHash.from_bytes(C.hash_blake2b256(new Uint8Array(metadata))) : null;
    const relays = C.Relays.new();
    poolParams.relays.forEach((relay)=>{
        switch(relay.type){
            case "SingleHostIp":
                {
                    const ipV4 = relay.ipV4 ? C.Ipv4.new(new Uint8Array(relay.ipV4.split(".").map((b)=>parseInt(b)))) : undefined;
                    const ipV6 = relay.ipV6 ? C.Ipv6.new(fromHex(relay.ipV6.replaceAll(":", ""))) : undefined;
                    relays.add(C.Relay.new_single_host_addr(C.SingleHostAddr.new(relay.port, ipV4, ipV6)));
                    break;
                }
            case "SingleHostDomainName":
                {
                    relays.add(C.Relay.new_single_host_name(C.SingleHostName.new(relay.port, C.DNSRecordAorAAAA.new(relay.domainName))));
                    break;
                }
            case "MultiHost":
                {
                    relays.add(C.Relay.new_multi_host_name(C.MultiHostName.new(C.DNSRecordSRV.new(relay.domainName))));
                    break;
                }
        }
    });
    return C.PoolRegistration.new(C.PoolParams.new(C.Ed25519KeyHash.from_bech32(poolParams.poolId), C.VRFKeyHash.from_hex(poolParams.vrfKeyHash), C.BigNum.from_str(poolParams.pledge.toString()), C.BigNum.from_str(poolParams.cost.toString()), C.UnitInterval.from_float(poolParams.margin), C.RewardAddress.from_address(C.Address.from_bech32(poolParams.rewardAddress)), poolOwners, relays, metadataHash ? C.PoolMetadata.new(C.URL.new(poolParams.metadataUrl), metadataHash) : undefined));
}
export { Tx as Tx };
class Blockfrost {
    data;
    constructor(url, projectId){
        this.data = {
            url,
            projectId
        };
    }
    async getProtocolParameters() {
        const result = await fetch(`${this.data.url}/epochs/latest/parameters`, {
            headers: {
                project_id: this.data.projectId
            }
        }).then((res)=>res.json());
        return {
            minFeeA: parseInt(result.min_fee_a),
            minFeeB: parseInt(result.min_fee_b),
            maxTxSize: parseInt(result.max_tx_size),
            maxValSize: parseInt(result.max_val_size),
            keyDeposit: BigInt(result.key_deposit),
            poolDeposit: BigInt(result.pool_deposit),
            priceMem: parseFloat(result.price_mem),
            priceStep: parseFloat(result.price_step),
            coinsPerUtxoByte: BigInt(result.coins_per_utxo_size),
            collateralPercentage: parseInt(result.collateral_percent),
            maxCollateralInputs: parseInt(result.max_collateral_inputs),
            costModels: result.cost_models
        };
    }
    async getCurrentSlot() {
        return await fetch(`${this.data.url}/blocks/latest`, {
            headers: {
                project_id: this.data.projectId
            }
        }).then((res)=>res.json()).then((res)=>parseInt(res.slot));
    }
    async getUtxos(address) {
        let result = [];
        let page = 1;
        while(true){
            let pageResult = await fetch(`${this.data.url}/addresses/${address}/utxos?page=${page}`, {
                headers: {
                    project_id: this.data.projectId
                }
            }).then((res)=>res.json());
            if (pageResult.error) {
                if (pageResult.status_code === 400) return [];
                else if (pageResult.status_code === 500) {
                    throw new Error("Could not fetch UTxOs from Blockfrost. Try again.");
                } else {
                    pageResult = [];
                }
            }
            result = result.concat(pageResult);
            if (pageResult.length <= 0) break;
            page++;
        }
        return this.blockfrostUtxosToUtxos(result.map((r)=>({
                ...r,
                address
            })));
    }
    async getUtxosWithUnit(address, unit) {
        let result = [];
        let page = 1;
        while(true){
            let pageResult = await fetch(`${this.data.url}/addresses/${address}/utxos/${unit}?page=${page}`, {
                headers: {
                    project_id: this.data.projectId
                }
            }).then((res)=>res.json());
            if (pageResult.error) {
                if (pageResult.status_code === 400) return [];
                else if (pageResult.status_code === 500) {
                    throw new Error("Could not fetch UTxOs from Blockfrost. Try again.");
                } else {
                    pageResult = [];
                }
            }
            result = result.concat(pageResult);
            if (pageResult.length <= 0) break;
            page++;
        }
        return this.blockfrostUtxosToUtxos(result.map((r)=>({
                ...r,
                address
            })));
    }
    async getUtxosByOutRef(outRefs) {
        const queryHashes = [
            ...new Set(outRefs.map((outRef)=>outRef.txHash))
        ];
        const utxos = await Promise.all(queryHashes.map(async (txHash)=>{
            const result = await fetch(`${this.data.url}/txs/${txHash}/utxos`, {
                headers: {
                    project_id: this.data.projectId
                }
            }).then((res)=>res.json());
            if (!result || result.error) {
                return [];
            }
            const utxosResult = result.outputs.map((r)=>({
                    ...r,
                    tx_hash: txHash
                }));
            return this.blockfrostUtxosToUtxos(utxosResult);
        }));
        return utxos.reduce((acc, utxos)=>acc.concat(utxos), []).filter((utxo)=>outRefs.some((outRef)=>utxo.txHash === outRef.txHash && utxo.outputIndex === outRef.outputIndex));
    }
    async getDelegation(rewardAddress) {
        const result = await fetch(`${this.data.url}/accounts/${rewardAddress}`, {
            headers: {
                project_id: this.data.projectId
            }
        }).then((res)=>res.json());
        if (!result || result.error) {
            return {
                poolId: null,
                rewards: 0n
            };
        }
        return {
            poolId: result.pool_id || null,
            rewards: BigInt(result.withdrawable_amount)
        };
    }
    async getDatum(datumHash) {
        const datum = await fetch(`${this.data.url}/scripts/datum/${datumHash}/cbor`, {
            headers: {
                project_id: this.data.projectId
            }
        }).then((res)=>res.json()).then((res)=>res.cbor);
        if (!datum || datum.error) {
            throw new Error(`No datum found for datum hash: ${datumHash}`);
        }
        return datum;
    }
    async awaitTx(txHash) {
        return await new Promise((res)=>{
            const confirmation = setInterval(async ()=>{
                const isConfirmed = await fetch(`${this.data.url}/txs/${txHash}`, {
                    headers: {
                        project_id: this.data.projectId
                    }
                }).then((res)=>res.json());
                if (isConfirmed && !isConfirmed.error) {
                    clearInterval(confirmation);
                    res(true);
                    return;
                }
            }, 3000);
        });
    }
    async submitTx(tx) {
        const result = await fetch(`${this.data.url}/tx/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/cbor",
                project_id: this.data.projectId
            },
            body: tx.to_bytes()
        }).then((res)=>res.json());
        if (!result || result.error) {
            if (result?.status_code === 400) throw new Error(result.message);
            else throw new Error("Could not submit transaction.");
        }
        return result;
    }
    async blockfrostUtxosToUtxos(result) {
        return await Promise.all(result.map(async (r)=>({
                txHash: r.tx_hash,
                outputIndex: r.output_index,
                assets: (()=>{
                    const a = {};
                    r.amount.forEach((am)=>{
                        a[am.unit] = BigInt(am.quantity);
                    });
                    return a;
                })(),
                address: r.address,
                datumHash: !r.inline_datum ? r.data_hash : null,
                datum: r.inline_datum,
                scriptRef: r.reference_script_hash && await (async ()=>{
                    const { type ,  } = await fetch(`${this.data.url}/scripts/${r.reference_script_hash}`, {
                        headers: {
                            project_id: this.data.projectId
                        }
                    }).then((res)=>res.json());
                    if (type === "Native") {
                        throw new Error("Native script ref not implemented!");
                    }
                    const { cbor  } = await fetch(`${this.data.url}/scripts/${r.reference_script_hash}/cbor`, {
                        headers: {
                            project_id: this.data.projectId
                        }
                    }).then((res)=>res.json());
                    const script = C.PlutusScript.from_bytes(fromHex(cbor));
                    const scriptRef = C.ScriptRef.new(type === "PlutusV1" ? C.Script.new_plutus_v1(script) : C.Script.new_plutus_v2(script));
                    return toHex(scriptRef.to_bytes());
                })()
            })));
    }
}
function datumJsonToCbor(json) {
    const convert = (json)=>{
        if (!isNaN(json.int)) {
            return C.PlutusData.new_integer(C.BigInt.from_str(json.int.toString()));
        } else if (json.bytes || !isNaN(Number(json.bytes))) {
            return C.PlutusData.new_bytes(fromHex(json.bytes));
        } else if (json.map) {
            const m = C.PlutusMap.new();
            json.map.forEach(({ k , v  })=>{
                m.insert(convert(k), convert(v));
            });
            return C.PlutusData.new_map(m);
        } else if (json.list) {
            const l = C.PlutusList.new();
            json.list.forEach((v)=>{
                l.add(convert(v));
            });
            return C.PlutusData.new_list(l);
        } else if (!isNaN(json.constructor)) {
            const l1 = C.PlutusList.new();
            json.fields.forEach((v)=>{
                l1.add(convert(v));
            });
            return C.PlutusData.new_constr_plutus_data(C.ConstrPlutusData.new(C.BigNum.from_str(json.constructor.toString()), l1));
        }
        throw new Error("Unsupported type");
    };
    return toHex(convert(json).to_bytes());
}
export { Blockfrost as Blockfrost };
export { datumJsonToCbor as datumJsonToCbor };
function signData(addressHex, payload, privateKey) {
    const protectedHeaders = M.HeaderMap.new();
    protectedHeaders.set_algorithm_id(M.Label.from_algorithm_id(M.AlgorithmId.EdDSA));
    protectedHeaders.set_header(M.Label.new_text("address"), M.CBORValue.new_bytes(fromHex(addressHex)));
    const protectedSerialized = M.ProtectedHeaderMap.new(protectedHeaders);
    const unprotectedHeaders = M.HeaderMap.new();
    const headers = M.Headers.new(protectedSerialized, unprotectedHeaders);
    const builder = M.COSESign1Builder.new(headers, fromHex(payload), false);
    const toSign = builder.make_data_to_sign().to_bytes();
    const priv = C.PrivateKey.from_bech32(privateKey);
    const signedSigStruc = priv.sign(toSign).to_bytes();
    const coseSign1 = builder.build(signedSigStruc);
    const key = M.COSEKey.new(M.Label.from_key_type(M.KeyType.OKP));
    key.set_algorithm_id(M.Label.from_algorithm_id(M.AlgorithmId.EdDSA));
    key.set_header(M.Label.new_int(M.Int.new_negative(M.BigNum.from_str("1"))), M.CBORValue.new_int(M.Int.new_i32(6)));
    key.set_header(M.Label.new_int(M.Int.new_negative(M.BigNum.from_str("2"))), M.CBORValue.new_bytes(priv.to_public().as_bytes()));
    return {
        signature: toHex(coseSign1.to_bytes()),
        key: toHex(key.to_bytes())
    };
}
class Message {
    lucid;
    address;
    payload;
    constructor(lucid, address, payload){
        this.lucid = lucid;
        this.address = address;
        this.payload = payload;
    }
    sign() {
        return this.lucid.wallet.signMessage(this.address, this.payload);
    }
    signWithPrivateKey(privateKey) {
        const { paymentCredential , stakeCredential , address: { hex: hexAddress  }  } = this.lucid.utils.getAddressDetails(this.address);
        const keyHash = paymentCredential?.hash || stakeCredential?.hash;
        const keyHashOriginal = C.PrivateKey.from_bech32(privateKey).to_public().hash().to_hex();
        if (!keyHash || keyHash !== keyHashOriginal) {
            throw new Error(`Cannot sign message for address: ${this.address}.`);
        }
        return signData(hexAddress, this.payload, privateKey);
    }
}
function verifyData(addressHex, keyHash, payload, signedMessage) {
    const cose1 = M.COSESign1.from_bytes(fromHex(signedMessage.signature));
    const key = M.COSEKey.from_bytes(fromHex(signedMessage.key));
    const protectedHeaders = cose1.headers().protected().deserialized_headers();
    const cose1Address = (()=>{
        try {
            return toHex(protectedHeaders.header(M.Label.new_text("address"))?.as_bytes());
        } catch (_e) {
            throw new Error("No address found in signature.");
        }
    })();
    const cose1AlgorithmId = (()=>{
        try {
            const __int = protectedHeaders.algorithm_id()?.as_int();
            if (__int?.is_positive()) return parseInt(__int.as_positive()?.to_str());
            return parseInt(__int?.as_negative()?.to_str());
        } catch (_e) {
            throw new Error("Failed to retrieve Algorithm Id.");
        }
    })();
    const keyAlgorithmId = (()=>{
        try {
            const __int = key.algorithm_id()?.as_int();
            if (__int?.is_positive()) return parseInt(__int.as_positive()?.to_str());
            return parseInt(__int?.as_negative()?.to_str());
        } catch (_e) {
            throw new Error("Failed to retrieve Algorithm Id.");
        }
    })();
    const keyCurve = (()=>{
        try {
            const __int = key.header(M.Label.new_int(M.Int.new_negative(M.BigNum.from_str("1"))))?.as_int();
            if (__int?.is_positive()) return parseInt(__int.as_positive()?.to_str());
            return parseInt(__int?.as_negative()?.to_str());
        } catch (_e) {
            throw new Error("Failed to retrieve Curve.");
        }
    })();
    const keyType = (()=>{
        try {
            const __int = key.key_type().as_int();
            if (__int?.is_positive()) return parseInt(__int.as_positive()?.to_str());
            return parseInt(__int?.as_negative()?.to_str());
        } catch (_e) {
            throw new Error("Failed to retrieve Key Type.");
        }
    })();
    const publicKey = (()=>{
        try {
            return C.PublicKey.from_bytes(key.header(M.Label.new_int(M.Int.new_negative(M.BigNum.from_str("2"))))?.as_bytes());
        } catch (_e) {
            throw new Error("No public key found.");
        }
    })();
    const cose1Payload = (()=>{
        try {
            return toHex(cose1.payload());
        } catch (_e) {
            throw new Error("No payload found.");
        }
    })();
    const signature = C.Ed25519Signature.from_bytes(cose1.signature());
    const data = cose1.signed_data(undefined, undefined).to_bytes();
    if (cose1Address !== addressHex) return false;
    if (keyHash !== publicKey.hash().to_hex()) return false;
    if (cose1AlgorithmId !== keyAlgorithmId && cose1AlgorithmId !== M.AlgorithmId.EdDSA) {
        return false;
    }
    if (keyCurve !== 6) return false;
    if (keyType !== 1) return false;
    if (cose1Payload !== payload) return false;
    return publicKey.verify(data, signature);
}
function walletFromSeed(seed, options) {
    options = {
        addressType: options?.addressType || "Base",
        accountIndex: options?.accountIndex ?? 0,
        network: options?.network || "Mainnet"
    };
    function harden(num) {
        if (typeof num !== "number") throw new Error("Type number required here!");
        return 0x80000000 + num;
    }
    const entropy = mnemonicToEntropy(seed);
    const rootKey = C.Bip32PrivateKey.from_bip39_entropy(fromHex(entropy), new Uint8Array());
    const accountKey = rootKey.derive(harden(1852)).derive(harden(1815)).derive(harden(options.accountIndex));
    const paymentKey = accountKey.derive(0).derive(0).to_raw_key();
    const stakeKey = accountKey.derive(2).derive(0).to_raw_key();
    const paymentKeyHash = paymentKey.to_public().hash();
    const stakeKeyHash = stakeKey.to_public().hash();
    const networkId = options.network === "Mainnet" ? 1 : 0;
    const address = options.addressType === "Base" ? C.BaseAddress.new(networkId, C.StakeCredential.from_keyhash(paymentKeyHash), C.StakeCredential.from_keyhash(stakeKeyHash)).to_address().to_bech32(undefined) : C.EnterpriseAddress.new(networkId, C.StakeCredential.from_keyhash(paymentKeyHash)).to_address().to_bech32(undefined);
    const rewardAddress = options.addressType === "Base" ? C.RewardAddress.new(networkId, C.StakeCredential.from_keyhash(stakeKeyHash)).to_address().to_bech32(undefined) : null;
    return {
        address,
        rewardAddress,
        paymentKey: paymentKey.to_bech32(),
        stakeKey: options.addressType === "Base" ? stakeKey.to_bech32() : null
    };
}
function discoverOwnUsedTxKeyHashes(tx, ownKeyHashes, ownUtxos) {
    const usedKeyHashes = [];
    const inputs = tx.body().inputs();
    for(let i = 0; i < inputs.len(); i++){
        const input = inputs.get(i);
        const txHash = toHex(input.transaction_id().to_bytes());
        const outputIndex = parseInt(input.index().to_str());
        const utxo = ownUtxos.find((utxo)=>utxo.txHash === txHash && utxo.outputIndex === outputIndex);
        if (utxo) {
            const { paymentCredential  } = getAddressDetails(utxo.address);
            usedKeyHashes.push(paymentCredential?.hash);
        }
    }
    const txBody = tx.body();
    function keyHashFromCert(txBody) {
        const certs = txBody.certs();
        if (!certs) return;
        for(let i = 0; i < certs.len(); i++){
            const cert = certs.get(i);
            if (cert.kind() === 0) {
                const credential = cert.as_stake_registration()?.stake_credential();
                if (credential?.kind() === 0) {}
            } else if (cert.kind() === 1) {
                const credential1 = cert.as_stake_deregistration()?.stake_credential();
                if (credential1?.kind() === 0) {
                    const keyHash = toHex(credential1.to_keyhash().to_bytes());
                    usedKeyHashes.push(keyHash);
                }
            } else if (cert.kind() === 2) {
                const credential2 = cert.as_stake_delegation()?.stake_credential();
                if (credential2?.kind() === 0) {
                    const keyHash1 = toHex(credential2.to_keyhash().to_bytes());
                    usedKeyHashes.push(keyHash1);
                }
            } else if (cert.kind() === 3) {
                const poolParams = cert.as_pool_registration()?.pool_params();
                const owners = poolParams?.pool_owners();
                if (!owners) break;
                for(let i1 = 0; i1 < owners.len(); i1++){
                    const keyHash2 = toHex(owners.get(i1).to_bytes());
                    usedKeyHashes.push(keyHash2);
                }
                const operator = poolParams.operator().to_hex();
                usedKeyHashes.push(operator);
            } else if (cert.kind() === 4) {
                const operator1 = cert.as_pool_retirement().pool_keyhash().to_hex();
                usedKeyHashes.push(operator1);
            } else if (cert.kind() === 6) {
                const instantRewards = cert.as_move_instantaneous_rewards_cert()?.move_instantaneous_reward().as_to_stake_creds()?.keys();
                if (!instantRewards) break;
                for(let i2 = 0; i2 < instantRewards.len(); i2++){
                    const credential3 = instantRewards.get(i2);
                    if (credential3.kind() === 0) {
                        const keyHash3 = toHex(credential3.to_keyhash().to_bytes());
                        usedKeyHashes.push(keyHash3);
                    }
                }
            }
        }
    }
    if (txBody.certs()) keyHashFromCert(txBody);
    const withdrawals = txBody.withdrawals();
    function keyHashFromWithdrawal(withdrawals) {
        const rewardAddresses = withdrawals.keys();
        for(let i = 0; i < rewardAddresses.len(); i++){
            const credential = rewardAddresses.get(i).payment_cred();
            if (credential.kind() === 0) {
                usedKeyHashes.push(credential.to_keyhash().to_hex());
            }
        }
    }
    if (withdrawals) keyHashFromWithdrawal(withdrawals);
    const scripts = tx.witness_set().native_scripts();
    function keyHashFromScript(scripts) {
        for(let i = 0; i < scripts.len(); i++){
            const script = scripts.get(i);
            if (script.kind() === 0) {
                const keyHash = toHex(script.as_script_pubkey().addr_keyhash().to_bytes());
                usedKeyHashes.push(keyHash);
            }
            if (script.kind() === 1) {
                keyHashFromScript(script.as_script_all().native_scripts());
                return;
            }
            if (script.kind() === 2) {
                keyHashFromScript(script.as_script_any().native_scripts());
                return;
            }
            if (script.kind() === 3) {
                keyHashFromScript(script.as_script_n_of_k().native_scripts());
                return;
            }
        }
    }
    if (scripts) keyHashFromScript(scripts);
    const requiredSigners = txBody.required_signers();
    if (requiredSigners) {
        for(let i1 = 0; i1 < requiredSigners.len(); i1++){
            usedKeyHashes.push(toHex(requiredSigners.get(i1).to_bytes()));
        }
    }
    const collateral = txBody.collateral();
    if (collateral) {
        for(let i2 = 0; i2 < collateral.len(); i2++){
            const input1 = collateral.get(i2);
            const txHash1 = toHex(input1.transaction_id().to_bytes());
            const outputIndex1 = parseInt(input1.index().to_str());
            const utxo1 = ownUtxos.find((utxo)=>utxo.txHash === txHash1 && utxo.outputIndex === outputIndex1);
            if (utxo1) {
                const { paymentCredential: paymentCredential1  } = getAddressDetails(utxo1.address);
                usedKeyHashes.push(paymentCredential1?.hash);
            }
        }
    }
    return usedKeyHashes.filter((k)=>ownKeyHashes.includes(k));
}
class Lucid {
    txBuilderConfig;
    wallet;
    provider;
    network = "Mainnet";
    utils;
    static async new(provider, network) {
        const lucid = new this();
        if (network) lucid.network = network;
        if (provider) {
            lucid.provider = provider;
            const protocolParameters = await provider.getProtocolParameters();
            lucid.txBuilderConfig = C.TransactionBuilderConfigBuilder.new().coins_per_utxo_byte(C.BigNum.from_str(protocolParameters.coinsPerUtxoByte.toString())).fee_algo(C.LinearFee.new(C.BigNum.from_str(protocolParameters.minFeeA.toString()), C.BigNum.from_str(protocolParameters.minFeeB.toString()))).key_deposit(C.BigNum.from_str(protocolParameters.keyDeposit.toString())).pool_deposit(C.BigNum.from_str(protocolParameters.poolDeposit.toString())).max_tx_size(protocolParameters.maxTxSize).max_value_size(protocolParameters.maxValSize).collateral_percentage(protocolParameters.collateralPercentage).max_collateral_inputs(protocolParameters.maxCollateralInputs).ex_unit_prices(C.ExUnitPrices.from_float(protocolParameters.priceMem, protocolParameters.priceStep)).blockfrost(C.Blockfrost.new(provider.data.url + "/utils/txs/evaluate", provider.data.projectId)).costmdls(createCostModels(protocolParameters.costModels)).build();
        }
        lucid.utils = new Utils(lucid);
        return lucid;
    }
    newTx() {
        return new Tx(this);
    }
    fromTx(tx) {
        return new TxComplete(this, C.Transaction.from_bytes(fromHex(tx)));
    }
    newMessage(address, payload) {
        return new Message(this, address, payload);
    }
    verifyMessage(address, payload, signedMessage) {
        const { paymentCredential , stakeCredential , address: { hex: addressHex  }  } = this.utils.getAddressDetails(address);
        const keyHash = paymentCredential?.hash || stakeCredential?.hash;
        if (!keyHash) throw new Error("Not a valid address provided.");
        return verifyData(addressHex, keyHash, payload, signedMessage);
    }
    currentSlot() {
        return this.provider.getCurrentSlot();
    }
    utxosAt(address) {
        return this.provider.getUtxos(address);
    }
    utxosAtWithUnit(address, unit) {
        return this.provider.getUtxosWithUnit(address, unit);
    }
    utxosByOutRef(outRefs) {
        return this.provider.getUtxosByOutRef(outRefs);
    }
    delegationAt(rewardAddress) {
        return this.provider.getDelegation(rewardAddress);
    }
    awaitTx(txHash) {
        return this.provider.awaitTx(txHash);
    }
    async datumOf(utxo) {
        if (utxo.datum) return utxo.datum;
        if (!utxo.datumHash) {
            throw new Error("This UTxO does not have a datum hash.");
        }
        utxo.datum = await this.provider.getDatum(utxo.datumHash);
        return utxo.datum;
    }
    selectWalletFromPrivateKey(privateKey) {
        const priv = C.PrivateKey.from_bech32(privateKey);
        const pubKeyHash = priv.to_public().hash();
        this.wallet = {
            address: async ()=>C.EnterpriseAddress.new(this.network === "Mainnet" ? 1 : 0, C.StakeCredential.from_keyhash(pubKeyHash)).to_address().to_bech32(undefined),
            rewardAddress: async ()=>null,
            getUtxos: async ()=>{
                return await this.utxosAt(await this.wallet.address());
            },
            getUtxosCore: async ()=>{
                const utxos = await this.utxosAt(await this.wallet.address());
                const coreUtxos = C.TransactionUnspentOutputs.new();
                utxos.forEach((utxo)=>{
                    coreUtxos.add(utxoToCore(utxo));
                });
                return coreUtxos;
            },
            getDelegation: async ()=>{
                return {
                    poolId: null,
                    rewards: 0n
                };
            },
            signTx: async (tx)=>{
                const witness = C.make_vkey_witness(C.hash_transaction(tx.body()), priv);
                const txWitnessSetBuilder = C.TransactionWitnessSetBuilder.new();
                txWitnessSetBuilder.add_vkey(witness);
                return txWitnessSetBuilder.build();
            },
            signMessage: async (address, payload)=>{
                const { paymentCredential , address: { hex: hexAddress  }  } = this.utils.getAddressDetails(address);
                const keyHash = paymentCredential?.hash;
                const originalKeyHash = pubKeyHash.to_hex();
                if (!keyHash || keyHash !== originalKeyHash) {
                    throw new Error(`Cannot sign message for address: ${address}.`);
                }
                return signData(hexAddress, payload, privateKey);
            },
            submitTx: async (tx)=>{
                return await this.provider.submitTx(tx);
            }
        };
        return this;
    }
    selectWallet(api) {
        this.wallet = {
            address: async ()=>C.Address.from_bytes(fromHex((await api.getUsedAddresses())[0])).to_bech32(undefined),
            rewardAddress: async ()=>{
                const [rewardAddressHex] = await api.getRewardAddresses();
                const rewardAddress = rewardAddressHex ?? C.RewardAddress.from_address(C.Address.from_bytes(fromHex(rewardAddressHex))).to_address().to_bech32(undefined);
                return rewardAddress;
            },
            getUtxos: async ()=>{
                const utxos = (await api.getUtxos() || []).map((utxo)=>{
                    const parsedUtxo = C.TransactionUnspentOutput.from_bytes(fromHex(utxo));
                    return coreToUtxo(parsedUtxo);
                });
                return utxos;
            },
            getUtxosCore: async ()=>{
                const utxos = C.TransactionUnspentOutputs.new();
                (await api.getUtxos() || []).forEach((utxo)=>{
                    utxos.add(C.TransactionUnspentOutput.from_bytes(fromHex(utxo)));
                });
                return utxos;
            },
            getDelegation: async ()=>{
                const rewardAddr = await this.wallet.rewardAddress();
                return rewardAddr ? await this.delegationAt(rewardAddr) : {
                    poolId: null,
                    rewards: 0n
                };
            },
            signTx: async (tx)=>{
                const witnessSet = await api.signTx(toHex(tx.to_bytes()), true);
                return C.TransactionWitnessSet.from_bytes(fromHex(witnessSet));
            },
            signMessage: async (address, payload)=>{
                const hexAddress = toHex(C.Address.from_bech32(address).to_bytes());
                return await api.signData(hexAddress, payload);
            },
            submitTx: async (tx)=>{
                const txHash = await api.submitTx(toHex(tx.to_bytes()));
                return txHash;
            }
        };
        return this;
    }
    selectWalletFrom({ address , utxos , rewardAddress  }) {
        const addressDetails = this.utils.getAddressDetails(address);
        this.wallet = {
            address: async ()=>address,
            rewardAddress: async ()=>{
                const rewardAddr = !rewardAddress && addressDetails.stakeCredential ? (()=>{
                    if (addressDetails.stakeCredential.type === "Key") {
                        return C.RewardAddress.new(this.network === "Mainnet" ? 1 : 0, C.StakeCredential.from_keyhash(C.Ed25519KeyHash.from_hex(addressDetails.stakeCredential.hash))).to_address().to_bech32(undefined);
                    }
                    return C.RewardAddress.new(this.network === "Mainnet" ? 1 : 0, C.StakeCredential.from_scripthash(C.ScriptHash.from_hex(addressDetails.stakeCredential.hash))).to_address().to_bech32(undefined);
                })() : rewardAddress;
                return rewardAddr || null;
            },
            getUtxos: async ()=>{
                return utxos ? utxos : await this.utxosAt(address);
            },
            getUtxosCore: async ()=>{
                const coreUtxos = C.TransactionUnspentOutputs.new();
                (utxos ? utxos : await this.utxosAt(address)).forEach((utxo)=>coreUtxos.add(utxoToCore(utxo)));
                return coreUtxos;
            },
            getDelegation: async ()=>{
                const rewardAddr = await this.wallet.rewardAddress();
                return rewardAddr ? await this.delegationAt(rewardAddr) : {
                    poolId: null,
                    rewards: 0n
                };
            },
            signTx: async ()=>{
                throw new Error("Not implemented");
            },
            signMessage: async ()=>{
                throw new Error("Not implemented");
            },
            submitTx: async (tx)=>{
                return await this.provider.submitTx(tx);
            }
        };
        return this;
    }
    selectWalletFromSeed(seed, options) {
        const { address , rewardAddress , paymentKey , stakeKey  } = walletFromSeed(seed, {
            addressType: options?.addressType,
            accountIndex: options?.accountIndex,
            network: this.network
        });
        const paymentKeyHash = C.PrivateKey.from_bech32(paymentKey).to_public().hash().to_hex();
        const stakeKeyHash = stakeKey ? C.PrivateKey.from_bech32(stakeKey).to_public().hash().to_hex() : "";
        const privKeyHashMap = {
            [paymentKeyHash]: paymentKey,
            [stakeKeyHash]: stakeKey
        };
        this.wallet = {
            address: async ()=>address,
            rewardAddress: async ()=>rewardAddress || null,
            getUtxos: async ()=>this.utxosAt(address),
            getUtxosCore: async ()=>{
                const coreUtxos = C.TransactionUnspentOutputs.new();
                (await this.utxosAt(address)).forEach((utxo)=>coreUtxos.add(utxoToCore(utxo)));
                return coreUtxos;
            },
            getDelegation: async ()=>{
                const rewardAddr = await this.wallet.rewardAddress();
                return rewardAddr ? await this.delegationAt(rewardAddr) : {
                    poolId: null,
                    rewards: 0n
                };
            },
            signTx: async (tx)=>{
                const utxos = await this.utxosAt(address);
                const ownKeyHashes = [
                    paymentKeyHash,
                    stakeKeyHash
                ];
                const usedKeyHashes = discoverOwnUsedTxKeyHashes(tx, ownKeyHashes, utxos);
                const txWitnessSetBuilder = C.TransactionWitnessSetBuilder.new();
                usedKeyHashes.forEach((keyHash)=>{
                    const witness = C.make_vkey_witness(C.hash_transaction(tx.body()), C.PrivateKey.from_bech32(privKeyHashMap[keyHash]));
                    txWitnessSetBuilder.add_vkey(witness);
                });
                return txWitnessSetBuilder.build();
            },
            signMessage: async (address, payload)=>{
                const { paymentCredential , stakeCredential , address: { hex: hexAddress  } ,  } = this.utils.getAddressDetails(address);
                const keyHash = paymentCredential?.hash || stakeCredential?.hash;
                const privateKey = privKeyHashMap[keyHash];
                if (!privateKey) {
                    throw new Error(`Cannot sign message for address: ${address}.`);
                }
                return signData(hexAddress, payload, privateKey);
            },
            submitTx: async (tx)=>{
                return await this.provider.submitTx(tx);
            }
        };
        return this;
    }
}
export { Lucid as Lucid };
