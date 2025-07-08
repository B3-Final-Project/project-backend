# Dating App Backend

## Technologies Used

- **Node.js**: JavaScript runtime for server-side applications.
- **NestJS**: Progressive Node.js framework for building efficient, scalable server-side applications.
- **TypeORM**: ORM for TypeScript and JavaScript (ES7, ES6, ES5).
- **PostgreSQL**: Relational database used for persistent storage.
- **AWS SSO & SOPS**: Secure management of secrets and AWS authentication.
- **Docker Compose**: For local development and service orchestration.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repo-url>
cd projet-b3-backend
```

### 2. AWS SSO Login

You need access to AWS resources for secrets decryption and other operations. The AWS SSO configuration is found in the parent `docker compose` module, you will need a registered user in the aws console to decrypt the env variables, to get a user, please contact the admin (Max PINDER-WHITE)

```bash
aws sso login --profile b3
```

> **Note:** Ensure your AWS config and credentials are set up as described in the infra module.

### 3. Decrypt Environment Files

This project uses [SOPS](https://github.com/mozilla/sops) for managing encrypted environment files. Make sure SOPS is installed on your machine.

- Ensure your `.env` files use **LF (Line Feed)** line endings (not CRLF).
- Place the encrypted `.env` files in the project root as required.

To decrypt all environment files:

```bash
npm run sops:decrypt
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

The server should now be running locally. By default, it will connect to the database and other services as configured in your environment files.

---

## Additional Notes

- For more details on AWS SSO or SOPS setup, refer to the documentation in the parent infrastructure module (`projet-infra`).
- If you encounter issues with environment variables, double-check line endings and decryption status.
- For Docker-based development, use the provided `docker-compose.yml`.

---

## License

MIT



