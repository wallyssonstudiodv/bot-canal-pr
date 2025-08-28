const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações
const YOUTUBE_API_KEY = "AIzaSyDubEpb0TkgZjiyjA9-1QM_56Kwnn_SMPs";
const CANAL_ID = "UCh-ceOeY4WVgS8R0onTaXmw";

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Variáveis globais
let qrCodeData = '';
let isReady = false;
let groups = [];
let schedules = [];

// Função para buscar último vídeo do YouTube
async function getLatestVideo() {
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CANAL_ID}&order=date&part=snippet&type=video&maxResults=1`;
        const response = await axios.get(url);
        
        if (response.data.items && response.data.items.length > 0) {
            const video = response.data.items[0];
            const videoId = video.id.videoId;
            const titulo = video.snippet.title;
            const thumbnail = video.snippet.thumbnails.high.url;
            const link = `https://www.youtube.com/watch?v=${videoId}`;
            
            return {
                titulo,
                link,
                thumbnail,
                videoId
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar vídeo:', error);
        return null;
    }
}

// Função para enviar vídeo para grupos
async function sendVideoToGroups(groupIds) {
    try {
        const videoData = await getLatestVideo();
        
        if (!videoData) {
            console.log('Nenhum vídeo encontrado');
            return;
        }

        const message = `🚨 Saiu vídeo novo no canal!\n\n🎬 ${videoData.titulo}\n👉 Assista agora: ${videoData.link}\n\n📢 Compartilhe com todos! 🙏`;
        
        // Baixar thumbnail
        const thumbnailResponse = await axios.get(videoData.thumbnail, { responseType: 'arraybuffer' });
        const thumbnailBuffer = Buffer.from(thumbnailResponse.data);
        const media = new MessageMedia('image/jpeg', thumbnailBuffer.toString('base64'), 'thumbnail.jpg');
        
        // Enviar para cada grupo
        for (const groupId of groupIds) {
            try {
                await client.sendMessage(groupId, message);
                await client.sendMessage(groupId, media, { caption: `🆕 ${videoData.titulo}\n🎥 Assista: ${videoData.link}` });
                console.log(`Vídeo enviado para grupo: ${groupId}`);
            } catch (error) {
                console.error(`Erro ao enviar para grupo ${groupId}:`, error);
            }
        }
    } catch (error) {
        console.error('Erro ao enviar vídeo:', error);
    }
}

// Carregar dados salvos
function loadData() {
    try {
        if (fs.existsSync('schedules.json')) {
            schedules = JSON.parse(fs.readFileSync('schedules.json', 'utf8'));
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        schedules = [];
    }
}

// Salvar dados
function saveData() {
    try {
        fs.writeFileSync('schedules.json', JSON.stringify(schedules, null, 2));
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

// Configurar cron jobs
function setupCronJobs() {
    // Limpar jobs existentes
    cron.getTasks().forEach(task => task.destroy());
    
    schedules.forEach(schedule => {
        if (schedule.active) {
            const cronExpression = `${schedule.minute} ${schedule.hour} * * ${schedule.days.join(',')}`;
            
            cron.schedule(cronExpression, () => {
                console.log(`Executando agendamento: ${schedule.name}`);
                sendVideoToGroups(schedule.groups);
            }, {
                timezone: "America/Sao_Paulo"
            });
            
            console.log(`Cron job criado: ${schedule.name} - ${cronExpression}`);
        }
    });
}

// Eventos do WhatsApp
client.on('qr', async (qr) => {
    console.log('QR Code gerado');
    qrCodeData = await qrcode.toDataURL(qr);
});

client.on('ready', async () => {
    console.log('WhatsApp Web conectado!');
    isReady = true;
    
    // Buscar grupos
    const chats = await client.getChats();
    groups = chats
        .filter(chat => chat.isGroup)
        .map(chat => ({
            id: chat.id._serialized,
            name: chat.name
        }));
    
    console.log(`${groups.length} grupos encontrados`);
    
    // Configurar cron jobs
    setupCronJobs();
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp desconectado:', reason);
    isReady = false;
    qrCodeData = '';
    groups = [];
});

// Rotas da API
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', (req, res) => {
    res.json({
        isReady,
        qrCode: qrCodeData,
        groupCount: groups.length,
        scheduleCount: schedules.length
    });
});

app.get('/api/groups', (req, res) => {
    res.json(groups);
});

app.get('/api/schedules', (req, res) => {
    res.json(schedules);
});

app.post('/api/schedules', (req, res) => {
    const { name, hour, minute, days, groups: selectedGroups, active } = req.body;
    
    if (!name || hour === undefined || minute === undefined || !days || !selectedGroups) {
        return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    const schedule = {
        id: Date.now().toString(),
        name,
        hour: parseInt(hour),
        minute: parseInt(minute),
        days: days.map(d => parseInt(d)),
        groups: selectedGroups,
        active: active !== false,
        created: new Date().toISOString()
    };
    
    schedules.push(schedule);
    saveData();
    setupCronJobs();
    
    res.json({ success: true, schedule });
});

app.put('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const { name, hour, minute, days, groups: selectedGroups, active } = req.body;
    
    const scheduleIndex = schedules.findIndex(s => s.id === id);
    
    if (scheduleIndex === -1) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    schedules[scheduleIndex] = {
        ...schedules[scheduleIndex],
        name: name || schedules[scheduleIndex].name,
        hour: hour !== undefined ? parseInt(hour) : schedules[scheduleIndex].hour,
        minute: minute !== undefined ? parseInt(minute) : schedules[scheduleIndex].minute,
        days: days || schedules[scheduleIndex].days,
        groups: selectedGroups || schedules[scheduleIndex].groups,
        active: active !== undefined ? active : schedules[scheduleIndex].active,
        updated: new Date().toISOString()
    };
    
    saveData();
    setupCronJobs();
    
    res.json({ success: true, schedule: schedules[scheduleIndex] });
});

app.delete('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const scheduleIndex = schedules.findIndex(s => s.id === id);
    
    if (scheduleIndex === -1) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    schedules.splice(scheduleIndex, 1);
    saveData();
    setupCronJobs();
    
    res.json({ success: true });
});

app.post('/api/test-send', async (req, res) => {
    const { groups: selectedGroups } = req.body;
    
    if (!selectedGroups || selectedGroups.length === 0) {
        return res.status(400).json({ error: 'Nenhum grupo selecionado' });
    }
    
    if (!isReady) {
        return res.status(400).json({ error: 'WhatsApp não conectado' });
    }
    
    try {
        await sendVideoToGroups(selectedGroups);
        res.json({ success: true, message: 'Vídeo enviado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar vídeo: ' + error.message });
    }
});

// Inicializar
loadData();

client.initialize();

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});