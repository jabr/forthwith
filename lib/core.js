function stackTrace() {
    // TODO: is there not a better way to get this info in rhino/ringo?
    var ex = new Packages.org.mozilla.javascript.EvaluatorException("");
    ex.fillInStackTrace();
    return ex.getScriptStack();
}

exports._ = {
    get fileName() {
        // use the third frame as the first two are stackTrace helper and this getter.
        return stackTrace()[2].fileName;
    },
    
    get lineNumber() {
        // use the third frame as the first two are stackTrace helper and this getter.
        return stackTrace()[2].lineNumber;
    }
};
