import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {},
  plugins: [],
  future: {
    purgeLayersByDefault: true,
  },
} satisfies Config;
