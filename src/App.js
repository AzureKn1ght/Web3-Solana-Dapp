import React, { useEffect, useState } from "react";
import "./App.css";

// Constants
const TWITTER_HANDLE = "AzureKn1ght";
const TWITTER_LINK = `https://github.com/AzureKn1ght`;
const TEST_GIFS = [
  "https://media.giphy.com/media/O8GyWTlBlAmKhpMIMq/giphy.gif",
  "https://media.giphy.com/media/SwEfs4Lchv8o5WVYG2/giphy.gif",
  "https://media.giphy.com/media/iNwDIhUl9S6j42lJz7/giphy.gif",
  "https://media.giphy.com/media/uWW9mp7jKEpVUyYcAQ/giphy.gif",
];

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
    if (inputValue.length > 0) {
      console.log("Gif link:", inputValue);
      setGifList([...gifList, inputValue]);
      setInputValue("");
    } else {
      console.log("Empty input. Try again.");
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => (
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
        {/* Map through gifList instead of TEST_GIFS */}
        {gifList.map((gif) => (
          <div className="gif-item" key={gif}>
            <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>
  );

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
      setGifList(TEST_GIFS);
    }
  }, [walletAddress]);

  return (
    <div className="App">
      {/* This was solely added for some styling fanciness */}
      <div Style="position: fixed; z-index: 0; width: 100%; height: 100%; top: -50%; left: -50%;">
        <iframe
          frameborder="0"
          height="200%"
          width="200%"
          src="https://www.youtube-nocookie.com/embed/nq4tT68UoCg?autoplay=1&loop=1&controls=0&showinfo=0&modestbranding=1&mute=1&start=60"
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
