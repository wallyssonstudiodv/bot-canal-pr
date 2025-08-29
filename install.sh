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

# 🔧 Removida a checagem de root para permitir rodar como root

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
node_modules/
sessions/
data/
.env
logs
backups/
EOF

# Verificar se PM2 está instalado
log_info "Verificando PM2..."
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
  }]
};
EOF

mkdir -p logs

# Scripts auxiliares
log_info "Criando scripts auxiliares..."
echo '#!/bin/bash
pm2 start ecosystem.config.js && pm2 logs whatsapp-bot --lines 20' > start.sh
chmod +x start.sh

echo '#!/bin/bash
pm2 stop whatsapp-bot && pm2 delete whatsapp-bot' > stop.sh
chmod +x stop.sh

echo '#!/bin/bash
pm2 restart whatsapp-bot' > restart.sh
chmod +x restart.sh

echo '#!/bin/bash
pm2 status whatsapp-bot && pm2 logs whatsapp-bot' > monitor.sh
chmod +x monitor.sh

# Instruções finais
echo ""
echo "🎉 INSTALAÇÃO CONCLUÍDA!"
echo "👉 Para iniciar: ./start.sh"
echo "👉 Para parar: ./stop.sh"
echo "👉 Para reiniciar: ./restart.sh"
echo "👉 Para monitorar: ./monitor.sh"
echo ""