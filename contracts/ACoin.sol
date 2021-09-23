// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
// Testing
import "hardhat/console.sol";

contract ACoin is ERC20, ERC20Burnable, Pausable, Ownable, ERC20Permit, ERC20Votes {
    constructor() ERC20("ACoin", "ACN") ERC20Permit("ACoin") {
      _mint(msg.sender, 1000000000 * 10 ** decimals());
    }

    function pause() public onlyOwner {
      _pause();
    }

    function unpause() public onlyOwner {
      _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
      _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
      internal
      whenNotPaused
      override
    {
      super._beforeTokenTransfer(from, to, amount);
    }

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(address from, address to, uint256 amount)
      internal
      override(ERC20, ERC20Votes)
    {
      super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
      internal
      override(ERC20, ERC20Votes)
    {
      super._mint(to, amount);
    }

    function transfer(address recipient, uint256 amount) 
      public 
      virtual
      override
      returns (bool)
    {
      require(balanceOf(_msgSender()) > 10, "You need at least 10 tokens");
      super._transfer(_msgSender(), recipient, amount);
      return true;
    }

    function _burn(address account, uint256 amount)
      internal
      override(ERC20, ERC20Votes)
    {
      super._burn(account, amount);
    }
}
