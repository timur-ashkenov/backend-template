# Local HTTPS Certificates

This folder is **not** meant to be versioned.  
All files inside `certs/` are ignored by git, except this README.

Each developer should generate their own local TLS certificates for `https://localhost:3000`.

---

## 1. Install mkcert

### macOS
```bash
brew install mkcert nss
mkcert -install
```

### Linux
1. Download mkcert binary from [https://github.com/FiloSottile/mkcert/releases](https://github.com/FiloSottile/mkcert/releases)  
2. Move it to your path and make it executable:
   ```bash
   sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
   sudo chmod +x /usr/local/bin/mkcert
   ```
3. Install local CA:
   ```bash
   mkcert -install
   ```

### Windows
1. Install [Chocolatey](https://chocolatey.org/install) (if not already installed).  
2. Run PowerShell as Administrator and install mkcert:
   ```powershell
   choco install mkcert
   mkcert -install
   ```

---

## 2. Generate localhost certificates
Run in the project root:

```bash
mkcert localhost 127.0.0.1 ::1
mkdir -p certs
mv localhost+2.pem certs/localhost.pem
mv localhost+2-key.pem certs/localhost.key
```

Now you should have:
```
certs/localhost.pem   # certificate
certs/localhost.key   # private key
```

---

## 3. Run the backend
Set the following in your `.env` (already supported in the code):

```env
HTTPS_ENABLED=true
HTTPS_CERT_PATH=./certs/localhost.pem
HTTPS_KEY_PATH=./certs/localhost.key
PORT=3000
```

Then start the server:
```bash
npm run dev
# or: yarn dev
```

Server will be available at:

👉 https://localhost:3000

---

⚠️ Do **not** commit the `.pem` or `.key` files to git.  
They are machine-specific and must be generated locally by each developer.
