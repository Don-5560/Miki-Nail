// index.js
// トップページの商品一覧とタグフィルターを管理しています

let activeTag = 'all'; // 現在選択中のタグ

document.addEventListener('DOMContentLoaded', function() {
  applySettings();
  renderTagButtons();

  // 商品詳細ページのタグリンクからの遷移に対応
  const savedTag = sessionStorage.getItem('filterTag');
  if (savedTag) {
    sessionStorage.removeItem('filterTag');
    activeTag = savedTag;
  }

  renderProducts(getFilteredProducts());
});

// ────────────────────────────────────────────
//  設定をページに反映
// ────────────────────────────────────────────

function applySettings() {
  const s = getSettings();

  document.querySelectorAll('.shop-name').forEach(function(el) {
    el.textContent = s.shopName;
  });
  document.title = s.shopName + ' | ハンドメイドネイルチップ';

  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) heroTitle.innerHTML = s.heroTitle.replace('\n', '<br>');

  const heroSub = document.getElementById('heroSub');
  if (heroSub) heroSub.textContent = s.heroSub;

  document.querySelectorAll('.ig-link').forEach(function(el) {
    el.href = 'https://www.instagram.com/' + s.instagramHandle;
    el.textContent = '@' + s.instagramHandle;
  });
}

// ────────────────────────────────────────────
//  タグフィルターボタンの描画
// ────────────────────────────────────────────

function renderTagButtons() {
  const container = document.getElementById('tagFilter');
  if (!container) return;

  const tags = getAllTags();

  // 「すべて」ボタン + 各タグのボタンを作る
  let html = '<button class="tag-btn" data-tag="all">すべて</button>';
  tags.forEach(function(tag) {
    html += '<button class="tag-btn" data-tag="' + tag + '">' + tag + '</button>';
  });
  container.innerHTML = html;

  // active状態を設定
  container.querySelectorAll('.tag-btn').forEach(function(btn) {
    if (btn.dataset.tag === activeTag) btn.classList.add('active');

    btn.addEventListener('click', function() {
      activeTag = this.dataset.tag;

      // ボタンのactive切り替え
      container.querySelectorAll('.tag-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      this.classList.add('active');

      renderProducts(getFilteredProducts());
    });
  });
}

// ────────────────────────────────────────────
//  タグで絞り込んだ商品リストを返す
// ────────────────────────────────────────────

function getFilteredProducts() {
  const products = getProducts();
  if (activeTag === 'all') return products;
  return products.filter(function(p) {
    return p.tags.includes(activeTag);
  });
}

// ────────────────────────────────────────────
//  商品カードの描画
// ────────────────────────────────────────────

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('emptyMessage');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = products.map(function(p) {
    const isSoldOut = p.stock === 0;
    const imgSrc = p.images && p.images[0] ? p.images[0] : '';

    const tagsHtml = p.tags.map(function(tag) {
      return '<span class="tag-chip">' + tag + '</span>';
    }).join('');

    // 在庫わずかのバッジ（1〜2点）
    let badgeHtml = '';
    if (isSoldOut) {
      badgeHtml = '<div class="badge sold-out-badge">SOLD OUT</div>';
    } else if (p.stock <= 2) {
      badgeHtml = '<div class="badge low-stock-badge">残り' + p.stock + '点</div>';
    }

    return `
      <a href="product.html?id=${p.id}" class="product-card${isSoldOut ? ' is-sold-out' : ''}">
        <div class="card-image">
          ${imgSrc
            ? '<img src="' + imgSrc + '" alt="' + p.name + '" loading="lazy">'
            : '<div class="no-image">💅</div>'
          }
          ${badgeHtml}
        </div>
        <div class="card-body">
          <div class="card-tags">${tagsHtml}</div>
          <p class="card-name">${p.name}</p>
          <p class="card-price">¥${p.price.toLocaleString()} <span class="tax">税込</span></p>
        </div>
      </a>
    `;
  }).join('');
}
