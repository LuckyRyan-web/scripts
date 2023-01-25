import json from '@rollup/plugin-json'
import typescript from 'rollup-plugin-typescript2'
// 引入外部包
import resolve from '@rollup/plugin-node-resolve'
// 解析 cjs 格式的包
import commonjs from '@rollup/plugin-commonjs'
// 压缩插件
// import { terser } from 'rollup-plugin-terser'

import eslint from '@rollup/plugin-eslint'

import peerDepsExternal from 'rollup-plugin-peer-deps-external'

const packageJson = require('./package.json')

export default [
    {
        input: 'src/index.ts',
        external: Object.keys(packageJson.peerDependencies || {}),
        plugins: [
            peerDepsExternal(),
            resolve(),
            eslint({
                throwOnError: false,
            }),
            commonjs(),
            typescript(),
            json(),
        ],
        output: [
            {
                file: packageJson.main,
                format: 'cjs',
            },
            {
                file: packageJson.module,
                format: 'es',
            },
        ],
        // output: [
        //     {
        //         file: 'dist/index.umd.js',
        //         format: 'umd',
        //     },
        //     {
        //         file: 'dist/index.es.js',
        //         format: 'es',
        //     },
        // ],
    },
]
