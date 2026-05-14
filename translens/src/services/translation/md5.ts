export function md5(input: string): string {
  function rotateLeft(n: number, s: number): number {
    return (n << s) | (n >>> (32 - s));
  }
  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z); }
  function FF(a: number,b: number,c: number,d: number,x: number,s: number,t: number){
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, F(b,c,d)), addUnsigned(x,t)), s), b);
  }
  function GG(a: number,b: number,c: number,d: number,x: number,s: number,t: number){
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, G(b,c,d)), addUnsigned(x,t)), s), b);
  }
  function HH(a: number,b: number,c: number,d: number,x: number,s: number,t: number){
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, H(b,c,d)), addUnsigned(x,t)), s), b);
  }
  function II(a: number,b: number,c: number,d: number,x: number,s: number,t: number){
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, I(b,c,d)), addUnsigned(x,t)), s), b);
  }
  function stringToWords(s: string): number[] {
    const len = s.length;
    const words: number[] = [];
    for (let i = 0; i < len - 3; i += 4) {
      words.push(
        (s.charCodeAt(i)) | (s.charCodeAt(i+1) << 8) |
        (s.charCodeAt(i+2) << 16) | (s.charCodeAt(i+3) << 24)
      );
    }
    const rem = len % 4;
    if (rem === 0) { words.push(0x80); }
    else if (rem === 1) { words.push(s.charCodeAt(len-1) | 0x8000); }
    else if (rem === 2) { words.push(s.charCodeAt(len-2) | (s.charCodeAt(len-1) << 8) | 0x80000); }
    else { words.push(s.charCodeAt(len-3) | (s.charCodeAt(len-2) << 8) | (s.charCodeAt(len-1) << 16) | 0x800000); }
    while ((words.length + 2) % 16 !== 0) words.push(0);
    const lowBits = (len * 8) & 0xffffffff;
    const highBits = Math.floor(len * 8 / Math.pow(2, 32));
    words.push(lowBits, highBits);
    return words;
  }
  function wordToHex(w: number): string {
    let hex = "";
    for (let i = 0; i < 4; i++) {
      hex += ((w >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    }
    return hex;
  }

  const x = stringToWords(input);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const aa = a, bb = b, cc = c, dd = d;
    a=FF(a,b,c,d,x[k+0],7,0xd76aa478);d=FF(d,a,b,c,x[k+1],12,0xe8c7b756);c=FF(c,d,a,b,x[k+2],17,0x242070db);b=FF(b,c,d,a,x[k+3],22,0xc1bdceee);
    a=FF(a,b,c,d,x[k+4],7,0xf57c0faf);d=FF(d,a,b,c,x[k+5],12,0x4787c62a);c=FF(c,d,a,b,x[k+6],17,0xa8304613);b=FF(b,c,d,a,x[k+7],22,0xfd469501);
    a=FF(a,b,c,d,x[k+8],7,0x698098d8);d=FF(d,a,b,c,x[k+9],12,0x8b44f7af);c=FF(c,d,a,b,x[k+10],17,0xffff5bb1);b=FF(b,c,d,a,x[k+11],22,0x895cd7be);
    a=FF(a,b,c,d,x[k+12],7,0x6b901122);d=FF(d,a,b,c,x[k+13],12,0xfd987193);c=FF(c,d,a,b,x[k+14],17,0xa679438e);b=FF(b,c,d,a,x[k+15],22,0x49b40821);
    a=GG(a,b,c,d,x[k+1],5,0xf61e2562);d=GG(d,a,b,c,x[k+6],9,0xc040b340);c=GG(c,d,a,b,x[k+11],14,0x265e5a51);b=GG(b,c,d,a,x[k+0],20,0xe9b6c7aa);
    a=GG(a,b,c,d,x[k+5],5,0xd62f105d);d=GG(d,a,b,c,x[k+10],9,0x2441453);c=GG(c,d,a,b,x[k+15],14,0xd8a1e681);b=GG(b,c,d,a,x[k+4],20,0xe7d3fbc8);
    a=GG(a,b,c,d,x[k+9],5,0x21e1cde6);d=GG(d,a,b,c,x[k+14],9,0xc33707d6);c=GG(c,d,a,b,x[k+3],14,0xf4d50d87);b=GG(b,c,d,a,x[k+8],20,0x455a14ed);
    a=GG(a,b,c,d,x[k+13],5,0xa9e3e905);d=GG(d,a,b,c,x[k+2],9,0xfcefa3f8);c=GG(c,d,a,b,x[k+7],14,0x676f02d9);b=GG(b,c,d,a,x[k+12],20,0x8d2a4c8a);
    a=HH(a,b,c,d,x[k+5],4,0xfffa3942);d=HH(d,a,b,c,x[k+8],11,0x8771f681);c=HH(c,d,a,b,x[k+11],16,0x6d9d6122);b=HH(b,c,d,a,x[k+14],23,0xfde5380c);
    a=HH(a,b,c,d,x[k+1],4,0xa4beea44);d=HH(d,a,b,c,x[k+4],11,0x4bdecfa9);c=HH(c,d,a,b,x[k+7],16,0xf6bb4b60);b=HH(b,c,d,a,x[k+10],23,0xbebfbc70);
    a=HH(a,b,c,d,x[k+13],4,0x289b7ec6);d=HH(d,a,b,c,x[k+0],11,0xeaa127fa);c=HH(c,d,a,b,x[k+3],16,0xd4ef3085);b=HH(b,c,d,a,x[k+6],23,0x4881d05);
    a=HH(a,b,c,d,x[k+9],4,0xd9d4d039);d=HH(d,a,b,c,x[k+12],11,0xe6db99e5);c=HH(c,d,a,b,x[k+15],16,0x1fa27cf8);b=HH(b,c,d,a,x[k+2],23,0xc4ac5665);
    a=II(a,b,c,d,x[k+0],6,0xf4292244);d=II(d,a,b,c,x[k+7],10,0x432aff97);c=II(c,d,a,b,x[k+14],15,0xab9423a7);b=II(b,c,d,a,x[k+5],21,0xfc93a039);
    a=II(a,b,c,d,x[k+12],6,0x655b59c3);d=II(d,a,b,c,x[k+3],10,0x8f0ccc92);c=II(c,d,a,b,x[k+10],15,0xffeff47d);b=II(b,c,d,a,x[k+1],21,0x85845dd1);
    a=II(a,b,c,d,x[k+8],6,0x6fa87e4f);d=II(d,a,b,c,x[k+15],10,0xfe2ce6e0);c=II(c,d,a,b,x[k+6],15,0xa3014314);b=II(b,c,d,a,x[k+13],21,0x4e0811a1);
    a=II(a,b,c,d,x[k+4],6,0xf7537e82);d=II(d,a,b,c,x[k+11],10,0xbd3af235);c=II(c,d,a,b,x[k+2],15,0x2ad7d2bb);b=II(b,c,d,a,x[k+9],21,0xeb86d391);
    a=addUnsigned(a,aa);b=addUnsigned(b,bb);c=addUnsigned(c,cc);d=addUnsigned(d,dd);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}
