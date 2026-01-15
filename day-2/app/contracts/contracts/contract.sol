// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StorageContract {
    uint256 private storedValue;
    address public owner;
    string private message;


    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    event ValueUpdated(uint256 newValue);
     event MessageUpdated(string newText);

    // menyimpan nilai ke blockchain
    function setValue(uint256 _value) public {
        storedValue = _value;
        emit ValueUpdated(_value);
    }   

    // mengambil nilai dari blockchain
    function getValue() public view returns (uint256) {
        return storedValue;
    }


    // simpan string
    function setText(string memory _text) public onlyOwner {
        message = _text;
        emit MessageUpdated(_text);
    }

    // ambil string
    function getText() public view returns (string memory) {
        return message;
    }
}