# AWB Tracker - Deployment Guide

Complete guide for deploying AWB Tracker to production.

## Quick Start

### Prerequisites
- Docker 24.0+ and Docker Compose v2.0+
- Git
- Domain name (for production)
- Server with 2GB+ RAM, 20GB+ disk

### Local Development

```bash
# Clone the repository
git clone https://github.com/dekolor/awb_tracker.git
cd awb_tracker

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Deploy locally
./deploy.sh local
```

Access at: http://localhost:8000

Default login: `test@example.com` / `password123`

### Production Deployment

#### Option 1: VPS (Recommended)

1. **Provision a server** (DigitalOcean, Hetzner, AWS, etc.)
   - Ubuntu 22.04 LTS
   - 2GB RAM minimum
   - 20GB SSD

2. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Clone and configure**
   ```bash
   git clone https://github.com/dekolor/awb_tracker.git
   cd awb_tracker
   cp .env.example .env
   nano .env  # Configure for production
   ```

4. **Configure .env for production**
   ```env
   APP_NAME="AWB Tracker"
   APP_ENV=production
   APP_KEY=  # Generate with: openssl rand -base64 32
   APP_DEBUG=false
   APP_URL=https://your-domain.com

   DB_CONNECTION=mysql
   DB_HOST=db
   DB_PORT=3306
   DB_DATABASE=awb_tracker
   DB_USERNAME=awb_user
   DB_PASSWORD=your_secure_password_here
   DB_ROOT_PASSWORD=your_root_password_here

   # Carrier API Keys (get from providers)
   CARGUS_API_KEY=
   FAN_COURIER_API_KEY=
   SAMEDAY_API_KEY=

   # Discord webhook for notifications (optional)
   DISCORD_WEBHOOK_URL=
   ```

5. **Deploy**
   ```bash
   ./deploy.sh production
   ```

6. **Configure reverse proxy (nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

7. **Set up SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

#### Option 2: Using Pre-built Images (GitHub Container Registry)

```bash
# Pull the image
docker pull ghcr.io/dekolor/awb_tracker:latest

# Run with docker-compose
wget https://raw.githubusercontent.com/dekolor/awb_tracker/main/docker-compose.prod.yml
wget https://raw.githubusercontent.com/dekolor/awb_tracker/main/.env.example -O .env

# Edit .env with your settings
nano .env

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│  PHP-FPM    │────▶│   MySQL     │
│  (Web)      │     │   (App)     │     │  (Database) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Redis     │
                    │  (Cache/    │
                    │   Queue)    │
                    └─────────────┘
```

### Services

- **app**: PHP-FPM application server
- **nginx**: Web server and reverse proxy
- **db**: MySQL database
- **redis**: Cache and queue backend
- **scheduler**: Laravel scheduler worker
- **queue**: Laravel queue worker

## Maintenance

### Update Application

```bash
cd awb_tracker
git pull origin main
./deploy.sh production
```

### Backup Database

```bash
# Automated backup script
docker-compose -f docker-compose.prod.yml exec db mysqldump -u root -p awb_tracker > backup_$(date +%Y%m%d).sql
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f app
```

### Scale Queue Workers

```bash
docker-compose -f docker-compose.prod.yml up -d --scale queue=3
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check disk space
df -h

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Database connection failed

```bash
# Check if DB is healthy
docker-compose -f docker-compose.prod.yml ps

# Check DB logs
docker-compose -f docker-compose.prod.yml logs db

# Reset database (WARNING: data loss)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Permission errors

```bash
# Fix storage permissions
docker-compose -f docker-compose.prod.yml exec app chown -R www-data:www-data /var/www/storage
```

## Security Checklist

- [ ] Change default database passwords
- [ ] Set strong APP_KEY
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Disable APP_DEBUG in production
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Log monitoring enabled

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_NAME` | Application name | Yes |
| `APP_ENV` | Environment (local/production) | Yes |
| `APP_KEY` | Encryption key | Yes |
| `APP_URL` | Base URL | Yes |
| `DB_*` | Database configuration | Yes |
| `CARGUS_API_KEY` | Cargus carrier API | No |
| `FAN_COURIER_API_KEY` | Fan Courier API | No |
| `SAMEDAY_API_KEY` | Sameday API | No |
| `DISCORD_WEBHOOK_URL` | Discord notifications | No |

## Support

For issues and feature requests, visit: https://github.com/dekolor/awb_tracker/issues
