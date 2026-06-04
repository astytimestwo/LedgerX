import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import fs from 'fs'

const cssTrackerPlugin = () => {
    return {
        name: 'css-tracker',
        enforce: 'post' as const,
        transform(code: string, id: string) {
            if (id.endsWith('global.css')) {
                console.log(`\n\n===========================================`)
                console.log(`[TRACKER] Processing: ${id}`)
                console.log(`[TRACKER] Generated CSS size: ${code.length} bytes`);

                const hasP6 = code.includes('.p-6');
                const hasGap5 = code.includes('.gap-5');
                const hasBgWhite10 = code.includes('.bg-white\\\\/10') || code.includes('.bg-white/10');
                const hasBackdrop = code.includes('backdrop-blur');

                console.log(`[TRACKER] Found .p-6 (24px padding)? : ${hasP6}`);
                console.log(`[TRACKER] Found .gap-5 (20px gap)?   : ${hasGap5}`);
                console.log(`[TRACKER] Found .bg-white/10?        : ${hasBgWhite10}`);
                console.log(`[TRACKER] Found backdrop-blur?       : ${hasBackdrop}`);

                fs.writeFileSync(resolve(__dirname, 'tailwind-debug-output.css'), code);
                console.log(`[TRACKER] Full CSS dumped to: tailwind-debug-output.css`);
                console.log(`===========================================\n\n`)
                return code;
            }
        }
    }
}

export default defineConfig({
    main: {
        entry: 'src/main/index.ts',
        build: {
            outDir: 'out/main',
            rollupOptions: {
                external: [
                    'electron',
                    'better-sqlite3-multiple-ciphers',
                    'bcrypt',
                    'kysely',
                    'otplib',
                    'zod',
                    'electron-log',
                ]
            }
        }
    },
    preload: {
        entry: 'src/preload/index.ts',
        build: {
            outDir: 'out/preload',
            rollupOptions: {
                external: ['electron']
            }
        }
    },
    renderer: {
        root: 'src/renderer',
        build: {
            outDir: 'out/renderer'
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src/renderer'),
                '@shared': resolve(__dirname, 'src/shared')
            }
        },
        plugins: [tailwindcss(), react(), cssTrackerPlugin()]
    }
})
