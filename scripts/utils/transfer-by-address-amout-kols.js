// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");

const GFALTokenArtifact = require('../../artifacts/contracts/_mock/GFALToken.sol/GFALToken.json')
// Constants
const TRANSFERS_PAYLOAD = {
  address: [
    "0xF3c6cfbF4AF75b90E3c84C8BDB2F22c2459C9488",
    "0x72d0455D25Db9c36af5869BBF426312bA923C643",
    "0x7C0fef6c18e8494FFE2669eF691c4E5e8877717F",
    "0x66E90af5a39804C0ee64Ffd9eea9CD902D222304",
    "0x6C795Be0a4887816Ce761D41e482fcF4fBCa9963",
    "0x0dcf62499Ec89065c7fFE4af339A2b43414C5ddF",
    "0xeC56f708097287cc8F545A485B02E1cB756d8131",
    "0xF1A01f3933EFe8fDa863B0a46E4006447B842999",
    "0x7397b65EF64eb85a9C51bEECEaBA24E8462022A8",
    "0x7D2E20D89B1B2e55d881c5f34b3ce7a036C92175",
    "0x43BC50CeD75C52a0d3Dcb80e101188B13442509f",
    "0x0f688Ab129b0bed48C3da9F32B7C717fCc30Eeb1",
    "0xE7B42E517DDD8172383467A8aDED492fEeBc60da",
    "0x9A353eCfa0e2B20455879d7D7e5Ca1E8D2543098",
    "0x0D536b459CcCAE9aCC9155D6415dEC8d06b9b0D7",
    "0x129340d0495913904e13cC300F0eF123Fd5bA5a4",
    "0x6779D01231934d4BF5b4d3a33c939a38E7EFcC92",
    "0xaf85281627961190D7eb21b727C25be8Bb6055e5",
    "0xF6ac3ac48e189A398b14bbEf1c03EFE5Ccf213F8",
    "0xa7CF27D2E6aA8744c5bf8942A07edE8156C567fD",
    "0x0522C0c421C4A1EE70cdC82c3CA1DcafdE585534",
    "0xfC31c881eEAC889f9Df2d9c06a18aa8891330659",
    "0xb190A7c07f41F6825046AaE6deaA0cb77527e1C5",
    "0xDC91c2CF4313fc80F36d540FB4f797d68F9BDe1a",
    "0x00C9b37df30AcB68ad0b6EcB419425FF22f652D1",
    "0x0887C5C38697ed6a4c592aF15735eF2B4d9556Ec",
    "0xB6393357EFd9023cf59BAFd501289D4B45DFd628",
    "0xfb078c81eA86Ce334B4e760919B43856199CF164",
    "0xB16A6094AB88776a5B9E080f71B08acDE58b9d7d",
    "0x64ec24675d7bbC80f954FF15EDD57d381f5b3E1a",
    "0x5f7dA351b88aAF0Ea38b1274e578C64a444e7F9b",
    "0x203ee0Ef92e633d96Fd574491feDF9b5DaEa5996",
    "0x0036d68CCab1677179cD7A5c8c8568Dc7907eAc8",
    "0x241E670036A44c655c62FF9ee55eb708Fa71b00b",
    "0x56E37F8C824344A41B5B1Db614AbFf732f0603aD",
    "0x1BB100E126fC108074224401E17b782EfF00531F",
    "0x6600a38105A8dC7502c7Ebc10A5AF1a70F64fa1d",
    "0x06D0c544581Be34276bDDE8356670e09c1a5f670",
    "0x88A811324874a83AD35D1D9968bB8c4509d3d03d",
    "0x846c61889fdBC577a876BCd6753B66e4b5266888",
    "0x7129432aEAd49940979961ebA3E811e1728F0540",
    "0x9C6d4c10df976205DE101f8039184B2a8191f0a7",
    "0xdd9De483F00Fa30107e7162A3F04C0641C5b4Ba6",
    "0x6227F2886Bf1c157c2320d67f9445667Ce0C0BC5",
    "0xC06992F58Bdf57696e12648D79D848B39DdC552d",
    "0x65056F8C991847DD55DD2cC7F659271784a9745a",
    "0x405D4397DF7Cce6D269BD9bDe35DD5DF1884edCa",
    "0x33784Ab78dc2b678044B623806a4af803c95fd7a",
    "0xd999074F947f9813bDD161Fb2452332ac6a4D695",
    "0xfa004D2F0EdD8DAb7cb601d3f4E77f8340E20081",
    "0xB67e49A45858F3CBf2bC2026A4347B5518279798",
    "0xCF5A52aDD33eC587a656B3D8fD3306066C693B42",
    "0x9967AC7939b128E6933C6de94B65E8B42A77C404",
    "0x2E4ee865C41f64D0fDF725287E6d87c3968c3B7E",
    "0x9f1E064DD0DeA444dF264D7B8EA51b697D39DD57",
    "0x6cDAcd9cD2d4A824BCe5E91F4899c959F2693a9f",
    "0x385BFa6b50f99aB5C717C6d773ec204A115d9e90",
    "0x32AF8b3b7D529cd59887fA1ec743Eeb47D9F3F79",
    "0x50b3e08d5c3a2386e0c9585031b1152a5f0e2370",
    "0x9Fe5cf8E2aB8536BA8A31801f5188Eb327f0f6f7",
    "0xA241924244EE71cF45c917dCc766379A506ff616",
    "0x7f306428a0888aF2f08d33459153b595C7561079",
    "0x87602D030C0E91bC448b499BFddA1DC39561b22d",
    "0xea8980b7f4a5C3B0d883bDAc5A995fE82F5DCE15",
    "0x4a57baBD4B74CfDB14D27ca86c9E3c75b9260C1b",
    "0x9B4C5B6247d9FB7aa21c5A255aDEc55B07f4E243",
    "0xf7Ef4A3ab05d61317D2B37006c54229c8dEb6B77",
    "0x19Bb8DC361C33DE97fAea342300D43C337f201B9",
    "0x74ec3daabde3d29ff44eb09a0984500c25eb0126",
    "0x6e56CDEc3baf2A1c41a60ABA25b0895B473CbE7E",
    "0xe7291624133a9C26e706Fa56BBA62caa4081378E",
    "0x6fDDfA63C80e222F8237D03D80D8B44Fe882f508",
    "0x2b12a8460E88e7754b498a7d32A8ba259d81Ef6A",
    "0xD5B5b8Cfde127C98f837F16C2e1728F537b9B0b3",
    "0x333Fb10911383F0a2FeB08d937763e72aA6a3191",
    "0x857F72B0bb0eAd265609D83965599fb2eCF23d7c",
    "0x81A80DbFFcABc600F358a0603a5a123AbC84FC86",
    "0x7AD1C66F57909100ca7a452313D486C38906c6Da",
    "0xbC627254fa9e73117cb70E1D4Eed610Ba0a9DE0D",
    "0x622e1f575223Ec80d2aE909b1C8a6d99AAC78074",
    "0x5D39036947e83862cE5f3DB351cC64E3D4592cD5",
    "0x70Cd8A087E524bA26F6Fa18B64e20FbDF154b190",
    "0xE6c500275c0D20CAdC39bC95aDF013310B367D23",
    "0x71D3089Fd8a9A88F395253199412D85a582f0573",
  ],
  amount: [
    ethers.utils.parseEther(String(187500)),
    ethers.utils.parseEther(String(187500)),
    ethers.utils.parseEther(String(75000)),
    ethers.utils.parseEther(String(75000)),
    ethers.utils.parseEther(String(187500)),
    ethers.utils.parseEther(String(281250)),
    ethers.utils.parseEther(String(46875)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(46875)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(112500)),
    ethers.utils.parseEther(String(46875)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(46875)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(65625)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(46875)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(46875)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(46875)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(75000)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(18750)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(75000)),
    ethers.utils.parseEther(String(75000)),
    ethers.utils.parseEther(String(93750)),
    ethers.utils.parseEther(String(196875)),
    ethers.utils.parseEther(String(18750)),
    ethers.utils.parseEther(String(13125)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(75000)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(75000)),
    ethers.utils.parseEther(String(75000)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(75000)),
    ethers.utils.parseEther(String(46875)),
    ethers.utils.parseEther(String(15000)),
    ethers.utils.parseEther(String(11250)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(11250)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(11250)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(18750)),
    ethers.utils.parseEther(String(15000)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(15000)),
    ethers.utils.parseEther(String(11250)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(18750)),
    ethers.utils.parseEther(String(18750)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(11250)),
    ethers.utils.parseEther(String(11250)),
    ethers.utils.parseEther(String(3750)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(11250)),
    ethers.utils.parseEther(String(18750)),
    ethers.utils.parseEther(String(18750)),
    ethers.utils.parseEther(String(7500)),
    ethers.utils.parseEther(String(18750)),
    ethers.utils.parseEther(String(18750)),
    ethers.utils.parseEther(String(65625)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(37500)),
    ethers.utils.parseEther(String(56250)),
    ethers.utils.parseEther(String(28125)),
    ethers.utils.parseEther(String(37500)),
  ]
}

const GFAL_TOKEN = process.env.GFAL_TOKEN

async function main() {
  // Create a new provider
  let provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER);

  // Create a new instance of the contract using the provider
  const gfalToken = new ethers.Contract(GFAL_TOKEN, GFALTokenArtifact.abi, provider);

  // Validate correct length of arrays
  if (TRANSFERS_PAYLOAD.address.length !== TRANSFERS_PAYLOAD.amount.length) {
    throw Error('Array lengths mismatch')
  }

  // Sender from private key
  const signer = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY)
  const nonce = await provider.getTransactionCount(signer.address);

  // Executing transactions and saving results
  let results = []
  for (let i = 0; i < TRANSFERS_PAYLOAD.address.length; i++) {
    const gasPrice = await provider.getGasPrice();
    const gasLimit = await gfalToken.estimateGas.transfer(TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i], {from: signer.address});

    // Construct the transaction
    const tx = {
      from: signer.address, // specify the sender
      to: gfalToken.address,
      gasLimit,
      gasPrice,
      nonce: nonce + i,
      data: gfalToken.interface.encodeFunctionData('transfer', [TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i]]),
    };
    const signedTx = await signer.signTransaction(tx);
    const transactionResponse = await provider.sendTransaction(signedTx);
    results.push(transactionResponse)
  }

  console.log(
    `TransferByAddressAmountKols script executed:`,
    results
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
