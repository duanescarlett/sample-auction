// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
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
    address minter;
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
    returns (uint256)
  {
    address msgSender = msg.sender;
    _tokenIds.increment(); // New ID
    uint256 newItemId = _tokenIds.current(); // Get current ID
    _mint(msgSender, newItemId);
    _setTokenURI(newItemId, tokenURI);
    // Give the marketplace permissions
    setApprovalForAll(contractAddress, true);
    // Add Struct to the IDs mapping 
    idToNFT[newItemId] = MediaData(tokenURI, name, newItemId, msgSender);

    return newItemId;
  }

  function fetchOwnedNFTs() public view returns (MediaData[] memory) {
    // Total amount of NFTs the exist
    uint256 nftCount = _tokenIds.current(); 
    uint256 currentIndex = 0;
    // Setup array by size
    MediaData[] memory items = new MediaData[](nftCount);
    // ownerOf(id) returns the address of the NFT holder
    for (uint256 i = 0; i < nftCount; i++) {
      if (ownerOf(i + 1) == msg.sender) {
        MediaData storage currentItem = idToNFT[i];
        // Add the NFT to the new array 
        items[currentIndex] = currentItem;
        // Increment the counter 
        currentIndex++;
      }
    }
    return items;
  }

  function fetchMintedNFTs() public view returns (MediaData[] memory) {
    // Total amount of NFTs the exist
    uint256 nftCount = _tokenIds.current(); 
    uint256 currentIndex = 0;
    // Setup array by size
    MediaData[] memory items = new MediaData[](nftCount);
    // ownerOf(id) returns the address of the NFT holder
    for (uint256 i = 0; i < nftCount; i++) {
      // if (idToMarketItem[i + 1].owner == address(0)) {
      if (idToNFT[i].minter == msg.sender) {
        MediaData storage currentItem = idToNFT[i];
        // Add the NFT to the new array 
        items[currentIndex] = currentItem;
        // Increment the counter 
        currentIndex++;
      }
    }
    return items;
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