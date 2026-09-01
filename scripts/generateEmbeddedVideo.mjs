import { readFileSync, writeFileSync } from "node:fs";

const input = "/home/ubuntu/webdev-static-assets/44749-browser.mp4";
const output = "client/src/lib/embeddedVideoAssets.ts";
const base64 = readFileSync(input).toString("base64");

writeFileSync(
  output,
  `// Generated from the owner-provided 44749.mp4. Do not edit manually.\nexport const embeddedVideos = {\n  ppfInstallation: "data:video/mp4;base64,${base64}",\n} as const;\n`,
);

console.log(`Wrote ${output} (${base64.length} Base64 characters).`);
