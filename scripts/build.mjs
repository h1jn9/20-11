import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const copyTargets = ['index.html', 'style.css', 'script.js', 'js', 'assets', 'hoa', 'nhac.mp3'];

async function exists(file) {
    try {
        await stat(file);
        return true;
    } catch {
        return false;
    }
}

async function collectFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map((entry) => {
            const full = path.join(dir, entry.name);
            return entry.isDirectory() ? collectFiles(full) : [full];
        })
    );
    return files.flat();
}

async function validateReferences() {
    const html = await readFile(path.join(root, 'index.html'), 'utf8');
    const jsFiles = [...await collectFiles(path.join(root, 'js')), path.join(root, 'script.js')];
    const js = (await Promise.all(jsFiles.map((file) => readFile(file, 'utf8')))).join('\n');
    const source = `${html}\n${js}`;
    const references = [...source.matchAll(/(?:src|href)\s*[:=]\s*["']((?:\.\/)?(?:(?:assets|hoa|js)\/[^"'?#]+|nhac\.mp3))["']/g)]
        .map((match) => match[1]);
    const unique = [...new Set(references)];
    const missing = [];

    for (const ref of unique) {
        if (!(await exists(path.join(root, ref)))) missing.push(ref);
    }

    return { checked: unique.length, missing };
}

async function build() {
    await rm(dist, { recursive: true, force: true });
    await mkdir(dist, { recursive: true });

    for (const target of copyTargets) {
        await cp(path.join(root, target), path.join(dist, target), { recursive: true });
    }

    const { checked, missing } = await validateReferences();
    if (missing.length) {
        console.error('Build thất bại - thiếu asset được tham chiếu:');
        missing.forEach((file) => console.error(`  - ${file}`));
        process.exitCode = 1;
        return;
    }

    const files = await collectFiles(dist);
    console.log(`Build thành công: ${files.length} files -> dist/`);
    console.log(`Da kiem tra ${checked} tham chieu asset local: khong co file nao bi thieu.`);
}

build().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
