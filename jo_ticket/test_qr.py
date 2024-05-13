
import qrcode
from PIL import Image

billet_id = "bb0dc44e-6ae9-456d-9e11-c6bf2bf66538"

with Image.open("billet.png") as im:
    qr = qrcode.QRCode(box_size=4)
    qr.add_data(billet_id)
    qr.make()

    qr_im = qr.make_image()

    im.paste(qr_im, (111, 340))
    im.save('billet_with_qrcode.png')
