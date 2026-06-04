import { Configuration } from 'electron-builder';

const config: Configuration = {
    appId: 'com.ledgerx.app',
    productName: 'LedgerX',
    copyright: 'Copyright © 2024 LedgerX',
    directories: {
        output: 'dist-installer',
        buildResources: 'build',
    },
    files: [
        'out/**/*',
        'package.json',
        'node_modules/**/*',
        '!node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
        '!node_modules/**/{test,__tests__,tests,powered-test,example,examples}/**',
    ],
    win: {
        target: [{ target: 'nsis', arch: ['x64'] }],
        signingHashAlgorithms: ['sha256'],
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'LedgerX',
    },
    linux: {
        target: ['AppImage'],
        category: 'Office',
    },
};

export default config;
