var Explore = React.createClass({
    requiredScripts: [
        'spa/loader.jsx'
    ],
    requiredModules: [
        'spa/singleCollection'
    ],
    onClick(e) {
        window.preventItem(e);
        this.emit('section/change', 'spa/collection', {collection: this.props.collections[parseInt(e.currentTarget.dataset.index)]});
    },
    render() {
        var _this = this;
        return (<section className="Pager">
            {this.props.loadingCollections && <Loader />}
            {this.props.collections && <section className="collections">
                <section className="collectionsList">
                    {this.props.collections.map(it => <a key={it.key} data-index={it.index} href="javascript:;" onClick={_this.onClick}>
                        <SingleCollection collection={it}/>
                    </a>)}
                </section>
            </section>}
        </section>);
    }
});