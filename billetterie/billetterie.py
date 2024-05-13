# Variables 
stations = {
    "Meinohama": 1.5,
    "Muromi": 0.8,
    "Fujisaki": 1.1,
    "Nishijin": 1.2,
    "Tojinmachi": 0.8,
    "Ohorikoen (Ohori Park)": 1.1,
    "Akasaka": 0.8,
    "Tenjin": 0.8,
    "Nakasu-Kawabata": 1.0,
    "Gion": 0.7,
    "Hakata": 1.2,
    "Higashi-Hie": 2.1,
    "Fukuokakuko (Airport)": 0.0,
}
stations_names = list(stations.keys())

# Zone tarifaire
fare_zones = {
    'Zone 1': {'distance': 3, 'tarif_normal': 210, 'tarif_reduit': 110},
    'Zone 2': {'distance': 7, 'tarif_normal': 260, 'tarif_reduit': 130},
    'Zone 3': {'distance': 11, 'tarif_normal': 300, 'tarif_reduit': 150},                   
    'Zone 4': {'distance': 15, 'tarif_normal': 340, 'tarif_reduit': 170}
}

# Introduction
print("           /////// ")
print("         ///       ")
print("  //////////////   ")
print("      ///          ")
print("///////            ")
print("\nBienvenue sur la billetterie du métro municipal de Fukuoka.")

# fonctions
def get_valid_number(prompt, min_value=0, max_value=None):
    """Demande à l'utilisateur un nombre valide."""
    while True:
        try:
            value = int(input(prompt))
            if value >= min_value and (max_value is None or value <= max_value):
                return value
            else:
                print(f"Veuillez entrer un nombre entre {min_value} et {max_value}." if max_value is not None else f"Veuillez entrer un nombre supérieur ou égal à {min_value}.")
        except ValueError:
            print("Veuillez entrer un nombre valide.")

def calculate_distance(start_station, end_station, stations):
    """Calcule la distance totale entre deux stations."""
    station_list = list(stations.keys())
    start_index = station_list.index(start_station)
    end_index = station_list.index(end_station)
    distance = 0
    if start_index < end_index:
        for i in range(start_index, end_index):
            distance += list(stations.values())[i]
    else:
        for i in range(end_index, start_index):
            distance += list(stations.values())[i]
    return distance

def find_fare_zone(distance, fare_zones):
    """Détermine la zone tarifaire basée sur la distance."""
    for zone, details in fare_zones.items():
        if distance <= details['distance']:
            return zone, details
    return None, None  
# Retourne une valeur par défaut si la distance ne correspond à aucune zone

def calculate_total_cost(nb_billets_adulte, nb_billets_reduit, fare_details):
    """Calcule le coût total en fonction du nombre de billets et des tarifs."""
    total_cost = nb_billets_adulte * fare_details['tarif_normal'] + nb_billets_reduit * fare_details['tarif_reduit']
    return total_cost

# Interaction avec l'utilisateur pour l'achat des billets
nb_billets_adulte = get_valid_number("Combien de billets adulte souhaitez-vous ? ")
nb_billets_reduit = get_valid_number("Combien de billets à tarif réduit souhaitez-vous ? ")

# Choix des stationn
print("\nVeuillez choisir votre station de départ :")
for index, station in enumerate(stations_names):
    print(f"{index + 1}. {station}")
station_depart = stations_names[get_valid_number("Entrez le numéro de votre station de départ : ", 1, len(stations_names)) - 1]

print("\nVeuillez choisir votre station d'arrivée :")
for index, station in enumerate(stations_names):
    print(f"{index + 1}. {station}")
station_arrivee = stations_names[get_valid_number("Entrez le numéro de votre station d'arrivée : ", 1, len(stations_names)) - 1]

# Calcul de l'itinéraire et choix de la bonne zone tarifaire
distance = calculate_distance(station_depart, station_arrivee, stations)
zone, fare_details = find_fare_zone(distance, fare_zones)

if fare_details:  # Si il y'a une zone tarifaire 
    total_cost = calculate_total_cost(nb_billets_adulte, nb_billets_reduit, fare_details)
    print("\nDétails de votre voyage :")
    print(f"De {station_depart} à {station_arrivee}")
    print(f"Distance : {distance:.2f} km, Zone tarifaire : {zone}")
    print(f"Coût total : {total_cost} yens")
    if stations_names.index(station_depart) < stations_names.index(station_arrivee):
        print("Prenez le train sur la voie 1.")
    else:
        print("Prenez le train sur la voie 2.")
else:  # Si aucune zone tarifaire
    print("Erreur : Impossible de calculer l'itinéraire. Veuillez vérifier les noms des stations.")
