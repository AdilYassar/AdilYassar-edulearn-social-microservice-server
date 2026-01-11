# Social Microservice 🚀

A comprehensive social collaboration backend for the EduLearn platform. Handles friends, chat, groups, feed, notifications, and media uploads.

## 🛠️ Prerequisites

Ensure you have the following installed:

1.  **Node.js** (v16+)
2.  **MongoDB** (Atlas functionality connected!)
3.  **Redis** (For caching and socket presence)
4.  **RabbitMQ** (For async messaging/sync with Quiz Server)

## 🚀 Getting Started

### 1. Environment Setup

The `.env` file is already configured with your MongoDB Atlas connection and API tokens.

### 2. Dependency Installation

```bash
npm install
```

### 3. Run Dependencies (Redis & RabbitMQ)

If you have Docker installed, simply run:

```bash
docker-compose up -d
```

*This will start Redis on port 6379 and RabbitMQ on port 5672.*

**If you do NOT have Docker:**
1.  Install **Redis** for Windows: [Download Here](https://github.com/microsoftarchive/redis/releases)
2.  Install **RabbitMQ** (requires Erlang): [Download Here](https://www.rabbitmq.com/download.html)
3.  Start both services manually.

### 4. Start the Server

```bash
npm run dev
```

The server will start on port `3001` (or defined PORT). 
*Note: Ensure your Quiz Server is also running.*

## 🔗 Integration with Quiz Server

This microservice relies on the Quiz Server for user authentication and data syncing.
Please refer to `QUIZ_SERVER_INTEGRATION.md` for the specific code changes needed in your Quiz Server to enable secure communication.

## 📂 Project Structure

- `src/api/v1` - REST API Routes and Controllers
- `src/services` - core Business Logic
- `src/repositories` - Database Access Layer
- `src/models` - Mongoose Models
- `src/socket` - Real-time Socket.io handlers
- `src/queues` - BullMQ Background Jobs
- `src/config` - Configuration files

## ✅ Features Implemented

*   **Google Drive Integration:** Uploads files to your Drive folder.
*   **Real-time Chat:** 1-on-1 and Group messaging.
*   **Friend System:** Send, accept, reject, block requests.
*   **Social Feed:** Posts, likes, comments with visibility settings.
*   **Notifications:** Real-time system notifications.
*   **Security:** JWT Auth & Internal Service Tokens.
