// admin.js
// 管理画面（出品・編集・削除・設定変更）

// ── パスワード設定 ───────────────────────────
// ここを変更すると管理画面のパスワードが変わります
const ADMIN_PASSWORD = 'nails2026';
// ─────────────────────────────────────────────

let editingId = null;   // 編集中の商品ID（新規追加のときはnull）
let currentImages = []; // 現在フォームに入っている画像（base64）

document.addEventListener('DOMContentLoaded', function() {
  checkPassword();
});

// ────────────────────────────────────────────
//  パスワード認証
// ────────────────────────────────────────────

function checkPassword() {
  // セッション中は認証済みとして扱う
  if (sessionStorage.getItem('admin_auth') === 'ok') {
    showAdmin();
    return;
  }

  const overlay = document.getElementById('passwordOverlay');
  if (overlay) overlay.style.display = 'flex';

  const form = document.getElementById('passwordForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const input = document.getElementById('passwordInput');
    if (input.value === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'ok');
      overlay.style.display = 'none';
      showAdmin();
    } else {
      document.getElementById('passwordError').style.display = 'block';
      input.value = '';
      input.focus();
    }
  });
}

// ────────────────────────────────────────────
//  管理画面の初期表示
// ────────────────────────────────────────────

function showAdmin() {
  loadSettings();
  renderProductList();
  renderTagMasterList();
  setupEventListeners();
}

// ────────────────────────────────────────────
//  イベントリスナーをまとめて設定
// ────────────────────────────────────────────

function setupEventListeners() {
  // 「新しく出品する」ボタン
  document.getElementById('addNewBtn').addEventListener('click', function() {
    openForm(null);
  });

  // フォームの送信
  document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveProduct();
  });

  // フォームを閉じる
  document.getElementById('cancelBtn').addEventListener('click', closeForm);
  document.getElementById('formOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeForm();
  });

  // 画像アップロード
  document.getElementById('imageUpload').addEventListener('change', handleImageUpload);

  // 設定フォームの送信
  document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveSettingsForm();
  });

  // タグ管理：追加ボタン
  document.getElementById('addTagBtn').addEventListener('click', function() {
    var input = document.getElementById('newTagName');
    var tag = input.value.trim();
    if (!tag) return;
    addTag(tag);
    input.value = '';
    renderTagMasterList();
    showToast('タグ「' + tag + '」を追加しました');
  });
  document.getElementById('newTagName').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addTagBtn').click(); }
  });

  // フォーム内：新しいタグをその場で追加
  document.getElementById('addTagInFormBtn').addEventListener('click', function() {
    var input = document.getElementById('newTagInForm');
    var tag = input.value.trim();
    if (!tag) return;
    addTag(tag);
    input.value = '';
    renderTagCheckboxes(); // チェックボックス一覧を再描画して新タグを反映
    // 追加したタグを自動でチェック状態に
    var label = document.querySelector('.tag-check-label[data-tag="' + tag + '"]');
    if (label) {
      label.classList.add('checked');
      label.querySelector('input').checked = true;
    }
    renderTagMasterList();
  });
  document.getElementById('newTagInForm').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addTagInFormBtn').click(); }
  });

  // タブ切り替え
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const target = this.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });
}

// ────────────────────────────────────────────
//  商品一覧の描画
// ────────────────────────────────────────────

function renderProductList() {
  const list = document.getElementById('productList');
  const products = getProducts();

  if (products.length === 0) {
    list.innerHTML = '<p class="empty-msg">まだ商品がありません。「新しく出品する」から追加してください。</p>';
    return;
  }

  list.innerHTML = products.map(function(p) {
    const imgSrc = p.images && p.images[0] ? p.images[0] : '';
    const isSoldOut = p.stock === 0;
    return `
      <div class="admin-product-row">
        <div class="admin-thumb">
          ${imgSrc ? '<img src="' + imgSrc + '" alt="' + p.name + '">' : '<div class="no-image-sm">💅</div>'}
        </div>
        <div class="admin-info">
          <p class="admin-product-name">${p.name}</p>
          <p class="admin-product-meta">
            ¥${p.price.toLocaleString()} ／ 在庫: ${isSoldOut ? '<span class="sold-out-text">0（SOLD OUT）</span>' : p.stock + '点'}
          </p>
          <div class="admin-tags">
            ${p.tags.map(function(tag) { return '<span class="tag-chip">' + tag + '</span>'; }).join('')}
          </div>
        </div>
        <div class="admin-actions">
          <button class="btn-edit" onclick="openForm('${p.id}')">編集</button>
          <button class="btn-delete" onclick="deleteItem('${p.id}', '${p.name}')">削除</button>
        </div>
      </div>
    `;
  }).join('');
}

// ────────────────────────────────────────────
//  出品・編集フォームを開く
// ────────────────────────────────────────────

function openForm(id) {
  editingId = id;
  currentImages = [];

  var overlay = document.getElementById('formOverlay');
  var title = document.getElementById('formTitle');

  if (id) {
    // 編集モード：既存の値をフォームにセット
    var p = getProduct(id);
    if (!p) return;

    title.textContent = '商品を編集';
    document.getElementById('fieldName').value = p.name;
    document.getElementById('fieldPrice').value = p.price;
    document.getElementById('fieldStock').value = p.stock;
    document.getElementById('fieldDesc').value = p.description;

    // サイズのチェックボックスを設定
    document.querySelectorAll('.size-check').forEach(function(cb) {
      cb.checked = p.sizes.includes(cb.value);
    });

    currentImages = p.images ? p.images.slice() : [];
    renderTagCheckboxes(p.tags); // 編集対象商品のタグをチェック済みにする
  } else {
    // 新規モード：フォームをリセット
    title.textContent = '新しく出品する';
    document.getElementById('fieldName').value = '';
    document.getElementById('fieldPrice').value = '';
    document.getElementById('fieldStock').value = '';
    document.getElementById('fieldDesc').value = '';
    document.querySelectorAll('.size-check').forEach(function(cb) { cb.checked = false; });
    currentImages = [];
    renderTagCheckboxes([]); // 全部未チェック
  }

  renderImagePreviews();
  overlay.style.display = 'flex';
}

// タグチェックボックスを描画（checkedTags: チェックしておくタグの配列）
function renderTagCheckboxes(checkedTags) {
  var group = document.getElementById('tagCheckGroup');
  if (!group) return;
  var checked = checkedTags || [];
  var tags = getTags();

  if (tags.length === 0) {
    group.innerHTML = '<p style="font-size:13px;color:var(--text-sub);">タグがありません。「タグ管理」タブから追加してください。</p>';
    return;
  }

  group.innerHTML = tags.map(function(tag) {
    var isChecked = checked.includes(tag);
    return '<label class="tag-check-label' + (isChecked ? ' checked' : '') + '" data-tag="' + tag + '">'
      + '<input type="checkbox" class="tag-cb"' + (isChecked ? ' checked' : '') + '>'
      + tag
      + '</label>';
  }).join('');

  // ラベルをクリックしてチェック状態を切り替え
  group.querySelectorAll('.tag-check-label').forEach(function(label) {
    label.addEventListener('click', function() {
      var cb = this.querySelector('input');
      cb.checked = !cb.checked;
      this.classList.toggle('checked', cb.checked);
    });
  });
}

function closeForm() {
  document.getElementById('formOverlay').style.display = 'none';
}

// ────────────────────────────────────────────
//  画像アップロード（複数OK）
// ────────────────────────────────────────────

function handleImageUpload(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  // 各ファイルをbase64に変換して currentImages に追加
  const promises = files.map(function(file) {
    return new Promise(function(resolve) {
      const reader = new FileReader();
      reader.onload = function(ev) { resolve(ev.target.result); };
      reader.readAsDataURL(file);
    });
  });

  Promise.all(promises).then(function(results) {
    currentImages = currentImages.concat(results);
    renderImagePreviews();
    // ファイル選択をリセット（同じファイルを再度選べるように）
    e.target.value = '';
  });
}

// アップロード済み画像のプレビューを表示
function renderImagePreviews() {
  const area = document.getElementById('imagePreviewArea');
  if (!area) return;

  if (currentImages.length === 0) {
    area.innerHTML = '<p class="upload-hint">画像をアップロードしてください（複数可）</p>';
    return;
  }

  area.innerHTML = currentImages.map(function(src, i) {
    return `
      <div class="preview-thumb">
        <img src="${src}" alt="画像${i + 1}">
        <button type="button" class="remove-img" onclick="removeImage(${i})">×</button>
        ${i === 0 ? '<span class="main-badge">メイン</span>' : ''}
      </div>
    `;
  }).join('');
}

// 画像を削除
function removeImage(index) {
  currentImages.splice(index, 1);
  renderImagePreviews();
}

// ────────────────────────────────────────────
//  商品を保存（新規 or 更新）
// ────────────────────────────────────────────

function saveProduct() {
  // チェックされたタグを収集
  var tags = [];
  document.querySelectorAll('.tag-cb:checked').forEach(function(cb) {
    var label = cb.closest('.tag-check-label');
    if (label) tags.push(label.dataset.tag);
  });

  // チェックしたサイズを配列に
  const sizes = [];
  document.querySelectorAll('.size-check:checked').forEach(function(cb) {
    sizes.push(cb.value);
  });

  const data = {
    name: document.getElementById('fieldName').value.trim(),
    price: parseInt(document.getElementById('fieldPrice').value, 10),
    stock: parseInt(document.getElementById('fieldStock').value, 10),
    description: document.getElementById('fieldDesc').value.trim(),
    tags: tags,
    sizes: sizes,
    images: currentImages.slice()
  };

  if (!data.name || isNaN(data.price) || isNaN(data.stock)) {
    alert('商品名・価格・在庫数は必ず入力してください。');
    return;
  }

  if (editingId) {
    updateProduct(editingId, data);
    showToast('商品を更新しました');
  } else {
    addProduct(data);
    showToast('商品を出品しました');
  }

  closeForm();
  renderProductList();
}

// ────────────────────────────────────────────
//  商品の削除
// ────────────────────────────────────────────

function deleteItem(id, name) {
  if (!confirm('「' + name + '」を削除しますか？\nこの操作は元に戻せません。')) return;
  deleteProduct(id);
  showToast('商品を削除しました');
  renderProductList();
}

// ────────────────────────────────────────────
//  タグ管理タブの描画
// ────────────────────────────────────────────

function renderTagMasterList() {
  var list = document.getElementById('tagMasterList');
  if (!list) return;
  var tags = getTags();

  if (tags.length === 0) {
    list.innerHTML = '<p class="empty-msg">タグがまだありません</p>';
    return;
  }

  list.innerHTML = tags.map(function(tag) {
    return '<div class="tag-master-item">'
      + '<span>' + tag + '</span>'
      + '<button onclick="removeTag(\'' + tag + '\')" title="削除">×</button>'
      + '</div>';
  }).join('');
}

function removeTag(tag) {
  if (!confirm('タグ「' + tag + '」を削除しますか？\nこのタグを持つ商品からも取り除かれます。')) return;
  deleteTag(tag);
  renderTagMasterList();
  renderProductList(); // 商品の表示にも反映
  showToast('タグ「' + tag + '」を削除しました');
}

// ────────────────────────────────────────────
//  ショップ設定の読み込みと保存
// ────────────────────────────────────────────

function loadSettings() {
  const s = getSettings();
  document.getElementById('settingShopName').value = s.shopName;
  document.getElementById('settingIg').value = s.instagramHandle;
  document.getElementById('settingHeroTitle').value = s.heroTitle;
  document.getElementById('settingHeroSub').value = s.heroSub;
}

function saveSettingsForm() {
  const s = {
    shopName: document.getElementById('settingShopName').value.trim(),
    instagramHandle: document.getElementById('settingIg').value.trim().replace('@', ''),
    heroTitle: document.getElementById('settingHeroTitle').value.trim(),
    heroSub: document.getElementById('settingHeroSub').value.trim()
  };
  saveSettings(s);
  showToast('設定を保存しました');
}

// ────────────────────────────────────────────
//  トースト通知（右下に一時表示）
// ────────────────────────────────────────────

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2500);
}
