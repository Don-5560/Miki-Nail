// product.js
// 商品詳細ページを管理しています

document.addEventListener('DOMContentLoaded', function() {
  // URLの ?id=xxx から商品IDを取得
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showError('商品IDが指定されていません。');
    return;
  }

  const product = getProduct(id);
  if (!product) {
    showError('この商品は存在しないか、削除された可能性があります。');
    return;
  }

  applySettings(product);
  renderDetail(product);
  renderRelated(product);
});

// ────────────────────────────────────────────
//  設定をページに反映
// ────────────────────────────────────────────

function applySettings(product) {
  const s = getSettings();
  document.title = product.name + ' | ' + s.shopName;

  document.querySelectorAll('.shop-name').forEach(function(el) {
    el.textContent = s.shopName;
  });
  document.querySelectorAll('.ig-link').forEach(function(el) {
    el.href = 'https://www.instagram.com/' + s.instagramHandle;
    el.textContent = '@' + s.instagramHandle;
  });
}

// ────────────────────────────────────────────
//  商品詳細の描画
// ────────────────────────────────────────────

function renderDetail(p) {
  const isSoldOut = p.stock === 0;
  const s = getSettings();

  // メイン画像
  const mainImg = document.getElementById('mainImage');
  if (mainImg && p.images && p.images[0]) {
    mainImg.src = p.images[0];
    mainImg.alt = p.name;
  }

  // サムネイル画像（複数ある場合）
  const thumbs = document.getElementById('thumbnails');
  if (thumbs) {
    if (p.images && p.images.length > 1) {
      thumbs.innerHTML = p.images.map(function(src, i) {
        return '<img src="' + src + '" class="thumb' + (i === 0 ? ' active' : '') + '" alt="画像' + (i + 1) + '" data-index="' + i + '">';
      }).join('');

      // サムネイルをクリックするとメイン画像が切り替わる
      thumbs.querySelectorAll('.thumb').forEach(function(thumb) {
        thumb.addEventListener('click', function() {
          mainImg.src = p.images[this.dataset.index];
          thumbs.querySelectorAll('.thumb').forEach(function(t) { t.classList.remove('active'); });
          this.classList.add('active');
        });
      });
    } else {
      thumbs.style.display = 'none';
    }
  }

  // 商品名
  const nameEl = document.getElementById('productName');
  if (nameEl) nameEl.textContent = p.name;

  // 価格
  const priceEl = document.getElementById('productPrice');
  if (priceEl) priceEl.innerHTML = '¥' + p.price.toLocaleString() + '<span class="tax"> 税込</span>';

  // 在庫状況
  const stockEl = document.getElementById('stockStatus');
  if (stockEl) {
    if (isSoldOut) {
      stockEl.innerHTML = '<span class="stock-label sold-out">SOLD OUT</span>';
    } else if (p.stock <= 2) {
      stockEl.innerHTML = '<span class="stock-label low-stock">残り' + p.stock + '点</span>';
    } else {
      stockEl.innerHTML = '<span class="stock-label in-stock">在庫あり</span>';
    }
  }

  // タグ（クリックするとトップページでそのタグで絞り込む）
  const tagsEl = document.getElementById('productTags');
  if (tagsEl) {
    tagsEl.innerHTML = p.tags.map(function(tag) {
      return '<a href="index.html" class="tag-chip clickable" data-tag="' + tag + '">' + tag + '</a>';
    }).join('');

    tagsEl.querySelectorAll('.tag-chip').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.setItem('filterTag', this.dataset.tag);
        window.location.href = 'index.html';
      });
    });
  }

  // 説明文（改行を<br>に変換）
  const descEl = document.getElementById('productDesc');
  if (descEl) descEl.innerHTML = p.description.replace(/\n/g, '<br>');

  // サイズ選択
  const sizeWrap = document.getElementById('sizeWrap');
  const sizeOpts = document.getElementById('sizeOptions');
  if (sizeOpts && p.sizes && p.sizes.length > 0) {
    sizeOpts.innerHTML = p.sizes.map(function(size) {
      return '<button class="size-btn">' + size + '</button>';
    }).join('');

    sizeOpts.querySelectorAll('.size-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        sizeOpts.querySelectorAll('.size-btn').forEach(function(b) { b.classList.remove('selected'); });
        this.classList.add('selected');
      });
    });
  } else if (sizeWrap) {
    sizeWrap.style.display = 'none';
  }

  // Instagramで問い合わせるボタン
  const dmBtn = document.getElementById('dmButton');
  if (dmBtn) {
    if (isSoldOut) {
      dmBtn.textContent = 'SOLD OUT';
      dmBtn.classList.add('disabled');
      dmBtn.removeAttribute('href');
    } else {
      dmBtn.href = 'https://www.instagram.com/' + s.instagramHandle;
      dmBtn.textContent = 'Instagramでお問い合わせ 💌';
      dmBtn.target = '_blank';
      dmBtn.rel = 'noopener noreferrer';
    }
  }
}

// ────────────────────────────────────────────
//  関連商品（同じタグを持つ他の商品）
// ────────────────────────────────────────────

function renderRelated(currentProduct) {
  const section = document.getElementById('relatedSection');
  if (!section) return;

  const related = getProducts()
    .filter(function(p) {
      if (p.id === currentProduct.id) return false;
      return p.tags.some(function(tag) { return currentProduct.tags.includes(tag); });
    })
    .slice(0, 4); // 最大4件

  if (related.length === 0) {
    section.style.display = 'none';
    return;
  }

  const grid = document.getElementById('relatedGrid');
  if (!grid) return;

  grid.innerHTML = related.map(function(p) {
    const imgSrc = p.images && p.images[0] ? p.images[0] : '';
    const isSoldOut = p.stock === 0;
    return `
      <a href="product.html?id=${p.id}" class="product-card${isSoldOut ? ' is-sold-out' : ''}">
        <div class="card-image">
          ${imgSrc ? '<img src="' + imgSrc + '" alt="' + p.name + '" loading="lazy">' : '<div class="no-image">💅</div>'}
          ${isSoldOut ? '<div class="badge sold-out-badge">SOLD OUT</div>' : ''}
        </div>
        <div class="card-body">
          <p class="card-name">${p.name}</p>
          <p class="card-price">¥${p.price.toLocaleString()}</p>
        </div>
      </a>
    `;
  }).join('');
}

// ────────────────────────────────────────────
//  エラー表示
// ────────────────────────────────────────────

function showError(message) {
  const main = document.querySelector('.detail-wrap');
  if (main) {
    main.innerHTML = `
      <div class="error-box">
        <p>${message}</p>
        <a href="index.html" class="btn-primary">商品一覧に戻る</a>
      </div>
    `;
  }
}
