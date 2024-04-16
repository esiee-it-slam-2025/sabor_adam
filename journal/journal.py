"""
Cours "Advanced 2" - Exercice "Journal"
Réalisé par Sabor Adam
"""
import argparse
import random
from datetime import datetime
from donnees import articles, interviews  # On suppose que 'donnees.py' contient 'articles' et 'interviews'

# Importation pour la lecture des fichiers
import os

# Définition de la classe de base pour les éléments du journal
class ElementJournal:
    def __init__(self, date, titre, auteur, texte):
        self.date = date
        self.titre = titre
        self.auteur = auteur
        self.texte = texte

# Définition de la classe Article héritant de ElementJournal
class Article(ElementJournal):
    def __init__(self, date, titre, auteur, texte, categorie):
        super().__init__(date, titre, auteur, texte)
        self.categorie = categorie

# Définition de la classe Interview héritant de ElementJournal
class Interview(ElementJournal):
    def __init__(self, date, titre, auteur, texte, invite):
        super().__init__(date, titre, auteur, texte)
        self.invite = invite

# Classe Generateur pour créer et gérer les entrées du journal
class Generateur:
    def __init__(self):
        self.elements = []

    def importer(self):
        # Importation des articles et interviews
        for article in articles:
            self.elements.append(Article(article['date'], article['titre'], article['auteur'], article['texte'], article['categorie']))
        for interview in interviews:
            self.elements.append(Interview(interview['date'], interview['titre'], interview['auteur'], interview['texte'], interview['invite']))
        random.shuffle(self.elements)  # Mélange aléatoire des articles

    def afficher(self, date_edition):
        # Filtrer les éléments par date et les afficher
        try:
            datetime.strptime(date_edition, '%Y-%m-%d')  # Validation du format de la date
            valid_elements = [elem for elem in self.elements if elem.date == date_edition]
            for elem in valid_elements:
                print(f"Titre: {elem.titre}")
                print(f"Auteur: {elem.auteur}")
                print(f"Texte: {elem.texte}\n")
            self.ajouter_credits()
        except ValueError:
            print("Erreur : Le format de la date doit être YYYY-MM-DD")

    def ajouter_credits(self):
        # Lecture et affichage du contenu de credits.txt
        if os.path.exists('credits.txt'):
            with open('credits.txt', 'r') as file:
                print(file.read())

# Configuration des arguments de ligne de commande avec argparse
parser = argparse.ArgumentParser(description="Générateur de journal")
parser.add_argument("date", help="Date de l'édition du journal au format YYYY-MM-DD")
args = parser.parse_args()

# Instance de la classe Generateur
generateur = Generateur()
generateur.importer()

# Affichage du journal pour une date spécifique passée en argument de ligne de commande
generateur.afficher(args.date)
