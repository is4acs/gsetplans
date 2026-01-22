# Module Suivi Journalier - GSET PLANS

## 📋 Vue d'ensemble

Le module **Suivi Journalier** permet de tracker la progression quotidienne des techniciens D3 sur les interventions Orange et Canal+. Il utilise le fichier Excel mensuel SUIVI_D3 tenu en interne par votre agent de suivi.

## 🎯 Objectifs

- ✅ Visualiser la progression quotidienne de chaque technicien
- ✅ Comparer les performances Orange vs Canal+
- ✅ Calculer automatiquement les taux de réussite, échec, clôture
- ✅ Identifier les tendances et points d'amélioration
- ✅ Prix d'intervention basé sur moyenne des grilles tarifaires

## 📁 Fichiers livrés

1. **SuiviJournalier.jsx** - Composant React principal
2. **INTEGRATION_SUIVI.md** - Guide d'intégration dans App.jsx
3. **exemple_data_suivi.json** - Données d'exemple pour tests

## 🚀 Installation

### Option 1 : Intégration complète

1. Copier `SuiviJournalier.jsx` dans `/src/components/`
2. Suivre les étapes du fichier `INTEGRATION_SUIVI.md`
3. Ajouter l'import et l'onglet dans App.jsx

### Option 2 : Module autonome

Le composant peut fonctionner de manière autonome :

```javascript
import SuiviJournalier from './components/SuiviJournalier';

function App() {
  return (
    <SuiviJournalier 
      theme="light"
      userRole="admin"
      currentTechName={null}
    />
  );
}
```

## 📊 Utilisation

### 1. Import du fichier SUIVI

- Cliquer sur "Importer SUIVI"
- Sélectionner votre fichier Excel mensuel (ex: SUIVI_JANVIER_.xlsx)
- Le parser extrait automatiquement les feuilles "SUIVI JOURNALIER CANAL" et "SUIVI JOURNALIER ORANGE"

### 2. Données extraites

Pour chaque ligne :
- **Technicien** : Nom/alias du tech (tel que dans le fichier)
- **Date** : Date de l'intervention
- **Type** : ORANGE ou CANAL
- **OT Planifiés** : Nombre d'OT planifiés
- **OT Réalisés** : Nombre d'OT effectués
- **OK** : OT réussis
- **NOK** : OT en échec
- **Reportés** : OT reportés
- **Taux** : Réussite, Échec, Report, Clôture (calculés auto)

### 3. Filtres disponibles

#### Période
- **7 derniers jours** : Vue hebdomadaire
- **30 derniers jours** : Vue mensuelle
- **Tout** : Historique complet

#### Type d'intervention
- **Orange + Canal** : Vue combinée
- **Orange uniquement** : Interventions Orange
- **Canal uniquement** : Interventions Canal+

#### Technicien
- **Mode Admin** : Voir tous les techniciens
- **Mode Tech** : Voir uniquement ses propres données

## 📈 Visualisations

### 1. Cards de statistiques

| Métrique | Description |
|----------|-------------|
| **OT Planifiés** | Total des OT planifiés sur la période |
| **OT Réalisés** | Total réalisés + % de clôture |
| **Taux Réussite** | % d'OT OK + nombre total |
| **Taux Échec** | % d'OT NOK + nombre total |

### 2. Graphique d'évolution

Graphique en ligne montrant jour par jour :
- Ligne bleue : OT planifiés
- Ligne verte : OT réalisés

Permet d'identifier :
- Les jours de forte activité
- Les écarts planifié/réalisé
- Les tendances sur la période

### 3. Graphique OK vs NOK

Graphique en barres empilées par jour :
- Barre verte : OT OK
- Barre rouge : OT NOK

Permet d'identifier :
- Les jours problématiques
- Les ratios de réussite
- Les pics d'échecs

### 4. Table détaillée

Table complète avec toutes les données :
- Tri par date décroissante
- Couleurs par type (bleu = Canal, orange = Orange)
- Codes couleur sur taux de réussite :
  - Vert : ≥ 70%
  - Jaune : 50-70%
  - Rouge : < 50%

## 🔧 Configuration des prix moyens

Pour afficher un montant estimé basé sur vos grilles tarifaires :

```javascript
// Dans SuiviJournalier.jsx, ajouter dans le calcul des stats :

// Calculer prix moyens depuis vos grilles
const prixMoyenOrange = 153.42; // Moyenne AERC, BPMS, CHRC, FARC, etc.
const prixMoyenCanal = 180.50;  // Moyenne PBEA, PBEC, PBEF, etc.

const montantEstime = stats.ok * (
  selectedType === 'CANAL' ? prixMoyenCanal :
  selectedType === 'ORANGE' ? prixMoyenOrange :
  (prixMoyenOrange + prixMoyenCanal) / 2
);

// Ajouter une card supplémentaire
<StatCard
  icon={Euro}
  label="Montant Estimé"
  value={`${montantEstime.toFixed(2)}€`}
  theme={t}
  color="emerald"
  subValue={`Basé sur ${stats.ok} OT OK`}
/>
```

## 📝 Format du fichier SUIVI

Le fichier Excel doit contenir les feuilles suivantes :

### SUIVI JOURNALIER CANAL
```
| Nom technicien | Equipe | Date | État | OT planifiés | OT Réalisé | OT OK | OT NOK | OT Reportes | ... |
|----------------|--------|------|------|--------------|------------|-------|--------|-------------|-----|
| Maxime Paul    | D3     | ...  | ...  | 8           | 7          | 5     | 2      | 1           | ... |
```

### SUIVI JOURNALIER ORANGE
```
| Nom technicien | Equipe | Date | État | OT planifiés | OT Réalisé | OT OK | OT NOK | OT Reportes | ... |
|----------------|--------|------|------|--------------|------------|-------|--------|-------------|-----|
| Zakaria Settou | D3     | ...  | ...  | 5           | 5          | 4     | 1      | 0           | ... |
```

## 💾 Stockage des données

- **LocalStorage** : Clé `gsetplans_suivi`
- **Format** : JSON array d'objets
- **Persistance** : Données sauvegardées entre sessions
- **Reset** : Bouton "Effacer" pour supprimer toutes les données

## 🎨 Personnalisation

### Thèmes
Le composant supporte les thèmes `light` et `dark` via la prop `theme`.

### Couleurs
Modifiables via les classes Tailwind :
- Primary : `emerald-500`
- Success : `green-500`
- Error : `red-500`
- Warning : `yellow-500`
- Info : `blue-500`

### Graphiques
Couleurs et styles Recharts modifiables dans :
- `LineChart` : propriété `stroke`
- `BarChart` : propriété `fill`

## 🐛 Debugging

### Les données ne s'affichent pas
1. Vérifier la console : erreurs de parsing ?
2. Vérifier les noms de feuilles Excel (doivent être exactement "SUIVI JOURNALIER CANAL" et "SUIVI JOURNALIER ORANGE")
3. Vérifier le format des dates dans Excel
4. Vérifier localStorage : `localStorage.getItem('gsetplans_suivi')`

### Filtres ne fonctionnent pas
1. Vérifier que `userRole` est passé correctement
2. Vérifier que `currentTechName` correspond aux noms dans le fichier
3. Les noms sont sensibles à la casse et espaces

### Graphiques vides
1. Vérifier qu'il y a des données pour la période sélectionnée
2. Vérifier le format des dates (doivent être ISO : YYYY-MM-DD)
3. Ouvrir la console pour voir les données `chartData`

## 📞 Support

Pour toute question sur l'intégration ou l'utilisation :
1. Consulter `INTEGRATION_SUIVI.md`
2. Tester avec `exemple_data_suivi.json`
3. Vérifier la console pour les erreurs

## 🔄 Évolutions futures possibles

- [ ] Export PDF des rapports journaliers
- [ ] Alertes sur taux de réussite < seuil
- [ ] Comparaison inter-techniciens
- [ ] Prédictions basées sur historique
- [ ] Intégration avec imports RCC/Canal existants
- [ ] Calcul automatique des montants à payer par technicien
- [ ] Notifications sur objectifs atteints

## ✅ Checklist d'intégration

- [ ] Fichier SuiviJournalier.jsx copié dans `/src/components/`
- [ ] Import ajouté en haut de App.jsx
- [ ] Onglet "Suivi Journalier" ajouté dans la navigation
- [ ] Rendu conditionnel ajouté dans le switch
- [ ] Test avec fichier SUIVI_JANVIER_.xlsx
- [ ] Vérification des filtres (période, type, technicien)
- [ ] Test mode Admin et mode Tech
- [ ] Vérification responsive mobile
- [ ] Test thème light/dark
- [ ] Documentation utilisateur finale

---

**Version** : 1.0
**Date** : Janvier 2026
**Auteur** : GSET Plans Development Team
