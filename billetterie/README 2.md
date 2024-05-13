
# Exercice "Billetterie"

![Fukuoka City Subway](../../assets/fukuoka_subway_logo.png)

👉 À réaliser après avoir lu le cours "Basic 2"

## 📜 Situation

Le métro municipal de la ville de [Fukuoka](https://fr.wikipedia.org/wiki/Fukuoka), située au sud-ouest du Japon, comporte 3 lignes :

- **Airport Line** (orange)
- **Hakozaki Line** (bleu)
- **Nanakuma Line** (vert)

Pour cet exercice, nous allons travailler uniquement avec la **Airport Line**, qui est la plus importante des trois.

![Carte du réseau](../../assets/fukuoka_subway_map.png)

En plus des machines de billetterie existantes en gare, on vous demande de développer une version rudimentaire qui puisse fonctionner dans un terminal. En cas de panne des machines, le personnel de gare pourra alors utiliser votre système pour **rapidement** imprimer des billets aux clients.

Dans le ferroviaire au Japon, le prix d'un billet est souvent calculé à partir d'un **frais de service de base** auquel on ajoute un **montant calculé selon la distance parcourue**.

Dans notre cas, le métro municipal de Fukuoka a simplifié la chose en définissant des **zones tarifaires**: selon la distance parcourue par un usager, il aura alors à payer le prix de la zone tarifaire correspondante.

Les enfants et les personnes handicapées peuvent payer un **tarif réduit** qui correspond toujours à la **moitié du tarif adulte** (sauf pour le tarif réduit de la première zone qui est fixé à 110 yen).

Voici le tableau des zones tarifaires de la **Airport Line** :

Zone   | Distance    | Tarif plein | Tarif réduit |
------ | ----------- | ----------- | ------------ |
Zone 1 | 0 à 3 km    | 210 yen     | 110 yen      |
Zone 2 | 3.1 à 7km   | 260 yen     | 130 yen      |
Zone 3 | 7.1 à 11km  | 300 yen     | 150 yen      |
Zone 4 | 11.1 à 15km | 340 yen     | 170 yen      |

Par exemple : un trajet de **Muromi** jusqu'à **Tenjin** correspond à 5.8km. Il correspond donc à la **zone tarifaire 2**, et un billet coûtera alors 260 yens (ou 130 yens en tarif réduit).

Tiré de la [grille tarifaire officielle](https://subway.city.fukuoka.lg.jp/eng/fare/deta/fare_table.pdf).

## 🏁 Objectifs

Le but est de poser quelques questions à l'utilisateur pour calculer ce qu'il devra payer au total, tout en suivant les règles tarifaires de la compagnie.

On peut d'abord lui demander combien de billets adulte il désire, puis s'il désire des billets à tarif réduit, et si oui, combien de billets à tarif réduit.

Ensuite, il faudra lui demander la station de départ et d'arrivée de son itinéraire. Pour éviter les fautes de frappe et profiter du fait que chaque station ait déjà un numéro officiel, on affichera la liste des stations avec le numéro à taper pour en choisir une.

On peut alors déterminer la zone tarifaire à appliquer aux billets demandés, en calculant la distance kilométrique entre la station de départ et celle d'arrivée. Pour cela, la variable `stations` est un dictionnaire ayant comme clés le nom d'une station, et pour valeur la distance kilométrique jusqu'à la station suivante. Meinohama est donc à 1.5km de Muromi, etc.

Pour terminer, on affichera tout le détail des calculs (nombre de billets, prix unitaire, zone tarifaire), puis le coût total, et enfin la voie du train qu'il devra emprunter : voie 1 dans le sens Meinohama > Fukuokafuko, et voie 2 dans le sens inverse.

J'ai commencé à écrire quelques variables au début du script, mais il faudra peut-être en déclarer d'autres qui seront utiles au long du code. Il ne faut cependant pas modifier les valeurs du dictionnaire contenant les stations et les distances.

Vous devez gérer les erreurs des utilisateurs, quand la machine attends que l'utilisateur tape une valeur, si cette valeur n'est pas cohérente, prévenir l'utilisateur que ce qu'il a tapé ne convient pas et lui demander de retaper une nouvelle valeur jusqu'a ce que celle ci soit cohérente.

Quand l'utilisateur doit taper un nombre (nb de billet / numéro de station) verifier qu'il tape bien un nombre non négatif, et que ce nombre est cohérent (corréspond bien à un numéro de station).

N'hésitez pas à optimiser votre code en créant des fonctions.

## ⭕ Conditions de réussite

- ✔️ On peut acheter des billets plein tarif et/ou tarif réduit
- ✔️ On peut aller autant dans un sens (Meinohama > Fukuokakuko) que dans l'autre sens (Fukuokakuko > Meinohama)
- ✔️ On voit le détail de l'itinéraire (distance, zone) et le calcul du coût total à payer par l'usager
- ✔️ On redemande à l'utilisateur de saisir si sa saisie est incohérente

## 🙃 Erreurs fréquentes des élèves

* Les entrées utilisateur ne sont pas correctement converties en nombres lorsqu'il le faut
* Les numéros affichés des stations sont étranges voire carrément écrites en dur dans le dictionnaire

## ☝ Conseils

Avant d'essayer d'avoir un affichage soigné dans le terminal, commencez d'abord par correctement coder toute la logique nécessaire au bon fonctionnement du script. Testez longuement votre programme avec différents cas possibles.

N'oubliez pas que la ligne de métro est une simple suite de stations, que l'on peut parcourir dans un sens ou dans l'autre.

Il y a bien sûr plusieurs façons de calculer la distance de l'itinéraire. Vu que l'on demande des numéros de stations à l'utilisateur, cela peut aider au fait que l'on doive parcourir le dictionnaire des stations et de leur distance dans un sens donné... Pensez aussi qu'un itinéraire peut aller dans la direction Meinohama > Fukuokakuko, ou bien dans la direction inverse : le calcul sera sûrement différent dans ce cas là.

Si vous hésitez sur plusieurs façons de coder une idée en tête, n'hésitez pas à l'écrire pas à pas, quitte à avoir de nombreuses lignes ou variables - vous pourrez toujours optimiser après coup une fois que cela fonctionne. C'est avec de l'expérience que vous finirez par écrire du code concis du premier coup !

Faite votre code pas à pas, partie après partie en affichant des résultats que vous pourrez enlever après. Par exemple vérifier que vous récupérer bien la bonne zone avant de faire le calcul du prix total.

Ajoutez la gestion d'erreur après avoir un code qui fonctionne complètement. Focalisez vous sur les fonctionnalités, quand elle marche vous pouvez passez au perfectionnement (gestion d'erreur, esthetique...)