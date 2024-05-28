const { sendMsg, sendErr, getMsg, waitMsg } = window.electron;

Toast.setPlacement(TOAST_PLACEMENT.BOTTOM_RIGHT);
Toast.setTheme(TOAST_THEME.DARK);

let isInitialized = false;
let translator = "nllb-0";
let translate = translateByParagraph; // function
let clipboard = false; // default 0

// default
async function translateByAll(text, from, to, cb) {
  let result = "", 
      startedAt = new Date().valueOf();

  console.log(`translate to ${to} from ${from}`);

  // start
  cb(0, result, 0);

  result += await waitMsg("translate", {
    translator,
    text,
    from,
    to,
  });

  // end
  cb(1, result, new Date().valueOf() - startedAt);
}

async function translateByParagraph(text, from, to, cb) {
  let paragraphs = text.split(/(\r\n{2,}|\r{2,}|\n{2,})/g),
      result = "", 
      totalParagraphs = paragraphs.length,
      countParagraphs = 0,
      startedAt = new Date().valueOf();

  console.log(`found ${totalParagraphs} paragraphs`);
  console.log(`translate to ${to} from ${from}`);

  // start
  cb(0, result, 0);

  for (let i = 0 ; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    if (paragraph.trim() !== "") {
      try {
        result += await waitMsg("translate", {
          translator,
          text: paragraph,
          from,
          to,
        });
      } catch(err) {
        console.error(err);
        result += paragraph;
      }
    } else {
      result += paragraph || "";
    }

    countParagraphs += 1;

    cb(countParagraphs / totalParagraphs, result, new Date().valueOf() - startedAt);
  }

  // end
  cb(1, result, new Date().valueOf() - startedAt);
}

async function translateByLine(text, from, to, cb) {
  let lines = text.split(/(\r\n|\r|\n)/g),
      result = "", 
      totalLines = lines.length,
      countLines = 0,
      startedAt = new Date().valueOf();

  console.log(`found ${totalLines} lines`);
  console.log(`translate to ${to} from ${from}`);

  // start
  cb(0, result, 0);

  for (let i = 0 ; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() !== "") {
      try {
        result += await waitMsg("translate", {
          translator,
          text: line,
          from,
          to,
        });
      } catch(err) {
        console.error(err);
        result += line;
      }
    } else {
      result += line || "";
    }

    countLines += 1;

    cb(countLines / totalLines, result, new Date().valueOf() - startedAt);
  }

  // end
  cb(1, result, new Date().valueOf() - startedAt);
}

async function translateBySentence(text, from, to, cb) {
  
  function isFullstop(str) {
    return /^(\u002E|\u0589|\u06D4|\u0701|\u0702|\u1362|\u166E|\u1803|\u1809|\u2488|\u2489|\u248A|\u248B|\u248C|\u248D|\u248E|\u248F|\u2490|\u2491|\u2492|\u2493|\u2494|\u2495|\u2496|\u2497|\u2498|\u2499|\u249A|\u249B|\u2CF9|\u2CFE|\u2E3C|\u3002|\uA4FF|\uA60E|\uA6F3|\uFE12|\uFE52|\uFF0E|\uFF61)$/.test(str);
  }

  function isEndByFullstop(str) {
    return /(\u002E|\u0589|\u06D4|\u0701|\u0702|\u1362|\u166E|\u1803|\u1809|\u2488|\u2489|\u248A|\u248B|\u248C|\u248D|\u248E|\u248F|\u2490|\u2491|\u2492|\u2493|\u2494|\u2495|\u2496|\u2497|\u2498|\u2499|\u249A|\u249B|\u2CF9|\u2CFE|\u2E3C|\u3002|\uA4FF|\uA60E|\uA6F3|\uFE12|\uFE52|\uFF0E|\uFF61)\s+/.test(str);
  }

  function splitSentences(str) {
    return str.split(/(\u002E|\u0589|\u06D4|\u0701|\u0702|\u1362|\u166E|\u1803|\u1809|\u2488|\u2489|\u248A|\u248B|\u248C|\u248D|\u248E|\u248F|\u2490|\u2491|\u2492|\u2493|\u2494|\u2495|\u2496|\u2497|\u2498|\u2499|\u249A|\u249B|\u2CF9|\u2CFE|\u2E3C|\u3002|\uA4FF|\uA60E|\uA6F3|\uFE12|\uFE52|\uFF0E|\uFF61)/);
  }

  const paragraphs = text.split(/\r\n|\r|\n/g);
  let result = "", 
      totalSentences = 0,
      countSentences = 0,
      startedAt = new Date().valueOf();

  // calc
  for (const paragraph of paragraphs) {
    const sentences = splitSentences(paragraph);
    totalSentences += sentences.length;
  }

  console.log(`found ${totalSentences} sentences`);
  console.log(`translate to ${to} from ${from}`);

  // start
  cb(0, result, new Date().valueOf() - startedAt);

  for (let i = 0 ; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const sentences = splitSentences(paragraph);
    for (let j = 0; j < sentences.length; j++) {
      const sentence = sentences[j];
      if (isFullstop(sentence)) {
        if (!isEndByFullstop(result)) {
          result += sentence + " ";
        }
      } else if (sentence.trim() !== "") {
        try {
          result += await waitMsg("translate", {
            translator,
            text: sentence,
            from,
            to,
          });
        } catch(err) {
          console.error(err);
          result += sentence;
        }
      }

      countSentences += 1;

      cb(countSentences / totalSentences, result, new Date().valueOf() - startedAt);

      // fix last fullstop
      if (result.length > 0 && isFullstop(result[result.length - 1])) {
        result += " ";
      }
    }

    // pass last linebreak
    if (i !== paragraph.length - 1) {
      result += "\n";
    }
  }

  // end
  cb(1, result, new Date().valueOf() - startedAt);
}

// page 1
// translate text
(function() {
  const inputLangOptionsElement = document.getElementById("text-input-lang-options");
  const outputLangOptionsElement = document.getElementById("text-output-lang-options");
  const inputLangElement = document.getElementById("text-input-lang");
  const outputLangElement = document.getElementById("text-output-lang");
  const inputTextElement = document.getElementById("text-input-text");
  const outputTextElement = document.getElementById("text-output-text");
  const inputButtonElement = document.getElementById("text-input-button");
  const outputButtonElement = document.getElementById("text-output-button");
  let langs = [];
  
  function setSpinner(element) {
    const spinner = document.createElement("span");
    spinner.className = "spinner-border spinner-border-sm mr-3";
    element.innerHTML = "";
    element.appendChild(spinner);
    element.disabled = true;
  }

  function startTranslate() {
    // set spinner
    setSpinner(inputButtonElement);
    setSpinner(outputButtonElement);
  }

  function endTranslate() {
    // remove spinner
    inputButtonElement.innerHTML = "Translate A to B";
    inputButtonElement.disabled = false;
    outputButtonElement.innerHTML = "Translate B to A";
    outputButtonElement.disabled = false;
  }

  function isLangValid(str) {
    return langs.indexOf(str) > -1;
  }

  function isLangsValid() {
    return isLangValid(inputLangElement.value) && isLangValid(outputLangElement.value);
  }

  // set validation
  [inputLangElement, outputLangElement]
    .forEach(function(el, idx) {
      // validation
      el.addEventListener("input", function(e) {
        const elem = e.target;
        if (isLangValid(elem.value)) {
          elem.classList.remove("is-invalid");
        } else {
          elem.classList.add("is-invalid");
        }
      });
    });

  // language detection
  [inputTextElement, outputTextElement]
    .forEach(function(el, idx) {
      const langElement = idx === 0 ? inputLangElement : outputLangElement;
      // validation
      el.addEventListener("input", async function(e) {
        const elem = e.target;
        try {
          const lang = await waitMsg("get-lang", elem.value);
          // console.log(`lang: ${lang}`);
          
          if (isLangValid(lang)) {
            langElement.value = lang;
            langElement.classList.remove("is-invalid");
          }
        } catch(err) {
          console.error(err);
        }
      });
    });
  
  // set datasets
  waitMsg("get-lang-list")
    .then(function(obj) {

      langs = Object.keys(obj);

      for (const item of langs) {
        const io = document.createElement("option");
        io.value = item;
        inputLangOptionsElement.appendChild(io);
  
        const oo = document.createElement("option");
        oo.value = item;
        outputLangOptionsElement.appendChild(oo);
      }
    });

  // set text translate event
  [inputButtonElement, outputButtonElement]
    .forEach(function(el, idx, arr) {
      const srcTextElement = idx === 0 ? inputTextElement : outputTextElement;
      const srcLangElement = idx === 0 ? inputLangElement : outputLangElement;
      const dstTextElement = idx === 0 ? outputTextElement : inputTextElement;
      const dstLangElement = idx === 0 ? outputLangElement : inputLangElement;
      el.addEventListener("click", async function(e) {
        if (!isInitialized) {
          Toast.create({
            title: "InitializeError",
            message: "Not initialized.",
            status: TOAST_STATUS.DANGER,
            timeout: 3000
          });
          return;
        }
        if (!isLangsValid()) {
          Toast.create({
            title: "LanguageError",
            message: "Invalid language.",
            status: TOAST_STATUS.DANGER,
            timeout: 3000
          });
          return;
        }

        if (srcTextElement.value.trim() == "") {
          Toast.create({
            title: "ValueError",
            message: "Input must have at least 1 character.",
            status: TOAST_STATUS.DANGER,
            timeout: 3000
          });
          return;
        }

        const srcText = srcTextElement.value;
        const srcLang = srcLangElement.value;
        const dstLang = dstLangElement.value;

        startTranslate();

        translate(srcText, srcLang, dstLang, function(progress, result, timestamp) {
          dstTextElement.value = result;
          if (progress === 1) {
            endTranslate();
            console.log(`translated ${srcText.length} characters for ${timestamp} ms`);
          }
        });
      });
    });

  // clipboard handler
  getMsg("clipboard", function(err, msg, event) {
    if (clipboard) {
      inputTextElement.value = msg;
      inputButtonElement.click();
    }
  });
})();

// page 2
// translate txt files
(function() {
  const inputLangOptionsElement = document.getElementById("txt-input-lang-options");
  const outputLangOptionsElement = document.getElementById("txt-output-lang-options");
  const inputLangElement = document.getElementById("txt-input-lang");
  const outputLangElement = document.getElementById("txt-output-lang");
  const inputPathElement = document.getElementById("txt-input-path");
  const outputPathElement = document.getElementById("txt-output-path");
  const inputTextElement = document.getElementById("txt-input-text");
  const outputTextElement = document.getElementById("txt-output-text");
  const inputButtonElement = document.getElementById("txt-input-button");
  const outputButtonElement = document.getElementById("txt-output-button");
  
  function setSpinner(element) {
    const spinner = document.createElement("span");
    spinner.className = "spinner-border spinner-border-sm mr-3";
    element.innerHTML = "";
    element.appendChild(spinner);
    element.disabled = true;
  }

  function startTranslate() {
    // set spinner
    setSpinner(inputButtonElement);
    setSpinner(outputButtonElement);
  }

  function endTranslate() {
    // remove spinner
    inputButtonElement.innerHTML = "Translate A to B";
    inputButtonElement.disabled = false;
    outputButtonElement.innerHTML = "Translate B to A";
    outputButtonElement.disabled = false;
  }
  
  waitMsg("get-lang-list")
    .then(function(obj) {
      const langs = Object.keys(obj);
      for (const item of langs) {
        const io = document.createElement("option");
        io.value = item;
        inputLangOptionsElement.appendChild(io);
  
        const oo = document.createElement("option");
        oo.value = item;
        outputLangOptionsElement.appendChild(oo);
      }
  
      function isLangValid(str) {
        return langs.indexOf(str) > -1;
      }

      async function isPathValid(str) {
        return await waitMsg("is-exists", str);
      }

      function isLangsValid() {
        return isLangValid(inputLangElement.value) && isLangValid(outputLangElement.value);
      }

      function isPathsValid() {
        return isPathValid(inputPathElement.value) && isPathValid(outputPathElement.value);
      }

      async function getTextsFromDir(dirPath) {
        return await waitMsg("get-text-files", dirPath);
      }
  
      // set validation
      [inputLangElement, outputLangElement]
        .forEach(function(el, idx) {
          el.addEventListener("input", function(e) {
            const elem = e.target;
            if (isLangValid(elem.value)) {
              elem.classList.remove("is-invalid");
            } else {
              elem.classList.add("is-invalid");
            }
          });
        });


      [inputPathElement, outputPathElement]
        .forEach(function(el, idx) {
          const langElement = idx === 0 ? inputLangElement : outputLangElement;

          // path validation
          el.addEventListener("input", async function(e) {
            const elem = e.target;
            try {
              if (await isPathValid(elem.value)) {
                elem.classList.remove("is-invalid");
              } else {
                elem.classList.add("is-invalid");
              }
            } catch(err) {
              console.error(err);
              elem.classList.add("is-invalid");
            }
          });

          // language detection
          el.addEventListener("change", async function(e) {
            const elem = e.target;
            try {
              const texts = await getTextsFromDir(elem.value);

              const filteredLangs = texts
                .filter(function(item) {
                  return item.lang;
                })
                .map(function(item) {
                  return item.lang;
                });
              
              const lang = jsutl.mode(filteredLangs);
              // console.log(`lang: ${lang}`);

              if (isLangValid(lang)) {
                langElement.value = lang;
                langElement.classList.remove("is-invalid");
              }
            } catch(err) {
              console.error(err);
            }
          });
        });

      // set text translate event
      [inputButtonElement, outputButtonElement]
        .forEach(function(el, idx, arr) {
          const srcPathElement = idx === 0 ? inputPathElement : outputPathElement;
          const srcLangElement = idx === 0 ? inputLangElement : outputLangElement;
          const dstPathElement = idx === 0 ? outputPathElement : inputPathElement;
          const dstLangElement = idx === 0 ? outputLangElement : inputLangElement;
          el.addEventListener("click", async function(e) {
            if (!isInitialized) {
              Toast.create({
                title: "InitializeError",
                message: "Not initialized.",
                status: TOAST_STATUS.DANGER,
                timeout: 3000
              });
              return;
            }
            if (!isLangsValid()) {
              Toast.create({
                title: "LanguageError",
                message: "Invalid language.",
                status: TOAST_STATUS.DANGER,
                timeout: 3000
              });
              return;
            }
  
            if (!isPathsValid()) {
              Toast.create({
                title: "PathError",
                message: "Invalid directory path.",
                status: TOAST_STATUS.DANGER,
                timeout: 3000
              });
              return;
            }

            const srcPath = srcPathElement.value;
            const dstPath = dstPathElement.value;
            const srcLang = srcLangElement.value;
            const dstLang = dstLangElement.value;

            function translateFile(file) {
              return new Promise(function(resolve, reject) {
                // preview
                inputTextElement.value = file.text;
            
                translate(file.text, file.lang || srcLang, dstLang, function(progress, result, timestamp) {
                  console.log(`${file.name}: ${progress}`);

                  // preview
                  outputTextElement.value = result;

                  if (progress === 1) {
                    console.log(`translated ${file.text.length} characters for ${timestamp} ms`);
                    resolve(result);
                  }
                });
              });
            }

            async function writeTextFile(filename, dirPath, text) {
              await waitMsg("write-text-file", {
                filename, dirPath, text,
              });
            }

            startTranslate();

            const files = await getTextsFromDir(srcPath);
            for (const file of files) {
              const text = await translateFile(file);
              const filename = file.name;
              const dirPath = dstPath;

              try {
                await writeTextFile(filename, dirPath, text);
              } catch(err) {
                console.error(err);

                Toast.create({
                  title: "WriteError",
                  message: err.message,
                  status: TOAST_STATUS.DANGER,
                  timeout: 3000
                });
              }
            }

            endTranslate();
          });
        });
    });
})();

// page 3
// settings
(function() {
  // type
  document.querySelectorAll("input[name='translate-type']").forEach(function(el) {
    el.addEventListener("change", function(e) {
      const value = e.target.value;
      translator = value;
      console.log(`translate type changed: ${translator}`);
    });
  });

  // unit
  document.querySelectorAll("input[name='translate-unit']").forEach(function(el) {
    el.addEventListener("change", function(e) {
      const value = e.target.value;
      if (value === "all") {
        translate = translateByAll;
      } else if (value === "paragraph") {
        translate = translateByParagraph;
      } else if (value === "line") {
        translate = translateByLine;
      }  else if (value === "sentence") {
        translate = translateBySentence;
      } else {
        translate = translateByAll;
      }
      console.log(`translate unit changed: ${value}`);
    });
  });

  // clipboard
  document.querySelectorAll("input[name='translate-clipboard']").forEach(function(el) {
    el.addEventListener("change", function(e) {
      const value = e.target.value;
      clipboard = value === "1";
      console.log(`translate clipboard changed: ${value}`);
    });
  });
})();

getMsg("init", function(err, msg, event) {
  const progressElement = document.getElementById("loading").querySelector(".progress-bar");
  const messageElement = document.getElementById("loading").querySelector(".message");

  if (err) {
    console.error(err);
    progressElement.style.width = "0%";
    messageElement.innerHTML = err;
    return;
  }

  const { progress, message } = msg;
  progressElement.style.width = (progress * 100) + "%";
  messageElement.innerHTML = message;

  if (progress === 1) {
    setTimeout(function() {
      document.getElementById("loading").style.display = "none";
      isInitialized = true;
    }, 1000);
  }
});

getMsg("test", function(err, msg, event) {
  console.log(`test: ${msg}`);
});