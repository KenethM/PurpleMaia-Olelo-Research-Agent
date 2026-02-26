# Lib Layer

The **`src/lib`** directory contains low‑level utility code and shared business logic that can be used across the whole project.

- **Authentication helpers** (`auth/`) implement login, token handling, session validation, and rate‑limiting logic.
- **Utility functions** (`utils.ts`) provide generic helpers such as date formatting, error handling, and other pure functions.
- **Error definitions** (`errors.ts`) centralise custom error classes so that services and API routes can throw consistent error types.

The lib layer should be **framework‑agnostic**; it does not contain React components or UI code. Think of it as the **core toolkit** that the rest of the application builds upon.
