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

const Mint = ({}) => {
  const [fileUrl, setFileUrl] = useState(null)
  const [auction, setAuction] = useState(false)
  const [formInput, updateFormInput] = useState({
    price: '', 
    name: '', 
    description: '', 
    auction: false,
    endtime: Date.now()
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

  const createNFT = async () => {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    // Prepare data for transport
    let { name, description, auction } = formInput
    let status = "Not For Sale"

    console.log('Signer: ', signer)
    let contract = new ethers.Contract(NFTAddr.Contract, NFT.abi, signer)
    let transaction = await contract.mint(fileUrl, name)
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
    console.log("This is the auction: ", auction)

    if (auction) {
      console.log("This statement is true")
      addToMarketAuction(tokenId, signer)
    } else {
      addToMarketSale(tokenId, signer)
    }
  }

  // Add NFT to the market
  const addToMarketSale = async (tokenId, signer) => {
    const price = ethers.utils.parseUnits(formInput.price, 'ether')

    let contract = new ethers.Contract(NFTMarketAddr.Contract, NFTMarket.abi, signer)
    let listingPrice = await contract.getListingPrice() 
    listingPrice = listingPrice.toString()
    
    console.log('Listing Price: ', listingPrice)
    console.log('Token ID: ', tokenId)

    // Get end time for auction
    let transaction = await contract.createMarketItem(
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

  const addToMarketAuction = async (tokenId, signer) => {
    const price = ethers.utils.parseUnits(formInput.price, 'ether')
    console.log(typeof formInput.endtime)
    // const auctionTime = ethers.utils.parseUnits(formInput.endtime.toString(), 'ether')
    // console.log("this is the auction time ", auctionTime)
    let contract = new ethers.Contract(NFTMarketAddr.Contract, NFTMarket.abi, signer)
    let listingPrice = await contract.getListingPrice() 
    listingPrice = listingPrice.toString()
    
    console.log('Listing Price: ', listingPrice)
    console.log('Token ID: ', tokenId)
    console.log('Auction: ', formInput.auction)

    let minutesToAdd = 30
    let currentDate = new Date()
    let futureDate = new Date(currentDate.getTime() + minutesToAdd*60000)

    console.log('Future Date: ', futureDate)

    // Get end time for auction
    let transaction = await contract.createMarketItem(
      NFTAddr.Contract, 
      tokenId, 
      price, 
      futureDate.getTime(),
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

      <Link href="/">
        <a>Go to Market</a>
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
          <label for="exampleFormControlInput1" className="form-label">Price <code>Floor Price for <i>AUCTION</i></code></label>
          <input 
            type="text" 
            className="form-control" 
            id="exampleFormControlInput1" 
            onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
            placeholder="Asset price in MATIC" />
        </div>
        <div className="mb-3">
          <label for="exampleFormControlInput1" className="form-label">Is this for Auction?</label>
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                value="true" 
                onChange={e => updateFormInput({ ...formInput, auction: e.target.value })}
                id="flexCheckChecked" />
              <label class="form-check-label" for="flexCheckChecked">
                Yes
              </label>
            </div>

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

export default Mint