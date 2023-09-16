import { existsSync, readdirSync } from "fs"
import { join } from "path";

function load(dir: string) {
  if (typeof dir !== "string") return;

  if (!existsSync(dir)) return;

  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = join(dir, file.name);

    if (!existsSync(filePath)) continue;

    if (file.isDirectory()) {
      load(filePath);

      continue;
    }

    if (file.isFile()) {
      if (file.name === `index.js` || !file.name.endsWith(".js")) continue;

      import(filePath);

      continue;
    }
  }
}

load(__dirname)