# JO Tickets

Application de gestion des billets pour les compétitions de football des JO Paris 2024.

## Présentation du projet

Ce projet est un POC (Proof Of Concept) de gestion des billets pour les compétitions de football des JO. Il comprend trois composants principaux :

1. **Interface d'administration Django** : Pour gérer les matchs, les équipes, les stades et visualiser les billets vendus
2. **Application mobile** : Interface web permettant aux supporters de consulter les matchs et d'acheter des billets
3. **Scanner de billets** : Application permettant aux stadiers de vérifier la validité des billets via QR code

## Prérequis

- Python 3.8+ 
- Navigateur web moderne
- Extension LiveServer pour VSCode (ou serveur équivalent)

## Installation et démarrage

###  Cloner le projet

```bash
git clone https://github.com/esiee-it-slam-2025/sabor_adam.git
cd esiee-it-slam-2025-sabor_adam
```

###  Installation des dépendances

```bash
pip install django
pip install djangorestframework
pip install django-cors-headers
pip install djangorestframework-simplejwt
```

### Configuration de la base de données

```bash
cd admin
python manage.py migrate
```

### Import des données initiales

```bash
sqlite3 mainapp/db.sqlite3 < ../data_jo.sql
```

### Création d'un superutilisateur Django pour accéder à l'administration

```bash
python manage.py createsuperuser
```
Suivez les instructions pour créer un compte administrateur.

###  Lancer le serveur backend

```bash
python manage.py runserver
```

Le serveur backend sera accessible à l'adresse : http://127.0.0.1:8000/

###  Lancer l'application mobile et le scanner

Pour l'interface mobile et le scanner, utilisez l'extension LiveServer de VSCode ou un serveur HTTP simple :

- Ouvrez le dossier du projet dans VSCode
- Cliquez-droit sur les fichiers `mobile/index.html` et `scanner/index.html`
- Sélectionnez "Open with Live Server"

## Guide d'utilisation

### Interface d'administration

1. Accédez à http://127.0.0.1:8000/gestion/login/
2. Connectez-vous avec le superutilisateur créé précédemment
3. Vous pouvez alors :
   - Consulter et modifier les matchs
   - Mettre à jour les scores
   - Voir les billets vendus

Vous pouvez également accéder à l'administration Django standard via http://127.0.0.1:8000/admin/

### Application mobile

1. Accédez à l'application mobile via l'URL fournie par LiveServer (généralement http://127.0.0.1:5500/mobile/index.html)
2. Créez un compte utilisateur en cliquant sur "S'inscrire"
3. Connectez-vous avec vos identifiants
4. Parcourez les matchs disponibles
5. Pour acheter un billet :
   - Cliquez sur "Acheter un billet" sur un match
   - Sélectionnez la catégorie et la quantité
   - Validez votre achat
6. Consultez vos billets achetés en cliquant sur "Mes Billets"
7. Vous pouvez télécharger vos QR codes pour les présenter aux stadiers

### Scanner de billets

1. Accédez au scanner via l'URL fournie par LiveServer (généralement http://127.0.0.1:5500/scanner/index.html)
2. Uploadez une image de QR code d'un billet
3. Le système vérifie la validité du billet et affiche ses informations
4. Si le billet est valide, vous pouvez le valider pour l'entrée au stade

## Structure du projet

```
└── esiee-it-slam-2025-sabor_adam/
    ├── README.md
    ├── admin/                     # Backend Django
    │   ├── manage.py
    │   └── mainapp/              # Application principale
    │       ├── models/           # Modèles de données
    │       ├── views/            # Vues et API
    │       ├── templates/        # Templates Django
    │       └── static/           # Fichiers statiques
    ├── mobile/                    # Application mobile
    │   ├── index.html            # Page principale
    │   ├── ticket.html           # Page de gestion des billets
    │   ├── css/
    │   └── js/
    └── scanner/                   # Scanner de billets
        ├── index.html
        ├── index.css
        └── index.js
```

## Fonctionnalités

### Backend Django
- API REST pour les matchs, équipes, stades et billets
- Authentification par token
- Interface d'administration personnalisée
- Vérification des billets

### Application mobile
- Inscription et connexion des utilisateurs
- Affichage des matchs disponibles
- Achat de billets selon différentes catégories
- Génération et téléchargement de QR codes
- Consultation des billets achetés

### Scanner de billets
- Scan des QR codes via upload d'image
- Vérification de la validité des billets
- Affichage des informations du billet
- Validation de l'entrée

## Remarques importantes

- L'application est conçue comme un POC, certaines fonctionnalités peuvent nécessiter des ajustements pour un environnement de production
- Les billets sont stockés dans la base de données SQLite et associés aux comptes utilisateurs
- Pour tester le scanner, vous devez d'abord acheter un billet via l'application mobile puis télécharger le QR code généré

## Dépannage

- **Problèmes CORS** : Si vous rencontrez des erreurs CORS, assurez-vous que les paramètres dans `settings/base.py` correspondent à l'URL de votre serveur frontend
- **Erreurs d'authentification** : Vérifiez que les tokens sont bien transmis dans les requêtes
- **Images QR code non visibles** : Vérifiez que les bibliothèques JavaScript sont correctement chargées

Pour toute autre question ou problème, n'hésitez pas à  contacter saboradam5@gmail.com.