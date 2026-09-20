const app=document.querySelector('#app');

const money=n=>new Intl.NumberFormat('fr-FR').format(n||0)+' F CFA';

async function api(u,o){
  return (await fetch(u,o)).json();
}

async function dashboard(){
  let d=await api('/api/dashboard');

  app.innerHTML=`
    <h1>Tableau de bord</h1>
    <div class="grid">
      <div class="card">Produits<div class="num">${d.products}</div></div>
      <div class="card">Stock<div class="num">${d.stock}</div></div>
      <div class="card">Commandes<div class="num">${d.orders}</div></div>
      <div class="card">Conversations<div class="num">${d.conversations}</div></div>
    </div>

    <div class="card">
      <h3>Agent commercial IA</h3>
      <p>Base de l'application installée.<br>
      La connexion WhatsApp et les règles de vente seront activées ensuite.</p>
    </div>`;
}

async function products(){
  let p=await api('/api/products');

  app.innerHTML=`
    <h1>
      Produits
      <button class="btn" onclick="addProduct()">+ Ajouter</button>
    </h1>

    <div class="product-list">

      ${p.map(x=>`
        <div class="card product-card">

          <h2>${x.name}</h2>

          <p><b>Catégorie :</b> ${x.category}</p>

          <p><b>Prix :</b> ${money(x.price)}</p>

          <p><b>Stock :</b> ${x.stock}</p>

          <div class="product-actions">
            <button class="btn" onclick="editProduct(${x.id})">
              ✏️ Modifier
            </button>

            <button class="btn" onclick="deleteProduct(${x.id})">
              🗑️ Supprimer
            </button>
          </div>

        </div>
      `).join('')}

    </div>`;
}

async function addProduct(){
  let name=prompt('Nom du produit');
  if(!name)return;

  let category=prompt('Catégorie','Divers')||'Divers';
  let price=Number(prompt('Prix F CFA')||0);
  let stock=Number(prompt('Stock')||0);

  await api('/api/products',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name,
      category,
      price,
      stock,
      status:stock?'Disponible':'Rupture'
    })
  });

  products();
}

async function editProduct(id){
  let p=await api('/api/products');
  let x=p.find(a=>a.id===id);

  if(!x){
    alert('Produit introuvable');
    return;
  }

  let name=prompt('Nom du produit',x.name);
  if(name===null)return;

  let category=prompt('Catégorie',x.category);
  if(category===null)return;

  let price=Number(prompt('Prix F CFA',x.price));
  let stock=Number(prompt('Stock',x.stock));

  await api('/api/products/'+id,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name,
      category,
      price,
      stock,
      status:stock?'Disponible':'Rupture'
    })
  });

  products();
}

async function deleteProduct(id){
  if(!confirm('Voulez-vous vraiment supprimer ce produit ?'))return;

  await api('/api/products/'+id,{
    method:'DELETE'
  });

  products();
}

async function orders(){
  let o=await api('/api/orders');

  app.innerHTML=`
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

      ${o.map(x=>`
        <tr>
          <td>${x.id}</td>
          <td>${x.client||''}</td>
          <td>${x.phone||''}</td>
          <td>${money(x.total)}</td>
          <td>${x.status}</td>
        </tr>
      `).join('')}
    </table>`;
}

async function addOrder(){
  let client=prompt('Nom du client');
  if(!client)return;

  let phone=prompt('Téléphone');
  let total=Number(prompt('Total F CFA')||0);

  await api('/api/orders',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({client,phone,total})
  });

  orders();
}

async function conversations(){
  let c=await api('/api/conversations');

  app.innerHTML=`
    <h1>Conversations</h1>

    <div class="warning">
      Les messages WhatsApp apparaîtront ici après activation du webhook.
    </div>

    ${c.map(x=>`
      <div class="card">
        <b>${x.phone||'Client'}</b>
        <p>${x.message||''}</p>
      </div>
    `).join('')}`;
}

function setup(){
  app.innerHTML=`
    <h1>WhatsApp Business</h1>

    <div class="warning">
      <b>Prêt pour la connexion.</b>
      Il faudra renseigner côté serveur le Phone Number ID,
      l'Access Token, le Verify Token et une URL HTTPS de webhook.
    </div>

    <div class="card">
      <h3>Numéro prévu</h3>
      <p><b>+226 65 23 73 82</b></p>
      <p>Ne partage jamais ton Access Token ou App Secret.</p>
    </div>`;
}

function go(p){
  ({dashboard,products,orders,conversations,setup}[p])();
}

go('dashboard');
