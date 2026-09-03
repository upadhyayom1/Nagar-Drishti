const fs = require('fs');
const file = 'frontend/app/(dashboard)/blacklist/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replacements
content = content.replace(/border-white\/5/g, 'border-[var(--glass-border)]');
content = content.replace(/bg-\[#0B0F19\]\/60/g, 'bg-[var(--bg-elevated-2)]');
content = content.replace(/bg-black\/40/g, 'bg-[var(--bg-void)]');
content = content.replace(/border-white\/10/g, 'border-[var(--glass-border)]');
content = content.replace(/bg-white\/5/g, 'bg-[var(--bg-surface-hover)]');
content = content.replace(/bg-white\/10/g, 'bg-[var(--bg-elevated)]');
content = content.replace(/text-white/g, 'text-[var(--text-primary)]');
content = content.replace(/hover:text-white/g, 'hover:text-[var(--text-primary)]');

// Cyan/Emerald/Violet fixes to work in light mode
content = content.replace(/text-cyan-400/g, 'text-cyan-600 dark:text-cyan-400');
content = content.replace(/text-emerald-400/g, 'text-emerald-600 dark:text-emerald-400');
content = content.replace(/text-violet-400/g, 'text-violet-600 dark:text-violet-400');

fs.writeFileSync(file, content);
console.log('Fixed colors in blacklist/page.tsx');
