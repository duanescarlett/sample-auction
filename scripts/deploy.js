const { ethers } = require("hardhat")

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log(`Deploying contracts with the account: ${deployer.address}`)

  const balance = await deployer.getBalance()
  console.log(`Account balance: ${balance.toString()}`)

  const Token = await ethers.getContractFactory('ACoin')
  const token = await Token.deploy() 
  console.log(`ACoin Token address: ${token.address}`)
  saveFrontendFiles(token, 'ACoin')
  
  const Marketplace = await ethers.getContractFactory('NFTMarket')
  const marketplace = await Marketplace.deploy()
  await marketplace.deployed()
  console.log(`NFT Marketplace Token address: ${marketplace.address}`)
  saveFrontendFiles(marketplace, 'NFTMarket')

  const NFT = await ethers.getContractFactory('NFT')
  const nft = await NFT.deploy(marketplace.address)
  await nft.deployed()
  console.log(`NFT Token address: ${nft.address}`)
  saveFrontendFiles(nft, 'NFT')

  // await tokenBtc.passMinterRole(lending.address) 
}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + '/../abis'

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ Contract: contract.address }, undefined, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}-ABI.json`,
    JSON.stringify(TokenArtifact, null, 2)
  );
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })