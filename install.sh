#!/bin/bash

# 🤖 WhatsApp YouTube Bot - Script de Instalação
# Wallysson Studio Dv 2025

echo "
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🤖 WhatsApp YouTube Bot - Instalador Automático          ║
║                                                              ║
║    🚀 Wallysson Studio Dv 2025                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log com cores
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar se está executando como root
if [ "$EUID" -eq 0 ]; then
    log_warning "Não execute este script como root!"
    exit 1
fi

# Detectar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    log_info "Sistema detectado: Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    log_info "Sistema detectado: macOS"
else
    log_error "Sistema operacional não suportado: $OSTYPE"
fi

# Verificar se Node.js está instalado
log_info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    log_warning "Node.js não encontrado. Instalando..."
    
    if [ "$OS" == "linux" ]; then
        # Instalar Node.js no Linux
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" == "mac" ]; then
        # Verificar se Homebrew está instalado
        if ! command -v brew &> /dev/null; then
            log_info "Instalando Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        # Instalar Node.js no macOS
        brew install node
    fi
else
    NODE_VERSION=$(node --version)
    log_success "Node.js já instalado: $NODE_VERSION"
fi

# Verificar se npm está disponível
if ! command -v npm &> /dev/null; then
    log_error "npm não encontrado. Por favor, instale o Node.js manualmente."
fi

NPM_VERSION=$(npm --version)
log_success "npm disponível: $NPM_VERSION"

# Verificar se Git está instalado
log_info "Verificando Git..."
if ! command -v git &> /dev/null; then
    log_warning "Git não encontrado. Instalando..."
    
    if [ "$OS" == "linux" ]; then
        sudo apt-get update
        sudo apt-get install -y git
    elif [ "$OS" == "mac" ]; then
        brew install git
    fi
else
    GIT_VERSION=$(git --version)
    log_success "Git já instalado: $GIT_VERSION"
fi

# Criar diretório do projeto
PROJECT_NAME="whatsapp-youtube-bot"
log_info "Criando diretório do projeto: $PROJECT_NAME"

if [ -d "$PROJECT_NAME" ]; then
    log_warning "Diretório já existe. Removendo..."
    rm -rf "$PROJECT_NAME"
fi

mkdir "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Criar package.json
log_info "Criando package.json..."
cat > package.json << 'EOF'
{
  "name": "whatsapp-youtube-bot",
  "version": "1.0.0",
  "description": "WhatsApp YouTube Bot with Baileys - Wallysson Studio Dv 2025",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.6.0",
    "express": "^4.18.2",
    "socket.io": "^4.7.4",
    "qrcode": "^1.5.3",
    "axios": "^1.6.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^3.0.3",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "pino": "^8.17.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "keywords": ["whatsapp", "bot", "youtube", "baileys", "automation"],
  "author": "Wallysson Studio Dv 2025",
  "license": "MIT"
}
EOF

# Instalar dependências
log_info "Instalando dependências npm..."
npm install

# Criar estrutura de diretórios
log_info "Criando estrutura de diretórios..."
mkdir -p src public data sessions

# Criar arquivo .env
log_info "Criando arquivo de configuração..."
cat > .env << EOF
# Configurações do servidor
PORT=3000
JWT_SECRET=wallysson-studio-secret-$(date +%s)

# Configurações do YouTube (substitua pela sua chave)
YOUTUBE_API_KEY=AIzaSyDubEpb0TkgZjiyjA9-1QM_56Kwnn_SMPs
CANAL_ID=UCh-ceOeY4WVgS8R0onTaXmw

# Configurações de desenvolvimento
NODE_ENV=development
EOF

# Criar .gitignore
log_info "Criando .gitignore..."
cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Sessions e dados
sessions/
data/
backups/

# Logs
logs
*.log

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Temporary files
tmp/
temp/
*.tmp

# Build files
dist/
build/
EOF

# Verificar se PM2 está instalado (para produção)
log_info "Verificando PM2 para gerenciamento de processos..."
if ! command -v pm2 &> /dev/null; then
    log_warning "PM2 não encontrado. Instalando globalmente..."
    npm install -g pm2
else
    PM2_VERSION=$(pm2 --version)
    log_success "PM2 já instalado: $PM2_VERSION"
fi

# Criar arquivo de configuração do PM2
log_info "Criando configuração PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'whatsapp-bot',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }],
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/master',
      repo: 'git@github.com:your-repo/whatsapp-youtube-bot.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
EOF

# Criar diretório de logs
mkdir -p logs

# Criar script de inicialização
log_info "Criando scripts de controle..."
cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando WhatsApp YouTube Bot..."

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Criar diretórios necessários
mkdir -p data sessions logs

# Iniciar com PM2
if command -v pm2 &> /dev/null; then
    echo "🔄 Iniciando com PM2..."
    pm2 start ecosystem.config.js
    pm2 logs whatsapp-bot --lines 20
else
    echo "🔄 Iniciando com Node.js..."
    npm start
fi
EOF

chmod +x start.sh

cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Parando WhatsApp YouTube Bot..."

if command -v pm2 &> /dev/null; then
    pm2 stop whatsapp-bot
    pm2 delete whatsapp-bot
else
    echo "❌ PM2 não encontrado. Para parar o processo, use Ctrl+C no terminal onde está executando."
fi
EOF

chmod +x stop.sh

cat > restart.sh << 'EOF'
#!/bin/bash

echo "🔄 Reiniciando WhatsApp YouTube Bot..."

if command -v pm2 &> /dev/null; then
    pm2 restart whatsapp-bot
else
    echo "❌ PM2 não encontrado. Pare o processo manual e execute ./start.sh"
fi
EOF

chmod +x restart.sh

# Criar arquivo de monitoramento de sistema
cat > monitor.sh << 'EOF'
#!/bin/bash

echo "📊 Status do WhatsApp YouTube Bot"
echo "================================="

if command -v pm2 &> /dev/null; then
    pm2 status whatsapp-bot
    echo ""
    echo "📈 Monitoramento em tempo real:"
    echo "pm2 monit"
    echo ""
    echo "📋 Ver logs:"
    echo "pm2 logs whatsapp-bot"
else
    echo "❌ PM2 não instalado. Status não disponível."
fi

echo ""
echo "🌐 Acesse: http://localhost:3000"
echo ""
echo "💾 Espaço em disco:"
df -h .
echo ""
echo "🧠 Uso de memória:"
free -h 2>/dev/null || vm_stat
EOF

chmod +x monitor.sh

# Criar script de backup
cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="whatsapp_bot_backup_$DATE.tar.gz"

echo "💾 Criando backup dos dados..."

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Criar backup
tar -czf "$BACKUP_DIR/$BACKUP_NAME" data/ sessions/ .env 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Backup criado: $BACKUP_DIR/$BACKUP_NAME"
    
    # Manter apenas os 10 backups mais recentes
    cd $BACKUP_DIR
    ls -1t whatsapp_bot_backup_*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null
    cd ..
    
    echo "🗂️  Backups antigos removidos (mantendo 10 mais recentes)"
else
    echo "❌ Erro ao criar backup"
fi
EOF

chmod +x backup.sh

# Criar arquivo de configuração do sistema
cat > config.json << EOF
{
  "system": {
    "name": "WhatsApp YouTube Bot",
    "version": "1.0.0",
    "author": "Wallysson Studio Dv 2025",
    "description": "Sistema de automação WhatsApp com agendamento",
    "installation_date": "$(date -Iseconds)"
  },
  "features": {
    "multi_user": true,
    "scheduled_messages": true,
    "group_management": true,
    "youtube_integration": true,
    "qr_code_auth": true,
    "real_time_dashboard": true
  },
  "requirements": {
    "node_version": ">=16.0.0",
    "npm_version": ">=8.0.0",
    "os": ["linux", "darwin", "win32"]
  }
}
EOF

# Verificar se tudo foi criado corretamente
log_info "Verificando instalação..."

# Lista de arquivos essenciais
REQUIRED_FILES=(
    "package.json"
    "server.js"
    "src/"
    "public/"
    "data/"
    "sessions/"
    ".env"
    ".gitignore"
    "ecosystem.config.js"
    "start.sh"
    "stop.sh"
    "restart.sh"
    "monitor.sh"
    "backup.sh"
    "config.json"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    log_success "Todos os arquivos necessários foram criados"
else
    log_warning "Arquivos não encontrados: ${MISSING_FILES[*]}"
fi

# Instruções finais
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║    🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!                     ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
log_success "Projeto criado em: $(pwd)"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1️⃣  Configurar API do YouTube:"
echo "    • Edite o arquivo .env"
echo "    • Substitua YOUTUBE_API_KEY pela sua chave"
echo "    • Substitua CANAL_ID pelo ID do seu canal"
echo ""
echo "2️⃣  Iniciar o sistema:"
echo "    • Execute: ./start.sh"
echo "    • Ou: npm start"
echo ""
echo "3️⃣  Acessar interface:"
echo "    • Abra: http://localhost:3000"
echo ""
echo "4️⃣  Comandos úteis:"
echo "    • Iniciar:     ./start.sh"
echo "    • Parar:       ./stop.sh"
echo "    • Reiniciar:   ./restart.sh"
echo "    • Monitor:     ./monitor.sh"
echo "    • Backup:      ./backup.sh"
echo ""
echo "🔧 CONFIGURAÇÕES AVANÇADAS:"
echo ""
echo "• PM2 (Produção):  pm2 start ecosystem.config.js"
echo "• Logs:           pm2 logs whatsapp-bot"
echo "• Status:         pm2 status"
echo ""
echo "📚 DOCUMENTAÇÃO:"
echo ""
echo "• README.md - Guia completo"
echo "• config.json - Configurações do sistema"
echo "• .env - Variáveis de ambiente"
echo ""
echo "🆘 SUPORTE:"
echo ""
echo "• Email: suporte@wallyssonstudio.dev"
echo "• GitHub: https://github.com/wallysson/whatsapp-youtube-bot"
echo ""

# Criar um teste simples para verificar se Node.js funciona
log_info "Criando teste de verificação..."
cat > test.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('🧪 Teste de Verificação - Wallysson Studio Dv 2025');
console.log('='.repeat(50));

// Verificar Node.js
console.log(`✅ Node.js: ${process.version}`);
console.log(`✅ Platform: ${process.platform}`);
console.log(`✅ Architecture: ${process.arch}`);

// Verificar arquivos
const requiredFiles = [
    'package.json',
    'src',
    'public',
    '.env'
];

console.log('\n📁 Verificando arquivos:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} (não encontrado)`);
    }
});

// Verificar dependências
console.log('\n📦 Verificando package.json:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`✅ Nome: ${packageJson.name}`);
    console.log(`✅ Versão: ${packageJson.version}`);
    console.log(`✅ Autor: ${packageJson.author}`);
    console.log(`✅ Dependências: ${Object.keys(packageJson.dependencies).length}`);
} catch (error) {
    console.log('❌ Erro ao ler package.json:', error.message);
}

console.log('\n🎉 Verificação concluída!');
console.log('\n🚀 Execute "npm start" ou "./start.sh" para iniciar o bot');
EOF

# Executar teste
log_info "Executando teste de verificação..."
node test.js

# Limpeza
rm test.js

echo ""
log_success "✨ Instalação 100% concluída!"
log_info "📁 Entre no diretório: cd $PROJECT_NAME"
log_info "🚀 Inicie o sistema: ./start.sh"
echo ""
echo "🙏 Obrigado por usar WhatsApp YouTube Bot!"
echo "💙 Wallysson Studio Dv 2025"
echo ""