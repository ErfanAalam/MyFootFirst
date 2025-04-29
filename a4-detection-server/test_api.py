import requests
from io import BytesIO

# URL of the image you want to test
# image_url = 'https://stimg.cardekho.com/images/carexteriorimages/930x620/Maruti/Dzire/11387/1731318279714/front-left-side-47.jpg?impolicy=resize&imwidth=420'
# image_url = 'https://play-lh.googleusercontent.com/q8DILvjmGt69DvEiHZl0zLn-pEpaBeAyUJTdVrlpqCv2h0BUos1ugPQM977BTbFZwK5H=w526-h296-rw'
image_url = 'https://www.shutterstock.com/image-photo/person-holding-white-empty-paper-600nw-1056193124.jpg'
# image_url = 'https://5.imimg.com/data5/MT/FM/LY/SELLER-29793180/a4-sheet-500x500.jpg'

# Flask server URL
upload_url = 'http://192.168.83.30:5000/detect-sheet'  # or 'http://192.168.83.30:5000/detect-sheet'

# Download the image
img_response = requests.get(image_url)

# Check if the image is downloaded successfully
if img_response.status_code == 200:
    img_file = BytesIO(img_response.content)

    # Send the image to the Flask server
    files = {'image': ('car.jpg', img_file, 'image/jpeg')}
    print(files)
    response = requests.post(upload_url, files=files)

    print(response.json())
else:
    print("Failed to download image.")
