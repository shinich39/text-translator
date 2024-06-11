# text-translator

NLLB-200 text translator.

## Text

1. Enter input text to "Text A".
2. If "Language A" is empty or not matched, replace "Language A" manually.
3. Enter output language to "Language B".
4. Click "Translate A to B" button.

<p>
  <img src="./imgs/1.png" width="100%" title="1.png">
</p>

## TXT files

1. Type input path to "Directory A".
2. Type output path to "Directory B".
3. If "Language A" is empty or not matched, replace "Language A" manually.
4. Type output language to "Language B".
5. Click "Translate A to B" button.

<p>
  <img src="./imgs/2.png" width="100%" title="2.png">
</p>

## Settings

#### Translate Type

- NLLB-200: Use NLLB-200 model (Take a lot of time for downloading in first translate.)
- google
- deepl
- papago
- yandex
- bing: Disabled
- reverso

#### Translate Unit

- All: Disabled
- Paragraph: Default
- Line: 
- Sentence: Slow

#### Translate from clipboard

- Disable
- Enable: Auto translate copied text.

## Updates

- Add all NLLB models.
- Add translateByLine.
- Add reverso.
- Add txt preview.
- Web timeout: 30s => 10s
- Add translate from clipboard.

## References

- [nllb-200-high-quality-machine-translation](https://ai.meta.com/blog/nllb-200-high-quality-machine-translation/ko/)