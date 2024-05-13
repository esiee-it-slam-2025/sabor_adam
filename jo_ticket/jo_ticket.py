# Import des bibliothèques nécessaires
import json
import locale
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import qrcode
import os

# Configuration locale pour afficher les dates en français
try:
    locale.setlocale(locale.LC_TIME, "fr_FR.UTF-8")
except locale.Error:
    print("Locale française non supportée, utilisation de la locale par défaut.")

# Fonction pour charger des données depuis un fichier JSON
def charger_donnees(fichier):
    # Construit le chemin absolu en se basant sur l'emplacement du script
    dir_path = os.path.dirname(os.path.realpath(__file__))
    chemin_absolu = os.path.join(dir_path, fichier)
    try:
        with open(chemin_absolu, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Erreur : Le fichier {fichier} n'a pas été trouvé à {chemin_absolu}.")
        return []
    except json.JSONDecodeError:
        print(f"Erreur : Échec de décodage JSON pour le fichier {fichier}.")
        return []

# Fonction pour associer les événements aux stades
def associer_stades_evenements(evenements, stades):
    stade_dict = {stade['id']: stade for stade in stades}
    for event in evenements:
        event['stade'] = stade_dict[event['stadium_id']]['name']
        event['location'] = stade_dict[event['stadium_id']]['location']
    return evenements

# Fonction pour associer les billets aux événements
def associer_billets_evenements(billets, evenements):
    evenement_dict = {event['id']: event for event in evenements}
    for billet in billets:
        billet['event'] = evenement_dict[billet['event_id']]
    return billets

# Chargement des données
stadiums = charger_donnees('stadiums.json')
events = charger_donnees('events.json')
tickets = charger_donnees('tickets.json')

# Association des données
events = associer_stades_evenements(events, stadiums)
tickets = associer_billets_evenements(tickets, events)

# Vérification et création du dossier pour les billets générés
if not os.path.exists("tickets"):
    os.makedirs("tickets")

# Chargement de la police de caractères
font_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "fonts", "Paris2024.ttf")
if os.path.exists(font_path):
    font_paris2024 = ImageFont.truetype(font_path, 17)
else:
    print(f"Erreur : Le fichier de police {font_path} est introuvable.")
    # Utilisation d'une police par défaut si la police spécifiée est introuvable
    font_paris2024 = ImageFont.load_default()

# Génération des billets
image_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "ticketJO.png")
if os.path.exists(image_path):
    for ticket in tickets:
        with Image.open(image_path) as im:
            draw = ImageDraw.Draw(im)
            event = ticket['event']
            start_date = datetime.strptime(event['start'], "%Y-%m-%dT%H:%M:%S%z")
            formatted_date = start_date.strftime("%d/%m/%Y")
            formatted_time = start_date.strftime("%H:%M")

            # Préparation des textes à écrire sur le billet
            event_info = [
                (event['team_home'], (37, 426), font_paris2024, (51, 19, 104)),
                (event['team_away'], (112, 503), font_paris2024, (51, 19, 104)),
                (f"{event['stade']} - {event['location']}", (60, 588), font_paris2024, "white"),
                (f"{formatted_date} {formatted_time}", (60, 656), font_paris2024, "white"),
                (ticket['category'], (20, 756), font_paris2024, "white"),
                (ticket['seat'] if ticket['seat'] != "free" else "Libre", (200, 756), font_paris2024, "white"),
                (f"{ticket['price']} {ticket['currency']}", (325, 756), font_paris2024, "white")
            ]

            # Écriture des informations sur le billet
            for text, position, font, color in event_info:
                draw.text(position, text, font=font, fill=color)

            # Création et ajout du QR Code
            qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=6, border=4)
            qr.add_data(f"Event Ticket: {ticket['id']}")
            qr.make()
            img_qr = qr.make_image(fill="black", back="white")
            im.paste(img_qr, (126, 835))

            # Sauvegarde du billet généré
            im.save(f"tickets/Billet_{ticket['id']}.png")
    print("Génération des billets terminée avec succès.")
else:
    print(f"Erreur : Le fichier image {image_path} est introuvable.")
