var WrapController = function (view) {
    var context = this;
    context.view = view;

    context.getSelectedToken = function getSelectedToken(selectedToken) {
        return selectedToken || (context.view.state && context.view.state.selectedToken);
    };

    context.onTokenAddressChange = async function(type, address) {
        try {
            address = window.web3.utils.toChecksumAddress(address);
        } catch(e) {
            address = undefined;
        }
        if(!address) {
            return context.view.setState({selectedToken : type !== 'ETH' ? null : {
                type,
                name : 'Ethereum',
                symbol : 'ETH',
                decimals : 18
            }}, type !== 'ETH' ? undefined : context.refreshData);
        }
        var selectedToken = {
            type,
            address,
            contract : window.newContract(window.context.IERC1155ABI, address),
            erc20Contract : window.newContract(window.context.IERC20ABI, address),
            erc721Contract : window.newContract(window.context.IERC721ABI, address)
        };
        try {
            selectedToken.name = await window.blockchainCall(selectedToken.contract.methods.name);
        } catch(e) {
        }
        try {
            selectedToken.symbol = await window.blockchainCall(selectedToken.contract.methods.symbol);
        } catch(e) {
        }
        try {
            selectedToken.decimals = await window.blockchainCall(selectedToken.contract.methods.decimals);
        } catch(e) {
        }
        context.view.setState({selectedToken}, context.refreshData);
    };

    context.refreshData = async function refreshData() {
        context.refreshBalanceOf();
    };

    context.refreshBalanceOf = async function refreshBalanceOf() {
        var selectedToken = context.getSelectedToken();
        if(!selectedToken) {
            return;
        }
        selectedToken.balanceOf = '0';
        selectedToken.approved = true;
        if(selectedToken.type === 'ERC20') {
            await context.refreshBalanceOfERC20(selectedToken);
        } if(selectedToken.type === 'ETH') {
            selectedToken.balanceOf = await window.web3.eth.getBalance(window.walletAddress);
        } else {
            try {
                selectedToken.balanceOf = await window.blockchainCall(selectedToken.contract.methods.balanceOf, window.walletAddress, selectedToken.tokenId);
            } catch(e) {
            }
        }
        selectedToken.balanceOfPlain = context.fromDecimals(selectedToken.balanceOf);
        context.view.setState({selectedToken});
    };

    context.fromDecimals = function fromDecimals(value) {
        var selectedToken = context.getSelectedToken(selectedToken);
        if(!selectedToken || !value) {
            return;
        }
        if(selectedToken.decimals && window.asNumber(selectedToken.decimals) > 1) {
            value = window.fromDecimals(value, selectedToken.decimals);
        }
        return window.formatMoney(value, 1);
    };

    context.toDecimals = function toDecimals(value) {
        var selectedToken = context.getSelectedToken(selectedToken);
        if(!selectedToken || !value) {
            return;
        }
        if(selectedToken.decimals && window.asNumber(selectedToken.decimals) > 1) {
            value = window.toDecimals(value, selectedToken.decimals);
        }
        return value.split(',').join('');
    };

    context.refreshBalanceOfERC20 = async function refreshBalanceOfERC20(selectedToken) {
        selectedToken = context.getSelectedToken(selectedToken);
        if(!selectedToken) {
            return;
        }
        try {
            selectedToken.balanceOf = await window.blockchainCall(selectedToken.erc20Contract.methods.balanceOf, window.walletAddress);
        } catch(e) {
        }
        selectedToken.allowance = '0';
        try {
            selectedToken.allowance = await window.blockchainCall(selectedToken.erc20Contract.methods.allowance, window.walletAddress, window.currentEthItemERC20Wrapper.options.address);
        } catch(e) {
        }
        selectedToken.approved = parseInt(selectedToken.allowance) >= parseInt(selectedToken.balanceOf);
    };

    context.performApprove = async function performApprove() {
        var selectedToken = context.getSelectedToken(selectedToken);
        if(!selectedToken) {
            return;
        }
        await window.blockchainCall(selectedToken.erc20Contract.methods.approve, window.currentEthItemERC20Wrapper.options.address, window.numberToString(0xfffffffffffffffffffffffff));
    };

    context.performItemize = async function performItemize() {
        var selectedToken = context.getSelectedToken(selectedToken);
        if(!selectedToken) {
            return;
        }
        await window.sleep(window.context.inputTimeout);
        await context[`performItemize${selectedToken.type}`](selectedToken);
        await context.view.emit('collections/refresh');
        var collectionAndItem = await context.recoverCollectionAndItem(selectedToken);
        collectionAndItem.created = 'wrap';
        context.view.emit('section/change', 'spa/successPage', collectionAndItem);
    };

    context.performItemizeETH = async function performItemizeETH(selectedToken) {
        var value = context.toDecimals(selectedToken.tokenAmount);
        if(parseInt(value) > parseInt(selectedToken.balanceOf)) {
            throw "You have insufficient amount to wrap";
        }
        await window.blockchainCall(value, window.currentEthItemERC20Wrapper.methods.mintETH);
        selectedToken.tokenId = await blockchainCall(window.currentEthItemERC20Wrapper.methods.ETHEREUM_OBJECT_ID);
        selectedToken.wrappedAddress = window.currentEthItemERC20Wrapper.options.address;
    };

    context.performItemizeERC20 = async function performItemizeERC20(selectedToken) {
        var value = context.toDecimals(selectedToken.tokenAmount);
        if(parseInt(value) > parseInt(selectedToken.balanceOf)) {
            throw "You have insufficient amount to wrap";
        }
        await window.blockchainCall(window.currentEthItemERC20Wrapper.methods['mint(address,uint256)'], selectedToken.address, value);
        selectedToken.tokenId = await blockchainCall(window.currentEthItemERC20Wrapper.methods.object, selectedToken.address);
        selectedToken.wrappedAddress = window.currentEthItemERC20Wrapper.options.address;
    };

    context.performItemizeERC1155 = async function performItemizeERC1155(selectedToken) {
        if(!selectedToken.tokenId || selectedToken.tokenId === "") {
            throw "Token Id is mandatory";
        }
        var value = context.toDecimals(selectedToken.tokenAmount);
        if(parseInt(value) > parseInt(selectedToken.balanceOf)) {
            throw "You have insufficient amount to wrap";
        }
        var recipient = window.ethItemOrchestrator.options.address;
        try {
            var version = (await window.blockchainCall(window.currentEthItemFactory.methods.erc1155WrapperModel))[1];
            var wrapped = await window.blockchainCall(window.currentEthItemKnowledgeBase.methods.wrapper, selectedToken.address, version);
            recipient = wrapped && wrapped !== window.voidEthereumAddress ? wrapped : recipient;
        } catch(e) {
        }
        await window.blockchainCall(selectedToken.contract.methods.safeTransferFrom, window.walletAddress, window.ethItemOrchestrator.options.address, selectedToken.tokenId, value, "0x");
        var version = (await window.blockchainCall(window.currentEthItemFactory.methods.erc1155WrapperModel))[1];
        selectedToken.wrappedAddress = await window.blockchainCall(window.currentEthItemKnowledgeBase.methods.wrapper, selectedToken.address, version);
    }

    context.performItemizeERC721 = async function performItemizeERC721(selectedToken) {
        if(!selectedToken.tokenId || selectedToken.tokenId === "") {
            throw "Token Id is mandatory";
        }
        var owner = window.web3.utils.toChecksumAddress(await window.blockchainCall(selectedToken.erc721Contract.methods.ownerOf, selectedToken.tokenId));
        var approved = window.web3.utils.toChecksumAddress(await window.blockchainCall(selectedToken.erc721Contract.methods.getApproved, selectedToken.tokenId));
        if(owner !== window.walletAddress && approved !== window.walletAddress) {
            throw "You don't have the permission to transfer this ERC721 NFT";
        }
        var recipient = window.ethItemOrchestrator.options.address;
        try {
            var version = (await window.blockchainCall(window.currentEthItemFactory.methods.erc721WrapperModel))[1];
            var wrapped = await window.blockchainCall(window.currentEthItemKnowledgeBase.methods.wrapper, selectedToken.address, version);
            recipient = wrapped && wrapped !== window.voidEthereumAddress ? wrapped : recipient;
        } catch(e) {
        }
        await window.blockchainCall(selectedToken.erc721Contract.methods.safeTransferFrom, window.walletAddress, recipient, selectedToken.tokenId, "0x");
        var version = (await window.blockchainCall(window.currentEthItemFactory.methods.erc721WrapperModel))[1];
        selectedToken.wrappedAddress = await window.blockchainCall(window.currentEthItemKnowledgeBase.methods.wrapper, selectedToken.address, version);
    };

    context.recoverCollectionAndItem = async function recoverCollectionAndItem(selectedToken) {
        selectedToken.wrappedAddress = window.web3.utils.toChecksumAddress(selectedToken.wrappedAddress);
        var collection = await window.loadSingleCollection(selectedToken.wrappedAddress);
        collection.items = collection.items || {};
        await window.loadItemData(collection.items[selectedToken.tokenId] = collection.items[selectedToken.tokenId] || {
            objectId : selectedToken.tokenId,
            collection
        });
        return {
            collection,
            item : collection.items[selectedToken.tokenId],
            name : collection.items[selectedToken.tokenId].name,
            tokenAmount : selectedToken.tokenAmount || 1
        }
    };
};