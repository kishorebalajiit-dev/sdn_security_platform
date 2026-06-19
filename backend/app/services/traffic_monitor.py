import threading
import time
import socket
import psutil
from datetime import datetime, timezone
from app.extensions import db, socketio, get_supabase
from app.models.core import NetworkTraffic, Alert
from app.services.ai_engine import analyze_signal

# Global counters updated by packet sniffer
packet_counts = {
    "TCP": 0, "UDP": 0, "HTTP": 0, "HTTPS": 0, "DNS": 0,
    "ICMP": 0, "ARP": 0, "SSH": 0, "MQTT": 0, "Other": 0
}
packet_types = {
    "normal": 0, "suspicious": 0, "dropped": 0, "blocked": 0
}
bandwidth_by_ip = {} # IP -> {"in": bytes, "out": bytes, "packets": count, "connections": count}

sniffer_started = False
monitor_thread = None
_lock = threading.Lock()

def get_network_details():
    addrs = psutil.net_if_addrs()
    stats = psutil.net_if_stats()
    
    active_iface = "Unknown"
    conn_type = "Ethernet"
    ip_addr = "127.0.0.1"
    mac_addr = "00:00:00:00:00:00"
    
    for iface, iface_stats in stats.items():
        if iface_stats.isup and iface != 'lo':
            active_iface = iface
            if 'wi-fi' in iface.lower() or 'wlan' in iface.lower():
                conn_type = "WiFi"
            
            if iface in addrs:
                for addr in addrs[iface]:
                    if addr.family == socket.AF_INET:
                        ip_addr = addr.address
                    elif addr.family == psutil.AF_LINK if hasattr(psutil, 'AF_LINK') else -1:
                        mac_addr = addr.address
                    elif hasattr(socket, 'AF_LINK') and addr.family == socket.AF_LINK:
                        mac_addr = addr.address
            break
            
    return active_iface, conn_type, ip_addr, mac_addr

def packet_callback(pkt):
    global packet_counts, packet_types, bandwidth_by_ip
    try:
        from scapy.all import IP, TCP, UDP, ICMP, ARP
        
        proto = "Other"
        size = len(pkt)
        src_ip = None
        dst_ip = None
        
        if pkt.haslayer(IP):
            src_ip = pkt[IP].src
            dst_ip = pkt[IP].dst
            
            if pkt.haslayer(TCP):
                proto = "TCP"
                sport = pkt[TCP].sport
                dport = pkt[TCP].dport
                if sport == 443 or dport == 443: proto = "HTTPS"
                elif sport == 80 or dport == 80: proto = "HTTP"
                elif sport == 22 or dport == 22: proto = "SSH"
                elif sport == 1883 or dport == 1883: proto = "MQTT"
            elif pkt.haslayer(UDP):
                proto = "UDP"
                sport = pkt[UDP].sport
                dport = pkt[UDP].dport
                if sport == 53 or dport == 53: proto = "DNS"
                elif sport == 1883 or dport == 1883: proto = "MQTT"
            elif pkt.haslayer(ICMP):
                proto = "ICMP"
        elif pkt.haslayer(ARP):
            proto = "ARP"
            
        packet_counts[proto] = packet_counts.get(proto, 0) + 1
        
        # Analyze packet type (heuristic rules)
        is_suspicious = False
        if proto == "ARP" and pkt.haslayer(ARP) and pkt[ARP].op == 2:
            # Simple ARP spoof checking can be added here
            pass
            
        if is_suspicious:
            packet_types["suspicious"] += 1
        else:
            packet_types["normal"] += 1
            
        # Update bandwidth consumers
        if src_ip:
            if src_ip not in bandwidth_by_ip:
                bandwidth_by_ip[src_ip] = {"in": 0, "out": 0, "packets": 0, "connections": 0}
            bandwidth_by_ip[src_ip]["out"] += size
            bandwidth_by_ip[src_ip]["packets"] += 1
            
        if dst_ip:
            if dst_ip not in bandwidth_by_ip:
                bandwidth_by_ip[dst_ip] = {"in": 0, "out": 0, "packets": 0, "connections": 0}
            bandwidth_by_ip[dst_ip]["in"] += size
            bandwidth_by_ip[dst_ip]["packets"] += 1
            
    except Exception:
        pass

def start_scapy_sniffer():
    global sniffer_started
    if sniffer_started:
        return
    sniffer_started = True
    
    def run_sniff():
        try:
            from scapy.all import sniff
            iface, _, _, _ = get_network_details()
            if iface != "Unknown":
                sniff(iface=iface, prn=packet_callback, store=0)
            else:
                sniff(prn=packet_callback, store=0)
        except Exception as e:
            print(f"[Traffic Monitor] Scapy sniff error (possibly missing Npcap/permissions): {e}")
            # Fallback connection-based estimation loop
            while True:
                time.sleep(1)
                estimate_from_connections()
                
    t = threading.Thread(target=run_sniff, daemon=True)
    t.start()

def estimate_from_connections():
    """Fallback function to generate real-time counts from socket connections if sniffing is unavailable."""
    global packet_counts, packet_types
    try:
        conns = psutil.net_connections(kind='inet')
        for c in conns:
            proto = "TCP" if c.type == 1 else "UDP"
            packet_counts[proto] = packet_counts.get(proto, 0) + 1
            if c.raddr:
                if c.raddr.port == 443: packet_counts["HTTPS"] = packet_counts.get("HTTPS", 0) + 1
                elif c.raddr.port == 80: packet_counts["HTTP"] = packet_counts.get("HTTP", 0) + 1
                elif c.raddr.port == 53: packet_counts["DNS"] = packet_counts.get("DNS", 0) + 1
                elif c.raddr.port == 22: packet_counts["SSH"] = packet_counts.get("SSH", 0) + 1
        packet_types["normal"] += len(conns)
    except Exception:
        pass

def traffic_monitoring_loop(app):
    global packet_counts, packet_types, bandwidth_by_ip
    
    with app.app_context():
        iface, conn_type, ip_addr, mac_addr = get_network_details()
        
        # Initial counters
        last_io = psutil.net_io_counters(pernic=True).get(iface, psutil.net_io_counters())
        last_time = time.time()
        
        while True:
            time.sleep(3.0)
            try:
                current_time = time.time()
                elapsed = current_time - last_time
                if elapsed <= 0: elapsed = 3.0
                
                current_io = psutil.net_io_counters(pernic=True).get(iface, psutil.net_io_counters())
                
                bytes_sent_delta = current_io.bytes_sent - last_io.bytes_sent
                bytes_recv_delta = current_io.bytes_recv - last_io.bytes_recv
                pkts_sent_delta = current_io.packets_sent - last_io.packets_sent
                pkts_recv_delta = current_io.packets_received - last_io.packets_received if hasattr(current_io, 'packets_received') else (current_io.packets_recv - last_io.packets_recv)
                
                last_io = current_io
                last_time = current_time
                
                upload_speed_mbps = (bytes_sent_delta * 8) / (elapsed * 1024 * 1024)
                download_speed_mbps = (bytes_recv_delta * 8) / (elapsed * 1024 * 1024)
                
                # Active connections
                conns = psutil.net_connections(kind='inet')
                active_conn_count = len(conns)
                
                # Update connection counts in consumers
                for c in conns:
                    if c.raddr:
                        rip = c.raddr.ip
                        if rip not in bandwidth_by_ip:
                            bandwidth_by_ip[rip] = {"in": 0, "out": 0, "packets": 0, "connections": 0}
                        bandwidth_by_ip[rip]["connections"] += 1
                
                # Anomaly Detection & Alert Generation using AI engine
                anomalies_count = 0
                alert_triggered = False
                
                # Heuristic spike or abnormal pattern detection
                signal_text = f"Traffic update: download={download_speed_mbps:.2f}Mbps, connections={active_conn_count}, packets={pkts_sent_delta + pkts_recv_delta}"
                if download_speed_mbps > 50.0:
                    signal_text += " abnormal traffic spikes ddos patterns detected"
                    anomalies_count += 1
                if active_conn_count > 300:
                    signal_text += " port scanning brute force activity"
                    anomalies_count += 1
                    
                ai_res = analyze_signal(signal_text)
                if ai_res and ai_res.get("classification") != "Normal Activity":
                    anomalies_count += 1
                    alert_triggered = True
                    alert_id = f"ALT-TRAFFIC-{int(time.time())}"
                    
                    # Create Alert in SQLAlchemy
                    new_alert = Alert(
                        alert_id=alert_id,
                        severity=ai_res.get("severity", "high").lower(),
                        title=f"AI Network Alert: {ai_res.get('classification')}",
                        message=ai_res.get("recommendation", "Suspicious traffic anomaly identified by AI classifier."),
                        status="new",
                        device_name=iface,
                        ai_confidence=ai_res.get("confidence", 85)
                    )
                    db.session.add(new_alert)
                
                bucket_label = datetime.now(timezone.utc).strftime("%H:%M:%S")
                
                # Save to traffic_logs via NetworkTraffic model
                traffic_rec = NetworkTraffic(
                    bucket=bucket_label,
                    inbound=bytes_recv_delta,
                    outbound=bytes_sent_delta,
                    anomalies=anomalies_count,
                    protocol_breakdown=packet_counts.copy(),
                    network_name=iface,
                    connection_type=conn_type,
                    upload_speed=float(upload_speed_mbps),
                    download_speed=float(download_speed_mbps),
                    packets_sent=pkts_sent_delta,
                    packets_received=pkts_recv_delta,
                    active_connections=active_conn_count,
                    packets=pkts_sent_delta + pkts_recv_delta
                )
                db.session.add(traffic_rec)
                
                # Rolling window limit
                if NetworkTraffic.query.count() > 60:
                    oldest = NetworkTraffic.query.order_by(NetworkTraffic.created_at.asc()).first()
                    if oldest: db.session.delete(oldest)
                    
                db.session.commit()
                
                # Sync with Supabase Storage/Tables if available
                supabase_client = get_supabase()
                if supabase_client:
                    try:
                        supabase_client.table("traffic_logs").insert({
                            "bucket": bucket_label,
                            "inbound": bytes_recv_delta,
                            "outbound": bytes_sent_delta,
                            "anomalies": anomalies_count,
                            "protocol_breakdown": packet_counts,
                            "upload_speed": float(upload_speed_mbps),
                            "download_speed": float(download_speed_mbps),
                            "packets": pkts_sent_delta + pkts_recv_delta
                        }).execute()
                    except Exception:
                        pass
                
                # Top consumers formatting
                top_consumers = []
                sorted_ips = sorted(bandwidth_by_ip.items(), key=lambda x: x[1]["in"] + x[1]["out"], reverse=True)[:6]
                for ip, metrics in sorted_ips:
                    try:
                        hostname = socket.getnameinfo((ip, 0), socket.NI_NAMEREQD)[0]
                    except Exception:
                        hostname = ip
                    top_consumers.append({
                        "device": hostname,
                        "ip": ip,
                        "in": round(metrics["in"] / 1024, 1),
                        "out": round(metrics["out"] / 1024, 1),
                        "packets": metrics["packets"],
                        "connections": metrics["connections"]
                    })
                    
                # Packet analysis bar data
                packet_analysis_data = [
                    {"time": bucket_label, "normal": packet_types["normal"], "suspicious": packet_types["suspicious"], "dropped": packet_types["dropped"]}
                ]
                
                # Emit real live telemetry payload to all listening frontend clients via WebSocket
                payload = {
                    "upload_speed": round(upload_speed_mbps, 2),
                    "download_speed": round(download_speed_mbps, 2),
                    "bytes_sent": current_io.bytes_sent,
                    "bytes_received": current_io.bytes_recv,
                    "packets_sent": pkts_sent_delta,
                    "packets_received": pkts_recv_delta,
                    "active_connections": active_conn_count,
                    "network_type": conn_type,
                    "network_name": iface,
                    "ip_address": ip_addr,
                    "mac_address": mac_addr,
                    "protocol_data": [
                        {"name": k, "packets": v, "color": c} for k, v, c in [
                            ("HTTPS", packet_counts.get("HTTPS", 0), "#2563EB"),
                            ("HTTP", packet_counts.get("HTTP", 0), "#06B6D4"),
                            ("DNS", packet_counts.get("DNS", 0), "#22C55E"),
                            ("SSH", packet_counts.get("SSH", 0), "#FFFF00"),
                            ("MQTT (IoT)", packet_counts.get("MQTT", 0), "#F59E0B"),
                            ("TCP/UDP Other", packet_counts.get("TCP", 0) + packet_counts.get("UDP", 0), "#EF4444")
                        ]
                    ],
                    "bandwidth_by_device": top_consumers if top_consumers else [
                        { "device": "Local Host", "in": round(download_speed_mbps, 1), "out": round(upload_speed_mbps, 1), "color": "#2563EB" }
                    ],
                    "packet_analysis": {
                        "normal": packet_types["normal"],
                        "suspicious": packet_types["suspicious"],
                        "dropped": packet_types["dropped"]
                    },
                    "bucket": bucket_label,
                    "anomalies": anomalies_count
                }
                
                socketio.emit("traffic_update", payload)
                
            except Exception as e:
                print(f"[Traffic Monitor Loop Error]: {e}")

def init_traffic_monitor(app):
    global monitor_thread
    with _lock:
        if monitor_thread is None:
            start_scapy_sniffer()
            monitor_thread = threading.Thread(target=traffic_monitoring_loop, args=(app,), daemon=True)
            monitor_thread.start()
            print("[Traffic Monitor] Background monitoring thread initialized.")
