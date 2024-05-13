# Variables
liste_course = {
    "pates": 2,
    "sauce tomate": 1,
    "parmesan": 1
}

# Fonctions
def show_actions():
    print("1 - Ajouter")
    print("2 - Supprimer")
    print("3 - Modifier")
    print("4 - Quitter")

def show_list():
    for index, (item, quantity) in enumerate(liste_course.items(), start=1):
        print(f"{index}. {item}: {quantity}")

def add_item():
    item = input("Entrez l'article à ajouter: ")
    quantity_input = input("Entrez la quantité: ")
    if quantity_input.isdigit():
        quantity = int(quantity_input)
        liste_course[item] = quantity
    else:
        print("Veuillez entrer un nombre pour la quantité.")
    show_list()

def remove_item():
    show_list()
    item_input = input("Entrez le numéro ou le nom de l'article à supprimer: ")
    if item_input.isdigit():
        item_number = int(item_input) - 1
        if item_number >= 0 and item_number < len(liste_course):
            item = list(liste_course.keys())[item_number]
            del liste_course[item]
        else:
            print("Numéro invalide.")
    else:
        if item_input in liste_course:
            del liste_course[item_input]
        else:
            print("Article non trouvé.")
    show_list()

def modify_item():
    show_list()
    item_input = input("Entrez le numéro ou le nom de l'article à modifier: ")
    if item_input.isdigit():
        item_number = int(item_input) - 1
        if item_number >= 0 and item_number < len(liste_course):
            item = list(liste_course.keys())[item_number]
        else:
            print("Numéro invalide.")
            return
    else:
        if item_input in liste_course:
            item = item_input
        else:
            print("Article non trouvé.")
            return
    new_quantity_input = input("Entrez la nouvelle quantité: ")
    if new_quantity_input.isdigit():
        new_quantity = int(new_quantity_input)
        liste_course[item] = new_quantity
    else:
        print("Veuillez entrer un nombre pour la quantité.")
    show_list()


def main():
    print("Bienvenue dans la liste de courses.\n")
    while True:
        print("Que voulez-vous faire ?")
        show_actions()
        choice = input("Faites votre choix (1-4): ")
        if choice == "1":
            add_item()
        elif choice == "2":
            remove_item()
        elif choice == "3":
            modify_item()
        elif choice == "4":
            print("À bientôt")
            break
        else:
            print("Choix invalide, veuillez réessayer.")

if __name__ == "__main__":
    main()
