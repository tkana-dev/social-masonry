import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';

const external = ['react', 'react-dom', 'react/jsx-runtime'];

export default [
  // Main bundle (UMD + ESM)
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
    external,
  },
  
  // React bundle
  {
    input: 'src/react/index.ts',
    output: [
      {
        file: 'dist/react/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/react/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
    external,
  },
  
  // CSS
  {
    input: 'src/styles.css',
    output: {
      file: 'dist/styles.css',
    },
    plugins: [
      postcss({
        extract: true,
        minimize: true,
        sourceMap: true,
      }),
    ],
  },
  
  // Type declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
    external: [/\.css$/],
  },
  
  // React type declarations
  {
    input: 'src/react/index.ts',
    output: {
      file: 'dist/react/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
    external: [/\.css$/],
  },
];
