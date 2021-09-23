import { ethers } from 'ethers'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'
import Web3Modal from 'web3modal'

// ABIs
import ACoin from '../abis/ACoin-ABI.json'
import ACoinAddr from '../abis/ACoin-address.json'
import NFT from '../abis/NFT-ABI.json'
import NFTAddr from '../abis/NFT-address.json'
import NFTMarket from '../abis/NFTMarket-ABI.json'
import NFTMarketAddr from '../abis/NFTMarket-address.json'

function HomePage() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')

  const loadNFTs = async () => {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const tokenContract = new ethers.Contract(NFTAddr.Contract, NFT.abi, signer)
    const marketContract = new ethers.Contract(NFTMarketAddr.Contract, NFTMarket.abi, signer)
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
        description: meta.data.description
      }
      return item 
    }))

    setNfts(items)
    setLoadingState('loaded')
  }

  const buyNft = async (nft) => {
    // console.log('Click.....')
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    // const provider = new ethers.providers.JsonRpcProvider()
    const signer = provider.getSigner()
    // const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const contract = new ethers.Contract(NFTMarketAddr.Contract, NFTMarket.abi, signer)

    const price = ethers.utils.parseUnits(nft.price, 'ether')
    const transaction = await contract.createMarketSale(NFTAddr.Contract, nft.tokenId, {
      value: price
    })
    await transaction.wait()
    loadNFTs()
  }

  useEffect( () => {
    loadNFTs()
  }, [])

  // Test to see if there are items in the marketplace
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>)

  return (
    <>
      <Head>
        <title>Aution</title>
      </Head>
      <div className="container">
        <h1>Home</h1>
        <p>
          <Link href="/mint">
            <a>Mint An NFT</a>
          </Link>
        </p>
        <p>
          <Link href="/dashboard">
            <a>Dashboard</a>
          </Link>
        </p>

        <section>
          { 
            nfts.map((nft, i) => (
              <div key={i} className="card">
                <img src={nft.image} 
                  className="img" 
                  width="64"
                  height="64"
                />
                <div className="">
                  <p>Price: {nft.price} MATIC</p>
                  <p>
                    <button 
                      className="" 
                      onClick={() => buyNft(nft)}>Buy</button>
                  </p>
                </div>
              </div>
            ))
          }

        </section>
      </div>
    </>
  )
}

export default HomePage
