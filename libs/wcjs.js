'use strict';

import * as cheerio from 'cheerio';
import puppeteer from "puppeteer";

async function getContent(url, selectors, delay) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  for (const selector of selectors) {
    await page.waitForSelector(selector, {
      visible: true,
      timeout: 1000 * 10, // 10sec
    });
  }

  if (delay) {
    await scrollPage(page, delay);
  }

  const content = await page.content();
  await page.close();
  await browser.close();
  return content;
}

async function scrollPage(page, delay) {
  while (true) {
    const previousHeight = await page.evaluate("document.body.scrollHeight");
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    try {
      await page.waitForFunction(
        `document.body.scrollHeight > ${previousHeight}`,
        { timeout: 1000 * 3 }
      );
    } catch {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, delay || 1000));
  }
}

async function parseContent(content) {
  const $ = cheerio.load(content);
  return $;
}

async function load(url, selectors, delay) {
  if (typeof selectors === "string") {
    selectors = [selectors];
  } else if (!Array.isArray(selectors)) {
    selectors = ["body *"];
  }

  if (!delay) {
    delay = 0;
  }

  const content = await getContent(url, selectors, delay);
  const $ = await parseContent(content);

  return selectors.reduce(function(prev, curr) {
    return prev.concat($(curr).contents().toArray());
  }, []);
}

// esm
export default {
  load,
}