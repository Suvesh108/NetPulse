const { packager } = require('@electron/packager');
const path = require('path');

async function build() {
  console.log('Starting NetPulse Windows v1.0 packaging...');
  
  const appPaths = await packager({
    dir: path.resolve(__dirname, '..'),
    name: 'NetPulse',
    platform: 'win32',
    arch: 'x64',
    out: path.resolve(__dirname, '../release-builds'),
    icon: path.resolve(__dirname, '../public/favicon.ico'),
    overwrite: true,
    prune: true,
    appVersion: '1.0.0',
    buildVersion: '1.0.0',
    appCopyright: 'Copyright (C) 2026 NetPulse Engineering',
    ignore: [
      /^\/android($|\/)/,
      /^\/\.git($|\/)/,
      /^\/release-builds($|\/)/
    ]
  });
  
  console.log('Packaging complete! Output paths:', appPaths);
}

build().catch(err => {
  console.error('Packaging error:', err);
  process.exit(1);
});
