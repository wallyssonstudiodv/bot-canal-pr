# 🤖 WhatsApp YouTube Bot - Wallysson Studio Dv 2025

Sistema completo de automação para WhatsApp com interface web moderna, desenvolvido com Baileys e Node.js. Permite envio automático de vídeos do YouTube para grupos do WhatsApp em horários agendados.

## ✨ Características

- 🔐 **Sistema Multi-usuário** - Cada usuário tem sua própria instância do bot
- 📱 **Interface Web Moderna** - Design responsivo com modo noturno
- 🎯 **Agendamento Inteligente** - Configure dias e horários específicos
- 👥 **Gestão de Grupos** - Selecione quais grupos receber o conteúdo
- 📊 **Dashboard Completo** - Estatísticas em tempo real
- 🔄 **Conexão QR Code** - Conecte facilmente via QR Code
- 💾 **Persistência JSON** - Dados salvos localmente
- 🛡️ **Segurança JWT** - Autenticação segura

## 🚀 Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **WhatsApp:** @whiskeysockets/baileys
- **Autenticação:** JWT, bcryptjs
- **Agendamento:** node-cron
- **Interface:** HTML5, CSS3, JavaScript vanilla
- **Comunicação:** Socket.IO
- **Banco de Dados:** JSON (file-based)

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/whatsapp-youtube-bot.git
cd whatsapp-youtube-bot
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente (opcional)
```bash
# Crie um arquivo .env na raiz do projeto
PORT=3000
JWT_SECRET=seu-jwt-secret-aqui
```

### 4. Execute o projeto
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

### 5. Acesse o sistema
Abra seu navegador e acesse: `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
whatsapp-youtube-bot/
├── src/
│   ├── whatsapp-bot.js       # Classe principal do bot WhatsApp
│   └── data-manager.js       # Gerenciamento de dados JSON
├── public/
│   └── index.html           # Interface web completa
├── data/                    # Dados dos usuários (JSON)
├── sessions/                # Sessões do WhatsApp (criado automaticamente)
├── server.js               # Servidor principal
├── package.json
└── README.md
```

## 🔧 Configuração

### Configurar API do YouTube

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do YouTube Data v3
4. Crie uma chave de API
5. Substitua a chave no arquivo `src/whatsapp-bot.js`:

```javascript
this.youtubeApiKey = "SUA_CHAVE_API_AQUI";
this.canalId = "ID_DO_CANAL_AQUI";
```

### Personalizar Canal

No arquivo `src/whatsapp-bot.js`, altere o ID do canal:

```javascript
this.canalId = "UCh-ceOeY4WVgS8R0onTaXmw"; // Substitua pelo ID do seu canal
```

## 📱 Como Usar

### 1. Registro/Login
- Acesse o sistema pela primeira vez
- Crie uma conta com email e senha
- Faça login para acessar o dashboard

### 2. Conectar WhatsApp
- Clique em "Conectar WhatsApp"
- Escaneie o QR Code com seu WhatsApp
- Aguarde a confirmação de conexão

### 3. Configurar Agendamentos
- Selecione os grupos desejados
- Defina nome, horário e dias da semana
- Salve o agendamento

### 4. Monitoramento
- Acompanhe estatísticas em tempo real
- Ative/desative agendamentos conforme necessário
- Gerencie múltiplas configurações

## 🔒 Segurança

- Senhas criptografadas com bcryptjs
- Autenticação JWT
- Sessions isoladas por usuário
- Validação de dados em todas as rotas

## 📊 Funcionalidades

### Dashboard
- Conexão em tempo real
- Estatísticas de envio
- Gerenciamento de grupos
- Controle de agendamentos

### Bot WhatsApp
- Envio automático de vídeos
- Download de thumbnails
- Mensagens personalizadas
- Controle de intervalo entre envios

### Agendamento
- Múltiplos horários por dia
- Seleção de dias da semana
- Grupos específicos por agendamento
- Ativação/desativação individual

## 🛠️ Desenvolvimento

### Executar em modo desenvolvimento
```bash
npm run dev
```

### Estrutura de dados
```json
{
  "userId": "12345",
  "groups": [
    {
      "id": "grupo_id",
      "name": "Nome do Grupo",
      "participants": 150
    }
  ],
  "schedules": [
    {
      "id": "schedule_id",
      "name": "Divulgação Diária",
      "time": "09:00",
      "days": [1, 2, 3, 4, 5],
      "groups": ["grupo_id_1", "grupo_id_2"],
      "active": true
    }
  ],
  "stats": {
    "messagesSent": 1250,
    "videosShared": 45
  }
}
```

## 🐛 Solução de Problemas

### Bot não conecta
1. Verifique se o QR Code foi escaneado corretamente
2. Certifique-se de que o WhatsApp está ativo no celular
3. Tente desconectar e conectar novamente

### Grupos não carregam
1. Aguarde alguns segundos após a conexão
2. Certifique-se de que está em grupos do WhatsApp
3. Recarregue a página se necessário

### Agendamento não funciona
1. Verifique se o bot está conectado
2. Confirme se os grupos estão selecionados
3. Verifique o horário do servidor

## 🚀 Deploy em Produção

### VPS/Servidor Linux
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 para gerenciamento de processo
npm install -g pm2

# Clonar e configurar projeto
git clone seu-repositorio
cd whatsapp-youtube-bot
npm install

# Executar com PM2
pm2 start server.js --name "whatsapp-bot"
pm2 startup
pm2 save
```

### Configuração Nginx (opcional)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

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

## 📄 Licença

Este projeto está licenciado under MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Wallysson Studio Dv 2025**
- 🌐 Website: [wallyssonstudio.dev](https://wallyssonstudio.dev)
- 📧 Email: contato@wallyssonstudio.dev
- 💼 LinkedIn: [wallysson-dev](https://linkedin.com/in/wallysson-dev)

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## ⭐ Apoie o Projeto

Se este projeto te ajudou, considere dar uma ⭐ no repositório!

## 📞 Suporte

Para suporte técnico ou dúvidas:
- 📧 Email: suporte@wallyssonstudio.dev
- 💬 WhatsApp: +55 (82) 9999-9999
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/whatsapp-youtube-bot/issues)

---

<div align="center">
  <strong>🚀 Desenvolvido com ❤️ por Wallysson Studio Dv 2025</strong>
</div>