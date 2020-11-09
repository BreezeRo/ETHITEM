var SingleCollection = React.createClass({
    requiredScripts: [
        'spa/loader.jsx',
        'spa/innerLoader.jsx',
        "spa/lazyImageLoader.jsx"
    ],
    getDefaultSubscriptions() {
        return {
            "collections/refresh": () => this.controller.loadData(this)
        }
    },
    componentDidMount() {
        this.controller.loadData(this);
    },
    getCustomLoader() {
        return (<section className={"singleCollection" + (this.props.className || "collection")}>
            <figure className="collectionIcon">
                <img src="assets/img/loadMonolith.png"/>
            </figure>
            <article className="collectionInfo">
                <h3 className="collectionTitle">{'\u00a0'}<span>{'\u00a0'}</span></h3>
            </article>
        </section>);
    },
    renderCollectionProblems(problems) {
        return (<p>
            <h4>Some error where found in this collection:</h4>
            {problems.map(it => <span>{it}</span>)}
        </p>);
    },
    render() {
        var color = this.props.collection.background_color;
        var children = [<Loader />];
        if (this.props.collection.loaded) {
            children = [
                <figure className="collectionIcon">
                    {<LazyImageLoader src={window.getElementImage(this.props.collection)}/>}
                    {this.props.collection.isOwner && <h6>Host</h6>}
                </figure>,
                <article className="collectionInfo">
                    {!this.props.miniature && <h3 className="collectionTitle">{this.props.collection.name} <span>({this.props.collection.symbol})</span></h3>}
                    {this.props.miniature && <h3 className="collectionTitle">{window.shortenWord(this.props.collection.name, 25)} <span>({window.shortenWord(this.props.collection.symbol, 6)})</span></h3>}
                    {!this.props.miniature && window.renderExpandibleElement(!this.props.collection.description ? "No description available" : window.convertTextWithLinksInHTML(this.props.collection.description), <p className="collectionDesc" />)}
                    {this.props.miniature && <p className="collectionDesc">{!this.props.collection.description ? "No description available" : window.shortenWord(this.props.collection.description, 100)}</p>}
                    <section className="collectionInfoSide">
                    {this.props.showItemsCount && <span className="collectionItems BrandizedS">
                        {(!this.state || (this.state.itemsCount !== 0 && !this.state.itemsCount)) && <InnerLoader />}
                        {this.state && this.state.itemsCount > 0 && `${this.state.itemsCount} ITEMS`}
                    </span>}
                    {!this.props.miniature && <p>Version: <b>{`${this.props.collection.category}_${this.props.collection.standardVersion}.${this.props.collection.erc20WrappedItemVersion}.${this.props.collection.modelVersion}`}</b></p>}
                    {/*!this.props.miniature && this.props.collection.problems && this.props.collection.problems.length > 0 && this.renderCollectionProblems(this.props.collection.problems)*/}
                    {this.props.showLink && <span className="ItemCollectionLink"><a target="_blank" onClick={window.copyHREF} href={window.getHomepageLink(`?collection=${this.props.collection.address}`)} className="collectionLink">Copy Link</a></span>}
                    </section>
                    <section className="collectionInfoSideLinks">
                        {this.props.collection.externalDNS && this.props.showLink && <span className="ItemCollectionLink"><a target="_blank" href={window.formatLink(this.props.collection.externalDNS)} className="collectionLink">External DNS</a></span>}
                        {this.props.collection.externalENS && this.props.showLink && <span className="ItemCollectionLink"><a target="_blank" href={window.formatLink(this.props.collection.externalENS)} className="collectionLink">External ENS</a></span>}
                        {this.props.collection.repoUri && this.props.showLink && <span className="ItemCollectionLink"><a target="_blank" href={window.formatLink(this.props.collection.repoUri)} className="collectionLink">Repo</a></span>}
                        {this.props.collection.licence_url && this.props.showLink && <span className="ItemCollectionLink"><a target="_blank" href={window.formatLink(this.props.collection.licence_url)} className="collectionLink">Licence</a></span>}
                    </section>
                </article>
            ];
        }
        if (this.props.onClick) {
            children = (<a href="javascript:;" data-key={this.props.collectionKey} onClick={this.props.onClick}>
                {children}
            </a>);
        }
        return (<section className={this.props.className || "collection"}>
            {children}
        </section>);
    }
});