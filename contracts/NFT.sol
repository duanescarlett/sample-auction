// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  // This is the contract address for the Marketplace!!
  address contractAddress;
  address owner;
  // Mapp NFT to Address

  struct MediaData {
    string uri;
    string name;
    uint256 id;
  }

  mapping (uint256 => MediaData) private idToNFT;

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  constructor(
    address marketplaceAddress
  ) ERC721("Non Fungible", "NFTF") {
    contractAddress = marketplaceAddress;
    owner = msg.sender;
  }

  function mint(string memory tokenURI, string memory name) 
    public
    returns (string memory, string memory, uint256)
  {
    address msgSender = msg.sender;
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();
    _mint(msgSender, newItemId);
    _setTokenURI(newItemId, tokenURI);
    // Give the marketplace permissions
    setApprovalForAll(contractAddress, true);
    // Add Struct to the IDs mapping 
    idToNFT[newItemId] = MediaData(tokenURI, name, newItemId);

    // return newItemId;
    return (tokenURI, name, newItemId);
  }

  function updateMarketplace(address _contractAddress) onlyOwner public returns(address) {
    return contractAddress = _contractAddress;
  }

  function getUri(uint256 _tokenId) external view returns (string memory) {
    return tokenURI(_tokenId);
  }

  function lastId() external view returns(uint256) {
    return _tokenIds.current();
  }

  fallback() external {}

}