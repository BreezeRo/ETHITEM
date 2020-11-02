var Wallet = React.createClass({
    requiredScripts: [
        'spa/loader.jsx',
        'spa/lazyImageLoader.jsx'
    ],
    getList() {
        var state = window.getState(this);
        var collections = state.collections;
        return collections.filter(it => it.hasBalance);
    },
    onClick(e) {
        window.preventItem(e);
        var state = window.getState(this);
        var collection = state.collections.filter(it => it.key === e.currentTarget.dataset.collection)[0];
        var item = collection.items[e.currentTarget.dataset.item];
        this.emit('wallet/toggle', false);
        this.emit('section/change', 'spa/item', {
            collection,
            item,
            collections: state.collections
        });
    },
    getDefaultSubscriptions() {
        return {
            "collections/refresh": () => this.controller.loadData(),
            "wallet/update": () => this.controller.loadData(),
            "ethereum/ping": () => this.controller.loadData()
        }
    },
    render() {
        var state = window.getState(this);
        if (!state.wallet) {
            return (<span style={{ "display": "none" }} />);
        }
        return (
        <section className="sideALLThing">
        <section className="sideThing">
            {!state.loaded && <Loader />}
            <section className="wallet">
                {state.collections && this.getList().map(collection => <section key={collection.key} className="walletCollection">
                    <section className="walletCollectionOpener">
                        <h5 className="walletCollectionOpenerName">{collection.name}</h5>
                    </section>
                    <section className="walletCollectionItems">
                        {collection.items && Object.values(collection.items).map(item => <section key={item.key} className="walletCollectionItem">
                            <a href="javascript:;" onClick={this.onClick} data-collection={collection.key} data-item={item.key}>
                                <h6 className="walletCollectionOpenerName">{item.name}</h6>
                                <figure className="collectionIcon" style={{ "background-color": item.backgroundImage }}>
                                    {item.image && <LazyImageLoader src={item.image} />}
                                    {item.dynamicData && <span className="walletCollectionItemQuantity">{item.dynamicData.balanceOfPlain}</span>}
                                </figure>
                            </a>
                        </section>)}
                    </section>
                </section>)}
            </section>
        </section>
        </section>);
    }
});