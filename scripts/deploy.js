require('dotenv').config()

const main = async () => {
  try {
    const [deployer] = await ethers.getSigners()
    console.log('Deploying contracts with the account:', deployer.address)
    console.log('Account balance:', (await deployer.getBalance()).toString())
    const TokenContract = await ethers.getContractFactory('StakingTokenContract')
    const result = await TokenContract.deploy(
      '0xA2807839b9d9980c0f67251514deded1CB8D5AB7',
      '0x36276A23fD22FCBe8b9f68Cf10c0f3882A29194c'
    )
    console.log('Deployed address:', result.address)
  } catch (error) {
    console.log('Fail to deploy contract')
    console.log(error)
  }
}

main()
