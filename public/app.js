const app = document.querySelector('#app');

const money = n =>
  new Intl.NumberFormat('fr-FR').format(Number(n) || 0) + ' F CFA';

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Erreur serveur');
  return response.json();
}

async function dashboard() {
  const d = await api('/api/dashboard');

  app.innerHTML = `
    <h1>Tableau de bord</h1>
    <div class="grid">
      <div class="card">Produits<div class="num">${d.products}</div></div>
      <div class="card">Stock<div class="num">${d.stock}</div></div>
      <div class="card">Commandes<div class="num">${d.orders}</div></div>
      <div class="card">Conversations<div class="num">${d.conversations}</div></div>
    </div>
  `;
}

async function products() {
  const p = await api('/api/products');

  app.innerHTML = `
    <h1>
      Produits
      <button class="btn" onclick="addProduct()">+ Ajouter</button>
    </h1>

    <div class="products-list">
      ${p.map(x => `
        <div class="card">
          <h3>${x.name}</h3>
          <p>Catégorie : <b>${x.category}</b></p>
          <p>Prix : <b>${money(x.price)}</b></p>
          <p>Stock : <b>${x.stock}</b></p>
          <p>Statut : <b>${x.status || 'Disponible'}</b></p>

          <button class="btn" onclick="editProduct(${x.id})">
            🖊️ Modifier
          </button>

          <button class="btn" onclick="deleteProduct(${x.id})">
            🗑️ Supprimer
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

async function addProduct() {
  const name = prompt('Nom du produit');
  if (!name) return;

  const category = prompt('Catégorie', 'Divers');
  if (category === null) return;

  const price = Number(prompt('Prix F CFA', '0'));
  const stock = Number(prompt('Stock', '0'));

  await api('/api/products', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name,
      category,
      price,
      stock,
      status: stock > 0 ? 'Disponible' : 'Rupture'
    })
  });

  products();
}

async function editProduct(id) {
  const list = await api('/api/products');
  const p = list.find(x => Number(x.id) === Number(id));

  if (!p) {
    alert('Produit introuvable');
    return;
  }

  const name = prompt('Nom du produit', p.name);
  if (name === null) return;

  const category = prompt('Catégorie', p.category);
  if (category === null) return;

  const price = Number(prompt('Prix F CFA', p.price));
  const stock = Number(prompt('Stock', p.stock));

  await api('/api/products/' + id, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name,
      category,
      price,
      stock,
      status: stock > 0 ? 'Disponible' : 'Rupture'
    })
  });

  products();
}

async function deleteProduct(id) {
  if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;

  await api('/api/products/' + id, {
    method: 'DELETE'
  });

  products();
}

async function orders() {
  const o = await api('/api/orders');

  app.innerHTML = `
    <h1>Commandes</h1>
    <table class="table">
      <tr>
        <th>N°</th>
        <th>Client</th>
        <th>Téléphone</th>
        <th>Total</th>
        <th>Statut</th>
      </tr>

      ${o.map(x => `
        <tr>
          <td>${x.id}</td>
          <td>${x.client || ''}</td>
          <td>${x.phone || ''}</td>
          <td>${money(x.total)}</td>
          <td>${x.status || ''}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

async function conversations() {
  const c = await api('/api/conversations');

  app.innerHTML = `
    <h1>Conversations</h1>

    <div class="warning">
      Les messages WhatsApp apparaîtront ici après activation du webhook.
    </div>

    ${c.map(x => `
      <div class="card">
        <b>${x.phone || 'Client'}</b>
        <p>${x.message || ''}</p>
      </div>
    `).join('')}
  `;
}

function setup() {
  app.innerHTML = `
    <h1>WhatsApp Business</h1>

    <div class="warning">
      <b>Prêt pour la connexion.</b>
    </div>

    <div class="card">
      <h3>Numéro prévu</h3>
      <p><b>+226 65 23 73 82</b></p>
    </div>
  `;
}

function go(page) {
  if (page === 'dashboard') dashboard();
  if (page === 'products') products();
  if (page === 'orders') orders();
  if (page === 'conversations') conversations();
  if (page === 'setup') setup();
}

go('dashboard');
