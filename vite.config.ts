import typescript from '@rollup/plugin-typescript'

export default {
  build: {
    lib: {
      entry: 'lib/index.ts',
      name: 'from-to',
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      plugins: [typescript()],
      external: ['bezier-easing'],
    },
  },
}
