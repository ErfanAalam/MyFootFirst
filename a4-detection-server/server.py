from flask import Flask, request, jsonify
import cv2
import numpy as np

app = Flask(__name__)

def detect_a4_and_foot(image):
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

    # Cluster intersections (basic method)
    from sklearn.cluster import DBSCAN
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
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    result = detect_a4_and_foot(image)
    return jsonify(result)


@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)