// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Sample {

    event Test(string value);

    function test(string memory value) public {
        emit Test(value);
    }
}