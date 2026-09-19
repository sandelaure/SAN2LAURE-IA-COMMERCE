import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
let products=[
{id:1,name:'Portefeuille RFID',category:'Portefeuilles',price:5000,stock:20,status:'Disponible'},
{id:2,name:'Sac à main',category:'Sacs',price:6000,stock:15,status:'Disponible'},
{id:3,name:'Montre classique',category:'Montres',price:6000,stock:10,status:'Disponible'}];
let orders=[],conversations=[];
app.get('/api/dashboard',(q,r)=>r.json({products:products.length,stock:products.reduce((a,p)=>a+p.stock,0),orders:orders.length,conversations:conversations.length}));
app.get('/api/products',(q,r)=>r.json(products));
app.post('/api/products',(q,r)=>{let p={id:Date.now(),...q.body};products.push(p);r.status(201).json(p)});
app.get('/api/orders',(q,r)=>r.json(orders));
app.post('/api/orders',(q,r)=>{let o={id:'CMD-'+String(orders.length+1).padStart(4,'0'),status:'Nouvelle',createdAt:new Date().toISOString(),...q.body};orders.push(o);r.status(201).json(o)});
app.get('/api/conversations',(q,r)=>r.json(conversations));
app.get('/webhook/whatsapp',(q,r)=>q.query['hub.mode']==='subscribe'&&q.query['hub.verify_token']===process.env.WHATSAPP_VERIFY_TOKEN?r.status(200).send(q.query['hub.challenge']):r.sendStatus(403));
app.post('/webhook/whatsapp',(q,r)=>{console.log('WhatsApp webhook',JSON.stringify(q.body));r.sendStatus(200)});
app.use((q,r)=>r.sendFile(path.join(__dirname,'public','index.html')));
app.listen(process.env.PORT||3000,()=>console.log('SAN2LAURE IA COMMERCE démarré'));
