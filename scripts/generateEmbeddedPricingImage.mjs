import { readFileSync, writeFileSync } from "node:fs";

const input = "/home/ubuntu/upload/file_00000000a0648210b508d7388563ef21.png";
const output = "client/src/lib/embeddedPricingImage.ts";
const data = readFileSync(input).toString("base64");
writeFileSync(output, `/* Generated from the user-provided Arabic pricing image. */\nexport const embeddedPricingImage = "data:image/png;base64,${data}";\n`);
console.log(`wrote ${output} with ${data.length} base64 characters`);
