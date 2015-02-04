$(function() {

    var toc = $('.toc');
    if(toc.length) {
        var base = $('body')[0].getBoundingClientRect().top;
        var top = toc[0].getBoundingClientRect().top;

        toc.affix({
            offset: {
                top: top - base
            }
        });
    }

});
