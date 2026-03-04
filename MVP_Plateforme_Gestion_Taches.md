# Plateforme de Gestion et Suivi Collaboratif de Tâches

## Document MVP & Contexte Produit

------------------------------------------------------------------------

# 1. Vision du Produit

Créer une plateforme SaaS B2B permettant aux entreprises de :

- Assigner des tâches aux collaborateurs
- Structurer le focus quotidien de chaque employé via un "Morning Check-in"
- Mesurer la performance individuelle et collective via un système de score pondéré
- Optimiser la répartition future des tâches grâce aux statistiques
- Créer une émulation d'équipe positive via un feed d'activité

Positionnement : outil de gestion de performance et de focus quotidien basé sur l'exécution réelle et la gamification douce.

------------------------------------------------------------------------

# 2. Problème Résolu

Dans beaucoup d'entreprises :
- Les tâches sont assignées sans suivi précis d'exécution réelle.
- Il n'existe pas de mesure claire du focus quotidien.
- Les managers manquent de données pour optimiser la répartition des tâches.
- Les employés manquent de visibilité sur l'impact de leur travail.

La plateforme apporte :
- Une planification quotidienne guidée et engageante (Morning Check-in)
- Un taux d'accomplissement mesurable par points (Pondération)
- Une vision claire de l'activité de l'équipe (Social Feed)
- Une autonomie dans la gestion des lourdes charges (Subdivision)

------------------------------------------------------------------------

# 3. Cible (MVP)

- PME (5 à 50 employés)
- Agences digitales
- Startups
- Cabinets de services
- Équipes commerciales

------------------------------------------------------------------------

# 4. Fonctionnalités MVP

## 4.1 Rôles

### Administrateur
- Création de l'entreprise
- Gestion des utilisateurs
- Attributions des rôles (Manager / Collaborateur)

### Manager
- Création et assignation de tâches
- Suivi du "Social Feed" de l'équipe
- Vue globale des tâches par collaborateur et statistiques

### Collaborateur
- **Morning Check-in** : Modale interactive le matin pour définir son focus du jour.
- **Subdivision de Tâches** : Possibilité de découper les tâches massives (Critique ou Haute) en sous-tâches plus digestes à répartir sur la semaine.
- **Social Feed** : Visualisation des succès de l'équipe.
- Clôture de journée et validation des points.

------------------------------------------------------------------------

# 5. Structure des Tâches & Système de Points

Chaque tâche contient :
- Titre & Description
- Catégorie
- Priorité et Points associés :
  - **Critique (5 pts)**
  - **Haute (3 pts)**
  - **Basse (1 pt)**
- Possibilité de subdivision (pour les tâches à 3 ou 5 pts)
- Deadline & Assigné à
- Statut (En attente / Dans le Focus / Terminé)
- Date de création et Date de complétion

------------------------------------------------------------------------

# 6. Focus Quotidien (Feature Différenciante)

**Le "Morning Check-in"** : 
1. À la première connexion de la journée, une modale engageante ("Assistant Matinal") accueille l'employé.
2. Il sélectionne les tâches qu'il s'engage à accomplir (son "Focus").
3. En fin de journée, il valide ce qu'il a réellement terminé.
4. L'outil calcule son score du jour basé sur les points accumulés.

------------------------------------------------------------------------

# 7. Statistiques & Score (Performance Index)

Le système évite le piège du "volume de micro-tâches" en se basant sur la valeur (les points) :
- **Score Quotidien** : Basé sur les points validés vs points engagés le matin.
- Le découpage des grosses tâches (Subdivision) permet à un employé de scorer régulièrement sans être bloqué des jours entiers sur une tâche Critique, reflétant ainsi son effort réel.
- Rapport mensuel sur le ratio d'accomplissement des points.

------------------------------------------------------------------------

# 8. Dimension Sociale / Équipe

**Social Feed (Activité de l'entreprise)** :
- Un journal d'activité met en avant les réussites de l'équipe pour créer de la cohésion :
  - "🔥 Alex vient de valider son Morning Focus"
  - "🎯 Sarah a terminé une tâche Critique (5 pts)"

------------------------------------------------------------------------

# 9. Stack Technique Proposée (MVP Rapide & Premium)

- **Frontend** : Next.js + Tailwind CSS pour une esthétique moderne, fluide et un rendu "SaaS Premium" immédiat.
- **Backend / DB** : Approche Low-code / BaaS (ex: Supabase) pour accélérer massivement le développement du MVP et se concentrer sur l'UX.

------------------------------------------------------------------------

# 10. Stratégie d'Onboarding (Go-to-Market)

**Modèle "Conciergerie" pour les premiers clients** :
- Le produit reste volontairement vide à l'inscription.
- L'intégration des 5-10 premières PME se fait via un appel visio (Google Meet) pour configurer l'espace, inviter les collaborateurs et créer les premières tâches ensemble, garantissant ainsi l'adoption et la récolte de feedbacks qualitatifs.

------------------------------------------------------------------------

Fin du document.
