# Run the backend in Docker (with MongoDB)

## 1) Requirements
- Docker Desktop 4.x+ or Docker Engine 24+
- Docker Compose V2 (usually already included)

Check:
```bash
docker --version
docker compose version
```

## 2) Start containers
```bash
docker compose up -d --build
```

API → http://localhost:$PORT  
MongoDB → $MONGO_URI

Healthcheck:
```bash
curl http://localhost:$PORT/health
```

## 3) Stop and logs
```bash
docker compose logs -f app

docker compose down

docker compose down -v   
```

## 4) Work with Mongo
Enter Mongo shell inside container:
```bash
docker compose exec mongo mongosh
```
