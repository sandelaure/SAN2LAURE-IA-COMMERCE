const app = document.querySelector('#app');

const money = n =>
  new Intl.NumberFormat('fr-FR').format(Number(n) || 0) + ' F CFA';

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Erreur serveur');
  return response.json();
}

async function dashboard() {
  try {
    const d = await api('/api/dashboard');

    app.innerHTML = `
      <h1>Tableau de bord</h1>
      <div class="grid">
        <div class="card">Produits<div class="num">${d.products}</div></div>
        <div class="card">Stock<div class="num">${d.stock}</div></div>
        <div class="card">Commandes<div class="num">${d.orders}</div></div>
        <div class="card">Conversations<div class="num">${d.conversations}</div></div>
      </div>

      <div class="card">
        <h3>Agent commercial IA</h3>
        <p>SAN2LAURE IA COMMERCE — IGOSA SERVICES</p>
      </div>
    `;
  } catch (e) {
    app.innerHTML = '<div class="warning">Impossible de charger le tableau de bord.</div>';
  }
}

async function products() {
  try {
    const p = await api('/api/products');

    app.innerHTML = `
      <h1>
        Produits
        <button class="btn" onclick="addProduct()">+ Ajouter</button>
      </h1>

      <div class="products-list">
        ${p.map(x => `
          <div class="card product-card">
            <h3>${x.name}</h3>
            <p><b>Catégorie :</b> ${x.category}</p>
            <p><b>Prix :</b> ${money(x.price)}</p>
            <p><b>Stock :</b> ${x.stock}</p>
            <p><b>Statut :</b> ${x.status || (x.stock > 0 ? 'Disponible' : 'Rupture')}</p>

            <div class="product-actions">
              <button class="btn" onclick="editProduct(${x.id})">
                🖊️ Modifier
              </button>

              <button class="btn" onclick="deleteProduct(${x.id})">
                🗑️ Supprimer
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    app.innerHTML = '<div class="warning">Impossible de charger les produits.</div>';
  }
}

async function addProduct() {
  const name = prompt('Nom du produit');
  if (!name) return;

  const category = prompt('Catégorie', 'Divers');
  if (category === null) return;

  const price = Number(prompt('Prix F CFA', '0') || 0);
  const stock = Number(prompt('Stock', '0') || 0);

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
  try {
    const list = await api('/api/products');
    const x = list.find(p => Number(p.id) === Number(id));

    if (!x) {
      alert('Produit introuvable');
      return;
    }

    const name = prompt('Nom du produit', x.name);
    if (name === null) return;

    const category = prompt('Catégorie', x.category);
    if (category === null) return;

    const price = Number(prompt('Prix F CFA', x.price));
    const stock = Number(prompt('Stock', x.stock));

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

  } catch (e) {
    alert('Erreur lors de la modification');
  }
}

async function deleteProduct(id) {
  if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;

  try {
    await api('/api/products/' + id, {
      method: 'DELETE'
    });

    products();

  } catch (e) {
    alert('Erreur lors de la suppression');
  }
}

async function orders() {
  const o = await api('/api/orders');

  app.innerHTML = `
    <h1>
      Commandes
      <button class="btn" onclick="addOrder()">+ Nouvelle</button>
    </h1>

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

async function addOrder() {
  const client = prompt('Nom du client');
  if (!client) return;

  const phone = prompt('Téléphone');
  const total = Number(prompt('Total F CFA') || 0);

  await api('/api/orders', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({client, phone, total})
  });

  orders();
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
      La connexion WhatsApp sera activée avec Meta WhatsApp Business Platform.
    </div>

    <div class="card">
      <h3>Numéro prévu</h3>
      <p><b>+226 65 23 73 82</b></p>
      <p>Ne partage jamais ton Access Token ou App Secret.</p>
    </div>
  `;
}

function go(page) {
  const pages = {
    dashboard,
    products,
    orders,
    conversations,
    setup
  };

  if (pages[page]) pages[page]();
}

go('dashboard');
