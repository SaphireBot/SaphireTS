import { readdirSync } from "fs";
import { join } from "path";

const files = readdirSync(__dirname, { withFileTypes: true });

for (const file of files) {
    const filePath = join(__dirname, file.name);
    if (file.name === "index.js" || !file.name.endsWith(".js")) continue;
    import(filePath);
    continue;
}