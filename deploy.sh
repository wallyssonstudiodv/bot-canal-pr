#!/bin/bash

# 🚀 Deploy Script - WhatsApp YouTube Bot
# Wallysson Studio Dv 2025

set -e  # Exit on any error

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Funções de log
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }
log_step() { echo -e "${PURPLE}🔄 $1${NC}"; }

# Banner
echo "
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🚀 Deploy Automático - WhatsApp YouTube Bot              ║
║                                                              ║
║    💼 Wallysson Studio Dv 2025                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"

# Variáveis de configuração
PROJECT_NAME="whatsapp-youtube-bot"
DEPLOY_METHOD=""
SERVER_USER=""
SERVER_HOST=""
SERVER_PATH=""
DOMAIN=""
USE_DOCKER=false
USE_SSL=false

# Função para mostrar menu
show_menu() {
    echo "🎯 Selecione o tipo de deploy:"
    echo "1) VPS/Servidor Linux (PM2)"
    echo "2) Docker Local"
    echo "3) Docker + Docker Compose"
    echo "4) VPS com Docker"
    echo "5) Servidor com Nginx + SSL"
    echo "0) Cancelar"
    echo
    read -p "Digite sua escolha [1-5]: " choice
    
    case $choice in
        1) DEPLOY_METHOD="vps-pm2" ;;
        2) DEPLOY_METHOD="docker-local" ;;
        3) DEPLOY_METHOD="docker-compose" ;;
        4) DEPLOY_METHOD="vps-docker" ;;
        5) DEPLOY_METHOD="nginx-ssl" ;;
        0) log_info "Deploy cancelado."; exit 0 ;;
        *) log_error "Opção inválida!" ;;
    esac
}

# Função para coletar informações do servidor
collect_server_info() {
    echo
    log_step "Coletando informações do servidor..."
    
    read -p "👤 Usuário do servidor: " SERVER_USER
    read -p "🌐 Host/IP do servidor: " SERVER_HOST
    read -p "📁 Caminho no servidor [/var/www/$PROJECT_NAME]: " SERVER_PATH
    SERVER_PATH=${SERVER_PATH:-"/var/www/$PROJECT_NAME"}
    
    if [[ "$DEPLOY_METHOD" == "nginx-ssl" ]]; then
        read -p "🌍 Domínio (ex: bot.seudominio.com): " DOMAIN
        read -p "🔒 Usar SSL? (y/n) [y]: " ssl_choice
        USE_SSL=${ssl_choice:-"y"}
    fi
}

# Função para verificar pré-requisitos
check_prerequisites() {
    log_step "Verificando pré-requisitos..."
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_error "Git não encontrado!"
    fi
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js não encontrado!"
    fi
    
    # Verificar Docker (se necessário)
    if [[ "$DEPLOY_METHOD" == *"docker"* ]] && ! command -v docker &> /dev/null; then
        log_error "Docker não encontrado!"
    fi
    
    # Verificar SSH (se necessário)
    if [[ "$DEPLOY_METHOD" == "vps"* ]] || [[ "$DEPLOY_METHOD" == "nginx-ssl" ]]; then
        if ! command -v ssh &> /dev/null; then
            log_error "SSH não encontrado!"
        fi
        
        log_info "Testando conexão SSH..."
        if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" exit 2>/dev/null; then
            log_error "Não foi possível conectar ao servidor via SSH!"
        fi
    fi
    
    log_success "Pré-requisitos verificados!"
}

# Deploy para VPS com PM2
deploy_vps_pm2() {
    log_step "Iniciando deploy para VPS com PM2..."
    
    # Comandos para executar no servidor
    cat << EOF > deploy_commands.sh
#!/bin/bash
set -e

echo "📦 Preparando ambiente..."

# Atualizar sistema
sudo apt-get update

# Instalar Node.js se não estiver instalado
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Instalar PM2 se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Criar diretório do projeto
sudo mkdir -p $SERVER_PATH
sudo chown $USER:$USER $SERVER_PATH

# Ir para o diretório
cd $SERVER_PATH

# Clonar ou atualizar repositório
if [ -d ".git" ]; then
    echo "🔄 Atualizando repositório..."
    git pull origin main
else
    echo "📥 Clonando repositório..."
    git clone . .
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install --production

# Criar diretórios necessários
mkdir -p data sessions logs backups

# Copiar configuração se não existir
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || echo "⚠️  Configure o arquivo .env manualmente"
fi

# Parar processo anterior
pm2 delete $PROJECT_NAME 2>/dev/null || true

# Iniciar com PM2
echo "🚀 Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js
pm2 startup
pm2 save

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Aplic