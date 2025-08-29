const fs = require('fs');
const path = require('path');

class DataManager {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.usersFile = path.join(this.dataDir, 'users.json');
        this.ensureDataDir();
    }

    ensureDataDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    // Gerenciamento de usuários
    getUsers() {
        try {
            if (fs.existsSync(this.usersFile)) {
                const data = fs.readFileSync(this.usersFile, 'utf8');
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('Erro ao ler usuários:', error);
            return [];
        }
    }

    saveUsers(users) {
        try {
            fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('Erro ao salvar usuários:', error);
            return false;
        }
    }

    // Gerenciamento de dados do usuário
    getUserDataFile(userId) {
        return path.join(this.dataDir, `user_${userId}.json`);
    }

    createUserData(userId) {
        const userDataFile = this.getUserDataFile(userId);
        const initialData = {
            userId,
            groups: [],
            schedules: [],
            stats: {
                messagesSent: 0,
                videosShared: 0
            },
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        };

        try {
            fs.writeFileSync(userDataFile, JSON.stringify(initialData, null, 2));
            return initialData;
        } catch (error) {
            console.error(`Erro ao criar dados do usuário ${userId}:`, error);
            return null;
        }
    }

    getUserData(userId) {
        const userDataFile = this.getUserDataFile(userId);
        
        try {
            if (fs.existsSync(userDataFile)) {
                const data = fs.readFileSync(userDataFile, 'utf8');
                return JSON.parse(data);
            } else {
                return this.createUserData(userId);
            }
        } catch (error) {
            console.error(`Erro ao ler dados do usuário ${userId}:`, error);
            return this.createUserData(userId);
        }
    }

    updateUserData(userId, updates) {
        try {
            const currentData = this.getUserData(userId);
            const updatedData = {
                ...currentData,
                ...updates,
                lastUpdate: new Date().toISOString()
            };

            const userDataFile = this.getUserDataFile(userId);
            fs.writeFileSync(userDataFile, JSON.stringify(updatedData, null, 2));
            
            return updatedData;
        } catch (error) {
            console.error(`Erro ao atualizar dados do usuário ${userId}:`, error);
            return null;
        }
    }

    // Backup e limpeza
    cleanupOldData(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const files = fs.readdirSync(this.dataDir);
            let cleanedFiles = 0;
            
            files.forEach(file => {
                if (file.startsWith('user_') && file.endsWith('.json')) {
                    const filePath = path.join(this.dataDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        
                        // Verificar se o usuário ainda existe
                        const users = this.getUsers();
                        const userId = userData.userId;
                        const userExists = users.find(u => u.id === userId);
                        
                        if (!userExists) {
                            fs.unlinkSync(filePath);
                            cleanedFiles++;
                            console.log(`🗑️ Arquivo limpo: ${file}`);
                        }
                    }
                }
            });
            
            console.log(`🧹 Limpeza concluída: ${cleanedFiles} arquivos removidos`);
            return cleanedFiles;
            
        } catch (error) {
            console.error('Erro na limpeza de dados:', error);
            return 0;
        }
    }

    createBackup() {
        try {
            const backupDir = path.join(this.dataDir, 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir);
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
            
            const allData = {
                users: this.getUsers(),
                userData: {},
                timestamp: new Date().toISOString()
            };

            // Coletar dados de todos os usuários
            const users = this.getUsers();
            users.forEach(user => {
                allData.userData[user.id] = this.getUserData(user.id);
            });

            fs.writeFileSync(backupFile, JSON.stringify(allData, null, 2));
            console.log(`💾 Backup criado: ${backupFile}`);
            
            return backupFile;
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            return null;
        }
    }

    getSystemStats() {
        try {
            const users = this.getUsers();
            let totalMessages = 0;
            let totalVideos = 0;
            let totalSchedules = 0;
            let totalGroups = 0;

            users.forEach(user => {
                const userData = this.getUserData(user.id);
                totalMessages += userData.stats?.messagesSent || 0;
                totalVideos += userData.stats?.videosShared || 0;
                totalSchedules += userData.schedules?.length || 0;
                totalGroups += userData.groups?.length || 0;
            });

            return {
                totalUsers: users.length,
                totalMessages,
                totalVideos,
                totalSchedules,
                totalGroups,
                systemUptime: process.uptime(),
                memoryUsage: process.memoryUsage()
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas do sistema:', error);
            return null;
        }
    }
}

module.exports = DataManager;