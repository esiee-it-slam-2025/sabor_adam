
# Exercice "Journal"

![Logo](../../assets/journal.png)

👉 À réaliser après avoir lu le cours "Advanced 2"

## 📜 Situation

Le quotidien "Le Lutécien", pour lequel vous travaillez, a besoin de connaître rapidement les articles devant paraître dans le prochain journal avant envoi à l'imprimeur.

Chaque journal peut inclure des **articles** d'actualité ainsi que des **interviews**, dont certains peuvent être réservés à une édition régionale.

**Attention** : les articles et interviews destinés à l'édition nationale doivent également paraître dans les éditions régionales.

Pour l'instant, le journal n'a que deux éditions régionales : en Ile-de-France et au PACA.

## 🏁 Objectifs

Générer un journal pour une date et une zone donnée qui contient les articles et les interview qui corespondent à ces caractéristiques.

Le premier but est d'utiliser, de façon simple, des classes pour représenter des données. Ici, il faudra représenter des articles et des interviews. L'intérêt premier de la programmation orientée objet est de pouvoir éviter de la duplication de code en ayant une classe "parent" qui contienne des choses communes, puis des classes "enfants" qui en héritent pour y ajouter des choses spécifiques aux articles et aux interviews.

Pour commencer, à vous de récupérer la liste des articles et interviews. Ils sont répartis en deux listes, dans le module `donnees.py`, qu'il vous faudra donc importer dans le fichier `journal.py`. Pour l'instant, on va rester simple au niveau des dates : ce sont toutes des chaînes de caractères sous la forme "annee-mois-jour", comme par exemple `2021-04-01` pour le 1er avril 2021.

Un héritage simple est déjà présent pour vous guider sur ce qu'il faudra y écrire pour les faire fonctionner, tout en gardant l'aspect polymorphe.

Les classes `Article` et `Interview` vous serviront à créer une instance de l'une ou de l'autre afin de représenter les données brutes contenues dans `donnees.py`. La classe `ElementJournal` devra contenir les choses qui se trouvent autant dans un article que dans un interview (par exemple la date). Ensuite, il faudra rajouter les champs qui sont uniques aux articles à la classe `Article`, et les champs uniques aux interviews à la classe `Interview`.

La classe `Generateur` est le coeur du script. Tout d'abord, elle est **instanciée** en précisant la **date** et l'**édition** du journal voulu, grâce à ce qui a été écrit dans le terminal (et récupéré grâce à `argparse`) lors de l'appel du script.

Ensuite, on appelle sa méthode `importer()` en y passant comme argument les données du module `donnees.py`. En parcourant chacune de ces listes de dictionnaires, il faudra instancier au choix la classe `Article` ou `Interview`, tout en leur passant comme argument les données des articles ou des interviews. Ces instances de classes `Article` ou `Interview` pourront être stockées dans une liste unique.

Lorsqu'une classe est instanciée, elle remplit généralement ses propriétés grâce à ce qu'elle reçoit dans son constructeur. C'est à vous de coder, dans les classes, les constructeurs `__init__` qui vont recevoir les données passées comme arguments lors de l'instanciation, afin de remplir les propriétés (variables) de la classe.

Quand vous voudrez parcourir la liste contenant les instances de classes, vous devrez déterminer si une instance provient de `Article` ou de `Interview` afin de savoir quelles propriétés utiliser dessus pour afficher leur contenu. Bien sûr, il ne faudra afficher dans le terminal que les articles et interviews correspondant à la date et à l'édition qui ont été passés comme arguments lors de l'appel du script.

Notre script peut accepter et comprendre des arguments lors de son appel dans une ligne de commande, grâce à l'usage de la bibliothèque `argparse`. Le script attends comme premier argument une date (au format annee-mois-jour) puis une édition ("national", "paca"...).

Dans un terminal, écrire par exemple `python journal.py 2021-04-06 paca` devra générer le journal dans on édition PACA pour le 6 Avril 2021. Vous pouvez écrire `python journal.py --help` pour plus de détails.

## ⭕ Conditions de réussite

* ✔️ Lorsque l'on génère un journal d'une certaine date, on ne voit que les articles et interviews de cette date
* ✔️ Lorsque l'on génère un journal d'une certaine édition, on ne voit que les articles et interviews destinés à être imprimés pour cette édition.
* ✔️ Les journaux régionaux (IDF et PACA) contiennent également les articles et interviews de l'édition nationale du journal.

## ☝ Conseils

Le plus simple pour décider de quels éléments à afficher ou non selon une édition de journal est peut-être de déterminer à l'avance les éditions desquelles on accepte les articles et interviews.

La lisibilité des caractéristiques et du contenu des articles/interviews est évidemment importante, n'hésitez pas à les écrire sur plusieurs lignes.
