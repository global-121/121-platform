const fs = require('fs');

const indexHtmlPath = './www/index.html';
const targetPath = indexHtmlPath;
const indexHtml = fs.readFileSync(indexHtmlPath).toString();

/////////////////////////////////////////////////

function makeStyleAsync(_match, p1) {
  return linkToScript(p1);
}

function linkToScript(cssPath) {
  const asyncStyle = `
<script>(function(){
var a = document.createElement('link');
a.rel = 'stylesheet';
a.href = '${cssPath}';
document.head.appendChild(a);
})()</script>`;
  return asyncStyle.split('\n').join('') + '\n';
}

/////////////////////////////////////////////////

const indexHtmlReplaced = indexHtml.replace(
  /<link rel="stylesheet" href="(styles\.[\S]+\.css)">/g,
  makeStyleAsync,
);

fs.writeFile(targetPath, indexHtmlReplaced, (err) => {
  if (err) {
    console.log(err);
  }

  console.log(`Output generated at ${targetPath}`);
});
