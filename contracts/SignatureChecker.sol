pragma solidity ^0.5.0;

import "./ECDSA.sol";

library SignatureChecker {

    // bytes4(keccak256("isValidSignature(bytes32,bytes)")
    bytes4 constant internal MAGICVALUE = 0x1626ba7e;

    /** 
     * @dev Checks the signature of an account using ecrecover.
     * In the future, it will use EIP-1271 to validate signatures of AA contracts.
     */
    function checkSignature(
        address signer,
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool) {
        (address recovered) = ECDSA.recover(hash, signature);
        if (recovered != address(0) && recovered == signer) {
            return true;
        }

        (bool success, bytes memory result) = signer.staticcall(
            abi.encodeWithSelector(MAGICVALUE, hash, signature)
        );
        return (
            success &&
            result.length == 32 &&
            abi.decode(result, (bytes32)) == bytes32(MAGICVALUE)
        );
    }
}
