import time
import random
import requests
import threading
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.log import setLogLevel, info

def create_topology():
    net = Mininet(topo=None, build=False, ipBase='10.0.0.0/8')

    info('*** Adding controller\n')
    c0 = net.addController(name='c0',
                           controller=RemoteController,
                           ip='ryu',
                           port=6633)

    info('*** Adding switches\n')
    s1 = net.addSwitch('s1', cls=OVSSwitch, protocols='OpenFlow13')
    s2 = net.addSwitch('s2', cls=OVSSwitch, protocols='OpenFlow13')

    info('*** Adding hosts\n')
    # Assign IPs and MACs matching our devices table
    h1 = net.addHost('h1', ip='10.0.2.17', mac='00:00:00:00:00:01') # PC-DevOps
    h2 = net.addHost('h2', ip='192.168.1.23', mac='00:00:00:00:00:02') # PC-Finance
    h3 = net.addHost('h3', ip='172.16.5.48', mac='00:00:00:00:00:03') # IoT-Sensor
    h4 = net.addHost('h4', ip='10.0.3.1', mac='00:00:00:00:00:04') # SVR-Web

    info('*** Creating links\n')
    net.addLink(h1, s1)
    net.addLink(h2, s1)
    net.addLink(h3, s2)
    net.addLink(h4, s2)
    net.addLink(s1, s2)

    info('*** Starting network\n')
    net.build()
    c0.start()
    s1.start([c0])
    s2.start([c0])

    stop_event = threading.Event()
    
    # Thread 1: Periodically report network statistics to Flask API
    reporter_thread = threading.Thread(target=statistics_reporter, args=(net, stop_event))
    reporter_thread.daemon = True
    reporter_thread.start()

    # Thread 2: Generate random ping traffic between hosts
    traffic_thread = threading.Thread(target=generate_traffic, args=(net, stop_event))
    traffic_thread.daemon = True
    traffic_thread.start()

    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        info('*** Stopping network\n')
        stop_event.set()
        net.stop()

def generate_traffic(net, stop_event):
    hosts = [net.get('h1'), net.get('h2'), net.get('h3'), net.get('h4')]
    while not stop_event.is_set():
        src = random.choice(hosts)
        dst = random.choice(hosts)
        if src != dst:
            info(f"Traffic Sim: ping {src.name} -> {dst.name}\n")
            src.cmd(f"ping -c 1 -W 1 {dst.IP()} > /dev/null 2>&1 &")
        time.sleep(random.randint(3, 8))

def statistics_reporter(net, stop_event):
    backend_url = "http://backend:5000/api/v1/traffic/report"
    while not stop_event.is_set():
        time.sleep(10)
        
        inbound_delta = random.randint(15, 75)
        outbound_delta = random.randint(10, 50)
        
        tcp_pct = random.randint(70, 85)
        udp_pct = random.randint(10, 20)
        icmp_pct = 100 - tcp_pct - udp_pct
        
        payload = {
            "inbound": inbound_delta,
            "outbound": outbound_delta,
            "anomalies": random.randint(0, 1),
            "protocol_breakdown": {
                "TCP": tcp_pct,
                "UDP": udp_pct,
                "ICMP": icmp_pct
            }
        }
        
        try:
            res = requests.post(backend_url, json=payload, timeout=3)
            info(f"Network stats posted to backend. Status: {res.status_code}\n")
        except Exception as e:
            info(f"SDN stats report failed: {e}\n")

if __name__ == '__main__':
    setLogLevel('info')
    create_topology()
