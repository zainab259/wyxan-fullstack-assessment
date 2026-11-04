import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#17251f', moss: '#52765c', sand: '#f4f3ed', line: '#dfe4dc' }, boxShadow: { soft: '0 10px 35px rgba(28,45,35,.08)' } } }, plugins: [] } satisfies Config;
