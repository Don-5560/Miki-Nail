// store.js
// 商品データと設定の読み書きをすべてここで管理しています
// localStorage（ブラウザの保存領域）を使っているので、サーバーなしで動きます

// ────────────────────────────────────────────
//  保存先のキー名
// ────────────────────────────────────────────
const PRODUCTS_KEY = 'fleur_products';
const SETTINGS_KEY = 'fleur_settings';
const TAGS_KEY = 'fleur_tags';

// ────────────────────────────────────────────
//  ショップ設定
// ────────────────────────────────────────────

function getSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) return JSON.parse(saved);

  // デフォルト設定（管理画面から変更できます）
  return {
    shopName: 'fleur nail',
    instagramHandle: 'your_instagram',
    heroTitle: 'あなたの指先に\n特別なひとときを',
    heroSub: 'handmade nail chips'
  };
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ────────────────────────────────────────────
//  サンプル画像（初回表示用のプレースホルダー）
//  本物の画像に差し替えれば自動的に切り替わります
// ────────────────────────────────────────────

function makePlaceholder(color, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <rect width="400" height="400" fill="${color}"/>
    <text x="200" y="185" font-size="48" text-anchor="middle" dominant-baseline="middle">💅</text>
    <text x="200" y="240" font-family="Georgia,serif" font-size="15" fill="rgba(255,255,255,0.85)" text-anchor="middle">${label}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ────────────────────────────────────────────
//  サンプルデータ（初回起動時のみ使用）
// ────────────────────────────────────────────

const SAMPLE_PRODUCTS = [
  {
    id: 'sample-1',
    name: 'フレンチネイルセット',
    price: 2800,
    description: '清潔感あふれるクラシックなフレンチデザイン。\nどんなコーデにも合わせやすい定番スタイルです。\n上品な白ラインが指先を美しく見せてくれます。',
    tags: ['フレンチ', 'シンプル', 'オフィス向け'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 3,
    images: [makePlaceholder('#F0B8CC', 'French'), makePlaceholder('#EBA8BC', 'French ②')],
    createdAt: '2026-05-01'
  },
  {
    id: 'sample-2',
    name: '大人ニュアンスネイル',
    price: 3200,
    description: 'くすみカラーで大人っぽく仕上げた一品。\nどんなコーデにも馴染む絶妙なニュアンスカラーです。\nデイリーからデートまで幅広く使えます。',
    tags: ['ニュアンス', 'くすみカラー', '大人かわいい'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 2,
    images: [makePlaceholder('#C4A0B4', 'Nuance')],
    createdAt: '2026-05-02'
  },
  {
    id: 'sample-3',
    name: '秋カラー テラコッタセット',
    price: 3000,
    description: '秋らしいテラコッタカラーで季節感を演出。\nオータムカラーがおしゃれな指先を作ります。',
    tags: ['秋冬', 'テラコッタ', 'カジュアル'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 0,
    images: [makePlaceholder('#CC8866', 'Terracotta')],
    createdAt: '2026-05-03'
  },
  {
    id: 'sample-4',
    name: 'クリアキラキラネイル',
    price: 3500,
    description: 'クリアベースにラメをあしらったキラキラデザイン。\n光を受けるたびに表情が変わる、特別な一品です。',
    tags: ['キラキラ', 'クリア', 'パーティー'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 1,
    images: [makePlaceholder('#A8C8E0', 'Clear Glitter')],
    createdAt: '2026-05-04'
  },
  {
    id: 'sample-5',
    name: 'ベビーピンク シンプルセット',
    price: 2500,
    description: 'やわらかいピンクのシンプルなデザイン。\nナチュラルで普段使いしやすい、女の子らしいセットです。',
    tags: ['ピンク', 'シンプル', 'ナチュラル', 'デイリー'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 5,
    images: [makePlaceholder('#FFBCD6', 'Baby Pink')],
    createdAt: '2026-05-05'
  },
  {
    id: 'sample-6',
    name: '和モダン 桜ネイル',
    price: 3800,
    description: '日本の美しさをネイルに落とし込んだデザイン。\n繊細な桜模様と和の色使いが上品です。\n特別なシーンにもぴったりな一品です。',
    tags: ['和風', '桜', '特別な日', '春'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 2,
    images: [makePlaceholder('#E8A0A8', '桜'), makePlaceholder('#F0BEC4', '桜 ②')],
    createdAt: '2026-05-06'
  }
];

// ────────────────────────────────────────────
//  商品データの読み書き
// ────────────────────────────────────────────

function getProducts() {
  const saved = localStorage.getItem(PRODUCTS_KEY);
  if (saved) return JSON.parse(saved);

  // 初回はサンプルデータを使う
  saveProducts(SAMPLE_PRODUCTS);
  return SAMPLE_PRODUCTS;
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getProduct(id) {
  const products = getProducts();
  return products.find(function(p) { return p.id === id; }) || null;
}

function addProduct(data) {
  const products = getProducts();
  const newProduct = Object.assign({}, data, {
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split('T')[0]
  });
  products.unshift(newProduct); // 新しいものを先頭に追加
  saveProducts(products);
  return newProduct;
}

function updateProduct(id, data) {
  const products = getProducts();
  const index = products.findIndex(function(p) { return p.id === id; });
  if (index === -1) return false;
  products[index] = Object.assign({}, products[index], data);
  saveProducts(products);
  return true;
}

function deleteProduct(id) {
  const products = getProducts().filter(function(p) { return p.id !== id; });
  saveProducts(products);
}

// すべての商品のタグを重複なしで取得（トップページのフィルター用）
function getAllTags() {
  const products = getProducts();
  const tagSet = new Set();
  products.forEach(function(p) {
    p.tags.forEach(function(tag) { tagSet.add(tag); });
  });
  return Array.from(tagSet);
}

// ────────────────────────────────────────────
//  マスタータグリスト（管理画面で管理するタグの一覧）
// ────────────────────────────────────────────

function getTags() {
  const saved = localStorage.getItem(TAGS_KEY);
  if (saved) return JSON.parse(saved);
  // 初回はサンプル商品のタグをそのまま使う
  const tags = getAllTags();
  saveTags(tags);
  return tags;
}

function saveTags(tags) {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

// タグを追加（重複は無視）
function addTag(tag) {
  const tags = getTags();
  if (tag && !tags.includes(tag)) {
    tags.push(tag);
    saveTags(tags);
  }
}

// タグを削除（そのタグを持つ商品からも取り除く）
function deleteTag(tag) {
  saveTags(getTags().filter(function(t) { return t !== tag; }));
  const products = getProducts();
  products.forEach(function(p) {
    p.tags = p.tags.filter(function(t) { return t !== tag; });
  });
  saveProducts(products);
}
