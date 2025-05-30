// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      config: {
        corePlugins: {
          preflight: false,
        },
      },
    },
    // autoprefixer: {}, // 可選：如果你要加入自動加前綴功能
  },
};
