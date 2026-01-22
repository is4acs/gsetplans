# Guide d'intégration - Module Suivi Journalier

## Étapes d'intégration dans App.jsx

### 1. Import du composant
Ajouter en haut de `App.jsx` :
```javascript
import SuiviJournalier from './components/SuiviJournalier';
```

### 2. Ajouter l'onglet dans la navigation
Dans la sidebar, ajouter après les autres onglets :

```javascript
// Dans le code de la sidebar, ajouter cette ligne :
<NavItem 
  icon={Calendar} 
  label="Suivi Journalier" 
  active={activeTab === 'suivi'} 
  onClick={() => setActiveTab('suivi')} 
/>
```

### 3. Ajouter le rendu conditionnel
Dans le rendu principal, ajouter :

```javascript
{activeTab === 'suivi' && (
  <SuiviJournalier 
    theme={theme}
    userRole={user?.role || 'tech'}
    currentTechName={user?.role === 'tech' ? user?.name : null}
  />
)}
```

## Fonctionnalités

### Import de fichier
- Le composant attend le fichier Excel mensuel SUIVI_D3
- Parse automatiquement les feuilles "SUIVI JOURNALIER CANAL" et "SUIVI JOURNALIER ORANGE"
- Extrait les colonnes : technicien, date, OT planifiés, réalisés, OK, NOK, reportés, taux

### Filtrage
- **Période** : 7 jours, 30 jours, ou tout
- **Type** : Orange, Canal, ou les deux
- **Technicien** : automatique selon le rôle (tech voit ses données, admin voit tout)

### Visualisations
1. **Cards de stats** : Planifiés, Réalisés, Taux Réussite, Taux Échec
2. **Graphique évolution** : Ligne temporelle planifiés vs réalisés
3. **Graphique OK/NOK** : Barres comparatives par jour
4. **Table détaillée** : Toutes les données avec tri par date

### Stockage
- LocalStorage : `gsetplans_suivi`
- Données persistantes entre sessions
- Bouton "Effacer" pour reset

## Structure des données attendues

Le fichier SUIVI doit avoir les feuilles :
- `SUIVI JOURNALIER CANAL` avec colonnes : Nom technicien, Date, État, OT planifiés, OT Réalisé, etc.
- `SUIVI JOURNALIER ORANGE` avec la même structure

Les noms de techniciens dans ces feuilles sont des alias qui seront affichés tels quels.

## Personnalisations possibles

### Moyenne de prix d'intervention
Si vous souhaitez calculer un prix moyen d'intervention basé sur vos grilles tarifaires, ajouter dans le composant :

```javascript
// Dans le calcul des stats
const prixMoyenOrange = 153.42; // moyenne de vos tarifs Orange
const prixMoyenCanal = 180.50; // moyenne de vos tarifs Canal

const montantEstime = 
  (stats.ok * (selectedType === 'CANAL' ? prixMoyenCanal : 
   selectedType === 'ORANGE' ? prixMoyenOrange : 
   (prixMoyenOrange + prixMoyenCanal) / 2));
```

### Couleurs personnalisées
Les couleurs sont déjà harmonisées avec votre thème teal/emerald. Modifiables via :
- Cards : classes `bg-emerald-50`, `text-emerald-500`
- Graphiques : propriétés `stroke` et `fill`

## Notes importantes
- Les données de suivi ne sont pas liées aux imports RCC/Canal existants
- C'est un module indépendant pour le suivi interne quotidien
- Les noms affichés sont ceux présents dans le fichier SUIVI (alias)
