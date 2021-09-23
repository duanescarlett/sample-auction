const { ethers } = require("hardhat")
const { expect } = require("chai")

describe("NFT Market Auction", () => {
  // let Market
  let market
  let marketAddress
  let nft
  let nftContractAddress
  let listingPrice
  let timed
  let auctionPrice

  beforeEach( async () => {
    // Set NFT market contract
    const Market = await ethers.getContractFactory("NFTMarket")
    market = await Market.deploy()
    await market.deployed()
    marketAddress = market.address 

    // Set NFT contract
    const NFT = await ethers.getContractFactory("NFT")
    nft = await NFT.deploy(marketAddress)
    await nft.deployed() 
    nftContractAddress = nft.address

    // Set listing price
    listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()

    // Set the auction end time
    auctionPrice = ethers.utils.parseUnits('100', 'ether')
    timed = new Date(24 * 3600 * 1000)

    // Mint 2 NFTs with id 1 & 2
    await nft.mint("https://www.myTokenLocation.com", "Master Piece")
    await nft.mint("https://www.myTokenLocation2.com", "Master Piece2")

    // Put 2 NFTs on auction
    await market.createMarketItem(
      nftContractAddress, 
      1, 
      auctionPrice, 
      timed.getTime(),
      100,
      true,
      { value: listingPrice } // Value of FTM sent
    )
    await market.createMarketItem(
      nftContractAddress, 
      2, 
      auctionPrice, 
      timed.getTime(),
      100,
      true,
      { value: listingPrice }
    );
  })

  it('Place a bid on an NFT', async () => {

    [_, buyerAddress] = await ethers.getSigners()
    // console.log(buyerAddress)

    let event = await market.connect(buyerAddress).bid(1, { value: listingPrice })
    // console.log(event)
  })

  it('Get Listing Fee', async () => {
    let fee = await market.getListingPrice()
    console.log(fee.toString())
  })

  it('Update Listing Fee', async () => {
    let fee = await market.updateListingFee(100000000000000000n)
    let returnedFee = await market.getListingPrice()
    // console.log(fee)
    console.log(returnedFee.toString())
  })

})

describe("NFT Market Sale", () => {
  it('Should create and execute market sales', async () => {
    // Set NFT market contract
    const Market = await ethers.getContractFactory("NFTMarket")
    const market = await Market.deploy()
    await market.deployed()
    const marketAddress = market.address 

    // Set NFT contract
    const NFT = await ethers.getContractFactory("NFT")
    const nft = await NFT.deploy(marketAddress)
    await nft.deployed() 
    const nftContractAddress = nft.address

    // Set listing price
    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()

    // Set the auction end time
    const auctionPrice = ethers.utils.parseUnits('100', 'ether')
    let timed = new Date(24 * 3600 * 1000)

    // Mint 2 NFTs with id 1 & 2
    await nft.mint("https://www.myTokenLocation.com", "Master Piece")
    await nft.mint("https://www.myTokenLocation2.com", "Master Piece2")

    // Put 2 NFTs on auction
    await market.createMarketItem(
      nftContractAddress, 
      1, 
      auctionPrice, 
      timed.getTime(),
      100,
      false,
      { value: listingPrice } // Value of FTM sent
    )
    await market.createMarketItem(
      nftContractAddress, 
      2, 
      auctionPrice, 
      timed.getTime(),
      100,
      false,
      { value: listingPrice}
    );
    
    [_, buyerAddress] = await ethers.getSigners()

    await market.connect(buyerAddress).createMarketSale(
      nftContractAddress, 
      1, 
      { value:auctionPrice }
    )

    let items = await market.fetchMarketItems()

    items = await Promise.all(items.map(async i => {
      const tokenUri = await nft.tokenURI(i.tokenId)

      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }

      return item
    }))
    console.log('items: ', items)
  })
})