# こそあど！

小学校中学年向けの、指示語を場面の中で考える学習アプリです。

## 学習体験

- 「れんしゅう」から、これ・それ・あれ・どれ／この・その・あの・どの／ここ・そこ・あそこ・どこを混ぜて10問連続で出題
- 話し手・聞き手・対象の位置を、NAVIキャラクターとSVGの記号で明示
- 同じ場面で話し手と聞き手を入れかえる「視点チェンジ」を通常問題に組み込み
- 間違えた問題は少し間をあけて再出題し、別のタイミングで2回正解すると復習待ちから外す
- 10問後は正解数・連続正解・少し苦手な系列だけを短く表示し、「もう10問」で再開
- 「ことば探偵」では、同じ場面を視点を変えて観察できる

## データ設計

`data.js` では、場面の状態を `SCENES`、視点から判断する設問を `QUESTION_BANK` に分離しています。

- `Scene`: 場所、人物の位置、対象物・場所の位置
- `Question`: 話し手、聞き手、問う種類、文型、選択肢、正解
- `targetRelation`: `speaker` / `listener` / `far`
- 「ど」系列は `questionType: interrogative` として処理し、距離関係に含めない。`candidateCount: 3` は画面上の候補数であり、出題回数ではない
- 文は確認済みのテンプレートと、対象物ごとの互換性から生成
- `SCENES` の11場面をすべて問題バンクに使い、各場面×3種類に「通常2視点＋疑問1問」を用意
- `starter: true` の場面だけに絞らず、入口の4問だけを固定し、その後は全問題から履歴と系列バランスで選ぶ

## 共通基盤

公開されている正本を直接読み込みます。

- [edu-components](https://tt-sensei.github.io/edu-components/)：`AnswerChecker`、`QuestionPool`、`ScoreManager`、`ComboManager`、`RetryWrong`、`StorageManager`
- [edu-effects](https://tt-sensei.github.io/edu-effects/)：学習UI、選択肢、正誤、フィードバック、動き、学習シェル
- [sounds-recipe-](https://tt-sensei.github.io/sounds-recipe-/)：正解・再挑戦・開始・達成などの効果音
- [navi-character-](https://tt-sensei.github.io/navi-character-/)：通常版NAVIキャラクター6人の軽量WebP

## 実行・検証

ビルドは不要です。GitHub Pagesで `index.html` を公開します。

問題データの整合性は、Node.js 18以上で次のコマンドから確認できます。

```bash
npm test
```

保存先は `edu:kosoado:*` の教材固有namespaceです。ブラウザのlocalStorageを使うため、外部DBやAPIキーは使用しません。
