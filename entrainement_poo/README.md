
# Exercice "Basic1"

👉 À réaliser après avoir lu la partie POO du cours "Advanced 2"

**Copiez le contenu de ce dossier dans VOTRE repo git et ne modifiez que VOTRE version**

Ecrivez votre code dans le fichier `entrainement_poo.py`, quand vous aurez terminé pensez à pusher votre code sur git.

## 🏁 Objectifs
Utilisation des concepts de POO du cours Advanced 2, à savoir **les classes, les attributs, les méthodes et l'héritage**

Créer un petit système de combat dans le même esprit que celui de textadventure mais ici les combattants doivent être des **objets**.

Un *héros* combat un *monstre*, il faudra donc une classe **Heros** pour créer un héros et une classe **Monstre** pour créer un monstre.

**Heros** et **Monstre** héritent de **Créature**, en effet les 2 ont des choses en communs.

Une créature possède :
- Des points de vie `pv`
- Des points de dégats `degats`
- Un état `etat` (il pourrait être empoisoné / paralysé...)
- Une attaque classique `attaque()` (action d'attaquer qui inflige les dégats de l'attribut `degat`)

Un héros a en plus :
- Un nom
- Des points de mana `pm`
- Une attaque magique `magie()` qui inflige 2x plus de dégats que l'attaque classique mais utilise un point de mana

Un monstre à en plus :
- Une attaque venin `venin()` qui n'inflige pas de dégat mais applique l'état empoisoné à l'adversaire qui lui fait perdre 1pv au début de chaque tour

Les actions d'attaques (`attaque()`, `magie()`, et `venin()`) doivent prendre en paramettre une cible, pour savoir à qui on enlève les `pv`.

Au début du jeu, le joueur choisi le nom de son héros et son arme (qui induira le nombre de dégat). Le combat commence par le tour du héros. Le joueur séléctionne également les actions du monstre.

Le script s'arrête par un message de victoire ou de defaite quand le héros ou le monstre n'a plus de `pv`.

*Optionnel* : Pour ajouter de la complexité au code :
- Le joueur peut saisir certaine caracteristique du héros (`pv`, `dégat` par exemple)
- Le joueur peut changer le nombre de monstres / de héros participant au combat
- Ajouter d'autre options dans le combat à votre guise 



## 🧑‍🏫 Consignes
* Créer une classe **Creature** avec des attributs, des méthodes et un constructeur
* Créer les classes **Heros** et **Monstre**, qui hérite de **Creature**
* Ajouter les spécificités des 2 classes, ajouter un constructeur qui override le constructeur de **Creature**
* Gérer le combat
* Prévoir un cas de victoire et un cas de défaite
* Gérer les erreurs



## ☝ Conseils

Aidez vous du cours.

N'hésitez pas à utiliser la fonction `print()` pour afficher les valeur contenu dans les variables

Prenez le temps de lire les erreurs et essayer de les comprendre avant de les copier-coller bêtement sur internet
