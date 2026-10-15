import http from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT || 4173);
http.createServer(async (req,res) => {
  if (req.url !== '/' && req.url !== '/index.html') {res.writeHead(404);res.end();return;}
  try { const html=await readFile(new URL('../outputs/米琳博物馆.html',import.meta.url));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html); }
  catch {res.writeHead(503);res.end('Build the app first.');}
}).listen(port,'127.0.0.1',()=>console.log(`Museum preview: http://127.0.0.1:${port}`));
