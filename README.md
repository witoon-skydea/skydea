# Skydea

A web application with user registration and login functionality.

## Features

- User registration
- User authentication (login/logout)
- User dashboard
- Responsive design
- SQLite database storage
- Support for reverse proxy deployment

## Technology Stack

- Node.js
- Express.js
- SQLite
- EJS templates
- Bootstrap 5

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
└── README.md             # Project documentation
```

## License

ISC