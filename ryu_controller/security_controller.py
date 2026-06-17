import logging
import json
from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import CONFIG_DISPATCHER, MAIN_DISPATCHER
from ryu.controller.handler import set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet, ethernet, ether_types
from ryu.app.wsgi import ControllerBase, WSGIApplication, route
from webob import Response

simple_switch_instance_name = 'simple_switch_api_app'

class SecurityController(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]
    _CONTEXTS = {'wsgi': WSGIApplication}

    def __init__(self, *args, **kwargs):
        super(SecurityController, self).__init__(*args, **kwargs)
        self.mac_to_port = {}
        self.blocked_macs = set()
        self.quarantined_macs = set()
        self.switches = {}
        wsgi = kwargs['wsgi']
        wsgi.register(SecurityControllerRest, {simple_switch_instance_name: self})
        self.logger.info("Ryu Security SDN Controller Initialized.")

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        self.switches[datapath.id] = datapath

        # Install table-miss flow entry (redirect unrecognized to controller)
        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER,
                                          ofproto.OFPCML_NO_BUFFER)]
        self.add_flow(datapath, 0, match, actions)
        self.logger.info("Switch connected: DPID %s", datapath.id)

    def add_flow(self, datapath, priority, match, actions, buffer_id=None, cookie=0):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS,
                                             actions)]
        if buffer_id:
            mod = parser.OFPFlowMod(datapath=datapath, cookie=cookie, buffer_id=buffer_id,
                                    priority=priority, match=match,
                                    instructions=inst)
        else:
            mod = parser.OFPFlowMod(datapath=datapath, cookie=cookie,
                                    priority=priority, match=match,
                                    instructions=inst)
        datapath.send_msg(mod)

    def block_mac(self, mac):
        self.logger.info("SDN Flow Mod: Blocking MAC %s", mac)
        self.blocked_macs.add(mac)
        self.quarantined_macs.discard(mac)
        
        # Pushes high priority drop flow rule
        for datapath in self.switches.values():
            parser = datapath.ofproto_parser
            match = parser.OFPMatch(eth_src=mac)
            self.add_flow(datapath, 100, match, [], cookie=99) # empty actions = drop
            
            match_dst = parser.OFPMatch(eth_dst=mac)
            self.add_flow(datapath, 100, match_dst, [], cookie=99)

    def allow_mac(self, mac):
        self.logger.info("SDN Flow Mod: Allowing MAC %s", mac)
        self.blocked_macs.discard(mac)
        self.quarantined_macs.discard(mac)
        
        # Remove drop flows
        for datapath in self.switches.values():
            ofproto = datapath.ofproto
            parser = datapath.ofproto_parser
            mod = parser.OFPFlowMod(
                datapath=datapath,
                cookie=99,
                cookie_mask=0xFFFFFFFF,
                command=ofproto.OFPFC_DELETE,
                out_port=ofproto.OFPP_ANY,
                out_group=ofproto.OFPG_ANY
            )
            datapath.send_msg(mod)

    def quarantine_mac(self, mac):
        self.logger.info("SDN Flow Mod: Quarantining MAC %s", mac)
        self.quarantined_macs.add(mac)
        self.blocked_macs.discard(mac)
        
        # Drop src traffic but allow with high priority for containment
        for datapath in self.switches.values():
            parser = datapath.ofproto_parser
            match = parser.OFPMatch(eth_src=mac)
            self.add_flow(datapath, 90, match, [], cookie=99)

    def monitor_mac(self, mac):
        self.logger.info("SDN Flow Mod: Monitoring MAC %s", mac)
        # Normal forwarding but mark with flow cookie for accounting
        for datapath in self.switches.values():
            ofproto = datapath.ofproto
            parser = datapath.ofproto_parser
            match = parser.OFPMatch(eth_src=mac)
            self.add_flow(datapath, 50, match, [parser.OFPActionOutput(ofproto.OFPP_NORMAL)], cookie=88)

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocols(ethernet.ethernet)[0]

        if eth.ethertype == ether_types.ETH_TYPE_LLDP:
            return

        dst = eth.dst
        src = eth.src
        dpid = datapath.id
        
        self.mac_to_port.setdefault(dpid, {})

        if src in self.blocked_macs or src in self.quarantined_macs:
            self.logger.warning("Packet blocked from MAC: %s", src)
            return

        self.logger.info("Packet in DPID:%s src:%s dst:%s port:%s", dpid, src, dst, in_port)
        self.mac_to_port[dpid][src] = in_port

        if dst in self.mac_to_port[dpid]:
            out_port = self.mac_to_port[dpid][dst]
        else:
            out_port = ofproto.OFPP_FLOOD

        actions = [parser.OFPActionOutput(out_port)]

        if out_port != ofproto.OFPP_FLOOD:
            match = parser.OFPMatch(in_port=in_port, eth_dst=dst, eth_src=src)
            if msg.buffer_id != ofproto.OFP_NO_BUFFER:
                self.add_flow(datapath, 1, match, actions, msg.buffer_id)
                return
            else:
                self.add_flow(datapath, 1, match, actions)

        data = None
        if msg.buffer_id == ofproto.OFP_NO_BUFFER:
            data = msg.data

        out = parser.OFPPacketOut(datapath=datapath, buffer_id=msg.buffer_id,
                                  in_port=in_port, actions=actions, data=data)
        datapath.send_msg(out)


class SecurityControllerRest(ControllerBase):
    def __init__(self, req, link, data, **config):
        super(SecurityControllerRest, self).__init__(req, link, data, **config)
        self.ryu_app = data[simple_switch_instance_name]

    @route('sdn', '/sdn/block', methods=['POST'])
    def block_device(self, req, **kwargs):
        try:
            body = json.loads(req.body)
            mac = body.get('mac')
            if mac:
                self.ryu_app.block_mac(mac)
                return Response(content_type='application/json', body=json.dumps({"status": "blocked", "mac": mac}))
        except Exception as e:
            return Response(status=500, body=str(e))
        return Response(status=400, body="Missing MAC address")

    @route('sdn', '/sdn/allow', methods=['POST'])
    def allow_device(self, req, **kwargs):
        try:
            body = json.loads(req.body)
            mac = body.get('mac')
            if mac:
                self.ryu_app.allow_mac(mac)
                return Response(content_type='application/json', body=json.dumps({"status": "allowed", "mac": mac}))
        except Exception as e:
            return Response(status=500, body=str(e))
        return Response(status=400, body="Missing MAC address")

    @route('sdn', '/sdn/quarantine', methods=['POST'])
    def quarantine_device(self, req, **kwargs):
        try:
            body = json.loads(req.body)
            mac = body.get('mac')
            if mac:
                self.ryu_app.quarantine_mac(mac)
                return Response(content_type='application/json', body=json.dumps({"status": "quarantined", "mac": mac}))
        except Exception as e:
            return Response(status=500, body=str(e))
        return Response(status=400, body="Missing MAC address")

    @route('sdn', '/sdn/monitor', methods=['POST'])
    def monitor_device(self, req, **kwargs):
        try:
            body = json.loads(req.body)
            mac = body.get('mac')
            if mac:
                self.ryu_app.monitor_mac(mac)
                return Response(content_type='application/json', body=json.dumps({"status": "monitoring", "mac": mac}))
        except Exception as e:
            return Response(status=500, body=str(e))
        return Response(status=400, body="Missing MAC address")
