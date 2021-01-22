const fs = require('fs');

const source = process.argv[2];
console.log('source: ', source);
const target = process.argv[3];
console.log('target: ', target);
fs.createReadStream(source).pipe(fs.createWriteStream(target, {flag:'w'}));
