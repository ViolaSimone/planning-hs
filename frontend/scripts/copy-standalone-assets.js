/**
 * Copies static assets next to the standalone server so that
 * "node .next/standalone/server.js" works when run locally,
 * mirroring what the Docker "runner" stage does with explicit COPY steps.
 *
 * Runs automatically after "next build" via the "postbuild" npm script.
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const staticSource = path.join(projectRoot, ".next", "static");
const staticTarget = path.join(
  projectRoot,
  ".next",
  "standalone",
  ".next",
  "static",
);

const publicSource = path.join(projectRoot, "public");
const publicTarget = path.join(
  projectRoot,
  ".next",
  "standalone",
  "public",
);

function copyIfExists(source, target) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.cpSync(source, target, { recursive: true, force: true });
  console.log(`Copied: ${source} -> ${target}`);
}

copyIfExists(staticSource, staticTarget);
copyIfExists(publicSource, publicTarget);
