// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecurityAudit {
    struct User {
        string email;
        string fullName;
        string role;
        bool isRegistered;
    }

    struct Device {
        string deviceId;
        string deviceName;
        string ipAddress;
        string macAddress;
        bool isRegistered;
    }

    struct AuditRecord {
        uint256 timestamp;
        string entityType;
        string entityId;
        string action;
        string actor;
        string detailsHash;
    }

    address public owner;
    mapping(address => User) public users;
    mapping(string => Device) public devices;
    AuditRecord[] public auditRecords;

    event UserRegistered(address indexed userAddr, string email, string role);
    event DeviceRegistered(string indexed deviceId, string deviceName, string ipAddress);
    event AuditRecordCreated(uint256 indexed index, string entityType, string action, string actor);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerUser(address userAddr, string memory email, string memory fullName, string memory role) public {
        users[userAddr] = User(email, fullName, role, true);
        emit UserRegistered(userAddr, email, role);
    }

    function getUser(address userAddr) public view returns (string memory email, string memory fullName, string memory role, bool isRegistered) {
        User memory u = users[userAddr];
        return (u.email, u.fullName, u.role, u.isRegistered);
    }

    function registerDevice(string memory deviceId, string memory deviceName, string memory ipAddress, string memory macAddress) public {
        devices[deviceId] = Device(deviceId, deviceName, ipAddress, macAddress, true);
        emit DeviceRegistered(deviceId, deviceName, ipAddress);
    }

    function verifyDevice(string memory deviceId) public view returns (bool isRegistered, string memory deviceName, string memory ipAddress, string memory macAddress) {
        Device memory d = devices[deviceId];
        return (d.isRegistered, d.deviceName, d.ipAddress, d.macAddress);
    }

    function createAuditRecord(string memory entityType, string memory entityId, string memory action, string memory actor, string memory detailsHash) public {
        auditRecords.push(AuditRecord(block.timestamp, entityType, entityId, action, actor, detailsHash));
        emit AuditRecordCreated(auditRecords.length - 1, entityType, action, actor);
    }

    function getAuditRecordCount() public view returns (uint256) {
        return auditRecords.length;
    }

    function getAuditRecord(uint256 index) public view returns (uint256 timestamp, string memory entityType, string memory entityId, string memory action, string memory actor, string memory detailsHash) {
        require(index < auditRecords.length, "Index out of bounds");
        AuditRecord memory r = auditRecords[index];
        return (r.timestamp, r.entityType, r.entityId, r.action, r.actor, r.detailsHash);
    }
}
