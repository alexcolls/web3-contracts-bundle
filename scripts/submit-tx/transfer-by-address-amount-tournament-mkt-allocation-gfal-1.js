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
    "0xe64f38f04e800c915423ec38b6fd50c0720783d9",
    "0xaddc67346a8e7175fcebc9769b7e8e616182308e",
    "0x301c8983633a8d3ce04c7bb5078a6da75465c078",
    "0x47aa3239c8636cd501c0d7db9c78a5edc0fc8546",
    "0x11e5102e3d780e15548e56d5b28338c3adc40cd6",
    "0xf976671f92fb606b0b7ebfd3027bdb89a7306a65",
    "0xda05029e35b0034b68d45c4428dae9336e28f18b",
    "0x57d9ca5353714d5363f94a4dacd7a4d528badeb7",
    "0xc913d5891e28cebef5b08af1b0e03f0528c0cb60",
    "0x3f3e6f0daf920ebbd5bf8df87e641756a884ae0c",
    "0x2f0ce85190a315e070bdebdc0e74e1aa0eba30e3",
    "0x9924e3194ef347ccd99535a90be2375e710bf8e1",
    "0x2fd617c6256049e3623a0074fa185938bfe02766",
    "0xa4cba2e6d5cbb480350e4e6f572c8e09ccc44574",
    "0xc4e366df43f4c7bac3965a5689bd2df09edbc30d",
    "0x58bc4658957d8d9ed36114eb2f1b339c043042a7",
    "0xb25e19da6785986bdb801294136b8350b0b6b917",
    "0x65ae058d27ad6b01030c76d8ec8be460ab2a6176",
    "0x71c80fb3d2f290b613a2655cb1d9235b6bb8dbc8",
    "0x1b4846d901cef6d2a5e282062c0e413abf4b010c",
    "0x836a4c5573d757c3cbffaf12040687bf487858d2",
    "0x444d2723e39734d5b81aead22adb178ec49ab588",
    "0xb935f49643f546282b533772ee3b03a18c71bdc6",
    "0x54b3a72f3dd64564ae1aea84b007ba5b6c458686",
    "0x5ab720cd9a7908e7f17200617a0294392b00e545",
    "0x39f487387c1d2151c8692530ba3730e2080654ad",
    "0xb72c1857c2a2fabdee24a6e263e23cdd45848bee",
    "0x57553f0f05e205500587d6fdbcf7d86d31ce0ad3",
    "0x0e6c2ec37b0923213b2808b4920277a99adb47b1",
    "0x5dd11457302e2f7a4f612ab122841a15546629d6",
    "0xf3fd25132d55fc5f71d16657567ed7467676c3ee",
    "0x0c85ea41b7f8d572578fc7fdf2294acc87b002f3",
    "0xcc2c3208cd97e10fa8bd5a51299cbda774089f55",
    "0x89c52980e6ec07157b5a9aa86c4b6468b248bc58",
    "0x60d5ff1c12ad3a232b859edecf5efce82058612c",
    "0xbe74dfadce14c8236130e2e5dd1e389841cc80e9",
    "0xbe08cf88ed6d993ca6eb9d5d0e0d91bc5f8d21d8",
    "0x263a46b5b7a45558a8fec453b39e27064dee30ae",
    "0x986e90488b2222bd65a9500950e0c426d9ca7cf1",
    "0x7305b09bfbf7ec15d2386b30642e85d539d2795e",
    "0x77cf041aacd06b9d73858d3ce9423449eef7a959",
    "0x52cd9a156e23bb405c82e5fbd9631964716066a2",
    "0x9606e9af7a5c42e91de149e4e3e2e98ae0185099",
    "0x73afc0e03968569fd2f1b463a9713dbe2e138801",
    "0x0461f255ce2ab113ae7efcfe172835e3f5e5c610",
    "0xee0551fa5255a6fdb700b47f98b7c1adb82fcbe8",
    "0x55c72073f2b141c5bbf84a09f909d93ec81ab0bf",
    "0xdfec9d2408dc3ce4bb7a22134a7e0be23a5cb0f3",
    "0x8d049def869e128a178a0e872f27aa639c1a19b2",
    "0x6bc579f4823b481cef82776a1bdce6b012ad75de",
    "0x8a49b6d22c28e3dfce2cd4ad35f8281cb554aae1",
    "0x1e487e7c79d1edd36606772270b6ea3bd4379b42",
    "0x0ae4f8b4887cffd315214d25118ce091d1ddce87",
    "0x21d82bd037b29bedbce416cb0f494b4d37a24135",
    "0x2b8da3490a8e1e3de140cccef196471b07cf34a4",
    "0x8eae50cc7dfe25b980a2314d4dbe3dcdabe697f8",
    "0xc68c30019c1aaeda567be93bd4cfaf766a9f910c",
    "0x49300e57b1f23a0c2dd479f80ce5e5e85f957e4d",
    "0xdec7ff9eceee3a871a7e922622c591e6dd7f91de",
    "0xc9da90026f3234eb1274af7127aea925ae9b33b5",
    "0x8cb3f27c38489964a1dadfa7c00890f3a492392b",
    "0xe121f3c30da537994e2d719d8fa3c05c31794241",
    "0x9dbb846ef30c696b82dbc530aa16db71389ce4e6",
    "0xee4d9c6b21fd3191038691290554d48189eeec59",
    "0xf0d62cf4606e02a35ac44e97bbb1be0db7afb38d",
    "0x498d5e4eb818362eec9b92054b9a39f292b3d82c",
    "0x9b03fe99aa765e92a2d0615699e63ec0ad13be4c",
    "0xeb3882c0bfe8caabfa80ffffe9959695dfaf32c7",
    "0xbd3ec686074c7f39fa24decaa82c28c7d5bde464",
    "0x1ab5bc4a5132ab94ff9f4a81dcfcbc781af332e1",
    "0xef61d2c3a7957509c5515050ba77e52c96f37458",
    "0x8beba1c7f27a5526bb7ddbc990ac832dc941d16d",
    "0x866300df1c71bc0047d89742703bcecbe5bb3559",
    "0xeedc972cc11f55f0c9e3900ab7512bcd0892af70",
    "0xac6104406380126cd060c3eef605fc6bd9576ee8",
    "0xa50d2483612ae3beba3829c3ee785422b87ff588",
    "0x8bdc3ffaf35af36de14ab30472bd87c510137f55",
    "0x88b2a8ba448cab219027ab2d91f5d6ee1c4060fa",
    "0x6a3ff30cbf38f3f15b6351b3d1ea336f40699699",
    "0x1878d7ccdeb256a0f02b2f8225d8edf00193b7c4",
    "0xfad6ad797805f793a180da6b8d428c2c6b18dcdc",
    "0xb265e1d2fe1597af09cb3b2d140ae1544b6808cb",
    "0xac3899335627b6e7623bb8e2dcb339bb0850ef31",
    "0x106d3f284f66fec8185b7778e21b45e04bf281da",
    "0x0149cb466a3c47bba0790e2229a7552fd22bb0c0",
    "0x24174e2bd429b9862b5a7b152c63015b0292f46c",
    "0x933930127aa636fd6951654b31c18a2786638768",
    "0x4ac0a71f79a08ec1f5290dded66ef9028deb1eea",
    "0xfb7001230b2bd4501246644f7cba897f40e6a9ce",
    "0xe1f347fb998fe1206bd9e212739015d74ee5f2c7",
    "0x13a4c6709459280459bd8ebd2c80182e54770651",
    "0x7d581a8b9e309e184f55e15101b3d8a604a46d6c",
    "0xec2fb0046f4da3c1e6a845037c8997368f8c39d5",
  ],
  amount: [
    ethers.utils.parseEther(String(125000)),
ethers.utils.parseEther(String(75000)),
ethers.utils.parseEther(String(50000)),
ethers.utils.parseEther(String(38000)),
ethers.utils.parseEther(String(25000)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(12500)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(4100)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(2500)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
  ]
}

const GFAL_TOKEN = process.env.GFAL_TOKEN_MAINNET

async function main() {
  // Create a new provider
  let provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER_MAIN);

  // Create a new instance of the contract using the provider
  const gfalToken = new ethers.Contract(GFAL_TOKEN, GFALTokenArtifact.abi, provider);

  // Validate correct length of arrays
  if (TRANSFERS_PAYLOAD.address.length !== TRANSFERS_PAYLOAD.amount.length) {
    throw Error('Array lengths mismatch')
  }

  // Sender from private key
  const signer = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY)
  const nonce = await provider.getTransactionCount(signer.address);
  const balanceBeforeTransfer = await gfalToken.balanceOf(signer.address);
  
  console.log(
    "-Sender G4AL balance Before:",
    ethers.utils.formatEther(balanceBeforeTransfer.toString())
  );

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
    // results.push(transactionResponse)
    console.log(`Transferred to:${TRANSFERS_PAYLOAD.address[i]}`);
    console.log(`Amount:${TRANSFERS_PAYLOAD.amount[i]}`);
  }

//   console.log(
//     `TransferByAddressAmountMarketplace script executed:`,
//     results
//   )

  const balanceAfterTransfer = await gfalToken.balanceOf(signer.address);

  console.log(
    `\n- Sender balance After: 
    ${ethers.utils.formatEther(balanceAfterTransfer.toString())} G4AL`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
