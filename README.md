# おまかせカーサーチ ホームページ

広島・山口を中心に、格安の軽自動車探しとローンが不安な方の相談へ特化した静的ホームページです。

## 開き方

`index.html` をブラウザで開くと表示できます。

管理用ページは `admin.html` です。

詳細ページ:

- `flow.html`: サービスの流れ
- `examples.html`: ご提案例
- `stock.html`: 在庫車両
- `service.html`: 対応内容
- `consultation.html`: 相談方法
- `faq.html`: よくある質問
- `about.html`: お店について
- `contact.html`: 無料相談フォーム
- `payment.html`: 支払い方法
- `privacy.html`: プライバシーポリシー
- `thanks.html`: フォーム送信完了ページ
- `404.html`: ページが見つからない場合の案内ページ

## 変更しやすい場所

- 店舗名: 各HTMLの `おまかせカーサーチ`
- 送信先メール: `script.js` の `ownerEmail`
- 電話番号表示: `script.js` の `ownerPhoneDisplay`
- 電話リンク: `script.js` の `ownerPhoneHref`
- 受付時間: `script.js` の `businessHours`
- LINE: `script.js` の `lineUrl`
- LINE通知Webhook: `script.js` の `lineWebhookEndpoint`
- フォーム送信先: `script.js` の `formEndpoint`
- 在庫データ: `data/stock.csv`
- ご提案例データ: `data/examples.csv`
- Googleスプレッドシート公開CSV: `script.js` の `stockDataUrl`
- ご提案例のGoogleスプレッドシート公開CSV: `script.js` の `exampleDataUrl`
- ヒーロー画像: `assets/hero-car-consultation.webp`

## フォームについて

ローカルやGitHub Pagesでは、送信後に内容確認の画面を表示し、メール下書きを作成できる形です。

Netlifyで公開すると、フォームはNetlify Formsで受信できるように設定しています。
フォーム名は `car-search-order` です。

相談方法は、電話・メール・LINEの3パターンを表示しています。
電話番号と受付時間は `script.js` 冒頭の `ownerPhoneDisplay`、`ownerPhoneHref`、`businessHours` を差し替えてください。

フォームは「格安の軽自動車」「ローン審査が不安」「月々の支払いを抑えたい」「頭金なしで相談したい」を中心にした内容です。
対応地域は広島県・山口県をメインにし、その他の全国対応は陸送費・登録費などの別途費用がかかる案内にしています。

## 動的機能

- ご提案例を条件別に絞り込み
- フォーム入力内容のライブ表示
- 入力済み項目の進捗表示
- 相談方法に合わせた案内文と送信ボタン文言の切り替え
- Netlify設定前の内容確認モーダル、メール下書き、LINE相談導線

## 掲載内容

- 格安軽自動車探し
- ローン審査が不安な方への相談
- 広島・山口を中心にした対応エリア案内
- 全国対応時の陸送費・別途費用の案内
- 車探しから納車までの対応内容
- サービスの流れ
- ご提案例
- 在庫車両
- 電話・メール・LINEの相談方法
- 無料相談フォーム
- よくある質問

## 在庫管理

在庫車両は `data/stock.csv` から自動表示します。

ご提案例は `data/examples.csv` から自動表示します。

管理用のExcelテンプレートは `outputs/car-data-management.xlsx` です。
Googleスプレッドシートで使う場合は、このExcelをGoogleドライブへアップロードして、各シートをCSV形式でウェブ公開します。

在庫CSVの列:

```csv
maker,name,year,mileage,color,inspection,price,label,note,image,visible
```

ご提案例CSVの列:

```csv
name,year,mileage,price,image,budget,category,visible
```

`visible` を `FALSE` にすると、その車両はサイトに表示されません。
画像は `assets/example-suv.png` のようにサイト内の画像パスを指定します。

Googleスプレッドシートで管理する場合は、シートをCSV形式でウェブ公開し、発行されたCSV URLを `script.js` の `stockDataUrl` または `exampleDataUrl` に設定してください。

実際にメールで自動受信したい場合は、フォームサービスが発行する送信先URLを `script.js` の `formEndpoint` に設定してください。
LINEへ自動通知したい場合は、LINE Messaging APIなどを扱うサーバー側Webhook URLを `lineWebhookEndpoint` に設定してください。

```js
const ownerEmail = "あなたのメールアドレス";
const lineUrl = "LINE公式アカウントの友だち追加URL";
const lineWebhookEndpoint = "LINE通知用Webhook URL";
const formEndpoint = "フォームサービスの送信先URL";
const stockDataUrl = "GoogleスプレッドシートのCSV公開URL";
const exampleDataUrl = "ご提案例用GoogleスプレッドシートのCSV公開URL";
```

`formEndpoint` を設定すると、フォーム送信時に入力内容をそのURLへPOSTします。
`lineWebhookEndpoint` を設定すると、フォーム送信時に入力内容をJSONでPOSTします。
未設定の場合は、メール下書き作成ボタンで内容を送れるようにしています。

LINEのチャネルアクセストークンなどの秘密情報は、`script.js` に直接書かないでください。
GitHub Pagesのような静的サイトでは誰でも中身を見られるため、秘密情報は必ずサーバー側Webhookに置きます。

## Netlify公開手順

1. NetlifyでGitHubリポジトリを選択します。
2. Build commandは空欄のままにします。
3. Publish directoryは `.` のままにします。
4. デプロイ後、NetlifyのForms画面で `car-search-order` が検出されているか確認します。
5. フォーム通知を使う場合は、NetlifyのNotificationsから受信メールを設定します。
6. `contact.html` からテスト送信し、NetlifyのFormsに送信内容が入るか確認します。

`netlify.toml` で `/thanks` を `thanks.html` へ表示する設定を入れています。

## SEO用ファイル

- `robots.txt`: 検索エンジン向けの巡回設定です。
- `sitemap.xml`: 主要ページのURL一覧です。

現在のサイトマップURLは `https://atsushisora.github.io/car_search/` を基準にしています。
Netlifyで別URLを使う場合は、公開後に `robots.txt` と `sitemap.xml` のURLをNetlifyのURLへ差し替えてください。

## 公開前チェック

- `script.js` の `ownerEmail` を実際のメールアドレスに変更
- `script.js` の `ownerPhoneDisplay`、`ownerPhoneHref`、`businessHours` を実際の内容に変更
- `privacy.html` の運営名など、店舗情報の本文を実際の内容に確認
- NetlifyのURLに合わせて `robots.txt` と `sitemap.xml` のURLを確認
- `data/stock.csv` と `data/examples.csv` の内容を最終調整
- フォーム送信後にNetlify Formsで受信できるか確認
