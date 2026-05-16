@AGENTS.md

# Kodstil och best practice

Håll alltid koden i linje med etablerade best practices för respektive teknologi:

- **TypeScript** — strikta typer, undvik `any`, använd interfaces/types konsekvent
- **React / Next.js** — följ App Router-konventioner, håll komponenter fokuserade, undvik onödig state
- **Supabase** — RLS på alla tabeller, verifiera alltid att inloggad user äger resursen innan läs/skriv
- **Säkerhet** — validera indata vid alla systembgränser, aldrig exponera admin-nycklar i klienten
- **Allmänt** — inga duplicerade abstraktioner, inga halvfärdiga lösningar, inga kommentarer som förklarar vad koden gör
