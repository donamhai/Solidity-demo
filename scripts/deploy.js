require('dotenv').config()

const main = async () => {
  try {
    const [deployer] = await ethers.getSigners()
    console.log('Deploying contracts with the account:', deployer.address)
    console.log('Account balance:', (await deployer.getBalance()).toString())
    const TokenContract = await ethers.getContractFactory('AuctionContract3')
    const result = await TokenContract.deploy(
      '0xa68BfAd8EdB3c6AE803CD6c18c86D2Ac1b7f051e',
      '0x34d176DeAb6625648855f80dF545954BCdb79168',
      '0x90b08157434F070865da36aFA3F775a8e67F7b5f',
      '5'
    )
    console.log('Deployed address:', result.address)
  } catch (error) {
    console.log('Fail to deploy contract')
    console.log(error)
  }
}

main()
