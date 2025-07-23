const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const axios = require('axios');
const cron = require('node-cron');

const WEBHOOK = 'https://meudrivenet.x10.bz/canal/webhook.php'; // Link do webhook
const GRUPO_AUTORIZADO = '120363227240067234@g.us'; // Grupo autorizado

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state });

  sock.ev.on('creds.update', saveCreds);

  async function enviarVideo() {
    try {
      const res = await axios.post(WEBHOOK, {});
      const dados = res.data;

      if (dados?.file_base64 && dados?.filename) {
        await sock.sendMessage(GRUPO_AUTORIZADO, {
          image: Buffer.from(dados.file_base64, 'base64'),
          caption: dados.caption || ''
        });
        console.log('✅ Vídeo enviado automaticamente');
      } else if (dados?.reply) {
        await sock.sendMessage(GRUPO_AUTORIZADO, { text: dados.reply });
        console.log('✅ Mensagem de texto enviada automaticamente');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar vídeo no webhook:', err.message);
    }
  }

  // Agendamento: 08:00, 12:15 e 18:00
  cron.schedule('0 8 * * *', enviarVideo);
  cron.schedule('40 12 * * *', enviarVideo);
  cron.schedule('0 18 * * *', enviarVideo);
}

iniciarBot();