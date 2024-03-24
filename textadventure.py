import sys
import random

# Variables globales
personnage = {"PV": 70, "Badges": 0, "Nom": "", "Pouvoir": ""}
pouvoirs = {
    1: {"nom": "Grappler", "message": "En tant que Grappler, vous immobilisez votre adversaire avec une prise parfaite.", "victoire": "vous gagnez sur un etranglement éclair, vous démontrez la suprématie du Grappler."},
    2: {"nom": "Lutteur", "message": "En tant que Lutteur, vous renversez la situation avec une lutte acharnée.", "victoire": "Votre lutte a écrasé votre adversaire, victoire écrasante."},
    3: {"nom": "Boxeur", "message": "En tant que Boxeur, vos poings parlent d'eux-mêmes, laissant l'adversaire K.O.", "victoire": "Vos poings ont dicté le verdict, une victoire retentissante."},
    4: {"nom": "Nakmuay", "message": "En tant que Nakmuay, vous utilisez l'art du Muay Thai pour subjuguer votre adversaire.", "victoire": "L'art du Muay Thai prévaut, vous écrasez votre adversaire"},
    5: {"nom": "Street Fighter", "message": "En tant que Street Fighter, vous utilisez les rues comme votre dojo.", "victoire": "Les rues vous ont bien formé, la victoire vous appartient."},
    6: {"nom": "Combattant de MMA", "message": "En tant que Combattant de MMA, vous montrez la force de la polyvalence.", "victoire": "La polyvalence est votre clé, vos compétences en MMA vous mènent à la victoire."},
    7: {"nom": "Combattant de Kung Fu", "message": "En tant que Combattant de Kung Fu, vos mouvements fluides et précis vous rendent imbattable.", "victoire": "La sagesse du Kung Fu vous offre une autre victoire."}

}
lieux_proches = {
    "hall": ["vestiaires", "arène", "salle_entrainement"],
    "vestiaires": ["hall"],
    "arène": ["hall"],
    "salle_entrainement": ["hall"]
}
lieu_actuel = "hall"

# Fonctions badge
def ajouter_badge(badge):
    if badge not in personnage:
        personnage[badge] = True
        personnage["Badges"] += 1
        print(f"Vous avez trouvé un badge dans les {badge}!")
        if personnage["Badges"] == 3:
            print("Félicitations! Vous avez collecté tous les badges et gagné le tournoi !")
            sys.exit()
    else:
        print("Vous avez déjà ce badge.")

def combattre():
    # donctions combat
    message_victoire_specifique = pouvoirs[personnage['Pouvoir']]['victoire']
    print(f"{pouvoirs[personnage['Pouvoir']]['message']} {message_victoire_specifique}")
    ajouter_badge("arène")


def changer_lieu(nouveau_lieu):
    global lieu_actuel
    lieu_actuel = nouveau_lieu
    print(f"Vous allez maintenant dans le {nouveau_lieu}.")
    evaluer_lieu()

def evaluer_lieu():
    global lieux_proches
    print(f"Vous êtes actuellement dans {lieu_actuel}. Que voulez-vous faire?")
    if lieu_actuel == "vestiaires":
        ajouter_badge("vestiaires")
    elif lieu_actuel == "arène":
        action = input("Voulez-vous combattre ? (oui/non) ")
        if action.lower() == 'oui':
            combattre()
        else:
            print("Vous avez choisi de ne pas combattre pour l'instant.")
    elif lieu_actuel == "salle_entrainement":
        ajouter_badge("salle_entrainement")
    proposer_actions(["Changer de lieu", "Vérifier l'inventaire"])

def proposer_actions(actions):
    for index, action in enumerate(actions, start=1):
        print(f"{index}. {action}")
    choix = int(input("Que souhaitez-vous faire ? Entrez le numéro de votre choix : "))
    if choix == 1:
        print("Où voulez-vous aller ensuite ?")
        for index, lieu in enumerate(lieux_proches[lieu_actuel], start=1):
            print(f"{index}. {lieu}")
        nouveau_choix = int(input()) - 1
        changer_lieu(lieux_proches[lieu_actuel][nouveau_choix])
    elif choix == 2:
        print(f"Vous avez {personnage['Badges']} badge(s).")
        evaluer_lieu()  # Retour à la boucle principale après vérification de l'inventaire

def intro():
    print("Bienvenue dans le monde de Baki !")
    nom = input("Quel est votre nom de combattant ? ")
    personnage["Nom"] = nom
    print("Choisissez votre spécialité de combat :")
    for key, valeur in pouvoirs.items():
        print(f"{key}. {valeur['nom']}")
    choix_pouvoir = int(input())
    personnage["Pouvoir"] = choix_pouvoir  # Changement pour stocker l'indice
    print(f"{pouvoirs[choix_pouvoir]['message']} Voici votre spécialité choisie : {pouvoirs[choix_pouvoir]['nom']}")
    changer_lieu("hall")

if __name__ == "__main__":
    intro()