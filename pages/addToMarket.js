import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Web3Modal from 'web3modal'

// ABIs
import ACoin from '../abis/ACoin-ABI.json'
import ACoinAddr from '../abis/ACoin-address.json'
import NFT from '../abis/NFT-ABI.json'
import NFTAddr from '../abis/NFT-address.json'
import NFTMarket from '../abis/NFTMarket-ABI.json'
import NFTMarketAddr from '../abis/NFTMarket-address.json'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const addToMarket = ({}) => {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({
    price: '', 
    name: '', 
    description: '', 
    auction: false 
  })
  const router = useRouter()

  const onChange = async (e) => {
    const file = e.target.files[0]
    try {
      const added = await client.add(
        file,
        { progress: (prog) => console.log(`received: ${prog}`) }
      )
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl(url)
    } catch (e) {
      console.log("Error => ", e)
    }
  }

  const createNFT = async (url) => {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    // Prepare data for transport
    let { name, description } = formInput
    let status = "Not For Sale"

    console.log('Signer: ', signer)
    let contract = new ethers.Contract(NFTAddr.Contract, NFT.abi, signer)
    let transaction = await contract.mint(url, name)
    let tx = await transaction.wait()

    let event = tx.events[0]
    let value = event.args[2]
    let address = event.args[1]
    let zero = event.args[0]
    let tokenId = value.toNumber()

    // console.log("This is the mint transaction: ", event)
    console.log("This is the token ID: ", tokenId)
    console.log("This is the value: ", value.toString())
    console.log("This is the address: ", address.toString())
  }

  // Add NFT to the market
  const addToMarketSale = async (tokenId) => {
    const price = ethers.utils.parseUnits(formInput.price, 'ether')

    contract = new ethers.Contract(NFTMarketAddr.Contract, NFTMarket.abi, signer)
    let listingPrice = await contract.getListingPrice() 
    listingPrice = listingPrice.toString()
    
    console.log('Listing Price: ', listingPrice)
    console.log('Token ID: ', tokenId)

    // Get end time for auction
    transaction = await contract.createMarketItem(
      NFTAddr.Contract, 
      tokenId, 
      price, 
      0,
      0,
      false,
      { value: listingPrice }
    )

    await transaction.wait()
    console.log('Transaction: ', transaction)
    router.push('/')
  }

  const addToMarketAuction = async (tokenId) => {
    const price = ethers.utils.parseUnits(formInput.price, 'ether')
    const auctionTime = ethers.utils.parseUnits(formInput.duration, 'ether')

    contract = new ethers.Contract(NFTMarketAddr.Contract, NFTMarket.abi, signer)
    let listingPrice = await contract.getListingPrice() 
    listingPrice = listingPrice.toString()
    
    console.log('Listing Price: ', listingPrice)
    console.log('Token ID: ', tokenId)
    // Get end time for auction
    transaction = await contract.createMarketItem(
      NFTAddr.Contract, 
      tokenId, 
      price, 
      0,
      price,
      formInput.auction,
      { value: listingPrice }
    )

    await transaction.wait()
    console.log('Transaction: ', transaction)
    router.push('/')
  }

  return (
    <div className="container">
      <div className="row">

      <Link href="/profile">
        <a>Go to profile...</a>
      </Link>

        <div className="mb-3">
          <label for="exampleFormControlInput1" className="form-label">Name</label>
          <input 
            type="text" 
            className="form-control" 
            id="exampleFormControlInput1" 
            onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
            placeholder="Asset Name" />
        </div>
        <div className="mb-3">
          <label for="exampleFormControlTextarea1" className="form-label">Description</label>
          <textarea 
            className="form-control" 
            placeholder="Asset Description"
            onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
            id="exampleFormControlTextarea1" 
            rows="3" />
        </div>
        <div className="mb-3">
          <label for="exampleFormControlInput1" className="form-label">Price</label>
          <input 
            type="text" 
            className="form-control" 
            id="exampleFormControlInput1" 
            onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
            placeholder="Asset price in MATIC" />
        </div>
        <div className="mb-3">
          <label for="exampleFormControlInput1" className="form-label">File</label>
          <input 
            type="file" 
            className="form-control" 
            id="exampleFormControlInput1" 
            onChange={ onChange }
            placeholder="Asset price in MATIC" />
        </div>
        <div className="mb-3">
          {
            fileUrl && (
              <img className="rounded mt-4" width="350" src={fileUrl} />
            )
          }
        </div>
        <div className="mb-3">
          <button  
            onClick={createNFT}
            className="form-control"
            >Mint NFT</button>
        </div>
      </div>
    </div>
  )
}

export default addToMarket
