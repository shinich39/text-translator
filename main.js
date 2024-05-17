import { app, BrowserWindow, ipcMain, screen, dialog, Menu, } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';
import { EventEmitter } from "node:events";
import {franc, francAll} from 'franc';
import nllb from './libs/nllbjs/index.js';
import iconv from 'iconv-lite';
import languageEncoding from "detect-file-encoding-and-language";
import wcjs from "./libs/wcjs.js";

// web

const PROVIDERS = {
  google: {
    "selectors": ["span.ryNqvb"],
    "url": function(text, from, to) {
      return `https://translate.google.com/?op=translate&text=${text}&sl=${from}&tl=${to}`
    }
  },
  deepl: {
    "selectors": ["div[aria-labelledby='translation-target-heading'] p span"],
    "url": function(text, from, to) {
      return `https://www.deepl.com/translator#${from}/${to}/${text}`
    }
  },
  papago: {
    "selectors": ["#txtTarget span"],
    "url": function(text, from, to) {
      return `https://papago.naver.com/?sk=${from}&tk=${to}&st=${text}`
    }
  },
  yandex: {
    "selectors": ["span.translation-word"],
    "url": function(text, from, to) {
      return `https://translate.yandex.com/?source_lang=${from}&target_lang=${to}&text=${text}`
    }
  },
  bing: {
    "selectors": ["#tta_output_ta", "tta_output_ta_gdf", "tta_output_ta_gdm"],
    "url": function(text, from, to) {
      return `https://www.bing.com/translator?from=${from}&to=${to}&text=${text}`
    }
  }
}

// ESM file path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process
const PROCESS_ID = process.pid;
const IS_MAC = process.platform === 'darwin';
const IS_WIN = process.platform === 'win32';
const IS_LINUX = process.platform === 'linux';

// App
const APP_NAME = app.name;
const APP_MENU = createMenu();
const APP_PATH = {
  APP: app.getPath("appData"),
  HOME: app.getPath("home"),
  USER: app.getPath("userData"),
  SESSION: app.getPath("sessionData"),
  TEMP: app.getPath("temp"),
  EXE: app.getPath("exe"),
  MODULE: app.getPath("module"),
  DESKTOP: app.getPath("desktop"),
  DOCUMENTS: app.getPath("documents"),
  DOWNLOADS: app.getPath("downloads"),
  PICTURES: app.getPath("pictures"),
  VIDEOS: app.getPath("videos"),
  MUSIC: app.getPath("music"),
  LOGS: app.getPath("logs"),
  DUMPS: app.getPath("crashDumps"),
};

// Set application menu
Menu.setApplicationMenu(APP_MENU); 

// Event
const MAX_CONCURRENT_EVENT_COUNT = 10;
EventEmitter.defaultMaxListeners = MAX_CONCURRENT_EVENT_COUNT;

// Methods
async function alert(title, message) {
  await dialog.showMessageBox({
    title: message ? title : undefined,
    message: message ? message : title,
  });
}

async function confirm(title, message) {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    buttons: ['Yes', 'No'],
    cancelId: 1,
    defaultId: 0,
    title: message ? title : message,
    detail: message ? message : undefined,
  });

  return response === 0;
}

function createMenu() {
  const template = IS_MAC ? {
    // mac
    [app.name]: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ],
    File: [
      { role: 'close' }
    ],
    Edit: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteAndMatchStyle' },
      { role: 'delete' },
      { role: 'selectAll' },
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [
          { role: 'startSpeaking' },
          { role: 'stopSpeaking' }
        ]
      }
    ],
    View: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ],
    Window: [
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
      { type: 'separator' },
      { role: 'window' }
    ],
    Help: [
      {
        label: 'Learn More',
        accelerator: "Cmd + H",
        click: async function() {
          const { shell } = require('electron');
          await shell.openExternal('https://electronjs.org')
        }
      }
    ]
  } : {
    // windows
    File: [
      { role: 'quit' }
    ],
    Edit: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      { type: 'separator' },
      { role: 'selectAll' }
    ],
    View: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ],
    Window: [
      { role: 'minimize' },
      { role: 'zoom' },
      { role: 'close' }
    ],
    Help: [
      {
        label: 'Learn More',
        accelerator: "Ctrl + H",
        click: async function() {
          const { shell } = require('electron');
          await shell.openExternal('https://electronjs.org')
        }
      }
    ]
  };
  
  const tmp = [];
  for (const label of Object.keys(template)) {
    tmp.push({
      label: label,
      submenu: template[label],
    });
  }
  
  const menu = Menu.buildFromTemplate(tmp);

  return menu;
}

function createWindow() {
  // Create the browser window.
  const w = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "resources/icons/512x512.png"),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      worldSafeExecuteJavaScript: true,
      contextIsolation: true, // https://www.electronjs.org/docs/latest/tutorial/security
      nodeIntegration: false,
    }
  });

  // and load the index.html of the app.
  w.loadFile('index.html');

  // Open the DevTools.
  // w.webContents.openDevTools();

  // Set event listeners.
  w.webContents.on("did-finish-load", onWindowLoad);
  w.webContents.on("close", onWindowClose);

  return w;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  win = createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      win = createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }

  app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let win;

async function onWindowLoad() {
  console.log(`${APP_NAME} window loaded.`);

  try {
    sendMsg("init", {
      progress: 0,
      message: "Creating environment..."
    });

    // create venv, torch, transformers
    await nllb.init();

    sendMsg("init", {
      progress: 0.5,
      message: "Downloading model..."
    });

    // install nllb model
    const result = await nllb.exec("You has passed the test.", "eng", "kor");
    sendMsg("test", result);

    sendMsg("init", {
      progress: 1,
      message: "Complete initialization."
    });
  } catch(err) {
    console.error(err);
    
    sendErr("init", err.message);
  }
}

function onWindowClose() {
  console.log(`${APP_NAME} window closed.`);
}

function getDisplay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  return primaryDisplay.workArea; // { x, y, width, height }
}

function sendMsg(channel, req) {
  win.webContents.send(channel, null, req);
}

function sendErr(channel, err) {
  win.webContents.send(channel, err);
}

function getMsg(channel, listener) {
  ipcMain.on(channel, function(event, err, req) {
    return listener(err, req, event);
  });
}

function waitMsg(channel, listener) {
  ipcMain.handle(channel, function(event, req) {
    if (typeof req === "object" && req.stack && req.message) {
      return listener(req, null, event);
    } else {
      return listener(null, req, event);
    }
  });
}

// Main

let CONFIG_PATH = path.join(__dirname, "config.json");
let FLORES_ALL_PATH = path.join(__dirname, "libs", "nllbjs", "langs", "flores.json");
let FLORES_101_PATH = path.join(__dirname, "libs", "nllbjs", "langs", "flores-101.json");
let FLORES_200_PATH = path.join(__dirname, "libs", "nllbjs", "langs", "flores-200.json");
let FLORES_ISO_PATH = path.join(__dirname, "libs", "nllbjs", "langs", "flores-iso.json");
let FLORES_ALL = JSON.parse(fs.readFileSync(FLORES_ALL_PATH));
let FLORES_ALL_KEYS = Object.keys(FLORES_ALL);
let FLORES_101 = JSON.parse(fs.readFileSync(FLORES_101_PATH));
let FLORES_101_KEYS = Object.keys(FLORES_101);
let FLORES_ISO = JSON.parse(fs.readFileSync(FLORES_ISO_PATH));
let config;

waitMsg("get-lang", function(err, msg, e) {
  try {
    return getLang(msg);
  } catch(err) {
    return err;
  }
});

waitMsg("is-exists", function(err, msg, e) {
  try {
    return fs.existsSync(msg);
  } catch(err) {
    return err;
  }
});

waitMsg("write-text-file", function(err, req, e) {
  try {
    let { filename, dirPath, text } = req;
    let extname = path.extname(filename);
    let basename = path.basename(filename, extname);
    let filePath = path.join(dirPath, filename);
    let index = 0;
    while (fs.existsSync(filePath)) {
      if (index > 100) {
        throw new Error("File already exists.");
      }

      index += 1;
      filename = `${basename} (${index})${extname}`;
      filePath = path.join(dirPath, filename);
    }

    fs.writeFileSync(filePath, text);

    return {filename, filePath};
  } catch(err) {
    return err;
  }
});

waitMsg("get-lang-list", function(err, msg, e) {
  try {
    return FLORES_101;
  } catch(err) {
    return err;
  }
});

waitMsg("get-text-files", async function(err, dirPath, e) {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error("Directory not found.");
    }

    const files = fs.readdirSync(dirPath);
    let result = [];
    for (const file of files) {
      try {
        // only txt file
        if (!/\.txt$/.test(file)) {
          continue;
        }
        const filePath = path.join(dirPath, file);
        const text = await readTextFile(filePath);
        let lang;
        try {
          lang = getLang(text);
        } catch(err) {
          lang = null;
        }
        result.push({
          path: filePath,
          name: file,
          text: text,
          lang: lang,
        });
      } catch(err) {
        console.error(err);
      }
    }

    result.sort(function(a, b) {
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });

    return result;
  } catch(err) {
    console.error(err);
    return err;
  }
});

waitMsg("translate", async function(err, {translator, text, from, to}, e) {
  try {
    if (translator === "local") {
      // local
      from = convertLangToFlores(from);
      to = convertLangToFlores(to);
      return await nllb.exec(text, from, to);
    } else {
      // web
      from = convertLangToISO2(from);
      to = convertLangToISO2(to);
      const url = PROVIDERS[translator].url(text, from, to);
      const selectors = PROVIDERS[translator].selectors;
      const elements = await wcjs.load(url, selectors);
      let result = "";
      for (const el of elements) {
        result += el.data;
      }
      return result;
    }
  } catch(err) {
    return err;
  }
});

function getConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, { encoding: "utf8" }));
  } else {
    // default config
    config = {};
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { encoding: "utf8" });
  }
}

function setConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { encoding: "utf8" });
}

function convertLangToFlores(str) {
  return FLORES_ALL[str];
}

function convertLangToISO2(str) {
  const flores = convertLangToFlores(str);
  const found = FLORES_ISO.find(function(item) {
    return item.flores === flores;
  });
  if (!found) {
    throw new Error(`ISO-2 language code not found.`);
  }
  return found.iso;
}

function getLang(str) {
  const result = franc(str);
  if (result === "und") {
    throw new Error(`${str} is to short.`);
  }
  if (FLORES_101_KEYS.indexOf(result) === -1) {
    throw new Error(`${result} is not supported language code.`);
  }
  return result;
}

async function getEncoding(filePath) {
  try {
    return await languageEncoding(filePath).encoding;
  } catch(err) {
    return "utf-8";
  }
}

async function readTextFile(filePath) {
  let encoding = await getEncoding(filePath);
  if (!iconv.encodingExists(encoding)) {
    encoding = "utf-8";
  }
  const buffer = fs.readFileSync(filePath);
  const str = iconv.decode(buffer, encoding);
  return str;
}