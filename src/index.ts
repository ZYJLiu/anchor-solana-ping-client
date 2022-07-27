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
  await airdropSol(connection, payer)

  // create Wallet object from payer keypair
  const wallet = new anchor.Wallet(payer)

  // create provider from connection and wallet
  const provider = new anchor.AnchorProvider(connection, wallet, {})
  anchor.setProvider(provider)

  // convert programId to Publickey object
  const programId = new anchor.web3.PublicKey(
    "3ycJzxn4Akd2A3G2EDAW5RrM5V5DeRWt84MWHJ1ctLUr"
  )

  // create program from IDL and programId
  const program = new anchor.Program(idl as anchor.Idl, programId)

  // generate keypair for counter account
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
  if (!process.env.PRIVATE_KEY) {
    console.log("Creating .env file")
    const keypair = anchor.web3.Keypair.generate()
    fs.writeFileSync(".env", `PRIVATE_KEY=[${keypair.secretKey.toString()}]`)
    return keypair
  }

  const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[]
  const secretKey = Uint8Array.from(secret)
  const keypairFromSecretKey = anchor.web3.Keypair.fromSecretKey(secretKey)
  return keypairFromSecretKey
}

async function airdropSol(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair
) {
  console.log("Airdropping 1 SOL...")
  const signature = await connection.requestAirdrop(
    payer.publicKey,
    anchor.web3.LAMPORTS_PER_SOL * 1
  )
  await connection.confirmTransaction(signature)

  const balance = await connection.getBalance(payer.publicKey)
  console.log("Current balance is", balance / anchor.web3.LAMPORTS_PER_SOL)
}

// async function createCounterRpc(
//   wallet: anchor.Wallet,
//   counter: anchor.web3.Keypair,
//   program: anchor.Program
// ) {
//   // invoke "create" instruction from program
//   const transactionSignature = await program.methods
//     .create()
//     .accounts({
//       counter: counter.publicKey,
//       user: wallet.publicKey,
//       systemProgram: anchor.web3.SystemProgram.programId,
//     })
//     .signers([counter])
//     .rpc()

//   console.log(
//     `Create Counter Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
//   )
// }

// async function createCounterInstruction(
//   connection: anchor.web3.Connection,
//   payer: anchor.web3.Keypair,
//   counter: anchor.web3.Keypair,
//   program: anchor.Program
// ) {
//   // invoke "increment" instruction from program
//   const instruction = await program.methods
//     .create()
//     .accounts({
//       counter: counter.publicKey,
//       user: payer.publicKey,
//       systemProgram: anchor.web3.SystemProgram.programId,
//     })
//     .signers([payer, counter])
//     .instruction()

//   const transaction = new anchor.web3.Transaction().add(instruction)

//   const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
//     connection,
//     transaction,
//     [payer, counter]
//   )
//   await connection.confirmTransaction(transactionSignature)

//   console.log(
//     `Create Counter Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
//   )
// }

// async function createCounterTransaction(
//   connection: anchor.web3.Connection,
//   payer: anchor.web3.Keypair,
//   counter: anchor.web3.Keypair,
//   program: anchor.Program
// ) {
//   const transaction = await program.methods
//     .create()
//     .accounts({
//       counter: counter.publicKey,
//       user: payer.publicKey,
//       systemProgram: anchor.web3.SystemProgram.programId,
//     })
//     .signers([payer, counter])
//     .transaction()

//   const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
//     connection,
//     transaction,
//     [payer, counter]
//   )
//   await connection.confirmTransaction(transactionSignature)

//   console.log(
//     `Create Counter Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
//   )
// }

async function incrementInstruction(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair,
  counter: anchor.web3.PublicKey,
  program: anchor.Program
) {
  // invoke "increment" instruction from program
  const instruction = await program.methods
    .increment()
    .accounts({
      counter: counter,
      user: payer.publicKey,
    })
    .signers([payer])
    .instruction()

  const transaction = new anchor.web3.Transaction().add(instruction)

  const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  )
  await connection.confirmTransaction(transactionSignature)

  console.log(
    `Increment Counter Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function incrementTransaction(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair,
  counter: anchor.web3.PublicKey,
  program: anchor.Program
) {
  // invoke "increment" instruction from program
  const transaction = await program.methods
    .increment()
    .accounts({
      counter: counter,
      user: payer.publicKey,
    })
    .signers([payer])
    .transaction()

  const transactionSignature = await anchor.web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  )

  await connection.confirmTransaction(transactionSignature)

  console.log(
    `Increment Counter Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function incrementRpc(
  wallet: anchor.Wallet,
  counter: anchor.web3.PublicKey,
  program: anchor.Program
) {
  // invoke "increment" instruction from program
  const transactionSignature = await program.methods
    .increment()
    .accounts({
      counter: counter,
      user: wallet.publicKey,
    })
    .signers([])
    .rpc()

  console.log(
    `Increment Counter Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

main()
  .then(() => {
    console.log("Finished successfully")
  })
  .catch((error) => {
    console.error(error)
  })
