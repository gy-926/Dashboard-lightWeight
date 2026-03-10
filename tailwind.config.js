/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    // 扫描本地 UMD 组件文件，确保其使用的 Tailwind 类不被 purge
    "./public/**/*.js"
  ],
  safelist: [
    // UMD 远端组件可能用到带 opacity 修饰符的变体（如 bg-white/90），
    // 这类写法无法被静态扫描文件识别，通过 safelist 确保生成
    { pattern: /^bg-.+\/\d+$/ },
    { pattern: /^text-.+\/\d+$/ },
    { pattern: /^border-.+\/\d+$/ },
    { pattern: /^shadow-.+\/\d+$/ },
    // Slate 色阶（UMD 组件常用，dashboard 本身可能未使用）
    { pattern: /^(bg|text|border|ring)-(slate|zinc)-(50|100|200|300|400|500|600|700|800|900)$/ },
    // 带颜色的 shadow 变体
    { pattern: /^shadow-(amber|blue|emerald|orange|purple|red|rose|teal)-\d+$/ },
    // rounded-2xl（UMD 组件常用，与 dashboard 的 rounded-xl 不同）
    'rounded-2xl',
    // UMD 组件对 input 使用 accent-* 类（如 accent-blue-600），远程加载无法被扫描，需加入 safelist
    { pattern: /^accent-.+$/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}