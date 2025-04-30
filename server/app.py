from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
CROPPED_FOLDER = 'cropped'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CROPPED_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/crop-image', methods=['POST'])
def crop_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Get crop parameters
        try:
            crop_width = int(request.form.get('crop_width', 220))
            crop_height = int(request.form.get('crop_height', 310))
            crop_x = int(request.form.get('crop_x', 0))
            crop_y = int(request.form.get('crop_y', 0))
        except ValueError:
            return jsonify({'error': 'Invalid crop parameters'}), 400

        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        try:
            # Read the image
            img = cv2.imread(filepath)
            if img is None:
                return jsonify({'error': 'Failed to read image'}), 400

            # Get image dimensions
            height, width = img.shape[:2]

            # Calculate crop coordinates
            # Convert from screen coordinates to image coordinates
            scale_x = width / request.form.get('screen_width', width)
            scale_y = height / request.form.get('screen_height', height)
            
            crop_x = int(crop_x * scale_x)
            crop_y = int(crop_y * scale_y)
            crop_width = int(crop_width * scale_x)
            crop_height = int(crop_height * scale_y)

            # Ensure crop coordinates are within image bounds
            crop_x = max(0, min(crop_x, width - 1))
            crop_y = max(0, min(crop_y, height - 1))
            crop_width = min(crop_width, width - crop_x)
            crop_height = min(crop_height, height - crop_y)

            # Crop the image
            cropped_img = img[crop_y:crop_y+crop_height, crop_x:crop_x+crop_width]

            # Save the cropped image
            cropped_filename = f'cropped_{filename}'
            cropped_filepath = os.path.join(CROPPED_FOLDER, cropped_filename)
            cv2.imwrite(cropped_filepath, cropped_img)

            # Clean up the original file
            os.remove(filepath)

            return jsonify({
                'success': True,
                'cropped_image_path': cropped_filepath
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Invalid file type'}), 400

# ... existing endpoints ...

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 