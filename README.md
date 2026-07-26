# オーダーオート ホームページ

広島・山口を中心に、格安の軽自動車探しとローンが不安な方の相談へ特化した静的ホームページです。

## 開き方

`index.html` をブラウザで開くと表示できます。

ローカル確認用にサーバーを使う場合:

```sh
python3 -m http.server 8080
```

その後、`http://127.0.0.1:8080/` を開きます。

## 主要ページ

- `index.html`: トップページ
- `hiroshima.html`: 広島の格安軽自動車相談
- `yamaguchi.html`: 山口の格安軽自動車相談
- `loan.html`: ローン審査が不安な方へ
- `trust.html`: 選ばれる理由
- `flow.html`: サービスの流れ
- `examples.html`: ご提案例
- `stock.html`: 在庫掲載準備中
- `service.html`: 対応内容
- `consultation.html`: 相談方法
- `faq.html`: よくある質問
- `about.html`: お店について
- `contact.html`: 無料相談フォーム
- `payment.html`: 支払い方法
- `privacy.html`: プライバシーポリシー
- `thanks.html`: フォーム送信完了ページ
- `404.html`: ページが見つからない場合の案内ページ
- `local-admin.html`: ローカル専用のCSVデータ確認・在庫作成ページ（公開対象外）

## 変更しやすい場所

- 送信先メール: `script.js` の `ownerEmail`
- 電話番号表示: `script.js` の `ownerPhoneDisplay`
- 電話リンク: `script.js` の `ownerPhoneHref`
- 受付時間: `script.js` の `businessHours`
- LINE友だち追加URL: `script.js` の `lineUrl`
- 在庫データ: Googleスプレッドシート公開CSV、または予備の `data/stock.csv`
- ご提案例データ: `data/examples.csv`
- Googleスプレッドシート公開CSV: `site-config.js` の `stockCsvUrl` / `exampleCsvUrl`
- ヒーロー画像: `assets/hero-car-consultation.webp`

## フォームについて

現在は静的サイトとして、送信後に内容確認モーダルを表示します。

フォーム内容は以下の方法で送れます。

- メール下書き作成
- LINE相談
- 内容コピー

自動メール送信やLINE自動通知を使う場合は、公開時にサーバー側の送信先を用意し、`script.js` の `formEndpoint` または `lineWebhookEndpoint` に設定します。

LINEのチャネルアクセストークンなどの秘密情報は、`script.js` に直接書かないでください。静的サイトでは誰でも中身を見られるため、秘密情報は必ずサーバー側に置きます。

## 在庫・ご提案例の管理

在庫車両はGoogleスプレッドシートの公開CSVから表示できます。`site-config.js` の `stockCsvUrl` に、公開CSV URLを入れてください。

`stockCsvUrl` が空の場合は、予備データとして `data/stock.csv` から表示します。

ご提案例もスプレッドシート管理にする場合は、`site-config.js` の `exampleCsvUrl` に公開CSV URLを入れてください。空の場合は `data/examples.csv` から表示します。

管理用のExcelテンプレートは `outputs/car-data-management.xlsx` です。Googleスプレッドシートで使う場合は、このExcelをGoogleドライブへアップロードして、各シートをCSV形式でウェブ公開します。`local-admin.html` はローカル専用で、公開サイトには含めません。

スプレッドシート公開CSVの設定例:

```js
window.orderAutoConfig = {
  stockCsvUrl: "https://docs.google.com/spreadsheets/d/e/公開ID/pub?gid=0&single=true&output=csv",
  exampleCsvUrl: "",
};
```

在庫CSVの列:

```csv
maker,name,year,mileage,color,inspection,price,label,note,image,visible
```

ご提案例CSVの列:

```csv
name,year,mileage,price,image,budget,category,visible
```

`visible` を `FALSE` にすると、その車両はサイトに表示されません。

## 公開前チェック

- 古物商許可取得後に、公安委員会名・許可番号・許可を受けた氏名を追加
- `script.js` のメール、電話、LINEを最終確認
- `privacy.html` と `about.html` の運営情報を最終確認
- `data/stock.csv` と `data/examples.csv` の内容を最終調整
- 公開URLに合わせて `robots.txt` と `sitemap.xml` を確認
- Googleビジネスプロフィール用の写真・説明文・営業時間を準備
