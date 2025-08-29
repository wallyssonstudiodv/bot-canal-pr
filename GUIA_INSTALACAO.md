# 🚀 Guia de Instalação - WhatsApp YouTube Bot Multi-usuário
### 📱 Sistema Profissional por Wallysson Studio Dv © 2025

## 📋 Pré-requisitos

### 1. VPS/Servidor
- Ubuntu 20.04 ou superior
- Mínimo 2GB RAM (recomendado 4GB)
- Acesso root ou sudo
- Conexão estável com a internet

### 2. Software necessário
- Node.js (versão 16 ou superior)
- NPM
- PM2 (para gerenciamento de processos)
- Git

## 🛠️ Instalação Completa

### 1. Conecte-se à sua VPS
```bash
ssh root@SEU_IP_VPS
```

### 2. Atualize o sistema
```bash
apt update && apt upgrade -y
```

### 3. Instale o Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

### 4. Instale o PM2 globalmente
```bash
npm install -g pm2
```

### 5. Instale dependências necessárias para WhatsApp Web.js
```bash
apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Instalar Chrome/Chromium para Puppeteer
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list
apt-get update
apt-get install -y google-chrome-stable
```

### 6. Crie o diretório do projeto
```bash
mkdir /opt/whatsapp-multi-bot
cd /opt/whatsapp-multi-bot
```

### 7. Crie os arquivos do projeto

#### 📄 server.js
```bash
nano server.js
```
*Cole o conteúdo completo do arquivo server.js*

#### 📄 package.json
```bash
nano package.json
```
*Cole o conteúdo do arquivo package.json*

#### 📄 ecosystem.config.js
```bash
nano ecosystem.config.js
```
*Cole o conteúdo do arquivo ecosystem.config.js*

### 8. Crie as pastas e arquivos HTML
```bash
mkdir public
mkdir logs

# Arquivo de login
nano public/login.html
```
*Cole o conteúdo completo do arquivo login.html*

```bash
# Arquivo do dashboard
nano public/dashboard.html
```
*Cole o conteúdo completo do arquivo dashboard.html*

### 9. Instale as dependências Node.js
```bash
npm install
```

## 🔧 Configuração Avançada

### 1. Configure sua API Key do YouTube
Edite o arquivo `server.js`:
```javascript
const YOUTUBE_API_KEY = "SUA_API_KEY_YOUTUBE_AQUI";
const CANAL_ID = "SEU_CANAL_ID_AQUI";
```

### 2. Configure o firewall
```bash
ufw allow 3000
ufw allow ssh
ufw enable
```

### 3. Configure permissões adequadas
```bash
chown -R root:root /opt/whatsapp-multi-bot
chmod -R 755 /opt/whatsapp-multi-bot
```

## 🚀 Inicialização do Sistema

### 1. Teste inicial (opcional)
```bash
node server.js
```
*Pressione Ctrl+C para parar após verificar se não há erros*

### 2. Inicie com PM2
```bash
pm2 start ecosystem.config.js
```

### 3. Configure auto-start
```bash
pm2 save
pm2 startup

# Execute o comando que aparecer (similar a este):
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

### 4. Verifique o status
```bash
pm2 status
pm2 logs whatsapp-youtube-bot
```

## 🔐 Sistema de Usuários

### 1. Primeiro Acesso
- Acesse: `http://SEU_IP:3000`
- Clique em "Cadastrar"
- Preencha os dados do primeiro usuário
- Faça login

### 2. Múltiplos Usuários
- Cada usuário terá seu próprio QR Code
- Sessões WhatsApp independentes
- Agendamentos individuais
- Dados isolados por usuário

## 📱 Como Usar o Sistema

### 1. Cadastro/Login
- **Cadastro**: Crie sua conta com username, email e senha
- **Login**: Entre com username/email e senha
- **Logout**: Botão no canto superior direito

### 2. Conectar WhatsApp
- Após login, aparecerá o QR Code
- Abra WhatsApp > Menu > Aparelhos conectados > Conectar aparelho
- Escaneie o QR Code
- Aguarde confirmação de conexão

### 3. Desconectar WhatsApp
- Botão "Desconectar WhatsApp" abaixo do QR Code
- Confirme a desconexão
- Um novo QR Code será gerado automaticamente

### 4. Gerenciar Agendamentos
- **Criar**: Preencha nome, horário, dias e selecione grupos
- **Testar**: Botão "Testar Envio" para verificar funcionamento
- **Ativar/Pausar**: Toggle nos agendamentos criados
- **Excluir**: Botão vermelho com ícone de lixeira

## 📊 Monitoramento e Manutenção

### Comandos PM2 Essenciais
```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs whatsapp-youtube-bot

# Reiniciar aplicação
pm2 restart whatsapp-youtube-bot

# Parar aplicação
pm2 stop whatsapp-youtube-bot

# Remover aplicação
pm2 delete whatsapp-youtube-bot

# Monitoramento detalhado
pm2 monit
```

### Arquivos de Dados
```bash
# Usuários cadastrados
/opt/whatsapp-multi-bot/users.json

# Dados por usuário (agendamentos, etc)
/opt/whatsapp-multi-bot/user_data_[USER_ID].json

# Sessions WhatsApp por usuário
/opt/whatsapp-multi-bot/.wwebjs_auth/session-user_[USER_ID]/
```

### Logs do Sistema
```bash
# Ver logs de erro
tail -f /opt/whatsapp-multi-bot/logs/err.log

# Ver logs gerais
tail -f /opt/whatsapp-multi-bot/logs/combined.log

# Ver logs do PM2
pm2 logs --lines 100
```

## 🔒 Segurança e Backup

### 1. Backup Regular
```bash
# Script de backup
#!/bin/bash
BACKUP_DIR="/backup/whatsapp-bot/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

cp /opt/whatsapp-multi-bot/*.json $BACKUP_DIR/
cp -r /opt/whatsapp-multi-bot/.wwebjs_auth $BACKUP_DIR/
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Manter apenas 7 dias de backup
find /backup/whatsapp-bot/ -name "*.tar.gz" -mtime +7 -delete
```

### 2. SSL/HTTPS (Recomendado)
```bash
# Instalar Nginx
apt install nginx

# Configurar proxy reverso
nano /etc/nginx/sites-available/whatsapp-bot
```

Configuração Nginx:
```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# SSL com Let's Encrypt
apt install certbot python3-certbot-nginx
certbot --nginx -d SEU_DOMINIO.com
```

## 🚨 Solução de Problemas

### WhatsApp não conecta
```bash
# Verificar logs
pm2 logs whatsapp-youtube-bot

# Limpar sessão específica
rm -rf .wwebjs_auth/session-user_[USER_ID]

# Reiniciar aplicação
pm2 restart whatsapp-youtube-bot
```

### Usuário não consegue fazer login
```bash
# Verificar arquivo de usuários
cat users.json

# Verificar logs de erro
tail -f logs/err.log
```

### Grupos não carregam
1. Verificar se WhatsApp está conectado
2. Aguardar sincronização (pode levar alguns minutos)
3. Recarregar página do dashboard

### Performance baixa
```bash
# Verificar recursos do sistema
htop
df -h

# Otimizar PM2
pm2 restart whatsapp-youtube-bot --update-env
```

## 📈 Características do Sistema

### ✅ Multi-usuário
- Sistema completo de cadastro e autenticação
-# 🚀 Guia de Instalação - WhatsApp YouTube Bot

## 📋 Pré-requisitos

### 1. VPS/Servidor
- Ubuntu 20.04 ou superior
- Mínimo 2GB RAM
- Acesso root ou sudo

### 2. Software necessário
- Node.js (versão 16 ou superior)
- NPM
- PM2 (para gerenciamento de processos)
- Git

## 🛠️ Instalação

### 1. Conecte-se à sua VPS
```bash
ssh root@SEU_IP_VPS
```

### 2. Atualize o sistema
```bash
apt update && apt upgrade -y
```

### 3. Instale o Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

### 4. Instale o PM2 globalmente
```bash
npm install -g pm2
```

### 5. Instale dependências necessárias
```bash
apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

### 6. Crie o diretório do projeto
```bash
mkdir /opt/whatsapp-bot
cd /opt/whatsapp-bot
```

### 7. Crie os arquivos do projeto

#### Arquivo server.js
```bash
nano server.js
```
*Cole o conteúdo do arquivo server.js*

#### Arquivo package.json
```bash
nano package.json
```
*Cole o conteúdo do arquivo package.json*

#### Arquivo ecosystem.config.js
```bash
nano ecosystem.config.js
```
*Cole o conteúdo do arquivo ecosystem.config.js*

### 8. Crie a pasta public e o arquivo HTML
```bash
mkdir public
nano public/index.html
```
*Cole o conteúdo do arquivo index.html*

### 9. Instale as dependências
```bash
npm install
```

### 10. Crie pasta de logs
```bash
mkdir logs
```

## 🔧 Configuração

### 1. Configure sua API Key do YouTube
Edite o arquivo `server.js` e substitua a API Key do YouTube:
```javascript
const YOUTUBE_API_KEY = "SUA_API_KEY_AQUI";
const CANAL_ID = "SEU_CANAL_ID_AQUI";
```

### 2. Configure o firewall (se necessário)
```bash
ufw allow 3000
ufw enable
```

## 🚀 Inicialização

### 1. Inicie o bot com PM2
```bash
pm2 start ecosystem.config.js
```

### 2. Salve a configuração do PM2
```bash
pm2 save
pm2 startup
```

### 3. Configure o PM2 para iniciar automaticamente
```bash
# Execute o comando que aparece após o 'pm2 startup'
# Geralmente será algo como:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

## 📱 Como usar

### 1. Acesse a interface web
Abra seu navegador e vá para: `http://SEU_IP_VPS:3000`

### 2. Conecte o WhatsApp
- Escaneie o QR Code que aparece na tela
- Aguarde a confirmação de conexão

### 3. Configure os agendamentos
- Selecione os grupos onde deseja enviar
- Configure horários e dias
- Clique em "Salvar Agendamento"

### 4. Teste o envio
- Use o botão "Testar Envio" para verificar se está funcionando

## 📊 Monitoramento

### Ver logs em tempo real
```bash
pm2 logs whatsapp-youtube-bot
```

### Ver status dos processos
```bash
pm2 status
```

### Reiniciar o bot
```bash
pm2 restart whatsapp-youtube-bot
```

### Parar o bot
```bash
pm2 stop whatsapp-youtube-bot
```

## 🔒 Segurança

### 1. Configure um proxy reverso (Nginx) - Opcional
```bash
apt install nginx

# Configure nginx
nano /etc/nginx/sites-available/whatsapp-bot
```

Conteúdo do arquivo nginx:
```nginx
server {
    listen 80;
    server_name SEU_DOMINIO_OU_IP;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 2. Configure SSL com Certbot (Opcional)
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d SEU_DOMINIO
```

## 🚨 Solução de Problemas

### Bot não conecta
1. Verifique se todas as dependências estão instaladas
2. Veja os logs: `pm2 logs whatsapp-youtube-bot`
3. Reinicie: `pm2 restart whatsapp-youtube-bot`

### QR Code não aparece
1. Aguarde alguns minutos
2. Limpe os dados de autenticação: `rm -rf .wwebjs_auth`
3. Reinicie o bot

### Grupos não aparecem
1. Certifique-se de que o WhatsApp está conectado
2. Aguarde a sincronização dos grupos
3. Recarregue a página

## 📝 Arquivos importantes

- `server.js` - Servidor principal
- `schedules.json` - Agendamentos salvos (criado automaticamente)
- `.wwebjs_auth/` - Dados de autenticação do WhatsApp
- `logs/` - Logs do sistema

## 🔄 Atualizações

Para atualizar o bot:
```bash
cd /opt/whatsapp-bot
pm2 stop whatsapp-youtube-bot
# Faça suas alterações
pm2 start whatsapp-youtube-bot
```

## ⚠️ Importante

- Mantenha sempre um backup dos arquivos `schedules.json` e `.wwebjs_auth/`
- Monitore os logs regularmente
- A sessão do WhatsApp pode expirar periodicamente, necessitando reautenticação
- Use sempre a versão mais recente do whatsapp-web.js

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `pm2 logs`
2. Consulte a documentação do whatsapp-web.js
3. Verifique se todas as dependências estão atualizadas