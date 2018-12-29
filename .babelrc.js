module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        modules: 'commonjs',
        targets: {
          node: '8',
        },
        debug: !!process.env.DEBUG,
      },
    ],
  ],
  plugins: [],
}
