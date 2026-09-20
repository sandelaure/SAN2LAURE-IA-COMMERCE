import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'publique')));

let products = [
  {
    id: 1,
    name: 'Portefeuille RFID',
    category: 'Portefeuilles',
    price: 5000,
    stock: 20,
    status: 'Disponible'
  },
  {
    id: 2,
    name: 'Sac à main',
    category: 'Sacs',
    price: 6000,
    stock: 15,
    status: 'Disponible'
  },
  {
    id: 3,
    name: 'Montre classique',
    category: 'Montres',
    price: 6000,
    stock: 10,
    status: 'Disponible'
  }
];

let orders = [];
let conversations = [];

/* TABLEAU DE BORD */
app.get('/api/dashboard', (req, res) => {
  res.json({
    products: products.length,
    stock: products.reduce((total, p) => total + Number(p.stock || 0), 0),
    orders: orders.length,
    conversations: conversations.length
  });
});

/* LISTE DES PRODUITS */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/* AJOUTER UN PRODUIT */
app.post('/api/products', (req, res) => {
  const { name, category, price, stock, status } = req.body;

  const product = {
    id: Date.now(),
    name: name || 'Nouveau produit',
    category: category || 'Divers',
    price: Number(price) || 0,
    stock: Number(stock) || 0,
    status: status || (Number(stock) > 0 ? 'Disponible' : 'Rupture')
  };

  products.push(product);
  res.json(product);
});/* MODIFIER UN PRODUIT */
app.put('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => String(p.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }

  const { name, category, price, stock, status } = req.body;

  products[index] = {
    ...products[index],
    name: name ?? products[index].name,
    category: category ?? products[index].category,
    price: Number(price ?? products[index].price),
    stock: Number(stock ?? products[index].stock),
    status: status ?? (Number(stock ?? products[index].stock) > 0 ? 'Disponible' : 'Rupture')
  };

  res.json(products[index]);
});


/* SUPPRIMER UN PRODUIT */
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => String(p.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Produit introuvable' });
  }

  const deleted = products.splice(index, 1)[0];

  res.json({
    success: true,
    message: 'Produit supprimé',
    product: deleted
  });
});

/* MODIFIER UN PRODUIT */
app.put('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({
      error: 'Produit introuvable'
    });
  }

  const { name, category, price, stock, status } = req.body;

  product.name = name ?? product.name;
  product.category = category ?? product.category;
  product.price = Number(price ?? product.price);
  product.stock = Number(stock ?? product.stock);
  product.status = status ?? (product.stock > 0 ? 'Disponible' : 'Rupture');

  res.json(product);
});

/* SUPPRIMER UN PRODUIT */
app.delete('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Produit introuvable'
    });
  }

  const deleted = products.splice(index, 1)[0];

  res.json({
    success: true,
    product: deleted
  });
});

/* COMMANDES */
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const order = {
    id: Date.now(),
    client: req.body.client || '',
    phone: req.body.phone || '',
    total: Number(req.body.total) || 0,
    status: 'À confirmer'
  };

  orders.push(order);
  res.json(order);
});

/* CONVERSATIONS */
app.get('/api/conversations', (req, res) => {
  res.json(conversations);
});

/* WEBHOOK WHATSAPP - VÉRIFICATION */
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode === 'subscribe' &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

/* WEBHOOK WHATSAPP - MESSAGES */
app.post('/webhook/whatsapp', (req, res) => {
  console.log(
    'Message WhatsApp reçu :',
    JSON.stringify(req.body, null, 2)
  );

  res.sendStatus(200);
});

/* PAGE PRINCIPALE */
app.use((req, res) => {
  res.sendFile(
    path.join(__dirname, 'publique', 'index.html')
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SAN2LAURE IA COMMERCE démarré sur le port ${PORT}`);
});
