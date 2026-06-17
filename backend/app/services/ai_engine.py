from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Sample data for training the AI model
# In a real application, this would come from a large dataset of network traffic
TRAFFIC_DATA = [
    # Normal traffic
    [1500, 80, 443, 0], [1200, 1024, 65535, 0], [100, 22, 22, 0],
    # DDoS attack (high packet count, common ports)
    [50000, 80, 80, 1], [60000, 443, 443, 1], [55000, 53, 53, 1],
    # Port scanning (sequential destination ports)
    [10, 1, 21, 2], [10, 1, 22, 2], [10, 1, 23, 2], [10, 1, 25, 2],
]

FEATURE_NAMES = ["packet_size", "src_port", "dst_port"]
TARGET_NAME = "threat_type"
THREAT_MAP = {0: "Normal", 1: "DDoS", 2: "Port Scanning"}

# Create a DataFrame
df = pd.DataFrame(TRAFFIC_DATA, columns=FEATURE_NAMES + [TARGET_NAME])

X = df[FEATURE_NAMES]
y = df[TARGET_NAME]

# Split data for training and testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Initialize and train the classifier
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)


def analyze_traffic(traffic_features: list) -> dict:
    """
    Analyzes a single instance of network traffic to classify it.
    :param traffic_features: A list of features [packet_size, src_port, dst_port]
    :return: A dictionary with the analysis result.
    """
    features = np.array(traffic_features).reshape(1, -1)
    prediction = clf.predict(features)[0]
    confidence_scores = clf.predict_proba(features)[0]
    confidence = max(confidence_scores) * 100

    threat_type = THREAT_MAP.get(prediction, "Unknown")
    recommendation = "No action needed."
    risk_level = "Low"

    if threat_type == "DDoS":
        recommendation = "Block source IP and monitor traffic patterns."
        risk_level = "Critical"
    elif threat_type == "Port Scanning":
        recommendation = "Isolate the source IP and investigate for further malicious activity."
        risk_level = "High"

    return {
        "threat_classification": threat_type,
        "confidence_score": round(confidence, 2),
        "risk_level": risk_level,
        "recommendation": recommendation,
        "features": dict(zip(FEATURE_NAMES, traffic_features))
    }


def analyze_signal(signal: str) -> dict:
    # This function is kept for compatibility with existing routes,
    # but the primary analysis should be done via analyze_traffic.
    # We can try to parse features from the signal string.
    try:
        # A real implementation would have a more robust parser.
        parts = signal.split(',')
        features = [int(p.split('=')[1]) for p in parts]
        return analyze_traffic(features)
    except Exception:
        return {
            "threat_classification": "Undetermined",
            "confidence_score": 0,
            "risk_level": "Unknown",
            "recommendation": "Could not parse signal for traffic analysis.",
            "features": {}
        }

