// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecurityContract {

    address public owner;

    enum Role { Admin, SecurityAnalyst, NetworkEngineer, Auditor }
    enum VerificationStatus { Pending, Verified, Rejected }

    struct User {
        bytes32 id;
        address walletAddress;
        Role role;
        bytes32 authenticationHash;
        VerificationStatus verificationStatus;
        bool exists;
    }

    struct Device {
        bytes32 id;
        address ownerAddress;
        bytes32 authenticationHash;
        VerificationStatus verificationStatus;
        bool exists;
    }

    struct AuditRecord {
        uint id;
        address initiator;
        string action;
        uint timestamp;
    }

    mapping(address => User) public users;
    mapping(bytes32 => Device) public devices;
    AuditRecord[] public auditLog;
    uint public auditLogCount;

    event UserRegistered(address indexed walletAddress, bytes32 indexed userId, Role role);
    event UserVerified(address indexed walletAddress, VerificationStatus status);
    event DeviceRegistered(bytes32 indexed deviceId, address indexed ownerAddress);
    event DeviceVerified(bytes32 indexed deviceId, VerificationStatus status);
    event AuditRecordCreated(uint id, address indexed initiator, string action, uint timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAdmin() {
        require(users[msg.sender].role == Role.Admin, "Only admins can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerUser(address _walletAddress, bytes32 _userId, Role _role, bytes32 _authenticationHash) public onlyOwner {
        require(!users[_walletAddress].exists, "User already registered");
        users[_walletAddress] = User({
            id: _userId,
            walletAddress: _walletAddress,
            role: _role,
            authenticationHash: _authenticationHash,
            verificationStatus: VerificationStatus.Pending,
            exists: true
        });
        emit UserRegistered(_walletAddress, _userId, _role);
    }

    function verifyUser(address _walletAddress, bytes32 _authenticationHash) public view returns (bool, Role) {
        if (users[_walletAddress].exists && users[_walletAddress].authenticationHash == _authenticationHash) {
            return (true, users[_walletAddress].role);
        }
        return (false, users[_walletAddress].role);
    }
    
    function setVerificationStatusUser(address _userAddress, VerificationStatus _status) public onlyAdmin {
        require(users[_userAddress].exists, "User does not exist");
        users[_userAddress].verificationStatus = _status;
        emit UserVerified(_userAddress, _status);
    }

    function registerDevice(bytes32 _deviceId, address _ownerAddress, bytes32 _authenticationHash) public {
        require(users[msg.sender].exists, "User must be registered to register a device");
        require(!devices[_deviceId].exists, "Device already registered");
        devices[_deviceId] = Device({
            id: _deviceId,
            ownerAddress: _ownerAddress,
            authenticationHash: _authenticationHash,
            verificationStatus: VerificationStatus.Pending,
            exists: true
        });
        emit DeviceRegistered(_deviceId, _ownerAddress);
    }

    function verifyDevice(bytes32 _deviceId, bytes32 _authenticationHash) public view returns (bool) {
        return devices[_deviceId].exists && devices[_deviceId].authenticationHash == _authenticationHash;
    }

    function setVerificationStatusDevice(bytes32 _deviceId, VerificationStatus _status) public onlyAdmin {
        require(devices[_deviceId].exists, "Device does not exist");
        devices[_deviceId].verificationStatus = _status;
        emit DeviceVerified(_deviceId, _status);
    }

    function createAuditRecord(string memory _action) public {
        require(users[msg.sender].exists, "User must be registered to create an audit record");
        auditLogCount++;
        auditLog.push(AuditRecord(auditLogCount, msg.sender, _action, block.timestamp));
        emit AuditRecordCreated(auditLogCount, msg.sender, _action, block.timestamp);
    }
}