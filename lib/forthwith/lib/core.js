var fs = require('fs');

function stackTrace() {
    // TODO: is there not a better way to get this info in rhino/ringo?
    var ex = new Packages.org.mozilla.javascript.EvaluatorException("");
    ex.fillInStackTrace();
    return ex.getScriptStack();
}

exports.core = {
    get fileName() {
        // use the third frame as the first two are stackTrace helper and this getter.
        return stackTrace()[2].fileName;
    },
    
    get lineNumber() {
        // use the third frame as the first two are stackTrace helper and this getter.
        return stackTrace()[2].lineNumber;
    },
    
    path: function(base, relative) {
        return fs.resolve(fs.relative(base), relative);
    }
};
