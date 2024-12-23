import resolve from '@rollup/plugin-node-resolve';

export default [
    {
        input: 'background.js',
        output: {
            file: 'dist/background.bundle.js',
            format: 'esm'
        },
        plugins: [resolve()]
    },
    {
        input: 'contentScript.js',
        output: {
            file: 'dist/contentScript.bundle.js',
            format: 'iife',
            name: 'ContentScript'
        },
        plugins: [resolve()]
    },
    {
        input: 'popup.js',
        output: {
            file: 'dist/popup.bundle.js',
            format: 'esm'
        },
        plugins: [resolve()]
    }
];