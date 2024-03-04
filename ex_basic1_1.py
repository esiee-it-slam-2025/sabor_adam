teams_points = {
    "Paris SG": 85,
    "Lens": 84,
    "Marseille": 73,
    "Rennes": 68,
    "Lille": 67,
    "Monaco": 65,
    "Lyon": 62,
}

def afficher_classement():
    print("Classement des équipes :")
    for equipe, points in sorted(teams_points.items(), key=lambda item: item[1], reverse=True):
        print(f"{equipe} : {points} points")

def competitions_equipes():
    classement = sorted(teams_points.items(), key=lambda item: item[1], reverse=True)
    
    
    ucl_french_teams = [equipe for equipe, points in classement[:2]]  
    europa_french_teams = [equipe for equipe, points in classement[2:5]]  

    print("Équipes qualifiées pour la Ligue des Champions (UCL) :")
    for equipe in ucl_teams:
        print(equipe)

    print("\nÉquipes qualifiées pour la Ligue Europa (EL) :")
    for equipe in el_teams:
        print(equipe)

if __name__ == "__main__":
    while True:
        choix = input("Entrez 1 pour voir le classement, 2 pour voir les équipes qualifiées pour les compétitions, ou q pour quitter : ")
        if choix == '1':
            afficher_classement()
        elif choix == '2':
            competitions_equipes()
        elif choix.lower() == 'q':
            print("Fin du programme.")
            break
        else:
            print("Choix non valide, veuillez réessayer.")
