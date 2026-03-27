/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    // 扫描本地 UMD 组件文件，确保其使用的 Tailwind 类不被 purge
    './public/**/*.js',
  ],
  safelist: [
    // UMD 远端组件可能用到带 opacity 修饰符的变体（如 bg-white/90），
    // 这类写法无法被静态扫描文件识别，通过 safelist 确保生成
    // { pattern: /^bg-.+\/\d+$/ },
    // { pattern: /^text-.+\/\d+$/ },
    // { pattern: /^border-.+\/\d+$/ },
    // { pattern: /^shadow-.+\/\d+$/ },
    // // 强制保留基础布局和常用原子类，确保 UMD 组件样式不会丢失
    // { pattern: /^(flex|grid|block|inline-block|hidden)$/ },
    // { pattern: /^(items|justify|content|place|self)-.+$/ },
    // { pattern: /^(m|p)[trblxy]?-.+$/ },
    // { pattern: /^(w|h)-.+$/ },
    // { pattern: /^text-.+$/ },
    // { pattern: /^font-.+$/ },
    // { pattern: /^bg-.+$/ },
    // { pattern: /^rounded-.+$/ },
    // { pattern: /^border-.+$/ },
    // // 确保保留 flex 相关的修饰类，如 flex-col, flex-shrink-0, gap-4 等
    // { pattern: /^flex-(col|row|wrap|nowrap|1|auto|initial|none|shrink|grow)-?.*/ },
    // { pattern: /^gap-.+$/ },
    // // 强制保留响应式断点类（sm, md, lg, xl, 2xl）下的宽度等常用类
    // {
    //   pattern: /^(w|h|flex|grid|hidden|block|text|bg|p|m)-.+$/,
    //   variants: ['sm', 'md', 'lg', 'xl', '2xl', 'hover', 'focus', 'active', 'dark'],
    // },
    // // Slate 色阶（UMD 组件常用，dashboard 本身可能未使用）
    // { pattern: /^(bg|text|border|ring)-(slate|zinc)-(50|100|200|300|400|500|600|700|800|900)$/ },
    // // 带颜色的 shadow 变体
    // { pattern: /^shadow-(amber|blue|emerald|orange|purple|red|rose|teal)-\d+$/ },
    // // rounded-2xl（UMD 组件常用，与 dashboard 的 rounded-xl 不同）
    // 'rounded-2xl',
    // // UMD 组件对 input 使用 accent-* 类（如 accent-blue-600），远程加载无法被扫描，需加入 safelist
    // { pattern: /^accent-.+$/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
