const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'whatsapp_bot_secret_key_2025';

// Configurações
const YOUTUBE_API_KEY = "AIzaSyDubEpb0TkgZjiyjA9-1QM_56Kwnn_SMPs";
const CANAL_ID = "UCh-ceOeY4WVgS8R0onTaXmw";

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Estrutura de dados para múltiplos usuários
let users = [];
let userSessions = new Map(); // userId -> { client, qrCode, isReady, groups, schedules, cronJobs }

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.session.token;

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// Funções auxiliares
function loadUsers() {
    try {
        if (fs.existsSync('users.json')) {
            users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        users = [];
    }
}

function saveUsers() {
    try {
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Erro ao salvar usuários:', error);
    }
}

function loadUserData(userId) {
    try {
        const userDataFile = `user_data_${userId}.json`;
        if (fs.existsSync(userDataFile)) {
            return JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
    return { schedules: [], groups: [] };
}

function saveUserData(userId, data) {
    try {
        const userDataFile = `user_data_${userId}.json`;
        fs.writeFileSync(userDataFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erro ao salvar dados do usuário:', error);
    }
}

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
            
            return { titulo, link, thumbnail, videoId };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar vídeo:', error);
        return null;
    }
}

// Função para enviar vídeo para grupos
async function sendVideoToGroups(userId, groupIds) {
    try {
        const userSession = userSessions.get(userId);
        if (!userSession || !userSession.isReady) {
            console.log('WhatsApp não conectado para usuário:', userId);
            return false;
        }

        const videoData = await getLatestVideo();
        if (!videoData) {
            console.log('Nenhum vídeo encontrado');
            return false;
        }

        const message = `🚨 Saiu vídeo novo no canal!\n\n🎬 ${videoData.titulo}\n👉 Assista agora: ${videoData.link}\n\n📢 Compartilhe com todos! 🙏`;
        
        // Baixar thumbnail
        const thumbnailResponse = await axios.get(videoData.thumbnail, { responseType: 'arraybuffer' });
        const thumbnailBuffer = Buffer.from(thumbnailResponse.data);
        const media = new MessageMedia('image/jpeg', thumbnailBuffer.toString('base64'), 'thumbnail.jpg');
        
        // Enviar para cada grupo
        for (const groupId of groupIds) {
            try {
                await userSession.client.sendMessage(groupId, message);
                await userSession.client.sendMessage(groupId, media, { 
                    caption: `🆕 ${videoData.titulo}\n🎥 Assista: ${videoData.link}` 
                });
                console.log(`Vídeo enviado para grupo: ${groupId} - Usuário: ${userId}`);
            } catch (error) {
                console.error(`Erro ao enviar para grupo ${groupId}:`, error);
            }
        }
        return true;
    } catch (error) {
        console.error('Erro ao enviar vídeo:', error);
        return false;
    }
}

// Configurar cron jobs para usuário
function setupUserCronJobs(userId) {
    const userSession = userSessions.get(userId);
    if (!userSession) return;

    // Limpar jobs existentes do usuário
    if (userSession.cronJobs) {
        userSession.cronJobs.forEach(job => job.destroy());
    }
    userSession.cronJobs = [];

    const userData = loadUserData(userId);
    userData.schedules.forEach(schedule => {
        if (schedule.active) {
            const cronExpression = `${schedule.minute} ${schedule.hour} * * ${schedule.days.join(',')}`;
            
            const job = cron.schedule(cronExpression, () => {
                console.log(`Executando agendamento: ${schedule.name} - Usuário: ${userId}`);
                sendVideoToGroups(userId, schedule.groups);
            }, {
                timezone: "America/Sao_Paulo",
                scheduled: false
            });
            
            job.start();
            userSession.cronJobs.push(job);
            console.log(`Cron job criado para usuário ${userId}: ${schedule.name} - ${cronExpression}`);
        }
    });
}

// Criar cliente WhatsApp para usuário
async function createWhatsAppClient(userId) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `user_${userId}` }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    const userSession = {
        client: client,
        qrCode: '',
        isReady: false,
        groups: [],
        cronJobs: []
    };

    userSessions.set(userId, userSession);

    client.on('qr', async (qr) => {
        console.log('QR Code gerado para usuário:', userId);
        userSession.qrCode = await qrcode.toDataURL(qr);
    });

    client.on('ready', async () => {
        console.log(`WhatsApp conectado para usuário: ${userId}`);
        userSession.isReady = true;
        
        try {
            // Buscar grupos
            const chats = await client.getChats();
            userSession.groups = chats
                .filter(chat => chat.isGroup)
                .map(chat => ({
                    id: chat.id._serialized,
                    name: chat.name
                }));
            
            console.log(`${userSession.groups.length} grupos encontrados para usuário ${userId}`);
            
            // Salvar grupos no arquivo do usuário
            const userData = loadUserData(userId);
            userData.groups = userSession.groups;
            saveUserData(userId, userData);
            
            // Configurar cron jobs
            setupUserCronJobs(userId);
        } catch (error) {
            console.error(`Erro ao processar grupos para usuário ${userId}:`, error);
        }
    });

    client.on('disconnected', (reason) => {
        console.log(`WhatsApp desconectado para usuário ${userId}:`, reason);
        userSession.isReady = false;
        userSession.qrCode = '';
        userSession.groups = [];
        
        if (userSession.cronJobs) {
            userSession.cronJobs.forEach(job => job.destroy());
            userSession.cronJobs = [];
        }
    });

    client.on('auth_failure', () => {
        console.log(`Falha na autenticação para usuário ${userId}`);
        userSession.qrCode = '';
        userSession.isReady = false;
    });

    await client.initialize();
    return client;
}

// Desconectar WhatsApp do usuário
async function disconnectWhatsApp(userId) {
    const userSession = userSessions.get(userId);
    if (userSession && userSession.client) {
        try {
            await userSession.client.logout();
            await userSession.client.destroy();
            
            // Limpar dados da sessão
            userSession.isReady = false;
            userSession.qrCode = '';
            userSession.groups = [];
            
            if (userSession.cronJobs) {
                userSession.cronJobs.forEach(job => job.destroy());
                userSession.cronJobs = [];
            }
            
            console.log(`WhatsApp desconectado com sucesso para usuário: ${userId}`);
            
            // Recriar cliente para gerar novo QR
            setTimeout(() => {
                createWhatsAppClient(userId);
            }, 2000);
            
            return true;
        } catch (error) {
            console.error(`Erro ao desconectar WhatsApp para usuário ${userId}:`, error);
            return false;
        }
    }
    return false;
}

// Rotas de autenticação
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    if (users.find(u => u.username === username || u.email === email)) {
        return res.status(400).json({ error: 'Usuário ou email já existe' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString();
        
        const newUser = {
            id: userId,
            username,
            email,
            password: hashedPassword,
            created: new Date().toISOString()
        };
        
        users.push(newUser);
        saveUsers();
        
        // Criar cliente WhatsApp para o novo usuário
        await createWhatsAppClient(userId);
        
        const token = jwt.sign({ id: userId, username }, JWT_SECRET);
        req.session.token = token;
        
        res.json({ success: true, token, user: { id: userId, username, email } });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }
    
    const user = users.find(u => u.username === username || u.email === username);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Credenciais inválidas' });
    }
    
    try {
        // Criar cliente WhatsApp se não existir
        if (!userSessions.has(user.id)) {
            await createWhatsAppClient(user.id);
        }
        
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        req.session.token = token;
        
        res.json({ 
            success: true, 
            token, 
            user: { id: user.id, username: user.username, email: user.email } 
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Rotas principais
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/status', authenticateToken, (req, res) => {
    const userSession = userSessions.get(req.user.id);
    const userData = loadUserData(req.user.id);
    
    if (!userSession) {
        return res.json({
            isReady: false,
            qrCode: '',
            groupCount: 0,
            scheduleCount: 0
        });
    }
    
    res.json({
        isReady: userSession.isReady,
        qrCode: userSession.qrCode,
        groupCount: userSession.groups.length,
        scheduleCount: userData.schedules.length
    });
});

app.get('/api/groups', authenticateToken, (req, res) => {
    const userSession = userSessions.get(req.user.id);
    res.json(userSession ? userSession.groups : []);
});

app.get('/api/schedules', authenticateToken, (req, res) => {
    const userData = loadUserData(req.user.id);
    res.json(userData.schedules);
});

app.post('/api/schedules', authenticateToken, (req, res) => {
    const { name, hour, minute, days, groups: selectedGroups, active } = req.body;
    
    if (!name || hour === undefined || minute === undefined || !days || !selectedGroups) {
        return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    const userData = loadUserData(req.user.id);
    
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
    
    userData.schedules.push(schedule);
    saveUserData(req.user.id, userData);
    setupUserCronJobs(req.user.id);
    
    res.json({ success: true, schedule });
});

app.put('/api/schedules/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, hour, minute, days, groups: selectedGroups, active } = req.body;
    
    const userData = loadUserData(req.user.id);
    const scheduleIndex = userData.schedules.findIndex(s => s.id === id);
    
    if (scheduleIndex === -1) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    userData.schedules[scheduleIndex] = {
        ...userData.schedules[scheduleIndex],
        name: name || userData.schedules[scheduleIndex].name,
        hour: hour !== undefined ? parseInt(hour) : userData.schedules[scheduleIndex].hour,
        minute: minute !== undefined ? parseInt(minute) : userData.schedules[scheduleIndex].minute,
        days: days || userData.schedules[scheduleIndex].days,
        groups: selectedGroups || userData.schedules[scheduleIndex].groups,
        active: active !== undefined ? active : userData.schedules[scheduleIndex].active,
        updated: new Date().toISOString()
    };
    
    saveUserData(req.user.id, userData);
    setupUserCronJobs(req.user.id);
    
    res.json({ success: true, schedule: userData.schedules[scheduleIndex] });
});

app.delete('/api/schedules/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userData = loadUserData(req.user.id);
    const scheduleIndex = userData.schedules.findIndex(s => s.id === id);
    
    if (scheduleIndex === -1) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    userData.schedules.splice(scheduleIndex, 1);
    saveUserData(req.user.id, userData);
    setupUserCronJobs(req.user.id);
    
    res.json({ success: true });
});

app.post('/api/test-send', authenticateToken, async (req, res) => {
    const { groups: selectedGroups } = req.body;
    
    if (!selectedGroups || selectedGroups.length === 0) {
        return res.status(400).json({ error: 'Nenhum grupo selecionado' });
    }
    
    const userSession = userSessions.get(req.user.id);
    if (!userSession || !userSession.isReady) {
        return res.status(400).json({ error: 'WhatsApp não conectado' });
    }
    
    try {
        const success = await sendVideoToGroups(req.user.id, selectedGroups);
        if (success) {
            res.json({ success: true, message: 'Vídeo enviado com sucesso!' });
        } else {
            res.status(500).json({ error: 'Erro ao enviar vídeo' });
        }
    } catch (error) {
        console.error('Erro ao enviar vídeo:', error);
        res.status(500).json({ error: 'Erro ao enviar vídeo: ' + error.message });
    }
});

app.post('/api/disconnect-whatsapp', authenticateToken, async (req, res) => {
    try {
        const success = await disconnectWhatsApp(req.user.id);
        if (success) {
            res.json({ success: true, message: 'WhatsApp desconectado com sucesso!' });
        } else {
            res.status(500).json({ error: 'Erro ao desconectar WhatsApp' });
        }
    } catch (error) {
        console.error('Erro ao desconectar WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao desconectar WhatsApp' });
    }
});

// Inicializar sistema
loadUsers();

// Criar clientes WhatsApp para usuários existentes ao iniciar o servidor
users.forEach(user => {
    createWhatsAppClient(user.id);
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 WhatsApp YouTube Bot - Wallysson Studio Dv 2025`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
});