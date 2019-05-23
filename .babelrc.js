module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        modules: 'commonjs',
        corejs: 3,
        targets: {
          node: '8',
        },
        debug: !!process.env.DEBUG,
        exclude: ['es.promise'],
      },
    ],
  ],
  plugins: [],
}
