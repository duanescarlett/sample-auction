import { ethers } from 'ethers'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
import { Button } from 'react-bootstrap'

// ABIs
import ACoin from '../abis/ACoin-ABI.json'
import ACoinAddr from '../abis/ACoin-address.json'
import NFT from '../abis/NFT-ABI.json'
import NFTAddr from '../abis/NFT-address.json'
import NFTMarket from '../abis/NFTMarket-ABI.json'
import NFTMarketAddr from '../abis/NFTMarket-address.json'

const dashboard = () => {
  const [nftsOnMarket, setNftsOnMarket] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [currentAccount, setCurrentAccount] = useState()
  const [sold, setSold] = useState([])

  useEffect(() => { 
    loadNFTs() 
  }, [])

  const loadNFTs = async () => {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    // Add the wallet address to the state
    setCurrentAccount(connection.selectedAddress)

    const marketContract = new ethers.Contract(NFTMarketAddr.Contract, NFTMarket.abi, signer)
    const tokenContract = new ethers.Contract(NFTAddr.Contract, NFT.abi, signer)
    const data = await marketContract.fetchItemsCreated()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      // const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: tokenUri
      }
      return item
    }))

    const soldItems = items.filter(i => i.sold)
    
    setNftsOnMarket(items)
    setSold(soldItems)
    setLoadingState('loaded')

  }

  const metaMaskLaunch = async () => {
    await loadNFTs()
  }

  return (
    <>
      {loadingState === 'not-loaded' ? 
      
      <div className="container">
        <div className="metamask-large-button">
          <Button 
            variant="primary" 
            size="lg"
            onClick={ metaMaskLaunch }
            >
            Connect Web3 Wallet
          </Button>
        </div>
      </div>
      : 
      <div className="container-fluid">
        <div>
          <h3>On the market</h3>
          {
            nftsOnMarket.map((nft, i) => (
              <div key={i} className="card">
                <img src={nft.image} 
                  className="img" 
                  width="64"
                  height="64"
                />
                <div className="">
                  <p>Price: {nft.price} MATIC</p>
                </div>
              </div>
            ))
          }
        </div>
        <hr />
        <div>
          <h3>Sold</h3>
          {
            sold.map((nft, i) => (
              <div key={i} className="card">
                <img src={nft.image} className="img" />
                <div className="">
                  <p></p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
      }
    </>
  )
}

export default dashboard
