// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
  using Counters for Counters.Counter;
  Counters.Counter private _itemIds;
  Counters.Counter private _itemsSold;

  address payable owner;
  uint256 listingPrice = 0.025 ether;

  // Vars for auction
  // uint256 public auctionEndTime;
  // // State of the auction  
  // address public highestBidder;
  // uint256 public highestBid;
  // Bool for auction end 
  bool ended = false;

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  constructor() {
    owner = payable(msg.sender);
  }

  struct MarketItem {
    uint256 itemId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable owner;
    address payable artist;
    // Price for sale
    uint256 price;
    bool sold;
    // Auction's end time  
    uint256 auctionEndTime;
    // State of the auction  
    address highestBidder;
    uint256 highestBid;
    // Is this item for an auction 
    bool auction;
    // Floor price for auction 
    uint256 floorPrice;
    // Test to see if the auction has ended
    bool ended;
  }

  mapping(uint256 => MarketItem) private idToMarketItem;
  // Auction refunds
  mapping(address => uint256) public pendingRefunds;

  fallback() external {}

  event MarketItemCreated (
    uint256 indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    address owner,
    address artist,
    uint256 price,
    bool sold
  );
  // Auction events
  event HighestBidIncrease(address bidder, uint256 amount);
  event AuctionEnded(address winner, uint256 amount);

  function getListingPrice() public view returns (uint256) {
    return listingPrice;
  }
  
  function updateListingFee(uint256 newPrice) onlyOwner public returns (uint256) {
    listingPrice = newPrice;
    return listingPrice;
  }

  function createMarketItem(
    address nftContract,
    uint256 tokenId,
    uint256 price,
    uint256 _biddingTime,
    uint256 floorPrice, // Floor price
    bool auction // Test to see if item is for auction
    ) public payable nonReentrant {
    require(price > 0, "Price must be at least 1 wei");
    require(msg.value == listingPrice, "Price must be equal to listingPrice");

    _itemIds.increment();
    uint256 itemId = _itemIds.current();

    // Add current time to timestamp to get auction end time
    uint256 auctionEndTime = block.timestamp + _biddingTime;
    // Pre-fill data for struct
    address highestBidder = msg.sender;
    uint256 highestBid = 0;

    idToMarketItem[itemId] = MarketItem(
      itemId,
      nftContract,
      tokenId,
      payable(msg.sender),
      payable(address(0)),
      payable(msg.sender),
      price,
      false,
      auctionEndTime,
      highestBidder,
      highestBid,
      auction,
      floorPrice,
      false
    );

    // Transfer the ownership to the NFT Marketplace contract
    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

    emit MarketItemCreated(
      itemId,
      nftContract,
      tokenId,
      msg.sender,
      address(0),
      msg.sender,
      price,
      false
    );
  }

  function createMarketSale(
    address nftContract,
    uint256 itemId
    ) public payable nonReentrant {
    uint256 price = idToMarketItem[itemId].price;
    uint256 tokenId = idToMarketItem[itemId].tokenId;
    require(msg.value == price, "Please submit the asking price in order to complete the purchase");
    
    // Subtract royalty
    // (msg.value * 15) / 1000
    uint256 artistCut = (msg.value / 1000) * 12;
    uint256 sellerCut = msg.value - artistCut;
    
    idToMarketItem[itemId].artist.transfer(artistCut);
    idToMarketItem[itemId].seller.transfer(sellerCut);

    // Transfer NFT to the buyer
    IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

    idToMarketItem[itemId].owner = payable(msg.sender);
    idToMarketItem[itemId].sold = true;
    _itemsSold.increment();
    payable(owner).transfer(listingPrice);
  }

  function fetchMarketItems() public view returns (MarketItem[] memory) {
    uint256 itemCount = _itemIds.current();
    uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
    uint256 currentIndex = 0;

    MarketItem[] memory items = new MarketItem[](unsoldItemCount);

    for (uint256 i = 0; i < itemCount; i++) {
      if (idToMarketItem[i + 1].owner == address(0)) {
        uint256 currentId = idToMarketItem[i + 1].itemId;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  function fetchMyNFTs() public view returns (MarketItem[] memory) {
    uint256 totalItemCount = _itemIds.current();
    uint256 itemCount = 0;
    uint256 currentIndex = 0;

    for(uint256 i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].owner == msg.sender) {
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);

    for(uint256 i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].owner == msg.sender) {
        uint256 currentId = idToMarketItem[i + 1].itemId;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }

    return items;
  }

  function fetchItemsCreated() public view returns (MarketItem[] memory) {
    uint256 totalItemCount = _itemIds.current();
    uint256 itemCount = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].seller == msg.sender) {
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);

    for (uint256 i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].seller == msg.sender) {
        uint256 currentId = idToMarketItem[i + 1].itemId;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }

    return items;
    
  }

  function bid(uint256 _id) public payable {
    address msgSender = msg.sender;
    uint256 msgValue = msg.value;

    if (block.timestamp > idToMarketItem[_id].auctionEndTime) {
      revert("The auction has already ended");
    }

    if (msgValue <= idToMarketItem[_id].highestBid) {
      revert("There is already a higher or equal bid");
    }

    // Make
    if (idToMarketItem[_id].highestBid != 0) {
      pendingRefunds[idToMarketItem[_id].highestBidder] += idToMarketItem[_id].highestBid;
    }
    
    idToMarketItem[_id].highestBidder = msgSender;
    idToMarketItem[_id].highestBid = msgValue;
    // Broadcast the bid event 
    emit HighestBidIncrease(msgSender, msgValue);
  }

  function withdraw() public returns(bool) {
    uint256 amount = pendingRefunds[msg.sender];
    address msgSender = msg.sender;

    if (amount > 0) {
      pendingRefunds[msgSender] = 0;
      if (!payable(msgSender).send(amount)) {
        pendingRefunds[msgSender] = amount; // in case payment does not go through
        return false;
      }
    }
    return true;
  }

  function auctionEnd(uint256 _id, address nftContract) public {
    if (block.timestamp < idToMarketItem[_id].auctionEndTime) {
      revert("The auction has not ended yet");
    }

    if (idToMarketItem[_id].ended) {
      revert("The auction has already ended");
    }

    idToMarketItem[_id].ended = true;

    // Calculate royalty and buyer payment
    uint256 artistCut = (idToMarketItem[_id].highestBid / 1000) * 12;
    uint256 sellerCut = idToMarketItem[_id].highestBid - artistCut;

    // emit AuctionEnded(idToMarketItem[_id].highestBidder, idToMarketItem[_id].highestBid)
    idToMarketItem[_id].artist.transfer(artistCut);
    idToMarketItem[_id].seller.transfer(sellerCut);

    // Transfer NFT to the highestBidder
    IERC721(nftContract).transferFrom(address(this), idToMarketItem[_id].highestBidder, _id);
    idToMarketItem[_id].owner = payable(idToMarketItem[_id].highestBidder);
    idToMarketItem[_id].sold = true;
    _itemsSold.increment();
    payable(owner).transfer(listingPrice);
  }

}