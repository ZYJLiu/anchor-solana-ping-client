import * as anchor from "@project-serum/anchor"
import * as fs from "fs"
import dotenv from "dotenv"
import idl from "./idl.json"
dotenv.config()

async function main() {
  // initialize keypair using helper function
  const payer = await initializeKeypair()

  // create connection to devnet
  const connection = new anchor.web3.Connection(
    anchor.web3.clusterApiUrl("devnet")
  )

  // call helper function to airdrop SOL to initialized Keypair
  await airdropSol(connection, payer)

  // create Wallet object from keypair
  const wallet = new anchor.Wallet(payer)

  // create AnchorProvider using connection and wallet
  const provider = new anchor.AnchorProvider(connection, wallet, {})
  // set provider
  anchor.setProvider(provider)

  // the on-chain address of the program we will invoke
  const programId = new anchor.web3.PublicKey(
    "3ycJzxn4Akd2A3G2EDAW5RrM5V5DeRWt84MWHJ1ctLUr"
  )

  // create Program constructor using imported idl and programId
  const program = new anchor.Program(idl as anchor.Idl, programId)

  // the on-chain address counter account we will be incrementing
  const counter = new anchor.web3.PublicKey(
    "4EgPRavdTMXD42zssM74oAFR8Ea6Upjt2snyNdsiUaFw"
  )

  // using .instruction
  await incrementInstruction(connection, payer, counter, program)

  // using .transaction
  await incrementTransaction(connection, payer, counter, program)

  // using .rpc
  await incrementRpc(wallet, counter, program)
}

async function initializeKeypair(): Promise<anchor.web3.Keypair> {
  // check if keypair in .env file already exists
  if (!process.env.PRIVATE_KEY) {
    console.log("Generating new Keypair")
    // generate keypair if one does not already exist
    const keypair = anchor.web3.Keypair.generate()
    console.log("Creating .env file")
    // create .env file and write secret key from new keypair to .env file
    fs.writeFileSync(".env", `PRIVATE_KEY=[${keypair.secretKey.toString()}]`)
    // return newly generated keypair
    return keypair
  }

  // read existing keypair in .env file if one already exists
  const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[]
  // convert to Uint8Array
  const secretKey = Uint8Array.from(secret)
  // convert to Keypair
  const keypairFromSecretKey = anchor.web3.Keypair.fromSecretKey(secretKey)
  // return existing keypair
  return keypairFromSecretKey
}

async function airdropSol(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair
) {
  console.log("Airdropping 1 SOL...")
  // requesting airdrop
  const signature = await connection.requestAirdrop(
    payer.publicKey,
    anchor.web3.LAMPORTS_PER_SOL * 1
  )
  // confirm airdrop transaction
  await connection.confirmTransaction(signature)
  // get new balance after airdrop
  const balance = await connection.getBalance(payer.publicKey)
  console.log("Current balance is", balance / anchor.web3.LAMPORTS_PER_SOL)
}

async function incrementInstruction(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair,
  counter: anchor.web3.PublicKey,
  program: anchor.Program
) {
  // create instruction
  const instruction = await program.methods
    .increment()
    .accounts({
      counter: counter,
      user: payer.publicKey,
    })
    .signers([payer])
    .instruction()

  // create transaction
  const transaction = new anchor.web3.Transaction().add(instruction)

  // send transaction
  const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  )

  await connection.confirmTransaction(transactionSignature)

  console.log(
    `Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function incrementTransaction(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair,
  counter: anchor.web3.PublicKey,
  program: anchor.Program
) {
  // create transaction
  const transaction = await program.methods
    .increment()
    .accounts({
      counter: counter,
      user: payer.publicKey,
    })
    .signers([payer])
    .transaction()

  // send transaction
  const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  )

  await connection.confirmTransaction(transactionSignature)

  console.log(
    `Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function incrementRpc(
  wallet: anchor.Wallet,
  counter: anchor.web3.PublicKey,
  program: anchor.Program
) {
  // send transaction
  const transactionSignature = await program.methods
    .increment()
    .accounts({
      counter: counter,
      user: wallet.publicKey,
    })
    .signers([])
    .rpc()

  console.log(
    `Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

main()
  .then(() => {
    console.log("Finished successfully")
  })
  .catch((error) => {
    console.error(error)
  })
