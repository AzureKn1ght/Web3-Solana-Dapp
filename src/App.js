import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import React, { useEffect, useState } from "react";
import kp from "./keypair.json";
import idl from "./idl.json";
import "./App.css";

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair, Transaction } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl("devnet");

// Controls how long we want to wait to confirm when a transaction is "done".
// Here we wait for it to be confirmed by the node we're connected to
// Can use "finalized" if we want to be extra sure full confirmation
const opts = {
  preflightCommitment: "processed",
};

// Constants
const TWITTER_HANDLE = "AzureKn1ght";
const TWITTER_LINK = `https://github.com/AzureKn1ght`;
// const TEST_GIFS = [
//   "https://media.giphy.com/media/O8GyWTlBlAmKhpMIMq/giphy.gif",
//   "https://media.giphy.com/media/SwEfs4Lchv8o5WVYG2/giphy.gif",
//   "https://media.giphy.com/media/iNwDIhUl9S6j42lJz7/giphy.gif",
//   "https://media.giphy.com/media/uWW9mp7jKEpVUyYcAQ/giphy.gif",
// ];

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  // Actions
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with Public Key:",
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log("Connected with Public Key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!");
      return;
    }
    setInputValue("");
    console.log("Gif link:", inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue);

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error);
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const getPhantomProvider = () => {
    if ("phantom" in window) {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    window.open("https://phantom.app/", "_blank");
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>
          <div className="gif-grid">
            {/* We use index as the key instead, also, 
            the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt="gif" />
                <div
                  className="tip"
                  id={item.userAddress.toString()}
                  onClick={transferSOL.bind(this, item)}
                >
                  💰 {item.userAddress.toString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  const transferSOL = async (receipient) => {
    if (!window.confirm("Tip submitter for 0.01 SOL?")) return;
    try {
      // Establishing connection
      const provider = getPhantomProvider();
      const connection = new Connection(network, opts.preflightCommitment);
      let blockhash = await (await connection.getLatestBlockhash()).blockhash;
      console.log("recentBlockhash: ", blockhash);

      // Get recipient wallet address
      receipient = receipient.userAddress.toString();
      console.log(receipient);

      // Get the phantom wallet of the user
      const sender = provider.publicKey.toString();
      console.log("Public key of the emitter: ", sender);

      // Receipiet wallet public key address
      const recieverWallet = new web3.PublicKey(receipient);

      // Build the transaction
      let transaction = new Transaction();
      const instruction = SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: recieverWallet,
        lamports: web3.LAMPORTS_PER_SOL / 100,
        //Sending 0.01 SOL. Remember 1 Lamport = 10^-9 SOL.
      });
      transaction.add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.publicKey;

      console.log("Transaction sent: ", transaction);
      const { signature } = await provider.signAndSendTransaction(transaction);
      await connection.getSignatureStatus(signature);

      // Display the transaction signature
      console.log("Signature: ", signature);
      alert("Tip sent successfully! :)");
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log("Error in getGifList: ", error);
      setGifList(null);
    }
  };

  // UseEffects
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");
      // Call Solana program here.

      // Set state
      getGifList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  return (
    <div className="App">
      {/* This was solely added for some styling fanciness */}
      <div Style="position: fixed; z-index: 0; width: 100%; height: 100%; top: -50%; left: -50%; pointer-events: none;">
        <iframe
          frameborder="0"
          height="200%"
          width="200%"
          src="https://www.youtube-nocookie.com/embed/nq4tT68UoCg?autoplay=1&loop=1&controls=0&showinfo=0&modestbranding=1&mute=1&disablekb=1&start=60"
          title="youtube"
        ></iframe>
      </div>
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">K-Pop GIF Portal</p>
          <p className="sub-text">
            ✨ View k-pop GIF collections in the Solana metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {/* We just need to add the inverse here! */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Built with ♥ by ${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
