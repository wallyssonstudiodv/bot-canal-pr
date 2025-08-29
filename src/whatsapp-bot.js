const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const P = require('pino');

class WhatsAppBot {
    constructor(userId, dataManager, io) {
        this.userId = userId;
        this.dataManager = dataManager;
        this.io = io;
        this.sock = null;
        this.connected = false;
        this.authDir = path.join(__dirname, '..', 'sessions', userId);
        
        // Configuração do YouTube
        this.youtubeApiKey = "AIzaSyDubEpb0TkgZjiyjA9-1QM_56Kwnn_SMPs";
        this.canalId = "UCh-ceOeY4WVgS8R0onTaXmw";
        
        // Logger
        this.logger = P({ 
            level: 'warn',
            prettyPrint: false 
        });
        
        this.ensureAuthDir();
    }

    ensureAuthDir() {
        if (!fs.existsSync(this.authDir)) {
            fs.mkdirSync(this.authDir, { recursive: true });
        }
    }

    async connect() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
            const { version, isLatest } = await fetchLatestBaileysVersion();
            
            console.log(`🔄 Conectando usuário ${this.userId} com Baileys v${version.join('.')}, isLatest: ${isLatest}`);

            this.sock = makeWASocket({
                version,
                logger: this.logger,
                printQRInTerminal: true,
                auth: state,
                generateHighQualityLinkPreview: true,
                defaultQueryTimeoutMs: 60 * 1000
            });

            // Eventos do socket
            this.sock.ev.on('creds.update', saveCreds);
            
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    try {
                        const qrString = await QRCode.toDataURL(qr);
                        this.io.emit('qr-code', { userId: this.userId, qr: qrString });
                        console.log(`📱 QR Code gerado para usuário ${this.userId}`);
                    } catch (error) {
                        console.error('Erro ao gerar QR Code:', error);
                    }
                }
                
                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    console.log(`❌ Conexão fechada para usuário ${this.userId}:`, lastDisconnect?.error, 'Reconectando...', shouldReconnect);
                    
                    this.connected = false;
                    this.io.emit('connection-status', { userId: this.userId, connected: false });
                    
                    if (shouldReconnect) {
                        setTimeout(() => {
                            this.connect();
                        }, 5000);
                    }
                } else if (connection === 'open') {
                    console.log(`✅ WhatsApp conectado para usuário ${this.userId}`);
                    this.connected = true;
                    
                    // Buscar grupos
                    await this.loadGroups();
                    
                    this.io.emit('connection-status', { 
                        userId: this.userId, 
                        connected: true 
                    });
                }
            });

            this.sock.ev.on('messages.upsert', (m) => {
                // Processar mensagens recebidas se necessário
            });

        } catch (error) {
            console.error(`Erro ao conectar usuário ${this.userId}:`, error);
            this.io.emit('connection-error', { userId: this.userId, error: error.message });
        }
    }

    async loadGroups() {
        try {
            const groups = await this.sock.groupFetchAllParticipating();
            const groupList = Object.values(groups).map(group => ({
                id: group.id,
                name: group.subject,
                participants: group.participants.length
            }));

            // Salvar grupos no banco de dados
            this.dataManager.updateUserData(this.userId, { groups: groupList });
            
            this.io.emit('groups-loaded', { 
                userId: this.userId, 
                groups: groupList 
            });
            
            console.log(`📋 ${groupList.length} grupos carregados para usuário ${this.userId}`);
            
        } catch (error) {
            console.error(`Erro ao carregar grupos do usuário ${this.userId}:`, error);
        }
    }

    async getLatestVideo() {
        try {
            const url = `https://www.googleapis.com/youtube/v3/search?key=${this.youtubeApiKey}&channelId=${this.canalId}&order=date&part=snippet&type=video&maxResults=1`;
            
            const response = await axios.get(url);
            
            if (response.data.items && response.data.items.length > 0) {
                const video = response.data.items[0];
                return {
                    videoId: video.id.videoId,
                    title: video.snippet.title,
                    thumbnail: video.snippet.thumbnails.high.url,
                    link: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                    publishedAt: video.snippet.publishedAt
                };
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao buscar último vídeo:', error);
            return null;
        }
    }

    async downloadThumbnail(url) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        } catch (error) {
            console.error('Erro ao baixar thumbnail:', error);
            return null;
        }
    }

    async sendScheduledContent(groupIds) {
        if (!this.connected || !this.sock) {
            console.log(`❌ Bot do usuário ${this.userId} não está conectado`);
            return;
        }

        try {
            const video = await this.getLatestVideo();
            
            if (!video) {
                console.log('Nenhum vídeo encontrado');
                return;
            }

            const message = `🚨 *Saiu vídeo novo no canal!*\n\n🎬 *${video.title}*\n\n👉 Assista agora: ${video.link}\n\n📢 *Compartilhe com todos!* 🙏`;

            // Baixar thumbnail
            const thumbnailBuffer = await this.downloadThumbnail(video.thumbnail);

            for (const groupId of groupIds) {
                try {
                    // Enviar mensagem de texto
                    await this.sock.sendMessage(groupId, { text: message });
                    
                    // Enviar imagem se disponível
                    if (thumbnailBuffer) {
                        await this.sock.sendMessage(groupId, {
                            image: thumbnailBuffer,
                            caption: `🆕 *${video.title}*\n\n🎥 Assista: ${video.link}`
                        });
                    }

                    console.log(`✅ Conteúdo enviado para grupo ${groupId} (usuário ${this.userId})`);
                    
                    // Aguardar um pouco entre envios para evitar spam
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.error(`Erro ao enviar para grupo ${groupId}:`, error);
                }
            }

            // Atualizar estatísticas
            const userData = this.dataManager.getUserData(this.userId);
            const stats = userData.stats || { messagesSent: 0, videosShared: 0 };
            stats.messagesSent += groupIds.length;
            stats.videosShared += 1;
            
            this.dataManager.updateUserData(this.userId, { stats });

        } catch (error) {
            console.error(`Erro ao enviar conteúdo agendado (usuário ${this.userId}):`, error);
        }
    }

    disconnect() {
        try {
            if (this.sock) {
                this.sock.end();
                this.sock = null;
            }
            
            this.connected = false;
            
            // Remover pasta de sessão para forçar novo QR Code
            if (fs.existsSync(this.authDir)) {
                fs.rmSync(this.authDir, { recursive: true });
            }
            
            console.log(`🔴 WhatsApp desconectado para usuário ${this.userId}`);
            
        } catch (error) {
            console.error(`Erro ao desconectar usuário ${this.userId}:`, error);
        }
    }

    isConnected() {
        return this.connected;
    }
}

module.exports = WhatsAppBot;