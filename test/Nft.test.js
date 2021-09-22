const { ethers } = require("hardhat")
const { expect } = require("chai")

describe('NFT Contract', () => {

  let tokenContract
  let nftContract

  beforeEach(async () => {
    // Setup the marketplace
    const Market = await ethers.getContractFactory("NFTMarket")
    const market = await Market.deploy()
    await market.deployed()
    const marketAddress = market.address 

    // Setup the token
    tokenContract = await ethers.getContractFactory("NFT")
    nftContract = await tokenContract.deploy(marketAddress);
    await nftContract.deployed();
    [owner, addr1, addr2] = await ethers.getSigners()
  })

  describe('Deployment', async () => {
    it('Should mint an NFT', async () => {
      let nftId = await nftContract.mint('http://duane.eth', 'Duane')
      // console.log(nftId)
    })

    it('Should get the last token ID', async () => {
      let id = await nftContract.lastId()
      console.log(id.toNumber())
    })

    it('Should return the URI of the NFT', async () => {
      await nftContract.mint('http://duane.eth', 'Duane')
      let uri = await nftContract.getUri(1)
      console.log(uri)
    })

  })

})