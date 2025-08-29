const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const fs = require('fs');
const WhatsAppBot = require('./src/whatsapp-bot');
const DataManager = require('./src/data-manager');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configurações
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'wallysson-studio-secret-2025';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Instâncias
const dataManager = new DataManager();
const bots = new Map(); // userId -> WhatsAppBot instance

// Rotas de autenticação
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const users = dataManager.getUsers();
        
        // Verificar se usuário já existe
        if (users.find(u => u.email === email || u.username === username)) {
            return res.status(400).json({ error: 'Usuário ou email já cadastrado' });
        }

        // Criar usuário
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        dataManager.saveUsers(users);

        // Criar estrutura inicial do usuário
        dataManager.createUserData(newUser.id);

        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);
        
        res.json({ 
            success: true, 
            token,
            user: { id: newUser.id, username, email }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const users = dataManager.getUsers();
        const user = users.find(u => u.email === email);
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        
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

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.userId = user.userId;
        next();
    });
};

// Rotas protegidas
app.get('/api/dashboard-data', authenticateToken, (req, res) => {
    try {
        const userData = dataManager.getUserData(req.userId);
        const bot = bots.get(req.userId);
        
        res.json({
            connected: bot ? bot.isConnected() : false,
            groups: userData.groups || [],
            schedules: userData.schedules || [],
            stats: userData.stats || { messagesSent: 0, videosShared: 0 }
        });
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

app.post('/api/connect-whatsapp', authenticateToken, (req, res) => {
    try {
        if (bots.has(req.userId)) {
            bots.get(req.userId).disconnect();
        }

        const bot = new WhatsAppBot(req.userId, dataManager, io);
        bots.set(req.userId, bot);
        
        bot.connect();
        
        res.json({ success: true, message: 'Iniciando conexão...' });
    } catch (error) {
        console.error('Erro ao conectar:', error);
        res.status(500).json({ error: 'Erro ao conectar WhatsApp' });
    }
});

app.post('/api/disconnect-whatsapp', authenticateToken, (req, res) => {
    try {
        const bot = bots.get(req.userId);
        if (bot) {
            bot.disconnect();
            bots.delete(req.userId);
        }
        
        res.json({ success: true, message: 'WhatsApp desconectado' });
    } catch (error) {
        console.error('Erro ao desconectar:', error);
        res.status(500).json({ error: 'Erro ao desconectar WhatsApp' });
    }
});

app.post('/api/save-schedule', authenticateToken, (req, res) => {
    try {
        const { name, days, time, groups, active } = req.body;
        
        const userData = dataManager.getUserData(req.userId);
        const schedules = userData.schedules || [];
        
        const newSchedule = {
            id: Date.now().toString(),
            name,
            days,
            time,
            groups,
            active: active !== false,
            createdAt: new Date().toISOString()
        };
        
        schedules.push(newSchedule);
        dataManager.updateUserData(req.userId, { schedules });
        
        res.json({ success: true, schedule: newSchedule });
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        res.status(500).json({ error: 'Erro ao salvar agendamento' });
    }
});

app.delete('/api/schedule/:id', authenticateToken, (req, res) => {
    try {
        const userData = dataManager.getUserData(req.userId);
        const schedules = userData.schedules || [];
        
        const filteredSchedules = schedules.filter(s => s.id !== req.params.id);
        dataManager.updateUserData(req.userId, { schedules: filteredSchedules });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar agendamento:', error);
        res.status(500).json({ error: 'Erro ao deletar agendamento' });
    }
});

app.put('/api/schedule/:id/toggle', authenticateToken, (req, res) => {
    try {
        const userData = dataManager.getUserData(req.userId);
        const schedules = userData.schedules || [];
        
        const schedule = schedules.find(s => s.id === req.params.id);
        if (schedule) {
            schedule.active = !schedule.active;
            dataManager.updateUserData(req.userId, { schedules });
        }
        
        res.json({ success: true, active: schedule ? schedule.active : false });
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        res.status(500).json({ error: 'Erro ao alterar status do agendamento' });
    }
});

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Cron job para executar agendamentos
cron.schedule('* * * * *', () => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const currentDay = now.getDay(); // 0 = domingo, 1 = segunda, etc.
    
    for (const [userId, bot] of bots) {
        if (!bot.isConnected()) continue;
        
        try {
            const userData = dataManager.getUserData(userId);
            const schedules = userData.schedules || [];
            
            for (const schedule of schedules) {
                if (!schedule.active) continue;
                
                // Verificar se é o horário e dia corretos
                if (schedule.time === currentTime && schedule.days.includes(currentDay)) {
                    bot.sendScheduledContent(schedule.groups);
                }
            }
        } catch (error) {
            console.error(`Erro ao processar agendamento para usuário ${userId}:`, error);
        }
    }
});

// Inicializar servidor
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🤖 WhatsApp YouTube Bot - Wallysson Studio Dv 2025       ║
║                                                              ║
║    🌐 Servidor rodando em: http://localhost:${PORT}${PORT === 3000 ? '           ' : '          '}║
║    📱 Sistema multi-usuário ativo                           ║
║    🔄 Agendamentos automáticos funcionando                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

process.on('SIGINT', () => {
    console.log('\n🔴 Desligando servidor...');
    
    // Desconectar todos os bots
    for (const [userId, bot] of bots) {
        try {
            bot.disconnect();
        } catch (error) {
            console.error(`Erro ao desconectar bot ${userId}:`, error);
        }
    }
    
    server.close(() => {
        console.log('✅ Servidor desligado com sucesso');
        process.exit(0);
    });
});