import os
from flask import Flask, request, redirect, render_template, jsonify
import cv2
import numpy as np
from sklearn.cluster import DBSCAN
import stripe

# Load API key from environment variable (more secure approach)
# You should set this environment variable before running the app
# export STRIPE_API_KEY='your_key_here'
stripe.api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_51RGKYsKy9tcCJAd4O6jDgdFvwJS4mS9Huf5KyMad1WJyr9jozsiwyfLruIfKOaQ62kY8HmrR5jy5TN0vP0S2ecPS00p1JewSJI')

# Initialize Flask app
app = Flask(__name__, static_url_path='', static_folder='public')

# Set domain for Stripe redirects
YOUR_DOMAIN = os.environ.get('APP_DOMAIN', 'http://192.168.137.6:5000')

@app.route('/')
def index():
    """Return the main index page"""
    return render_template('index.html')

@app.route('/success')
def success():
    """Handle successful payments"""
    return jsonify({"status": "success", "message": "Payment processed successfully"})

@app.route('/cancel')
def cancel():
    """Handle canceled payments"""
    return jsonify({"status": "canceled", "message": "Payment was canceled"})

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """Create a Stripe checkout session"""
    try:
        # Parse request data
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400
            
        price = data.get('price')
        name = data.get('name')
        
        if not price or not name:
            return jsonify({"status": "error", "message": "Price and name are required"}), 400

        # Create a product
        product = stripe.Product.create(name=name)

        # Create a price for the product
        created_price = stripe.Price.create(
            unit_amount=int(round(float(price) * 100)),
            currency="eur",
            product=product.id,
        )

        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price': created_price.id,
                    'quantity': 1,
                },
            ],
            mode='payment',
            # payment_method_types=['card','google_pay','apple_pay'],
            success_url=YOUR_DOMAIN + '/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=YOUR_DOMAIN + '/cancel',
        )
        
        return redirect(checkout_session.url, code=303)
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

def detect_a4(image):
    """Detects an A4 paper in the image and returns its contour if found."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    a4_contours = []
    aspect_ratio_threshold = 0.65  # Adjust as needed
    min_a4_area = 20000  # Adjust based on expected A4 size in pixels

    for cnt in contours:
        perimeter = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * perimeter, True)
        if len(approx) == 4:  # Potential rectangle
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = float(w) / h
            area = cv2.contourArea(cnt)

            if (aspect_ratio > aspect_ratio_threshold and aspect_ratio < (1 / aspect_ratio_threshold) and
                    area > min_a4_area):
                a4_contours.append(approx)

    if a4_contours:
        # Return the largest detected A4 contour (assuming the most prominent one is the actual sheet)
        return max(a4_contours, key=cv2.contourArea)
    return None

def detect_foot_on_region(image_gray, region_mask):
    """Detects a foot-like blob within a specified region of interest."""
    masked_image = cv2.bitwise_and(image_gray, image_gray, mask=region_mask)
    _, thresh = cv2.threshold(masked_image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU) # Invert for foot to be white
    dilated_thresh = cv2.dilate(thresh, np.ones((5, 5), np.uint8), iterations=2)
    foot_edges = cv2.Canny(dilated_thresh, 30, 100)
    contours, _ = cv2.findContours(foot_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in contours:
        area = cv2.contourArea(cnt)
        # Adjust area range based on expected foot size relative to A4
        if 3000 < area < 150000:
            # Further checks (e.g., aspect ratio, solidity) could be added here
            return True
    return False

def detect_a4_and_foot_enhanced(image):
    """Enhanced function to detect A4 paper and a foot on it."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    a4_contour = detect_a4(image)

    if a4_contour is not None:
        # Create a mask for the detected A4 region
        a4_mask = np.zeros_like(gray)
        cv2.drawContours(a4_mask, [a4_contour], -1, 255, cv2.FILLED)

        # Detect foot within the A4 region
        foot_detected = detect_foot_on_region(gray, a4_mask)
        return {'a4_detected': True, 'foot_on_a4': foot_detected}
    else:
        return {'a4_detected': False, 'foot_on_a4': False}

@app.route('/detect-sheet', methods=['POST'])
def detect_sheet():
    """API endpoint to detect A4 paper and foot in an uploaded image"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    try:
        file = request.files['image']
        npimg = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({'error': 'Invalid image format'}), 400

        result = detect_a4_and_foot_enhanced(image)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

@app.route('/ping', methods=['GET'])
def ping():
    """Simple health check endpoint"""
    return jsonify({'status': 'ok'})

def create_templates():
    """Create necessary templates directory and files if they don't exist"""
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    # Create a simple index.html if it doesn't exist
    if not os.path.exists('templates/index.html'):
        with open('templates/index.html', 'w') as f:
            f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Stripe Checkout</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f8f9fa;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        h1 {
            color: #4F46E5;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Payment Status</h1>
        <p id="message">Processing payment status...</p>
    </div>
    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('success') ? 'success' : urlParams.get('canceled') ? 'canceled' : null;
        
        if (status === 'success') {
            document.getElementById('message').innerText = 'Payment successful! You can close this window.';
        } else if (status === 'canceled') {
            document.getElementById('message').innerText = 'Payment was canceled.';
        }
    </script>
</body>
</html>
            """)

if __name__ == '__main__':
    # Create necessary templates
    create_templates()
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)