const fs = require("fs").promises;
const path = require("path");

async function collectFilesByPatterns(patterns) {
  const cwd = process.cwd();
  const files = [];
  const exts = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
  async function matchPattern(file, pattern) {
    try {
      if (pattern.endsWith("/*")) {
        const dir = path.join(cwd, pattern.slice(0, -2));
        const stat = await fs.stat(dir).catch(() => null);
        if (stat && stat.isDirectory()) {
          const dirFiles = await fs.readdir(dir);
          for (const f of dirFiles) {
            const full = path.join(dir, f);
            const subStat = await fs.stat(full);
            if (subStat.isFile()) files.push(full);
          }
        }
        return;
      }
      if (pattern.endsWith("/")) {
        const dir = path.join(cwd, pattern);
        const stat = await fs.stat(dir).catch(() => null);
        if (stat && stat.isDirectory()) {
          const dirFiles = await fs.readdir(dir);
          for (const f of dirFiles) {
            const full = path.join(dir, f);
            const subStat = await fs.stat(full);
            if (subStat.isFile()) files.push(full);
          }
        }
        return;
      }
      if (pattern.startsWith("*.") && pattern.length > 2) {
        const ext = pattern.slice(1);
        const dirFiles = await fs.readdir(cwd);
        for (const f of dirFiles) {
          if (f.endsWith(ext)) files.push(path.join(cwd, f));
        }
        return;
      }
      if (pattern.includes("*")) {
        const [prefix, suffix] = pattern.split("*");
        const dirFiles = await fs.readdir(cwd);
        for (const f of dirFiles) {
          if (f.startsWith(prefix) && f.endsWith(suffix)) files.push(path.join(cwd, f));
        }
        return;
      }
      const full = path.join(cwd, pattern);
      const stat = await fs.stat(full).catch(() => null);
      if (stat) {
        if (stat.isFile()) files.push(full);
        if (stat.isDirectory()) {
          const dirFiles = await fs.readdir(full);
          for (const f of dirFiles) {
            const sub = path.join(full, f);
            const subStat = await fs.stat(sub);
            if (subStat.isFile()) files.push(sub);
          }
        }
      }
    } catch (error) {
    }
  }
  await Promise.all(patterns.map(pat => matchPattern(pat, pat)));
  return files.filter(f => exts.includes(path.extname(f)));
}

module.exports = { collectFilesByPatterns }; 