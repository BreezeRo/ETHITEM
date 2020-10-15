var ExplainerController = function (view) {
    var context = this;
    context.view = view;

    context.loadExplainer = async function loadExplainer(ref) {
        if(!ref) {
            return;
        }
        var element = $('<div/>').load('../../index.html', () => ref.innerHTML = element.children('.Intro').html());
    };
};