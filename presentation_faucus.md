# Faucus - Le Framework d'Exécution

Faucus n'est pas une simple to-do list ou un logiciel de gestion classique. C'est une plateforme complète (SaaS) combinant gestion de projet, responsabilisation par les résultats et suivi des performances en temps réel, pensée spécifiquement pour l'exécution et la productivité des PME.

## 🎯 Concepts Fondamentaux et Méthodologie

- **Le Morning Check-In** : Chaque matin, chaque collaborateur définit son ambition de la journée. Il estime sa charge en sélectionnant des "points de valeur" sur lesquels il s'engage. 
- **L'Index de Performance (PI)** : Faucus remplace le time-tracking ou "flicage horaire" par une mesure de l'efficacité réelle (Points achevés divisés par Points engagés). 
- **Gamification & "Bac à faire" (Sandbox)** : Un système inspiré des jeux vidéo avec des "quêtes". Les collaborateurs peuvent accomplir des tâches orphelines situées dans le "Bac à faire" pour obtenir d'importants bonus (ex: +50%), encourageant ainsi l'entraide et l'excellence.

## 👤 Espace Collaborateur ("Mon Espace")

- **Dashboard** : Le tableau de bord personnel pour voir en un coup d'œil sa progression, ses statistiques et l'Index de Performance (PI).
- **Tâches (Exécution au format Kanban)** : Visualisation de l'avancement discipliné du travail. Lorsqu'une tâche est achevée, elle se valide instantanément et synchronise les performances en temps réel.
- **Messagerie Intégrée (Chat)** : Remplacement natif aux outils externes (comme Slack ou Teams). Inclut des canaux par projet et des messages directs, avec notifications en temps réel et badges "non lu".
- **Le Bac à faire** : L'espace d'opportunités visant à stimuler l'équipe.

## 🏢 Espace Entreprise

- **Projets** : Vue d'ensemble de tous les chantiers de l'entreprise (dossiers, missions clients).
- **Documents** : Espace sécurisé centralisant les fichiers de la société pour s'affranchir du désordre des stockages cloud externes.
- **Data Center** : Base de données cloud privée totalement éditable (façon Airtable). Permet de classer et de structurer l'information de l'entreprise sur mesure.
- **Rapports Analytiques** : Rapports de performance mensuels exhaustifs. Génération de graphiques individuels et collectifs pour savoir dans quel secteur (Design, Vente, Code...) l'équipe alloue le plus de points.
- **Support (Billetterie Interne)** : Outil central de ticketing pour des demandes internes (ordinateur en panne, recrutement, problèmes divers). Résolution optimisée pour les managers avec des vues claires (Split view).
- **Équipe (Admin & Manager)** : Panneau de gestion des invitations, des membres actuels et d'attribution des rôles.
- **Paramètres (Admin & Manager)** : Configuration approfondie de l'entreprise.

## 🔐 Sécurité & Structure

- **RBAC (Système de rôles et permissions)** : La plateforme intègre une gestion stricte des privilèges (Administrateur, Manager, Utilisateur) permettant aux dirigeants de garder le contrôle (ex: accès exclusif à l'Équipe, aux Paramètres ou zones du Data Center).
- **Temps Réel** : Tous les événements (création de tâche, déplacement dans un Kanban, réception d'un message) sont gérés de manière asynchrone et instantanée.

## 💎 Plans & Tarifs

- **Basic (3€/mois/user)** : Pour les petites équipes. Inclut le Check-in, la messagerie et le support communautaire.
- **Pro (8€/mois/user)** : PME structurées. Inclut l'Index de Performance, le Data Center et les Rapports mensuels.
- **Analytics (15€/mois/user)** : Orienté performance. Ajoute le Bac à faire avec gamification, RBAC avancé, et support dédié 24/7.
- **Entreprise (Sur devis)** : Utilisateurs et données illimités, account manager dédié.

## 💻 Tech Stack

- **Frontend** : Next.js, React, Tailwind CSS, shadcn/ui.
- **Store & Temps Réel** : Firebase (Firestore, Auth, Storage).
- **Animations** : GSAP, Lenis (Smooth Scroll).
- **Déploiement** : Vercel.

---

*Faucus - Reprenez le contrôle sur l'exécution.*
