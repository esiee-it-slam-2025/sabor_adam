
# Exercice "Basic 2"

👉 À réaliser après avoir lu le cours "Basic 2"

**Copiez le contenu de ce dossier dans votre repo git et ne modifiez que cette version**

ecrivez votre code dans le fichier `basic2.py`, quand vous aurez terminé pensez à pusher votre code sur git.

## 🏁 Objectifs
Utilisation des concepts vu dans le cours basic2, à savoir **manipuler des string**, **manipuler des listes**, **gérer une boucle de demande**

Vous devez créer un programme qui permet de gérer une liste de course. L'utilisateur peut ajouter des articles à sa liste, en supprimer ou en modifier la quantité nécéssaire.

Vous avez une variable contenant une liste de course, qui est un dictionnaire python.

Tout d'abord demandez à l'utilisateur ce qu'il souhaite faire (ajouter, supprimer, modifier, quitter le programme). Pour éviter les fautes de frappe demandez lui de saisir un chiffre choisir ce qu'il veut faire.

Quand il ajoute : demandez ce qu'il ajoute, puis la quantité qu'il souhaite ajouter. Ajoutez l'article et sa quantité à la liste de course puis affichez la.

Quand il supprime : affichez la liste de course avec un numéro par article. Demandez ce qu'il supprime, en demandant le numéro à supprimer pour éviter les fautes de frappes. Supprimez l'article et sa quantité de la liste de course puis affichez la.

Quand il modifie : affichez la liste de course avec un numéro par article. Demandez ce qu'il modifie en demandant le numéro à modifier pour éviter les fautes de frappes, puis la quantité qu'il souhaite modifier. Modifiez la quantité de l'article choisi dans la liste de course puis affichez la.

### Gérer les erreurs :
Si l'utilisateur tape quelque chose d'incohérent (du texte à la place des chiffres, ou des chiffre hors des choix possible), le programme de doit pas crasher. On lui demande de re-saisir quelque chose tant que son choix n'est pas cohérent.

## ⭕ Conditions de réussite

* ✔️ Utilisation de variables pour stocker les valeurs
* ✔️ Récupération d'une valeur saisie par l'utilisateur
* ✔️ Création et appel de fonction
* ✔️ Modification d'un dictionnaire
* ✔️ Utilisation d'une boucle `while`
* ✔️ Affichage d'un message selon le résultat
* ✔️ Mise à disposition sur git


## ☝ Conseils

Commencez par avoir la logique avant de faire la gestion d'erreur.

Pour la gestion d'erreur vous aurez probablement besoin d'utiliser une boucle `while True:` que vous arreterez avec `break` ou `return` 
