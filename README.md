# GSET PLANS - FTTH D3 Guyane

Dashboard de gestion des interventions FTTH pour GSET Caraïbes.

## 🚀 Installation

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé `anon` (Settings > API)

### 2. Configurer la base de données

1. Dans Supabase, allez dans **SQL Editor**
2. Copiez le contenu de `supabase-schema.sql` et exécutez-le
3. Cela créera toutes les tables et insérera les prix par défaut

### 3. Configurer l'authentification

Dans Supabase Dashboard:
1. **Authentication > Settings > Email**
   - Activez "Enable Email Confirmations"
   - Configurez les templates d'email si souhaité

2. **Authentication > URL Configuration**
   - Site URL: `http://localhost:5173` (dev) ou votre domaine de production
   - Redirect URLs: Ajoutez `http://localhost:5173/*`

### 4. Créer le premier admin

1. Allez dans **Authentication > Users**
2. Cliquez sur "Add user" > "Create new user"
3. Entrez l'email admin et un mot de passe
4. Cochez "Auto Confirm User"
5. Allez dans **SQL Editor** et exécutez:
```sql
UPDATE public.profiles 
SET role = 'dir' 
WHERE email = 'votre-email-admin@exemple.com';
```

### 5. Configurer l'application

```bash
# Cloner et installer
cd ftth-dashboard
npm install

# Créer le fichier .env
cp .env.example .env

# Éditer .env avec vos identifiants Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon

# Lancer l'application
npm run dev
```

## 📱 Utilisation

### Connexion Admin
1. Connectez-vous avec l'email admin créé
2. Vous avez accès à:
   - **Dashboard**: Vue d'ensemble des interventions
   - **Import**: Importer des fichiers Excel
   - **Comptes**: Créer des comptes techniciens
   - **Grilles**: Modifier les tarifs Orange/Canal+

### Créer un technicien
1. Allez dans **Comptes**
2. Remplissez: identifiant, nom, email
3. Cliquez **Créer**
4. Le technicien recevra un email pour définir son mot de passe

### Première connexion technicien
1. Le technicien clique sur **"Mot de passe oublié"**
2. Entre son email
3. Reçoit un email avec un lien
4. Définit son mot de passe

### Import de fichiers
Formats supportés:
- **Orange RCC**: Fichiers avec feuilles "Récap" et "Détails"
- **Canal+ Power BI**: Export avec codes GSE
- **Canal+ GST**: Export avec noms directs

## 📊 Grilles tarifaires

### Orange (22 codes)
```
LSIM1-3, LSOU1-3, LSA1-3, ETCFO, ETCFO1
PLP1-3, SAVA1-3, PSER1-3, SANR, PLPS
```

### Canal+ (17 codes)
```
AERC, BPMS, CHRC, FARC, INRC, PBEA, PBEC
PBEF, PBIS, PDOS, SAVD, SAVS, SAVG
TXPA, TXPB, TXPC, TXPD
```

## 🔧 Structure de la base de données

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs (extension de auth.users) |
| `orange_prices` | Grille tarifaire Orange |
| `canal_prices` | Grille tarifaire Canal+ |
| `orange_interventions` | Interventions Orange |
| `canal_interventions` | Interventions Canal+ |
| `imports` | Historique des imports |

## 🛠 Technologies

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Excel**: SheetJS (xlsx)

## 📝 Notes

- Les prix sont stockés en base de données et modifiables
- L'authentification utilise Supabase Auth avec email/password
- Row Level Security (RLS) protège les données
- Les techniciens ne voient que leurs interventions
