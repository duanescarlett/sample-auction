const { expect } = require("chai")
const chai = require("chai")
const { solidity } = require("ethereum-waffle")

chai.use(solidity)

describe("Token contract", () => {

  let Token
  let hardhatToken
  let ownerBalance

  beforeEach( async () => {
    [owner, addr1, addr2] = await ethers.getSigners()

    Token = await ethers.getContractFactory("ACoin")
    hardhatToken = await Token.deploy()
    ownerBalance = await hardhatToken.balanceOf(owner.address)
  })

  it("Deployment should assign the total supply of tokens to the owner", async () => {
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance)
  })

  it("Should send tokens from owner to user", async () => {
    await hardhatToken.transfer(addr1.address, 20)
    expect(await hardhatToken.balanceOf(addr1.address)).to.equal(20)
  })

  it("Should let one user send tokens to another user", async () => {
    await hardhatToken.transfer(addr1.address, 20)
    await hardhatToken.connect(addr1).transfer(addr2.address, 20)
    expect(await hardhatToken.balanceOf(addr2.address)).to.equal(20)
  })

  // it("Should have more than 10 token to transfer any", async () => {
  //   await hardhatToken.transfer(addr1.address, 2)
  //   expect(await hardhatToken.connect(addr1).transfer(addr2.address, 1))
  //   .to
  //   .be
  //   .revertedWith('You need at least 10 Tokens')
  //   // expect(await hardhatToken.balanceOf(addr2.address)).to.equal(0)
  // })
})
