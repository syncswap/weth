// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2022 SyncSwap

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.8.0;

contract ERC1271Mock {
    // bytes4(keccak256("isValidSignature(bytes32,bytes)")
    bytes4 constant internal MAGICVALUE = 0x1626ba7e;

    function isValidSignature(
        bytes32, 
        bytes calldata _signature
    ) external pure returns (bytes4 magicValue) {
        (uint _value) = abi.decode(_signature, (uint));
        if (_value == 1271) {
            magicValue = MAGICVALUE;
        }
    }
}