# Källdokument (PDF:er)

PDF:erna som ingest-skripten läser in i RAG-databasen kommer från tredje part
(AKC, SKK, FCI, ASPCA, RSPCA, NAVHDA, AVSAB m.fl.). De ligger inte i git:

- Vi har inte rätt att distribuera andras PDF:er vidare genom repot.
- De tog upp ~105 MB, mer än all kod tillsammans.

Istället finns de i en **privat** Supabase Storage-bucket, `source-documents`.
[`source-documents.json`](source-documents.json) är manifestet: sökväg i
repot, storlek, sha256 och ursprunglig käll-URL för varje fil. I bucketen lagras
varje fil som `<sha256>.pdf`.

## Hämta filerna (för att köra ingest)

```bash
npm run docs:pull
```

Laddar ner de filer som saknas eller ändrats till sina vanliga sökvägar under
`docs/`, och kontrollerar checksumman. Därefter fungerar `npm run ingest:*` som
vanligt. Kräver `NEXT_PUBLIC_SUPABASE_URL` och `SUPABASE_SERVICE_ROLE_KEY` i
`.env.local`.

## Lägga till ett nytt dokument

```bash
npx tsx scripts/source-docs.ts add docs/nytt-dokument.pdf https://kalla.example/original.pdf
npm run docs:push
```

`add` uppdaterar manifestet (committa det), `push` laddar upp filen. `.gitignore`
hindrar att PDF:en själv committas.

## Första uppladdningen

Den som har PDF:erna lokalt (de fanns i repot fram till och med commit
`7b01a25`) kör en gång:

```bash
npm run docs:push
```

Skriptet skapar bucketen som privat om den saknas och vägrar köra mot en
publik bucket.

## Historiken

Filerna ligger kvar i git-historiken. Om repot ska bli publikt eller storleken
blir ett problem: rensa dem med `git filter-repo --path-glob 'docs/**/*.pdf'
--invert-paths` och force-pusha – samordna med alla som har klonat repot först.

## Filer utan känd källa

`docs/homologation titre travail_0.pdf` och
`docs/training-guides/dog-training-101.pdf` används inte av något skript och
saknar käll-URL. Fyll i källan eller ta bort dem ur manifestet.
