# WhatsApp YouTube Bot - Dockerfile
# Wallysson Studio Dv 2025

FROM node:18-alpine

# Metadados
LABEL maintainer="Wallysson Studio Dv <contato@wallyssonstudio.dev>"
LABEL version="1.0.0"
LABEL description="WhatsApp YouTube Bot with Baileys"

# Instalar dependências do sistema
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S whatsappbot -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY ecosystem.config.js ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p data sessions logs backups
RUN chown -R whatsappbot:nodejs /app

# Mudar para usuário não-root
USER whatsappbot

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicialização
CMD ["npm", "start"]