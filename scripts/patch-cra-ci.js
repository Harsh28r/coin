const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-scripts',
  'scripts',
  'build.js'
);

if (!fs.existsSync(target)) {
  console.log('patch-cra-ci: react-scripts missing, skip');
  process.exit(0);
}

const marker = '/* coinsclarity-ci-patch */';
let src = fs.readFileSync(target, 'utf8');
if (src.includes(marker)) {
  process.exit(0);
}

const needle = "'use strict';\n";
if (!src.includes(needle)) {
  console.error('patch-cra-ci: unexpected react-scripts build.js');
  process.exit(1);
}

const inject =
  needle +
  marker +
  "\nprocess.env.CI = 'false';\n" +
  "process.env.DISABLE_ESLINT_PLUGIN = 'true';\n" +
  "process.env.GENERATE_SOURCEMAP = 'false';\n";

fs.writeFileSync(target, src.replace(needle, inject));
console.log('patch-cra-ci: CI eslint and sourcemaps disabled');
