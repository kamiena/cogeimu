# cogeimu
GameArtPRJ CÔGEIMU official site

## 構成

ビルド不要の静的サイト（HTML / CSS / JS のみ）。GitHub Pages でそのまま公開できます。

```
index.html            トップ（プロジェクト概要・作品一覧・チーム・活動実績・お問い合わせ）
works/yuki.html       01 Yuki（アルミ）
works/kagane.html     02 Kagane「ARE YOU THERE?」（銅）
assets/css/style.css  デザイン全体
assets/js/main.js     日英切り替え・メニュー・スクロール演出
assets/img/           画像（WebP）
```

## 日英切り替え

文章は日本語・英語を並べて書き、`lang` 属性で出し分けています。

```html
<span lang="ja">工芸 × ゲーム</span><span lang="en">Craft × Game</span>
```

- 画像の代替テキストは `data-alt-ja` / `data-alt-en`
- ページタイトルは `<html>` の `data-title-ja` / `data-title-en`
- URL に `?lang=en` を付けると英語で開きます

## 未確定の情報

差し替えが必要な箇所には `TODO(yuki)` / `TODO(kagane)` のコメントと、画面上に `TBA` / `Coming soon` 表示を入れています。

```
grep -rn "TODO(" --include=*.html .
```

## ローカル確認

```
python3 -m http.server 8000
# → http://localhost:8000
```
