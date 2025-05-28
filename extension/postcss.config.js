// postcss.config.js
export default {
    plugins: {
      '@tailwindcss/postcss': { // 保持使用 @tailwindcss/postcss
        config: {
          corePlugins: {
            preflight: false, // 禁用 Tailwind 的 Preflight
          },
        },
      },
      // 如果你有其他 PostCSS 插件，例如 autoprefixer，也可以在這裡添加
      // autoprefixer: {},
    },
  };
