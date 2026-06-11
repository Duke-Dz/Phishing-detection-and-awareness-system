# PDAS Postman Collection

API testing files for the Phishing Detection and Awareness System. These files are **not** used by the backend at runtime — import them into [Postman](https://www.postman.com/) only.

## Files

| File | Committed | Purpose |
|------|-----------|---------|
| `PDAS_API_Collection.json` | Yes | All API request definitions |
| `PDAS_Environment.example.json` | Yes | Template environment (no tokens) |
| `PDAS_Environment.json` | No (gitignored) | Your local environment with saved tokens |

## Setup

1. Import `PDAS_API_Collection.json` into Postman.
2. Copy the example environment to a local file:
   ```bash
   cp postman/PDAS_Environment.example.json postman/PDAS_Environment.json
   ```
   On Windows (PowerShell):
   ```powershell
   Copy-Item postman/PDAS_Environment.example.json postman/PDAS_Environment.json
   ```
3. Import `PDAS_Environment.json` into Postman and select **PDAS Local Development**.
4. Ensure the backend is running (`pdas-backend`, default port `5000`).
5. Run **Register Admin (First User)** or **Login** — tokens auto-save to the environment.

## Test flow

Register → Login → Scan URL → Check Notifications → Create Report

## Notes

- Keep `PDAS_Environment.json` local only. It stores JWT tokens after login tests.
- The collection lives at the **project root**, separate from `pdas-backend/`, so deployment and app code stay clean.
