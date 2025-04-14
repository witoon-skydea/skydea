# Skydea

A modern web application with user registration and login functionality, featuring an elegant and responsive UI.

![Skydea](https://via.placeholder.com/800x400?text=Skydea+Web+Application)

## Key Features

- **Secure User Registration** - Create your account with validation
- **User Authentication** - Robust login/logout functionality
- **Interactive Dashboard** - Modern, data-rich user dashboard  
- **Fully Responsive Design** - Looks great on mobile, tablet, and desktop
- **SQLite Database** - Fast and lightweight data storage
- **Reverse Proxy Support** - Configurable base path for flexible deployment
- **Modern UI** - Clean, intuitive interface with animations and visual feedback

## Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite** - Embedded database
- **EJS** - Templating engine
- **Bootstrap 5** - Frontend framework
- **Font Awesome** - Icon library
- **Bcrypt** - Secure password hashing

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd skydea
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   SESSION_SECRET=your_secret_key
   APP_BASE_PATH=/
   NODE_ENV=development
   DB_PATH=./database.sqlite
   ```

4. Start the application:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

5. Access the application at http://localhost:3000

## Deployment

### Reverse Proxy Configuration

This application supports deployment behind a reverse proxy using a sub-path. Set the `APP_BASE_PATH` environment variable to the sub-path (e.g., `/skydea`).

### Oracle Cloud Deployment

To deploy the application to Oracle Cloud:

1. Make sure the project is pushed to GitHub:
   ```
   git push origin main
   ```

2. Run the Oracle deployment script:
   ```
   ./oracle-deploy.sh
   ```

   This script will:
   - Push the latest code to GitHub
   - Connect to the Oracle Cloud instance
   - Clone or update the repository on the server
   - Install dependencies
   - Configure environment variables
   - Set up PM2 for process management
   - Configure Nginx with the correct sub-path settings
   - Reload Nginx to apply the changes

3. After deployment, the application will be available at:
   ```
   http://140.245.58.185/skydea
   ```

### Manual Oracle Cloud Deployment

If you prefer to deploy manually:

1. SSH into the server:
   ```
   ssh -i /path/to/ssh-key.key ubuntu@140.245.58.185
   ```

2. Clone the repository:
   ```
   mkdir -p ~/skydea
   cd ~/skydea
   git clone https://github.com/witoon-skydea/skydea .
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file:
   ```
   echo "PORT=3001
   APP_BASE_PATH=/skydea
   NODE_ENV=production
   SESSION_SECRET=$(openssl rand -base64 32)" > .env
   ```

5. Install and configure PM2:
   ```
   npm install pm2 -g
   pm2 start src/server.js --name skydea
   pm2 save
   pm2 startup
   ```

6. Configure Nginx:
   ```
   sudo nano /etc/nginx/sites-available/skydea.conf
   ```

   Add the following content:
   ```
   location /skydea/ {
       proxy_pass http://localhost:3001/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_cache_bypass $http_upgrade;
   }
   ```

7. Include the configuration in the main Nginx config:
   ```
   sudo nano /etc/nginx/sites-available/multi-path-apps.conf
   ```

   Add this line inside the server block:
   ```
   include /etc/nginx/sites-available/skydea.conf;
   ```

8. Test and reload Nginx:
   ```
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Project Structure

```
skydea/
├── public/               # Static assets
│   ├── css/              # CSS files
│   ├── js/               # JavaScript files
│   └── images/           # Image files
├── src/
│   ├── config/           # Application configuration
│   ├── controllers/      # Route controllers
│   ├── middlewares/      # Custom middlewares
│   ├── models/           # Data models
│   ├── routes/           # Express routes
│   ├── views/            # EJS templates
│   │   └── layouts/      # Layout templates
│   └── server.js         # Application entry point
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
├── package.json          # npm package configuration
├── deploy.sh             # Deployment script
├── test-locally.sh       # Local testing script
├── test-subpath.sh       # Subpath testing script
└── README.md             # Project documentation
```

## Screenshots

### Home Page
![Home Page](https://via.placeholder.com/800x400?text=Skydea+Home+Page)

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Skydea+Dashboard)

## Roadmap

- [ ] User profile management
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Admin dashboard
- [ ] User roles and permissions

## License

ISC

## Developer

Developed by Witoon Pongsilathong