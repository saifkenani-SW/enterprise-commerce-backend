# Enterprise Commerce Backend 🚀

This is a robust, scalable backend system built with **NestJS**, following **Clean Architecture** principles and **Domain-Driven Design (DDD)** concepts.

## 🛠 Tech Stack & Infrastructure

* **Framework:** NestJS
* **Database:** PostgreSQL (via TypeORM)
* **Caching:** Redis
* **Distributed Locks:** Redis
* **Message Queues:** BullMQ (Backed by Redis)
* **Containerization:** Docker & Docker Compose
* **ORM:** TypeORM

---

## 🚦 Prerequisites

Before you begin, ensure you have the following installed on your machine:

* [Node.js](https://nodejs.org/) (v18 or higher)
* [Docker](https://www.docker.com/)
* Docker Compose V2
* Git

---

# 🚀 Getting Started (Local Development)

Follow these steps to set up and run the project locally.

> ⚠️ **IMPORTANT**
>
> You **MUST** start the Docker infrastructure (Step 3) before running the NestJS application.
>
> The application depends on PostgreSQL and Redis during startup and will fail to boot if they are unavailable.

---

## 1. Clone the Repository

You can clone the repository using either HTTPS or SSH.

### Via HTTPS

```bash
git clone https://github.com/saifkenani-SW/enterprise-commerce-backend.git

cd enterprise-commerce-backend
```

### Via SSH

```bash
git clone git@github.com:saifkenani-SW/enterprise-commerce-backend.git

cd enterprise-commerce-backend
```

---

## 2. Environment Setup

Create your local environment file:

```bash
cp .env.example .env
```

Example `.env`:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=parallel_programming

REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=
REDIS_DB=0

REDIS_QUEUE_DB=1
```

> ⚠️ Never commit real credentials to Git.

---

## 3. Start Infrastructure (Required)

Start PostgreSQL and Redis containers:

```bash
docker compose up -d
```

Verify containers are running:

```bash
docker ps
```

Expected services:

* PostgreSQL
* Redis

---

## 4. Install Dependencies

```bash
npm install
```

---

## 5. Start the Application

Run the NestJS application in development mode:

```bash
npm run start:dev
```

If everything is configured correctly, you should see:

```text
Cache Connected: PONG
Lock Connected: PONG
Nest application successfully started
Application is running on: http://localhost:3000
```

---

# 🐳 Docker Infrastructure

The project ships with Docker Compose for local infrastructure.

Services:

| Service    | Port |
| ---------- | ---- |
| PostgreSQL | 5433 |
| Redis      | 6380 |

Start:

```bash
docker compose up -d
```

Stop:

```bash
docker compose down
```

Remove volumes:

```bash
docker compose down -v
```

---

# 🔐 Redis Features

This project includes:

* Cache abstraction layer
* Distributed locking
* BullMQ queue backend
* Dedicated Redis database for queues

---

# 📬 BullMQ Queues

BullMQ is used for background processing.

Features:

* Job retries
* Backoff strategies
* Dead Letter Queue (DLQ)
* Bull Board dashboard
* Redis-backed workers

---

# 📊 Queue Dashboard

Bull Board dashboard is available at:

```text
http://localhost:3000/admin/queues
```

Use it to:

* Monitor jobs
* Retry failed jobs
* Inspect queue status
* View completed jobs

---

# 🏗 Project Structure

```text
src/
├── libs/
│   ├── cache/
│   ├── lock/
│   └── bullmq/
│
├── module/
│   ├── user/
│   ├── product/
│   ├── inventory/
│   ├── order/
│   └── payment/
│
└── app.module.ts
```

---

# 🧪 Development Commands

Run application:

```bash
npm run start:dev
```

Build project:

```bash
npm run build
```

Run production build:

```bash
npm run start:prod
```

Run linter:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

---

# 📄 License

This project is licensed under the MIT License.
