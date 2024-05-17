import nllb from "./index.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async function() {
  const text = 'Lockheed Martin Delivers Initial 5G Testbed To U.S. Marine Corps And Begins Mobile Network Experimentation';
  const source = "eng_Latn";
  const targets = ["zho_Hans", "kor_Hang", "jpn_Jpan"];
  const model = 0;
  // 0: 'facebook/nllb-200-distilled-600M' <= default
  // 1: 'facebook/nllb-200-distilled-1.3B'
  // 2: 'facebook/nllb-200-1.3B'
  // 3: 'facebook/nllb-200-3.3B'
  // 4: 'facebook/nllb-moe-54b'

  // initialize take a very long time at first start
  await nllb.init();
  
  for (const target of targets) {
    const result = await nllb.exec(text, source, target, model);
    console.log(`${target}: ${result}`);
  }
})();