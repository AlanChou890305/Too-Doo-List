const fs = require("fs");
const path = require("path");

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const publicDir = path.join(__dirname, "..", "public");
const distDir = path.join(__dirname, "..", "dist");

if (fs.existsSync(publicDir)) {
  console.log("Copying public directory to dist...");
  copyRecursiveSync(publicDir, distDir);
  console.log("✅ Public directory copied successfully!");
} else {
  console.warn("⚠️ Public directory not found");
}
