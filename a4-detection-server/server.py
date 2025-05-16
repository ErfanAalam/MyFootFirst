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

def detect_a4_and_foot(image):
    """Detect A4 paper and foot in the provided image"""
    # Convert to grayscale and blur
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Edge detection
    edges = cv2.Canny(blurred, 50, 150, apertureSize=3)

    # Hough line detection
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=20)

    if lines is None or len(lines) < 4:
        return {'a4_detected': False, 'foot_on_a4': False}

    # Collect all line endpoints
    points = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        points.append((x1, y1))
        points.append((x2, y2))

    # Cluster intersections
    clustering = DBSCAN(eps=30, min_samples=2).fit(points)
    clusters = clustering.labels_
    num_corners = len(set(clusters)) - (1 if -1 in clusters else 0)

    a4_detected = num_corners >= 3  # Accept even with 1 missing corner

    # A4 region mask
    mask = np.zeros_like(gray)
    for line in lines:
        x1, y1, x2, y2 = line[0]
        cv2.line(mask, (x1, y1), (x2, y2), 255, 5)

    mask_dilated = cv2.dilate(mask, np.ones((11, 11), np.uint8), iterations=2)

    # Apply mask and detect larger non-rectangular blobs = foot
    foot_region = cv2.bitwise_and(gray, gray, mask=mask_dilated)
    _, foot_thresh = cv2.threshold(foot_region, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    foot_edges = cv2.Canny(foot_thresh, 50, 150)
    contours, _ = cv2.findContours(foot_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    foot_detected = False
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if 5000 < area < 200000:  # Range tuned for foot size
            foot_detected = True
            break

    return {'a4_detected': a4_detected, 'foot_on_a4': foot_detected}

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

        result = detect_a4_and_foot(image)
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