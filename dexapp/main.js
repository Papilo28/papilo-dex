// This line of code initializes the moralis server
const serverUrl ="https://fapzmhntkfj9.usemoralis.com:2053/server";
const appId = "jwO0TBPJjLiZXPNeNQ8c65eHnefNfU9dOtl5Cnsz";
Moralis.start({ serverUrl, appId });

// these are global variables that are included in the functions below 
let currentTrade = {};
let currentSelectSide;
let tokens;

document.getElementById("btn-login").hidden = false;

//functions
async function init() {
    await Moralis.initPlugins();
    await listAvailableTokens();
    currentUser = Moralis.User.current();
    if(currentUser){
        document.getElementById("swap_button").disabled;
    }
}

async function listAvailableTokens() {
    const result = await Moralis.Plugins.oneInch.getSupportedTokens({
        chain: 'bsc',
    });

      tokens = result.tokens;
      let parent = document.getElementById("token_list");
      for( const address in tokens) {
          let token = tokens[address];
          let div = document.createElement("div");
          div.setAttribute("data-address", address);
          div.className = "token_row";
          let html = `
          <img class="token_list_img" src="${token.logoURI}">
          <span class="toekn_list_text">${token.symbol}</span>
          `
          div.innerHTML = html;
          div.onclick = (() => {selectToken(address)});
          parent.appendChild(div);
      }
}

function selectToken(address){
    closeModal();
    console.log(tokens);
    currentTrade[currentSelectSide] = tokens[address];
    console.log(currentTrade);
    renderInterface();
    getQuote();
}

function renderInterface(){
    if(currentTrade.from) {
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
    }
    if(currentTrade.to) {
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
    }
}


async function login() {
    const user = await Moralis.authenticate({ 
        provider: "walletconnect",
        chainId: 56,
        mobileLinks: [
          "rainbow",
          "metamask",
          "argent",
          "trust",
          "imtoken",
          "pillar",
        ],
        signingMessage: "welcome to PAPILO", 
    });
    document.getElementById("swap_button").disabled = false;
    document.getElementById("logout-button").hidden = false;
    document.getElementById("btn-login").hidden = true;
    console.log(user);
}

async function logOut() {
  await Moralis.User.logOut();
  document.getElementById("swap_button").disabled = true;
  document.getElementById("logout-button").hidden = true;
  document.getElementById("btn-login").hidden = false;
  console.log("logged out");
}


function openModal(side){
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
    document.getElementById("token_modal").style.display = "none";
}

async function getQuote() {
    if(!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    
    let amount = Number(
        document.getElementById("from_amount").value *10**currentTrade.from.decimals 
    );

    const quote = await Moralis.Plugins.oneInch.quote({
        chain: 'bsc', 
        fromTokenAddress:  currentTrade.from.address, 
        toTokenAddress: currentTrade.to.address, 
        amount: amount,
    })
    console.log(quote);
    document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
    document.getElementById("to_amount").value = quote.toTokenAmount / (10**quote.toToken.decimals)
}

async function trySwap(){
    let address = Moralis.User.current().get("ethAddress");
    let amount = Number(
        document.getElementById("from_amount").value *10**currentTrade.from.decimals 
    );
    if(currentTrade.from.symbol !== "ETH"){
        const allowance = await Moralis.Plugins.oneInch.hasAllowance({
            chain: 'bsc',
            fromTokenAddress: "0x095418A82BC2439703b69fbE1210824F2247D77c",
            fromAddress: address,
            amount: amount,
        })
        console.log(allowance);
        if(!allowance){
                await Moralis.Plugins.oneInch.approve({
                  chain: 'bsc',
                  tokenAddress: "0x095418A82BC2439703b69fbE1210824F2247D77c",
                  fromAddress: address,
                });
              }
        }
    let reciept = await doSwap(address, amount);
    alert("Swap Complete");    
}

function doSwap(userAddress, amount) {
    return Moralis.Plugins.oneInch.swap({
        chain: 'bsc',
        fromTokenAddress: "0x095418A82BC2439703b69fbE1210824F2247D77c",
        toTokenAddress: "0x45f77E7B6089f2A6d15C72f83D16227587A3265C",
        amount: amount,
        fromAddress: userAddress,
        slippage: 1,
    });
}
        
init();


// These are lines of code that runs the functions created above
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_token_select").onclick = (() => {openModal("from")});
document.getElementById("to_token_select").onclick = (() => {openModal("to")});
document.getElementById("btn-login").onclick = login;
document.getElementById("logout-button").onclick = logOut;
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("swap_button").onclick = trySwap;
