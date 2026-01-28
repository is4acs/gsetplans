# GSET PLANS - Dashboard FTTH D3 Guyane

Application de suivi et gestion des interventions FTTH pour GSET Caraïbes.

## Stack technique

- React 18
- Vite 5
- TailwindCSS 3
- Supabase (auth + database)
- Recharts
- XLSX

## Installation

```bash
npm install
npm run dev
```

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter les scripts SQL dans l'ordre :
   - `sql/supabase-schema.sql` (schéma principal)
   - `sql/supabase-daily-schema.sql` (suivi journalier)
3. Copier l'URL et la clé anon dans `src/lib/supabase.js`

## Structure

```
├── src/
│   ├── App.jsx              # Application principale
│   ├── SuiviJournalier.jsx  # Composant suivi journalier
│   ├── main.jsx             # Point d'entrée
│   ├── index.css            # Styles globaux
│   └── lib/
│       └── supabase.js      # Client Supabase
├── public/
│   └── logo.svg             # Logo
├── sql/
│   ├── supabase-schema.sql
│   └── supabase-daily-schema.sql
└── index.html
```

## Scripts

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Preview du build
