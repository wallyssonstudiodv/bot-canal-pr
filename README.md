# 🤖 bot-canal-pr

Bot automático para WhatsApp que **monitora canais do YouTube** e **envia automaticamente os novos vídeos** para um grupo específico do WhatsApp.

Desenvolvido com [Baileys](https://github.com/WhiskeySockets/Baileys) e Node.js.

---

## 📌 Funcionalidades

- ✅ Monitora automaticamente um ou mais canais do YouTube.
- ✅ Envia mensagem com o **link do novo vídeo** diretamente em um grupo do WhatsApp.
- ✅ Funciona em segundo plano com PM2.
- ✅ Suporte a múltiplos canais monitorados.

---

## ⚙️ Requisitos

- Node.js v18 ou superior
- Git
- Termux (para Android), VPS ou qualquer ambiente com Node.js
- Conta de WhatsApp válida (para escanear o QR Code)

---

## 🚀 Instalação rápida (funciona em segundo plano)

Execute o seguinte comando no seu terminal (Linux, VPS ou Termux):

```bash
rm -rf bot-canal-pr \
&& git clone https://github.com/wallyssonstudiodv/bot-canal-pr.git \
&& cd bot-canal-pr \
&& npm install \
&& npm install -g pm2 \
&& pm2 start index.js --name bot-canal-pr \
&& pm2 save \
&& echo "✅ Bot rodando com PM2 em segundo plano (sem auto-start no Termux)"