# Photos Heatmap CLI

写真.appの位置情報データからヒートマップを作成するCLIツールです。

## 機能

- macOSの写真.appからGPS位置情報を抽出
- インタラクティブなHTMLヒートマップを生成
- 写真の撮影日時範囲を表示
- カスタマイズ可能な出力パス

## インストール

```bash
npm install
npm run build
```

## 使用方法

### 基本的な使用方法

```bash
npm start generate
```

### オプション

```bash
npm start generate --help
```

利用可能なオプション:
- `-o, --output <path>`: 出力ファイルパス (デフォルト: `./heatmap.html`)
- `-f, --format <format>`: 出力フォーマット (現在は `html` のみ)
- `--photos-db <path>`: カスタム写真データベースパス

### 例

```bash
# デフォルトの場所にヒートマップを生成
npm start generate

# カスタム出力パスを指定
npm start generate -o ~/Desktop/my-heatmap.html

# カスタムデータベースパスを指定
npm start generate --photos-db "/path/to/Photos Library.photoslibrary/database/photos.db"
```

## 必要な権限

このアプリケーションは写真.appのデータベースファイルにアクセスする必要があります:
- macOSの「システム設定」→「プライバシーとセキュリティ」→「フルディスクアクセス」で、ターミナルアプリケーションにアクセス権限を付与してください

## 技術詳細

- TypeScript/Node.js
- SQLite3で写真データベースを読み取り
- Leaflet.jsとleaflet-heatプラグインでヒートマップを生成
- 写真のタイムスタンプはCore Dataの参照日(2001-01-01)からの秒数で保存されています

## トラブルシューティング

### 「Photos database not found」エラー
- 写真.appが正しくセットアップされているか確認してください
- フルディスクアクセス権限が付与されているか確認してください

### 位置情報が見つからない
- 写真に位置情報が含まれているか確認してください
- iPhoneやカメラの位置情報設定が有効になっているか確認してください

## ライセンス

MIT