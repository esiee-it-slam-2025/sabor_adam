# Copiez ce fichier dans votre repo PERSONNEL
# Tapez votre code ci dessous
# puis executer ce fichier dans un terminal avec la commande "py entrainement_poo.pys"

# Variables initiales
# Initialisation de variables globales pour stocker les instances des héros et monstres
hero = None
monstre = None

# Dictionnaire pour associer les armes à leurs dégâts correspondants
armes = {"Épée": 5, "Arc": 4, "Couteau à beurre": 1}

# Définition de la classe de base Creature
class Creature:
    def __init__(self, pv, degats):
        self.pv = pv  
        self.degats = degats  
        self.etat = 'Normal'  
    def attaque(self, cible):
        # Méthode permettant à une créature d'attaquer une autre créature
        if cible.etat != 'Paralysé' and self.pv > 0:
            cible.pv -= self.degats
            return f"{self} attaque {cible} et inflige {self.degats} dégâts."
        return f"{self} ne peut pas attaquer."

# Classe Heros hérite de Creature
class Heros(Creature):
    def __init__(self, nom, pv, degats, pm):
        super().__init__(pv, degats)  
        self.nom = nom  
        self.pm = pm  

    def magie(self, cible):
        # Méthode spécifique aux héros pour utiliser une attaque magique
        if self.pm > 0 and self.pv > 0:
            cible.pv -= 2 * self.degats
            self.pm -= 1
            return f"{self.nom} utilise magie et inflige {2 * self.degats} dégâts."
        return f"{self.nom} ne peut pas utiliser magie (manque de PM ou hors de combat)."

# Classe Monstre hérite de Creature
class Monstre(Creature):
    def venin(self, cible):
        # Méthode spécifique aux monstres pour empoisonner une cible
        if self.pv > 0:
            cible.etat = 'Empoisonné'
            return f"{self} empoisonne {cible}."
        return f"{self} ne peut pas empoisonner."

# Fonction pour introduire le jeu et configurer les personnages
def intro():
    print("===============================================================")
    print("|| Bienvenue dans le système de combat POO (Punch Out Out) ! ||")
    print("===============================================================")
    nom_hero = input("Quel est le nom de ton héros? ")
    print("Choisis ton arme (Épée, Arc, Couteau à beurre): ")
    choix_arme = input()
    degats_hero = armes.get(choix_arme, 1)  # Récupération des dégâts de l'arme choisie

    global hero, monstre
    hero = Heros(nom_hero, 20, degats_hero, 5)  # Création d'une instance de Heros
    monstre = Monstre("Gorgon", 15, 3)  # Création d'une instance de Monstre

    combat()

# Fonction pour gérer le déroulement du combat
def combat():
    tour_hero = True
    while hero.pv > 0 and monstre.pv > 0:
        if tour_hero:
            print(f"C'est le tour de {hero.nom}. Choisissez une action (attaque, magie):")
            action = input()
            if action == "magie":
                print(hero.magie(monstre))
            else:
                print(hero.attaque(monstre))
            tour_hero = False
        else:
            print("Le monstre attaque!")
            if monstre.etat == 'Empoisonné':
                print(monstre.venin(hero))
            else:
                print(monstre.attaque(hero))
            tour_hero = True
        print(f"Statut - {hero.nom}: {hero.pv} PV, Monstre: {monstre.pv} PV")

        if hero.pv <= 0:
            print(f"{hero.nom} a été vaincu. Le monstre gagne!")
        elif monstre.pv <= 0:
            print("Le monstre a été vaincu. Le héros gagne!")

if __name__ == "__main__":
    intro()
    print("Fin du jeu.")
