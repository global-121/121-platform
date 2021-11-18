#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

let iconList = [];

function fromDir(startPath, filter, callback) {
  if (!fs.existsSync(startPath)) {
    console.warn(`Not a valid directory: ${startPath}`);
    return process.exit(1);
  }

  let files = fs.readdirSync(startPath);
  for (let i = 0; i < files.length; i++) {
    let filename = path.join(startPath, files[i]);
    let stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fromDir(filename, filter, callback); //recurse
    } else if (filter.test(filename)) {
      callback(filename, files[i]);
    }
  }
}

function addToIconList(filePath, fileName) {
  const iconName = fileName.split('.')[0];

  iconList.push({
    iconName,
    filePath,
    used: false,
  });
}

function checkIfUsed(filePath, _fileName) {
  let data = fs.readFileSync(filePath);

  iconList.forEach((icon, index, iconList) => {
    if (
      data.includes(`["name","${icon.iconName}"]`) || // for Angular 8 / view engine
      data.includes(`"name","${icon.iconName}"`) || // for Angular 9+ / ivy
      data.includes(`name:"${icon.iconName}"`) ||
      data.includes(`icon:"${icon.iconName}"`) ||
      data.includes(`"backButtonIcon","${icon.iconName}"`) // for stenciljs
    ) {
      console.log(` - icon used: ${icon.iconName}`);
      iconList[index].used = true;
    }
  });
}

// Gather all possible icons
fromDir('node_modules/ionicons/dist/ionicons/svg', /\.svg$/, addToIconList);

console.log('Checking icons in use...');
fromDir('www', /\.(js|css|html)$/, checkIfUsed);

const iconsUsed = iconList.filter((icon) => icon.used === true);
console.log(`\nFound ${iconsUsed.length} icons in use.\n`);

const iconFileNames = iconsUsed.map((icon) => icon.iconName);
const globLine = `"glob": "**/{${iconFileNames.join(',')}}.svg",`;

// Check if angular.json-glob line is as it should be...
const angularJson = fs.readFileSync('angular.json');
if (angularJson.includes(globLine)) {
  console.log('Icon-list in angular.json is up-to-date.\n');
  return process.exit(0);
} else {
  console.error(`Icon-list is out-of-date!\n`);
  console.error(`Update angular.json to the following lines:`);
  console.error('In the location: projects/app/architect/build/options/assets');
  console.error(`
              {
                ${globLine}
                "input": "node_modules/ionicons/dist/ionicons/svg",
                "output": "svg"
              },
`);
  process.exit(1);
}
