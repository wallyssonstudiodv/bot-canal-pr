# 🤖 bot-canal-pr

Bot automático para WhatsApp que **monitora canais do YouTube** e **envia automaticamente os novos vídeos** para um grupo específico do WhatsApp.

Desenvolvido com [Baileys](https://github.com/WhiskeySockets/Baileys) e Node.js.

---

## 📌 Funcionalidades

- ✅ Monitora automaticamente um ou mais canais do YouTube.
- ✅ Envia mensagem com o **link do novo vídeo** diretamente no grupo do WhatsApp.
- ✅ Funciona 24h em segundo plano.
- ✅ Suporte a múltiplos canais.
- ✅ Integração com PM2 para manter o bot sempre ativo (mesmo após reiniciar o servidor).

---

## ⚙️ Requisitos

- Node.js v18 ou superior
- Git
- Termux (para Android), VPS, ou qualquer ambiente com Node.js
- Conta de WhatsApp válida (com QR Code liberado no terminal)

---

## 🚀 Instalação automática (recomendado)

Copie e cole esse comando no seu terminal (Linux, Termux, VPS, etc):

```bash
rm -rf bot-canal-pr \
&& git clone https://github.com/wallyssonstudiodv/bot-canal-pr.git \
&& cd bot-canal-pr \
&& npm install \
&& npm install -g pm2 \
&& pm2 start index.js --name bot-canal-pr \
&& pm2 save \
&& pm2 startup | tail -n 1 | bash \
&& echo "✅ Bot iniciado com PM2 e configurado para reiniciar automaticamente!"