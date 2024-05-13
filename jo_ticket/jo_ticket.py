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
    with open(chemin_absolu, 'r', encoding='utf-8') as file:
        return json.load(file)

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

# Chargement de la police de caractères
font_paris2024 = ImageFont.truetype("fonts/Paris2024.ttf", 21)

# Génération des billets
for ticket in tickets:
    with Image.open("ticketJO.png") as im:
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
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=4, border=4)
        qr.add_data(f"Event Ticket: {ticket['id']}")
        qr.make()
        img_qr = qr.make_image(fill="black", back="white")
        im.paste(img_qr, (126, 835))

        # Sauvegarde du billet généré
        im.save(f"tickets/Billet_{ticket['id']}.png")

print("Génération des billets terminée avec succès.")
