#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json to get current version
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Increment patch version
const versionParts = packageJson.version.split('.');
versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
const newVersion = versionParts.join('.');

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Update index.html
const indexPath = path.join(__dirname, 'public', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace version in HTML (both occurrences)
const oldVersionRegex = /<div class="version">v\d+\.\d+\.\d+<\/div>/g;
const newVersionHtml = `<div class="version">v${newVersion}</div>`;
indexContent = indexContent.replace(oldVersionRegex, newVersionHtml);

fs.writeFileSync(indexPath, indexContent);

console.log(`✅ Version updated to v${newVersion} in both package.json and index.html`);