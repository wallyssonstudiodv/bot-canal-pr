const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const axios = require('axios')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const mime = require('mime-types')

const WEBHOOK_URL = 'https://meudrivenet.x10.bz/canal/webhook.php'
const GRUPO_AUTORIZADO = '120363227240067234@g.us' // 🔒 ID do grupo autorizado

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({ auth: state })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log("📲 Escaneie o QR abaixo com o WhatsApp:")
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.loggedOut) {
                console.log("❌ Sessão expirada. Escaneie novamente.")
            } else {
                console.log("🔁 Reconectando...")
                startBot()
            }
        }

        if (connection === 'open') {
            console.log("✅ Bot conectado com sucesso!")
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const sender = msg.key.remoteJid
        const isGroup = sender.endsWith('@g.us')

        // 🔐 Responde apenas ao grupo autorizado
        if (isGroup && sender !== GRUPO_AUTORIZADO) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        if (!text) return

        let nomeContato = sender.split('@')[0]
        try {
            const contato = await sock.onWhatsApp(sender)
            if (contato && contato[0] && contato[0].notify) {
                nomeContato = contato[0].notify
            }
        } catch {}

        try {
            const res = await axios.post(WEBHOOK_URL, {
                number: nomeContato,
                message: text
            })

            if (res.data.reply) {
                const resposta = res.data.reply.replace(/{nome}/gi, nomeContato)
                await sock.sendMessage(sender, { text: resposta })
            }

            if (res.data.file_base64 && res.data.filename) {
                const buffer = Buffer.from(res.data.file_base64, 'base64')
                const mimetype = mime.lookup(res.data.filename) || 'application/octet-stream'

                if (mimetype.startsWith('image/')) {
                    await sock.sendMessage(sender, {
                        image: buffer,
                        mimetype,
                        caption: res.data.caption || ''
                    })
                } else if (mimetype.startsWith('video/')) {
                    await sock.sendMessage(sender, {
                        video: buffer,
                        mimetype,
                        caption: res.data.caption || ''
                    })
                } else {
                    await sock.sendMessage(sender, {
                        document: buffer,
                        mimetype,
                        fileName: res.data.filename
                    })
                }
            }

        } catch (err) {
            console.error('❌ Erro no webhook:', err.message)
        }
    })

    // ⏰ Envio automático de mensagens às 08:00, 12:00 e 18:00
    setInterval(async () => {
        const agora = new Date()
        const horas = agora.getHours()
        const minutos = agora.getMinutes()

        const horariosPermitidos = [
            { hora: 8, mensagem: "🌞 Bom dia, grupo! Vamos começar o dia com energia!" },
            { hora: 12, mensagem: "🍽️ Boa tarde! Hora do almoço, aproveitem!" },
            { hora: 18, mensagem: "🌇 Boa noite, pessoal! Como foi o dia de vocês?" }
        ]

        for (let h of horariosPermitidos) {
            if (horas === h.hora && minutos === 0) {
                try {
                    await sock.sendMessage(GRUPO_AUTORIZADO, { text: h.mensagem })
                    console.log(`✅ Mensagem enviada automaticamente às ${h.hora}:00`)
                } catch (err) {
                    console.error(`❌ Erro ao enviar mensagem automática das ${h.hora}:`, err.message)
                }
            }
        }
    }, 60000) // Verifica a cada minuto
}

startBot()