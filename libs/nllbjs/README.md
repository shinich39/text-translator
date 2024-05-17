# nllbjs

Wrapping no-language-left-behind translate model.

## Usage

```js
import nllb from 'nllbjs';

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

  // initialize take a very long time at first start.
  // it requires at least 8 GB of available storage during initialization.
  await nllb.init();
  
  for (const target of targets) {
    const result = await nllb.exec(text, source, target, model);
    console.log(`${target}: ${result}`);
  }
  // zho_Hans: 洛克希德马丁向美国海军陆战队提供了初步5G测试台,开始移动网络实验
  // kor_Hang: 로크히드 마틴은 미국 해병대에 첫 번째 5G 테스트 베드를 공급하고 모바일 네트워크 실험을 시작했습니다
  // jpn_Jpan: ロックヒッド・マーティンが5Gテストベッドをアメリカ海兵隊に提供し,モバイルネットワーク実験を開始
})();
```

## References

- [no-language-left-behind](https://ai.meta.com/research/no-language-left-behind/)
- [nllb-200-distilled-600M](https://huggingface.co/facebook/nllb-200-distilled-600M)
- [Open-NLLB](https://github.com/gordicaleksa/Open-NLLB)