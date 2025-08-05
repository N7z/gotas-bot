# 💧 GotasBot
> Um bot talvez contra os TOS do Wplace, mas é indetectável e nem dá tanta vantagem assim.

Recentemente o backend do Wplace ativou Cloudflare em modo de ataque, então não dá mais pra usar só fetch. Com Puppeteer + Stealth, a automação funciona certinho pro que eu queria.

Desenvolvido por Paulinho™ ✔

# Planejo
Planejo adicionar em breve pintar automático / defender algum território assim que modificado com multiplas contas ao mesmo tempo

# ⚙️ Como usar
Crie um arquivo `cookies.json` e adicione os cookies `"s"` da conta Wplace no seguinte formato:
```json
[
  "xfSAFZ5xsX38gdRS_8xnlg%3D%3D" // esse cookie não existe tá
]
```
Crie um arquivo `.env` com a URL do seu webhook do Discord:

```env
DISCORD_WEBHOOK_URL="https://linkdowebhook"
```

# Rode o bot:
```bash
node index.js
```

E é isso, os guri ta on line