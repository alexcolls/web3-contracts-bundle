// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");

//const GFALTokenArtifact = require('./GFALToken.json')
const GFALTokenArtifact = {
  "_format": "hh-sol-artifact-1",
  "contractName": "skfghkjsahgfjhkgasjhkfhjgk",
  "sourceName": "contracts/_mock/GFALTokenArtifact.sol",
  "abi": [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
  "bytecode": "esdkjgfhjkhasdghjkasd",
  "deployedBytecode": "kghkasdhgkjahkjsghkjag",
  "linkReferences": {},
  "deployedLinkReferences": {}
};


// Constants
const TRANSFERS_PAYLOAD = {
  address: [
    "0xFC78A2e51fEDC1f3a7cBBA2B196619b0878C96bd",
    "0x3aea8013a5074689e5bca08dba10b24f2139c468",
    "0x7B259870D86935b52c0fcb2402AF85AE58b7e95b",
    "0xa6bfd887de95760ddc4782d9cd7e41b9b7d16a04",
    "0x22198dd5ba0e3b2cbe1850a7364903eb0ca78527",
    "0xa0805b446e3df7857ecc9f9bc162d686ce5514d7",
    "0xf0fc3a5340e3e91d93c1a4edf089291b7db7a665",
    "0x2a18f14271d17e5694cf3caf3b4126d55288625f",
    "0x636ce8b6a79c788b68559b8ea603aca918fda369",
    "0xbcb6229131d2b2b8770c33e78ddbc5efdba391c9",
    "0xc210eaba9f3fc8d47b50fbd75a967d2c7418af65",
    "0xFAb58a6985F324E0555694b236c32036a59350ae",
    "0x1de73818d5648a091120d22c7698256a468c8ea6",
    "0x3424872eBE65b9a954670a78F4C986b934D723E3",
    "0x50f6c883d8A305F27275DF920aC4B49Bad6497f4",
    "0x1510e4e063ec199632bccfc737f10b3894487ce8",
    "0xCDf733380647FF4B3E6EbAF497095c33B23669D8",
    "0x25Fd2699CdFbeF817Ab6a7b8c7dc0aA0C2c3378A",
    "0x06c08febde240e9547373f7d5415bce2fcd52c4f",
    "0x784676b280e9FAa1d1cCDb8599395417F57A7fb5",
    "0x39e19b58c1d705475ff080420326b0dfa16ebb86",
    "0xc89dad5583df2068b6d761237d3beee9145dcee2",
    "0x385c7689820B478D295D932B7ABCfAe9B4EDa60D",
    "0xca47c4ce2947125b93336a899bc46deadb414bd7",
    "0x4eafffb806c5564adceee4ae247a856f61025dbe",
    "0xf5757f1f178c17500903a6264e21397d64166c1f",
    "0x65D28B79BB9A303F1f6A68E06E06ecBa76A3638B",
    "0x9b7de29008d83fbd2762b5f8b4ebd369e3a3118b",
    "0x915bd493c178da302120a127ed461c3ae22f1698",
    "0x241C6cBE27CEE39B96f5826977d5929Dd04eaFeF",
    "0xd81179c7b11a2dfa760bc20bba157a3cd152b7ef",
    "0x54d8bffb86ecd72a5a02c2fc96d42c12af862a89",
    "0x35b0663c631f8525f15ab52bb7f6ea0c5f136202",
    "0x86f1B7CF52f088FC2BB5e0Efd54355892063B2D7",
    "0xc00666b949096d71cccda085c62c8b87e02ba8e7",
    "0xDA622f8763939D04B5Bd996Ba55652c66deCD5A3",
    "0xd883f0cef0907102ef8f8a9dc32d8502a8bb7854",
    "0x3032059e8d965e65510357d6729672bd187eac8f",
    "0xdf7d3b72ccd9814fc67a948a32a7d02bb2748fc5",
    "0xD4d270eb2a095d0ec3A05EeE2267526ad53D4B62",
    "0x4c44a690fee2c2df8e4327d83aed6e63148a3484",
    "0xa0e0be7465682f306cd03b0a2ebfcad07fd9497b",
    "0x77373c02eE2c93179ddC9d710a7815Ab39460A89",
    "0x8b236e73aa35a61861aab874415c5cc8a4a0077f",
    "0x4c166e680a7c761ab186baca7eaf970e66396825",
    "0x8eD624F6594c3f5764f2f415262352Ca812851ba",
    "0x05c220617c9d0d90fb0becb82b0c54ac8a7460e5",
    "0xFfE313d71C868180914fF2b5533EdbA3C532eb6E",
    "0x0cc25b6c3E89ea861FdF42AD767AB724922F4791",
    "0x91939d1c41E3f152cA74ff22113AB88E355343a9",
    "0x8070856D6B3F9751dbc56F8E8f18f311b6be1d0E",
    "0x157D1B22917586762CE0E8D5321651e0BEf1A8C6",
    "0x4eeeee303fa8928a643b1f0cce41a13e4e6945df",
    "0x49b1D57eDED25df264603285DebDdaE61a6A45fe",
    "0x9E4f317D6A941Cf651f1458058E71A024765045d",
    "0x7115bef7d3a7b7ae7a4dc8341fc6d9bf7892f325",
    "0x3868306e5293ce71b825e347bf455f379ee77729",
    "0x2088d708304848776b7e6d94027ce2a83929bb28",
    "0xB700466146B07E62Ff081764590D8898e9De60fd",
    "0xca9ea5eb2ed4f1fb9436f2134f5ea944c1989543",
    "0x5d26ed0568f582dd27f766ab8ffcc8505481593c",
    "0x79e736b2d02ac8bc7d12d49bc1886acdc6501a0e",
    "0x778d54adac6e0f4d63ed8031339dd89f900602a6",
    "0xc20c632ea10374b9e3bdff3420d25a8da781aba4",
    "0xd22afe5fc5dc3d21549157edf115515e93867a92",
    "0x07124f81a9f757520a019c44decc6379533c530f",
    "0x945a38be429d235062de54f696870572229df693",
    "0xf781312bb326e0631e41e1316f853d9b4acc37af",
    "0x423659de1e7c1e8f3b726d0cbbd8c0264e64e738",
    "0x2957b92d48c979da8b0f936e0744aef4f62d36b2",
    "0x90220C895B86Ee213d8524134c42431BafD6fCE4",
    "0x9e3281e74a4e3f18dbaa4775a417e79cad957ba7",
    "0x656f927334477ff7a4ff99095c59c255421d0ae9",
    "0x7CcD114AD4e793D4152348a2e529b18f908c164F",
    "0xd7d286f5491cf219f3343628b5b3236aeb0d19ed",
    "0xE5853581f48c7bcB90b5dd00F4725d7f7dA401E1",
    "0x4c6010a9bcfb14f4e833993945617c3ef37ff845",
    "0x7441233583A66bdA86a40D8332DD35b86cc63a6B",
    "0xb513b40e1f60e6b3b0d004c875dd196f71272424",
    "0x957775136F7d04b7a82b9814c92943350aF4489e",
    "0x719d6f33c3aa9da57bd8d18a3e446bcbeb042aeb",
    "0x33275f704331aF736D056712f5d1f8c2340417F8",
    "0x0edd051b41574c3327fed249f25cb1c67327f010",
    "0x4d5627FB9B211E694c12516B61FA6E56Ac234CF8",
    "0x35721779b5d157f36cb0ab06676d655f8209b136",
    "0x2b4c0400f82e2128fb3171b42c04bc3ddc6ee2dc",
    "0xde0deedca1e7b4fa00da36d5a7770ff58d236fab",
    "0xcC386023e00B1C7647EbDbCc950c23b2552214F5",
    "0xcf1fde00aabbfa99e450f256aee50d221798903d",
    "0x2c3b260bfa11047fea7cb4e4bedfe5f7ba1025db",
    "0x6DcC9865481BF037b569455BF0dAA9EC16b8D8a2",
    "0x895b77cba33961fa65afeea740fd54c4616a64a0",
    "0x72fe25e8d5db3f120b9be9e0cc2d698f76a7a30e",
    "0x3c420c6E454803D11f1cEb2F0a4ba76faB070983",
    "0x08f5d66f1c315cdac48d7dc3ac82ba9489460b28",
    "0x36fd70b730a6d7ac593169a0739c0df3026d69ea",
    "0x9bfe8b64463a24d3d381920db433c3fcacd2de6e",
    "0x120d9652ca6662bd6c96d2cd84cb0acea4694a6b",
    "0x365e8a72076e5c65db2e4e4e9f568ae98bac4d61",
    "0x91a3a77829c35b445a01811ac6e4f517655303c4",
  ],
  amount: [
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
    ethers.utils.parseEther(String(533.815991959397)),
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

  // Executing transactions and saving results
  let results = []
  for (let i = 0; i < TRANSFERS_PAYLOAD.address.length; i++) {
    let gasPrice = await provider.getGasPrice();
    let gasLimit = await gfalToken.estimateGas.transfer(TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i], {from: signer.address});

    // Construct the transaction
    let tx = {
      from: signer.address, // specify the sender
      to: gfalToken.address,
      gasLimit,
      gasPrice,
      nonce: nonce + i,
      data: gfalToken.interface.encodeFunctionData('transfer', [TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i]]),
    };
    let signedTx = await signer.signTransaction(tx);
    let transactionResponse = await provider.sendTransaction(signedTx);
    results.push(transactionResponse)
  }

  console.log(
      `TransferByAddressAmountMarketplace script executed:`,
      results
  )
}

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.performTransferByAddressSeedifyAirdropHTTP = (req, res) => {
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  let message = req.query.message || req.body.message || 'On it - ';

  main().catch((error) => {
    let message = error.message;
    console.error(error);
    process.exitCode = 1;
  })
  res.status(200).send(message);
}

const local = false;
if(local) {
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
