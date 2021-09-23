import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import Link from 'next/link'
import Web3Modal from "web3modal"
import axios from 'axios'

// ABIs
import ACoin from '../abis/ACoin-ABI.json'
import ACoinAddr from '../abis/ACoin-address.json'
import NFT from '../abis/NFT-ABI.json'
import NFTAddr from '../abis/NFT-address.json'
import NFTMarket from '../abis/NFTMarket-ABI.json'
import NFTMarketAddr from '../abis/NFTMarket-address.json'

const profile = () => {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')

  const loadMarketNFTs = async () => {
    const provider = new ethers.providers.JsonRpcProvider()
    const tokenContract = new ethers.Contract(NFTAddr.Contract, NFT.abi, provider)
    const marketContract = new ethers.Contract(NFTMarketAddr.Contract, NFTMarket.abi, provider)
    const data = await marketContract.fetchMarketItems()
    
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: tokenUri,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }

  // const loadMintedNFTs = async () => {
  //   const provider = new ethers.providers.JsonRpcProvider()
  //   const tokenContract = new ethers.Contract(NFTAddr.Contract, NFT.abi, provider)
  //   // const marketContract = new ethers.Contract(NFTMarketAddr.Contract, NFTMarket.abi, provider)
  //   const data = await tokenContract.fetchMintedNFTs()
    
  //   const items = await Promise.all(data.map(async i => {
  //     const tokenUri = await tokenContract.getUri(i.tokenId).toString()
  //     // const meta = await axios.get(tokenUri)
  //     // console.log(meta)
  //     let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
  //     let item = {
  //       price,
  //       tokenId: i.tokenId.toNumber(),
  //       seller: i.seller,
  //       owner: i.owner,
  //       image: meta.data.image,
  //       name: meta.data.name,
  //       description: meta.data.description,
  //     }
  //     return item
  //   }))
  //   setNfts(items)
  //   setLoadingState('loaded')
  // }

  useEffect( () => {
    loadMarketNFTs()
    // loadMintedNFTs()
  }, [])

  if (loadingState === 'loaded' && !nfts.length) {
    return ( 
      <>
        <div className="container">
          <h2>No assets Minted or Owned</h2> 
          <p>
            <Link href="/mint">
              <a>Add NFT to the market...</a>
            </Link>
          </p>
        </div>
      </>
    )
  } else {
    return (
      <div>
        <Link href="/mint">
          <a>Home</a>
        </Link>
        {
          nfts.map((nft, i) => (
            <div key={i} className="border">
              {/* <img src={nft.image} className="rounded" /> */}
              <div className="">
                <div>
                  <img 
                    src={nft.image}
                    className="img"
                    width="128"
                    height="128"
                  />
                </div>
                <p className="">Price - { nft.price } MATIC</p>
              </div>
            </div>
          ))
        }
      </div>
    )    
  }

}

export default profile
