# 🚀 Guia de Instalação - WhatsApp YouTube Bot

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