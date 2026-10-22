import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const output = resolve("dist");
async function filesIn(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const file = join(dir, entry.name);
      return entry.isDirectory() ? filesIn(file) : file;
    }),
  );
  return nested.flat();
}
const files = (await filesIn(output))
  .filter((file) => relative(output, file) !== "sw.js")
  .sort();
const template = await readFile(resolve("public/sw.js"), "utf8");
const hash = createHash("sha256");
hash.update(template);
for (const file of files) {
  hash.update(relative(output, file));
  hash.update(await readFile(file));
}
const urls = [
  "/",
  ...files.map((file) => "/" + relative(output, file).replaceAll("\\", "/")),
];
const worker = template
  .replace(
    /(['"])__PRECACHE_VERSION__\1/,
    JSON.stringify(hash.digest("hex").slice(0, 16)),
  )
  .replace(/(['"])__PRECACHE_MANIFEST__\1/, JSON.stringify(urls));
if (worker.includes("__PRECACHE_"))
  throw new Error("Offline worker placeholders were not replaced");
await writeFile(join(output, "sw.js"), worker);
console.log(`Offline book prepared: ${urls.length} local resources.`);
