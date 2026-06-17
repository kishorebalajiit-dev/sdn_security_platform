import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

def generate_and_train():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    services_dir = os.path.join(base_dir, "services")
    
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(services_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, "traffic_dataset.csv")
    model_path = os.path.join(services_dir, "threat_classifier.pkl")
    
    print("[AI Training] Generating training dataset...")
    # Features: [packet_rate, packet_size_avg, failed_logins, port_scanned_count, arp_requests_rate]
    # Classes: 0: Normal, 1: DDoS, 2: Port Scanning, 3: ARP Spoofing, 4: Brute Force, 5: Unauthorized Access
    
    np.random.seed(42)
    data = []
    
    # 0. Normal
    for _ in range(200):
        data.append([
            np.random.uniform(5.0, 50.0),     # packet_rate
            np.random.uniform(64.0, 1500.0),  # packet_size_avg
            np.random.randint(0, 3),          # failed_logins
            np.random.randint(0, 5),          # port_scanned_count
            np.random.uniform(0.1, 2.0),      # arp_requests_rate
            0                                 # Class
        ])
        
    # 1. DDoS
    for _ in range(150):
        data.append([
            np.random.uniform(10000.0, 80000.0), # packet_rate
            np.random.uniform(64.0, 1500.0),     # packet_size_avg
            np.random.randint(0, 2),             # failed_logins
            np.random.randint(0, 2),             # port_scanned_count
            np.random.uniform(0.1, 1.0),         # arp_requests_rate
            1                                    # Class
        ])
        
    # 2. Port Scanning
    for _ in range(150):
        data.append([
            np.random.uniform(100.0, 1000.0),   # packet_rate
            np.random.uniform(40.0, 80.0),      # packet_size_avg
            np.random.randint(0, 2),            # failed_logins
            np.random.randint(100, 1000),       # port_scanned_count
            np.random.uniform(0.1, 5.0),        # arp_requests_rate
            2                                   # Class
        ])
        
    # 3. ARP Spoofing
    for _ in range(150):
        data.append([
            np.random.uniform(20.0, 200.0),     # packet_rate
            np.random.uniform(42.0, 64.0),      # packet_size_avg
            np.random.randint(0, 2),            # failed_logins
            np.random.randint(0, 3),            # port_scanned_count
            np.random.uniform(100.0, 2000.0),   # arp_requests_rate
            3                                   # Class
        ])
        
    # 4. Brute Force
    for _ in range(150):
        data.append([
            np.random.uniform(10.0, 100.0),     # packet_rate
            np.random.uniform(200.0, 800.0),    # packet_size_avg
            np.random.randint(50, 600),         # failed_logins
            np.random.randint(0, 3),            # port_scanned_count
            np.random.uniform(0.1, 2.0),        # arp_requests_rate
            4                                   # Class
        ])
        
    # 5. Unauthorized Access
    for _ in range(150):
        data.append([
            np.random.uniform(5.0, 30.0),       # packet_rate
            np.random.uniform(800.0, 1500.0),   # packet_size_avg
            np.random.randint(10, 40),          # failed_logins
            np.random.randint(0, 2),            # port_scanned_count
            np.random.uniform(0.1, 2.0),        # arp_requests_rate
            5                                   # Class
        ])
        
    df = pd.DataFrame(data, columns=[
        "packet_rate", "packet_size_avg", "failed_logins", "port_scanned_count", "arp_requests_rate", "label"
    ])
    
    df.to_csv(csv_path, index=False)
    
    X = df.drop(columns=["label"])
    y = df["label"]
    
    print("[AI Training] Training RandomForest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    joblib.dump(model, model_path)
    print(f"[AI Training] Model saved successfully to {model_path}")

if __name__ == "__main__":
    generate_and_train()
