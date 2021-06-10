#!/usr/bin/env node
// jslint.js
// Copyright (c) 2015 Douglas Crockford  (www.JSLint.com)

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// The Software shall be used for Good, not Evil.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// jslint(source, option_object, global_array) is a function that takes 3
// arguments. The second two arguments are optional.

//      source          A text to analyze, a string or an array of strings.
//      option_object   An object whose keys correspond to option names.
//      global_array    An array of strings containing global variables that
//                      the file is allowed readonly access.

// jslint returns an object containing its results. The object contains a lot
// of valuable information. It can be used to generate reports. The object
// contains:

//      directives: an array of directive comment tokens.
//      edition: the version of JSLint that did the analysis.
//      exports: the names exported from the module.
//      froms: an array of strings representing each of the imports.
//      functions: an array of objects that represent all of the functions
//              declared in the file.
//      global: an object representing the global object. Its .context property
//              is an object containing a property for each global variable.
//      id: "(JSLint)"
//      json: true if the file is a JSON text.
//      lines: an array of strings, the source.
//      module: true if an import or export statement was used.
//      ok: true if no warnings were generated. This is what you want.
//      option: the option argument.
//      property: a property object.
//      stop: true if JSLint was unable to finish. You don't want this.
//      tokens: an array of objects representing the tokens in the file.
//      tree: the token objects arranged in a tree.
//      warnings: an array of warning objects. A warning object can contain:
//          name: "JSLintError"
//          column: A column number in the file.
//          line: A line number in the file.
//          code: A warning code string.
//          message: The warning message string.
//          a: Exhibit A.
//          b: Exhibit B.
//          c: Exhibit C.
//          d: Exhibit D.

// jslint works in several phases. In any of these phases, errors might be
// found. Sometimes JSLint is able to recover from an error and continue
// parsing. In some cases, it cannot and will stop early. If that should happen,
// repair your code and try again.

// Phases:

// PHASE 1. Split <source> by newlines into <line_array>.
// PHASE 2. Lex <line_array> into <token_array>.
// PHASE 3. Parse <token_array> into <token_tree> using Pratt parsing.
// PHASE 4. Walk <token_tree>, traversing all of the nodes of the tree. It is a
//          recursive traversal. Each node may be processed on the way down
//          (preaction) and on the way up (postaction).
// PHASE 5. Check whitespace between tokens in <token_array>.

// jslint can also examine JSON text. It decides that a file is JSON text if
// the first token is "[" or "{". Processing of JSON text is much simpler than
// the processing of JavaScript programs. Only the first three phases are
// required.

// WARNING: JSLint will hurt your feelings.

/*jslint node*/

/*property
    JSLINT_CLI, a, all, and, argv, arity, assign, async, b, bad_assignment_a,
    bad_directive_a, bad_get, bad_module_name_a, bad_option_a, bad_property_a,
    bad_set, bind, bitwise, block, body, browser, c, calls, catch, cli, closer,
    closure, code, column, concat, console_error, constant, context, convert,
    couch, create, cwd, d, dead, debug, default, devel, directive,
    directive_quiet, directives, disrupt, dot, duplicate_a, edition, ellipsis,
    else, empty_block, endsWith, env, error, eval, every, exec, exit,
    expected_a, expected_a_at_b_c, expected_a_b, expected_a_b_from_c_d,
    expected_a_before_b, expected_digits_after_a, expected_four_digits,
    expected_identifier_a, expected_line_break_a_b, expected_regexp_factor_a,
    expected_space_a_b, expected_statements_a, expected_string_a,
    expected_type_string_a, exports, expression, extra, file, finally, flag,
    for, forEach, formatted_message, free, freeze, freeze_exports, from, froms,
    fud, function_in_loop, functions, getset, global, id, identifier, import,
    inc, indexOf, infix_in, init, initial, isArray, isNaN, join, jslint, json,
    keys, label, label_a, lbp, led, length, level, line, line_offset,
    line_source, lines, live, long, loop, m, map, margin, match, max, message,
    misplaced_a, misplaced_directive_a, missing_await_statement,
    missing_browser, missing_m, mode_stop, module, naked_block, name, names,
    nested_comment, node, not_label_a, now, nr, nud, number_isNaN, ok, open,
    opening, option, out_of_scope_a, padStart, parameters, parent, pop,
    promises, property, push, quote, raw, readFile, readdir, redefinition_a_b,
    repeat, replace, required_a_optional_b, reserved_a, resolve, role, search,
    shebang, signature, single, slice, some, sort, source, split, stack,
    stack_trace, startsWith, statement, stop, subscript_a, switch, test,
    test_internal_error, then, this, thru, todo_comment, tokens, too_long,
    too_many_digits, tree, trim, try, type, unclosed_comment, unclosed_disable,
    unclosed_mega, unclosed_string, undeclared_a, unexpected_a,
    unexpected_a_after_b, unexpected_a_before_b, unexpected_at_top_level_a,
    unexpected_char_a, unexpected_comment, unexpected_directive_a,
    unexpected_expression_a, unexpected_label_a, unexpected_parens,
    unexpected_space_a_b, unexpected_statement_a, unexpected_trailing_space,
    unexpected_typeof_a, uninitialized_a, unopened_enable, unordered,
    unreachable_a, unregistered_property_a, unused_a, use_double, use_open,
    use_spaces, used, value, var_loop, var_switch, variable, versions, warning,
    warnings, weird_condition_a, weird_expression_a, weird_loop,
    weird_relation_a, white, wrap_condition, wrap_immediate, wrap_parameter,
    wrap_regexp, wrap_unary, wrapped, writable
*/

const edition = "v2021.6.4-beta";

function assert_or_throw(passed, message) {

// This function will throw <message> if <passed> is falsy.

    if (passed) {
        return passed;
    }
    throw new Error(
        `This was caused by a bug in JSLint.
Please open an issue with this stack-trace (and possible example-code) at
https://github.com/jslint-org/jslint/issues.
edition = "${edition}";
${message}`
    );
}

function empty() {

// The empty function produces a new empty object that inherits nothing. This is
// much better than '{}' because confusions around accidental method names like
// 'constructor' are completely avoided.

    return Object.create(null);
}

function noop() {

// This function will do nothing.

    return;
}

// coverage-hack
noop();

function populate(array, object = empty(), value = true) {

// Augment an object by taking property names from an array of strings.

    array.forEach(function (name) {
        object[name] = value;
    });
    return object;
}

function jslint(
    source = "",
    option_object = empty(),
    global_array = []
) {

// The jslint function itself.

    const allowed_option = {

// These are the options that are recognized in the option object or that may
// appear in a /*jslint*/ directive. Most options will have a boolean value,
// usually true. Some options will also predefine some number of global
// variables.

        bitwise: true,
        browser: [
            "caches", "CharacterData", "clearInterval", "clearTimeout",
            "document",
            "DocumentType", "DOMException", "Element", "Event", "event",
            "fetch",
            "FileReader", "FontFace", "FormData", "history",
            "IntersectionObserver",
            "localStorage", "location", "MutationObserver", "name", "navigator",
            "screen", "sessionStorage", "setInterval", "setTimeout", "Storage",
            "TextDecoder", "TextEncoder", "URL", "window", "Worker",
            "XMLHttpRequest"
        ],
        convert: true,
        couch: [
            "emit", "getRow", "isArray", "log", "provides", "registerType",
            "require", "send", "start", "sum", "toJSON"
        ],
        debug: true,
        devel: [
            "alert", "confirm", "console", "prompt"
        ],
        eval: true,
        for: true,
        getset: true,
        long: true,
        name: true,
        node: [
            "Buffer", "clearImmediate", "clearInterval", "clearTimeout",
            "console", "exports", "module", "process", "require",
            "setImmediate", "setInterval", "setTimeout", "TextDecoder",
            "TextEncoder", "URL", "URLSearchParams", "__dirname", "__filename"
        ],
        single: true,
        test_internal_error: true,
        this: true,
        unordered: true,
        white: true
    };

// The relational operators.

    const relationop = populate([
        "!=", "!==", "==", "===", "<", "<=", ">", ">="
    ]);

// This is the set of infix operators that require a space on each side.

    const spaceop = populate([
        "!=", "!==", "%", "%=", "&", "&=", "&&", "*", "*=", "+=", "-=", "/",
        "/=", "<", "<=", "<<", "<<=", "=", "==", "===", "=>", ">", ">=",
        ">>", ">>=", ">>>", ">>>=", "^", "^=", "|", "|=", "||"
    ]);

    const standard = [

// These are the globals that are provided by the language standard.

        "Array", "ArrayBuffer", "Boolean", "DataView", "Date", "Error",
        "EvalError",
        "Float32Array", "Float64Array", "Generator", "GeneratorFunction",
        "Int16Array", "Int32Array", "Int8Array", "Intl", "JSON", "Map", "Math",
        "Number", "Object", "Promise", "Proxy", "RangeError", "ReferenceError",
        "Reflect", "RegExp", "Set", "String", "Symbol", "SyntaxError", "System",
        "TypeError", "URIError", "Uint16Array", "Uint32Array", "Uint8Array",
        "Uint8ClampedArray", "WeakMap", "WeakSet", "decodeURI",
        "decodeURIComponent", "encodeURI", "encodeURIComponent", "globalThis",
        "import", "parseFloat", "parseInt"
    ];

    const bundle = {

// The bundle contains the raw text messages that are generated by jslint. It
// seems that they are all error messages and warnings. There are no "Atta
// boy!" or "You are so awesome!" messages. There is no positive reinforcement
// or encouragement. This relentless negativity can undermine self-esteem and
// wound the inner child. But if you accept it as sound advice rather than as
// personal criticism, it can make your programs better.

        and: "The '&&' subexpression should be wrapped in parens.",
        bad_assignment_a: "Bad assignment to '{a}'.",
        bad_directive_a: "Bad directive '{a}'.",
        bad_get: "A get function takes no parameters.",
        bad_module_name_a: "Bad module name '{a}'.",
        bad_option_a: "Bad option '{a}'.",
        bad_property_a: "Bad property name '{a}'.",
        bad_set: "A set function takes one parameter.",
        duplicate_a: "Duplicate '{a}'.",
        empty_block: "Empty block.",
        expected_a: "Expected '{a}'.",
        expected_a_at_b_c: "Expected '{a}' at column {b}, not column {c}.",
        expected_a_b: "Expected '{a}' and instead saw '{b}'.",
        expected_a_b_from_c_d: (
            "Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'."
        ),
        expected_a_before_b: "Expected '{a}' before '{b}'.",
        expected_digits_after_a: "Expected digits after '{a}'.",
        expected_four_digits: "Expected four digits after '\\u'.",
        expected_identifier_a: "Expected an identifier and instead saw '{a}'.",
        expected_line_break_a_b: (
            "Expected a line break between '{a}' and '{b}'."
        ),
        expected_regexp_factor_a: (
            "Expected a regexp factor and instead saw '{a}'."
        ),
        expected_space_a_b: "Expected one space between '{a}' and '{b}'.",
        expected_statements_a: "Expected statements before '{a}'.",
        expected_string_a: "Expected a string and instead saw '{a}'.",
        expected_type_string_a: "Expected a type string and instead saw '{a}'.",
        freeze_exports: (
            "Expected 'Object.freeze('. All export values should be frozen."
        ),
        function_in_loop: "Don't create functions within a loop.",
        infix_in: (
            "Unexpected 'in'. Compare with undefined, "
            + "or use the hasOwnProperty method instead."
        ),
        label_a: "'{a}' is a statement label.",
        misplaced_a: "Place '{a}' at the outermost level.",
        misplaced_directive_a: (
            "Place the '/*{a}*/' directive before the first statement."
        ),
        missing_await_statement: "Expected await statement in async function.",
        missing_browser: "/*global*/ requires the Assume a browser option.",
        missing_m: "Expected 'm' flag on a multiline regular expression.",
        naked_block: "Naked block.",
        nested_comment: "Nested comment.",
        not_label_a: "'{a}' is not a label.",
        number_isNaN: "Use Number.isNaN function to compare with NaN.",
        out_of_scope_a: "'{a}' is out of scope.",
        redefinition_a_b: "Redefinition of '{a}' from line {b}.",
        required_a_optional_b: (
            "Required parameter '{a}' after optional parameter '{b}'."
        ),
        reserved_a: "Reserved name '{a}'.",
        subscript_a: "['{a}'] is better written in dot notation.",
        todo_comment: "Unexpected TODO comment.",
        too_long: "Line is longer than 80 characters.",
        too_many_digits: "Too many digits.",
        unclosed_comment: "Unclosed comment.",
        unclosed_disable: (
            "Directive '/*jslint-disable*/' was not closed "
            + "with '/*jslint-enable*/'."
        ),
        unclosed_mega: "Unclosed mega literal.",
        unclosed_string: "Unclosed string.",
        undeclared_a: "Undeclared '{a}'.",
        unexpected_a: "Unexpected '{a}'.",
        unexpected_a_after_b: "Unexpected '{a}' after '{b}'.",
        unexpected_a_before_b: "Unexpected '{a}' before '{b}'.",
        unexpected_at_top_level_a: "Expected '{a}' to be in a function.",
        unexpected_char_a: "Unexpected character '{a}'.",
        unexpected_comment: "Unexpected comment.",
        unexpected_directive_a: (
            "When using modules, don't use directive '/*{a}'."
        ),
        unexpected_expression_a: (
            "Unexpected expression '{a}' in statement position."
        ),
        unexpected_label_a: "Unexpected label '{a}'.",
        unexpected_parens: "Don't wrap function literals in parens.",
        unexpected_space_a_b: "Unexpected space between '{a}' and '{b}'.",
        unexpected_statement_a: (
            "Unexpected statement '{a}' in expression position."
        ),
        unexpected_trailing_space: "Unexpected trailing space.",
        unexpected_typeof_a: (
            "Unexpected 'typeof'. Use '===' to compare directly with {a}."
        ),
        uninitialized_a: "Uninitialized '{a}'.",
        unopened_enable: (
            "Directive '/*jslint-enable*/' was not opened "
            + "with '/*jslint-disable*/'."
        ),
        unreachable_a: "Unreachable '{a}'.",
        unregistered_property_a: "Unregistered property name '{a}'.",
        unused_a: "Unused '{a}'.",
        use_double: "Use double quotes, not single quotes.",
        use_open: (
            "Wrap a ternary expression in parens, "
            + "with a line break after the left paren."
        ),
        use_spaces: "Use spaces, not tabs.",
        var_loop: "Don't declare variables in a loop.",
        var_switch: "Don't declare variables in a switch.",
        weird_condition_a: "Weird condition '{a}'.",
        weird_expression_a: "Weird expression '{a}'.",
        weird_loop: "Weird loop.",
        weird_relation_a: "Weird relation '{a}'.",
        wrap_condition: "Wrap the condition in parens.",
        wrap_immediate: (
            "Wrap an immediate function invocation in parentheses to assist "
            + "the reader in understanding that the expression is the result "
            + "of a function, and not the function itself."
        ),
        wrap_parameter: "Wrap the parameter in parens.",
        wrap_regexp: "Wrap this regexp in parens to avoid confusion.",
        wrap_unary: "Wrap the unary expression in parens."
    };

// Regular expression literals:

    function tag_regexp(strings) {
        return new RegExp(strings.raw[0].replace(/\s/g, ""));
    }

// supplant {variables}
    const rx_supplant = /\{([^{}]*)\}/g;
// identifier
    const rx_identifier = tag_regexp ` ^(
        [ a-z A-Z _ $ ]
        [ a-z A-Z 0-9 _ $ ]*
    )$`;
    const rx_module = tag_regexp ` ^ [ a-z A-Z 0-9 _ $ : . @ \- \/ ]+ $ `;
// star slash
    const rx_star_slash = tag_regexp ` \* \/ `;
// slash star
    const rx_slash_star = tag_regexp ` \/ \* `;
// slash star or ending slash
    const rx_slash_star_or_slash = tag_regexp ` \/ \* | \/ $ `;
// uncompleted work comment
    const rx_todo = tag_regexp ` \b (?:
        todo
      | TO \s? DO
      | HACK
    ) \b `;
// tab
    const rx_tab = /\t/g;
// directive
    const rx_directive = tag_regexp ` ^ (
        jslint
      | property
      | global
    ) \s+ ( .* ) $ `;
    const rx_directive_part = tag_regexp ` ^ (
        [ a-z A-Z $ _ ] [ a-z A-Z 0-9 $ _ ]*
    ) (?:
        : \s* ( true | false )
    )? ,? \s* ( .* ) $ `;
// token
    const rx_token = tag_regexp ` ^ (
        (\s+)
      | (
          [ a-z A-Z _ $ ]
          [ a-z A-Z 0-9 _ $ ]*
        )
      | [
          ( ) { } \[ \] , : ; ' " ~ \`
      ]
      | \? [ ? . ]?
      | = (?:
            = =?
          | >
        )?
      | \.+
      | \* [ * \/ = ]?
      | \/ [ * \/ ]?
      | \+ [ = + ]?
      | - [ = \- ]?
      | [ \^ % ] =?
      | & [ & = ]?
      | \| [ | = ]?
      | >{1,3} =?
      | < <? =?
      | ! (?:
            !
          | = =?
        )?
      | (
            0
          | [ 1-9 ] [ 0-9 ]*
        )
    ) ( .* ) $ `;
    const rx_digits = /^[0-9]*/;
    const rx_hexs = /^[0-9A-F]*/i;
    const rx_octals = /^[0-7]*/;
    const rx_bits = /^[01]*/;
// mega
    const rx_mega = /[`\\]|\$\{/;
// JSON number
    const rx_JSON_number = tag_regexp ` ^
        -?
        (?: 0 | [ 1-9 ] \d* )
        (?: \. \d* )?
        (?: [ e E ] [ \- + ]? \d+ )?
    $ `;
// initial cap
    const rx_cap = /^[A-Z]/;


// The directive comments.
    const directives = [];
// The exported names and values.
    const export_object = empty();
// The array containing all of the functions.
    const function_array = [];
// The global object; the outermost context.
    const global = {
        async: 0,
        body: true,
        context: empty(),
        finally: 0,
        from: 0,
        id: "(global)",
        level: 0,
        line: 1,
        live: [],
        loop: 0,
        switch: 0,
        thru: 0,
        try: 0
    };
// The array collecting all import-from strings.
    const import_array = [];
// Fudge starting line and starting column to 1.
    const line_fudge = 1;
// The object containing the tallied property names.
    const property = empty();
// The object containing the parser.
    const syntax_object = empty();
// The array of tokens.
    const token_array = [];
// The array collecting all generated warnings.
    const warning_array = [];
// The stack of functions.
    let function_stack = [];
// The array containing source lines.
    let line_array;
// true if parsing JSON.
    let mode_json = false;
// true if currently parsing a megastring literal.
    let mode_mega = false;
// true if import or export was used.
    let mode_module = false;
// true if a #! was seen on the first line.
    let mode_shebang = false;
// true if JSLint cannot finish.
    let mode_stop = true;
// "var" if using var; "let" if using let.
    let mode_var;
// The predefined property registry.
    let tenure;
// The next token to be examined in <token_array>.
    let token_nxt = global;
// The abstract parse tree.
    let token_tree;

// Error reportage functions:

    function artifact(the_token) {

// Return a string representing an artifact.

        if (the_token === undefined) {
            the_token = token_nxt;
        }
        return (
            (the_token.id === "(string)" || the_token.id === "(number)")
            ? String(the_token.value)
            : the_token.id
        );
    }

    function warn_at(code, line, column, a, b, c, d) {

// Report an error at some line and column of the program. The warning object
// resembles an exception.

        const warning = Object.assign({
            a,
            b,
            c,
            code,

// Fudge column numbers in warning message.

            column: column || line_fudge,
            d,
            line,
            line_source: "",
            name: "JSLintError"
        }, line_array[line]);
        warning.message = bundle[code].replace(rx_supplant, function (
            ignore,
            filling
        ) {
            assert_or_throw(
                warning[filling] !== undefined,
                "Expected warning[filling] !== undefined."
            );
//      Probably deadcode.
//      return (
//          replacement !== undefined
//          ? replacement
//          : found
//      );
            return warning[filling];
        });

// Include stack_trace for jslint to debug itself for errors.

        if (option_object.debug) {
            warning.stack_trace = new Error().stack;
        }
        if (warning.directive_quiet) {

// cause: "0 //jslint-quiet"

            return warning;
        }
        warning_array.push(warning);
        return warning;
    }

    function stop_at(code, line, column, a, b, c, d) {

// Same as warn_at, except that it stops the analysis.

        throw warn_at(code, line, column, a, b, c, d);
    }

    function warn(code, the_token, a, b, c, d) {

// Same as warn_at, except the warning will be associated with a specific token.
// If there is already a warning on this token, suppress the new one. It is
// likely that the first warning will be the most meaningful.

        if (the_token === undefined) {
            the_token = token_nxt;
        }
        if (the_token.warning === undefined) {
            the_token.warning = warn_at(
                code,
                the_token.line,
                (the_token.from || 0) + line_fudge,
                a || artifact(the_token),
                b,
                c,
                d
            );
            return the_token.warning;
        }
    }

    function stop(code, the_token, a, b, c, d) {

// Similar to warn and stop_at. If the token already had a warning, that
// warning will be replaced with this new one. It is likely that the stopping
// warning will be the more meaningful.

        if (the_token === undefined) {
            the_token = token_nxt;
        }
        delete the_token.warning;
        throw warn(code, the_token, a, b, c, d);
    }

    function is_weird(thing) {
        return (
            thing.id === "(regexp)"
            || thing.id === "{"
            || thing.id === "=>"
            || thing.id === "function"
            || (thing.id === "[" && thing.arity === "unary")
        );
    }

    function are_similar(a, b) {
        let a_string;
        let b_string;

// cause: "0&&0"

        assert_or_throw(!(a === b), `Expected !(a === b).`);
//  Probably deadcode.
//  if (a === b) {
//      return true;
//  }
        if (Array.isArray(a)) {
            return (
                Array.isArray(b)
                && a.length === b.length
                && a.every(function (value, index) {

// cause: "`${0}`&&`${0}`"

                    return are_similar(value, b[index]);
                })
            );
        }
        assert_or_throw(!Array.isArray(b), `Expected !Array.isArray(b).`);
//  Probably deadcode.
//  if (Array.isArray(b)) {
//      return false;
//  }
        if (a.id === "(number)" && b.id === "(number)") {
            return a.value === b.value;
        }
        if (a.id === "(string)") {
            a_string = a.value;
        } else if (a.id === "`" && a.constant) {
            a_string = a.value[0];
        }
        if (b.id === "(string)") {
            b_string = b.value;
        } else if (b.id === "`" && b.constant) {
            b_string = b.value[0];
        }
        if (typeof a_string === "string") {
            return a_string === b_string;
        }
        if (is_weird(a) || is_weird(b)) {
            return false;
        }
        if (a.arity === b.arity && a.id === b.id) {

// cause: "aa.bb&&aa.bb"

            if (a.id === ".") {
                return (
                    are_similar(a.expression, b.expression)
                    && are_similar(a.name, b.name)
                );
            }

// cause: "+0&&+0"

            if (a.arity === "unary") {
                return are_similar(a.expression, b.expression);
            }
            if (a.arity === "binary") {

// cause: "aa[0]&&aa[0]"

                return (
                    a.id !== "("
                    && are_similar(a.expression[0], b.expression[0])
                    && are_similar(a.expression[1], b.expression[1])
                );
            }
            if (a.arity === "ternary") {

// cause: "aa=(``?``:``)&&(``?``:``)"

                return (
                    are_similar(a.expression[0], b.expression[0])
                    && are_similar(a.expression[1], b.expression[1])
                    && are_similar(a.expression[2], b.expression[2])
                );
            }
            assert_or_throw(
                !(a.arity === "function" || a.arity === "regexp"),
                `Expected !(a.arity === "function" || a.arity === "regexp").`
            );
//      Probably deadcode.
//      if (a.arity === "function" || a.arity === "regexp") {
//          return false;
//      }

// cause: "undefined&&undefined"

            return true;
        }

// cause: "null&&undefined"

        return false;
    }


    function phase1_split() {

// PHASE 1. Split <source> by newlines into <line_array>.

        line_array = String("\n" + source).split(
            // rx_crlf
            /\n|\r\n?/
        ).map(function (line_source) {
            return {
                line_source
            };
        });
    }


    function phase2_lex() {

// PHASE 2. Lex <line_array> into <token_array>.

// A popular character.
        let char;
// The column number of the next character.
        let column = 0;
// The starting column number of the token.
        let from;
// The starting column of megastring.
        let from_mega;
// The line number of the next character.
        let line = 0;
// The starting line of "/*jslint-disable*/".
        let line_disable;
// The starting line of megastring.
        let line_mega;
// The remaining line source string.
        let line_source = "";
// The whole line source string.
        let line_whole = "";
// true if directives are still allowed.
        let mode_directive = true;
// true if regular expression literal seen on this line.
        let mode_regexp;
// A piece of string.
        let snippet = "";
// The first token.
        let token_1;
// The previous token excluding comments.
        let token_before_slash = global;
// The previous token including comments.
        let token_prv = global;

        function line_next() {

// Put the next line of source in line_source. If the line contains tabs,
// replace them with spaces and give a warning. Also warn if the line contains
// unsafe characters or is too damn long.

            let at;
            if (
                !option_object.long
                && line_whole.length > 80
                && line_disable === undefined
                && !mode_json
                && token_1
                && !mode_regexp
            ) {

// cause: "too_long"

                warn_at("too_long", line);
            }
            column = 0;
            line += 1;
            mode_regexp = false;
            line_source = undefined;
            line_whole = "";
            if (line_array[line] === undefined) {
                return line_source;
            }
            line_source = line_array[line].line_source;
            line_whole = line_source;

// Scan each line for following ignore-directives:
// "/*jslint-disable*/"
// "/*jslint-enable*/"
// "//jslint-quiet"

            if (line_source === "/*jslint-disable*/") {

// cause: "/*jslint-disable*/"

                line_disable = line;
            } else if (line_source === "/*jslint-enable*/") {
                if (line_disable === undefined) {

// cause: "/*jslint-enable*/"

                    stop_at("unopened_enable", line);
                }
                line_disable = undefined;
            } else if (line_source.endsWith(" //jslint-quiet")) {

// cause: "0 //jslint-quiet"

                line_array[line].directive_quiet = true;
            }
            if (line_disable !== undefined) {

// cause: "/*jslint-disable*/\n0"

                line_source = "";
            }
            at = line_source.search(rx_tab);
            if (at >= 0) {
                if (!option_object.white) {

// cause: "\t"

                    warn_at("use_spaces", line, at);
                }
                line_source = line_source.replace(rx_tab, " ");
            }
            if (!option_object.white && line_source.endsWith(" ")) {

// cause: " "

                warn_at(
                    "unexpected_trailing_space",
                    line,
                    line_source.length - 1
                );
            }
            return line_source;
        }

// Most tokens, including the identifiers, operators, and punctuators, can be
// found with a regular expression. Regular expressions cannot correctly match
// regular expression literals, so we will match those the hard way. String
// literals and number literals can be matched by regular expressions, but they
// don't provide good warnings. The functions char_after, char_before,
// read_some_digits, and char_after_escape help in the parsing of literals.

        function char_after(match) {

// Get the next character from the source line. Remove it from the line_source,
// and append it to the snippet. Optionally check that the previous character
// matched an expected value.

            if (match !== undefined && char !== match) {
                return (
                    char === ""

// cause: "aa=/[/"

                    ? stop_at("expected_a", line, column - 1, match, char)

// cause: "aa=/aa{/"

                    : stop_at("expected_a_b", line, column, match, char)
                );
            }
            char = line_source.slice(0, 1);
            line_source = line_source.slice(1);
            snippet += char || " ";
            column += 1;
            return char;
        }

        function char_before() {

// Back up one character by moving a character from the end of the snippet to
// the front of the line_source.

            char = snippet.slice(-1);
            line_source = char + line_source;
            column -= char.length;

// Remove last character from snippet.

            snippet = snippet.slice(0, -1);
            return char;
        }

        function read_some_digits(rx, quiet) {
            const digits = line_source.match(rx)[0];
            const length = digits.length;
            if (!quiet && length === 0) {

// cause: "0x"

                warn_at("expected_digits_after_a", line, column, snippet);
            }
            column += length;
            line_source = line_source.slice(length);
            snippet += digits;
            char_after();
            return length;
        }

        function char_after_escape(extra) {

// Validate char after escape "\\".

            char_after("\\");
            switch (char) {
            case "":

// cause: "\"\\"

                return stop_at("unclosed_string", line, column);
            case "/":
            case "\\":
            case "`":
            case "b":
            case "f":
            case "n":
            case "r":
            case "t":
                return char_after();
            case "u":
                if (char_after("u") === "{") {
                    if (mode_json) {

// cause: "[\"\\u{12345}\"]"

                        warn_at("unexpected_a", line, column, char);
                    }
                    if (read_some_digits(rx_hexs) > 5) {

// cause: "\"\\u{123456}\""

                        warn_at("too_many_digits", line, column);
                    }
                    if (char !== "}") {

// cause: "\"\\u{12345\""

                        stop_at("expected_a_before_b", line, column, "}", char);
                    }
                    return char_after();
                }
                char_before();
                if (read_some_digits(rx_hexs, true) < 4) {

// cause: "\"\\u0\""

                    warn_at("expected_four_digits", line, column);
                }
                return;
            default:
                if (extra && extra.indexOf(char) >= 0) {
                    return char_after();
                }

// cause: "\"\\0\""

                warn_at("unexpected_a_before_b", line, column, "\\", char);
            }
        }

        function token_create(id, value, identifier) {

// Create the token object and append it to token_array.

            const the_token = {
                from,
                id,
                identifier: Boolean(identifier),
                line,
                nr: token_array.length,
                thru: column
            };
            token_array.push(the_token);

// Directives must appear before the first statement.

            if (id !== "(comment)" && id !== ";") {
                mode_directive = false;
            }

// If the token is to have a value, give it one.

            if (value !== undefined) {
                the_token.value = value;
            }

// If this token is an identifier that touches a preceding number, or
// a "/", comment, or regular expression literal that touches a preceding
// comment or regular expression literal, then give a missing space warning.
// This warning is not suppressed by option_object.white.

            if (
                token_prv.line === line
                && token_prv.thru === from
                && (id === "(comment)" || id === "(regexp)" || id === "/")
                && (token_prv.id === "(comment)" || token_prv.id === "(regexp)")
            ) {

// cause: "/**//**/"

                warn(
                    "expected_space_a_b",
                    the_token,
                    artifact(token_prv),
                    artifact(the_token)
                );
            }
            if (token_prv.id === "." && id === "(number)") {

// cause: ".0"

                warn("expected_a_before_b", token_prv, "0", ".");
            }
            if (token_before_slash.id === "." && the_token.identifier) {
                the_token.dot = true;
            }

// The previous token is used to detect adjacency problems.

            token_prv = the_token;

// The token_before_slash token is a previous token that was not a comment.
// The token_before_slash token
// is used to disambiguate "/", which can mean division or regular expression
// literal.

            if (token_prv.id !== "(comment)") {
                token_before_slash = token_prv;
            }
            return the_token;
        }

        function parse_directive(the_comment, body) {

// JSLint recognizes three directives that can be encoded in comments. This
// function processes one item, and calls itself recursively to process the
// next one.

            const result = body.match(rx_directive_part);
            if (result) {
                let allowed;
                const name = result[1];
                const value = result[2];
                if (the_comment.directive === "jslint") {
                    allowed = allowed_option[name];
                    if (
                        typeof allowed === "boolean"
                        || typeof allowed === "object"
                    ) {
                        if (value === "true" || value === undefined) {
                            option_object[name] = true;
                            if (Array.isArray(allowed)) {
                                populate(allowed, global_array, false);
                            }
                        } else {
                            assert_or_throw(
                                value === "false",
                                `Expected value === "false".`
                            );
                            option_object[name] = false;
//                  Probably deadcode.
//                  } else if (value === "false") {
//                      option_object[name] = false;
//                  } else {
//                      warn("bad_option_a", the_comment, name + ":" + value);
                        }
                    } else {

// cause: "/*jslint undefined*/"

                        warn("bad_option_a", the_comment, name);
                    }
                } else if (the_comment.directive === "property") {
                    if (tenure === undefined) {
                        tenure = empty();
                    }
                    tenure[name] = true;
                } else if (the_comment.directive === "global") {
                    if (value) {

// cause: "/*global aa:false*/"

                        warn("bad_option_a", the_comment, name + ":" + value);
                    }
                    global_array[name] = false;
                    mode_module = the_comment;
                }
                return parse_directive(the_comment, result[3]);
            }
            if (body) {

// cause: "/*jslint !*/"

                return stop("bad_directive_a", the_comment, body);
            }
        }

        function comment(snippet) {

// Create a comment object. Comments are not allowed in JSON text. Comments can
// include directives and notices of incompletion.

            const the_comment = token_create("(comment)", snippet);
            let result;
            if (Array.isArray(snippet)) {
                snippet = snippet.join(" ");
            }
            if (!option_object.devel && rx_todo.test(snippet)) {

// cause: "//\u0074odo"

                warn("todo_comment", the_comment);
            }
            result = snippet.match(rx_directive);
            if (result) {
                if (!mode_directive) {

// cause: "0\n/*global aa*/"

                    warn_at("misplaced_directive_a", line, from, result[1]);
                } else {
                    the_comment.directive = result[1];
                    parse_directive(the_comment, result[2]);
                }
                directives.push(the_comment);
            }
            return the_comment;
        }

        function regexp() {

// Regexp
// Parse a regular expression literal.

            let flag;
            let mode_multi = false;
            let result;
            let value;
            mode_regexp = true;

            function regexp_subklass() {

// RegExp
// Match a character in a character class.

                switch (char) {
                case "\\":
                    char_after_escape("BbDdSsWw-[]^");
                    return true;
                case "":
                case "[":
                case "]":
                case "/":
                case "^":
                case "-":
                    return false;
                case " ":

// cause: "aa=/[ ]/"

                    warn_at("expected_a_b", line, column, "\\u0020", " ");
                    char_after();
                    return true;
                case "`":
                    if (mode_mega) {

// cause: "`${/[`]/}`"

                        warn_at("unexpected_a", line, column, "`");
                    }
                    char_after();
                    return true;
                default:
                    char_after();
                    return true;
                }
            }

            function regexp_choice() {
                let follow;

// RegExp
// Parse sequence of characters in regexp.

                while (true) {
                    switch (char) {
                    case "":
                    case "/":
                    case "]":
                    case ")":

// RegExp
// Break while-loop in regexp_choice().

                        if (!follow) {

// cause: "/ /"

                            warn_at(
                                "expected_regexp_factor_a",
                                line,
                                column,
                                char
                            );
                        }

// RegExp
// Match a choice (a sequence that can be followed by | and another choice).

                        assert_or_throw(
                            !(char === "|"),
                            `Expected !(char === "|").`
                        );
//                  Probably deadcode.
//                  if (char === "|") {
//                      char_after("|");
//                      return regexp_choice();
//                  }
                        return;
                    case "(":

// RegExp
// Match a group that starts with left paren.

                        char_after("(");
                        if (char === "?") {
                            char_after("?");
                            if (char === "=" || char === "!") {
                                char_after();
                            } else {
                                char_after(":");
                            }
                        } else if (char === ":") {

// cause: "aa=/(:)/"
// cause: "aa=/?/"

                            warn_at(
                                "expected_a_before_b",
                                line,
                                column,
                                "?",
                                ":"
                            );
                        }

// RegExp
// Recurse regexp_choice().

                        regexp_choice();
                        char_after(")");
                        break;
                    case "[":

// RegExp
// Match a class.

                        char_after("[");
                        if (char === "^") {
                            char_after("^");
                        }
                        while (true) {

// RegExp
// Match a range of subclasses.

                            while (regexp_subklass()) {
                                if (char === "-") {
                                    char_after("-");
                                    if (!regexp_subklass()) {

// cause: "aa=/[0-]/"

                                        return stop_at(
                                            "unexpected_a",
                                            line,
                                            column - 1,
                                            "-"
                                        );
                                    }
                                }
                            }
                            if (char === "]" || char === "") {
                                break;
                            }

// cause: "aa=/[/"

                            warn_at(
                                "expected_a_before_b",
                                line,
                                column,
                                "\\",
                                char
                            );
                            char_after();
                        }
                        char_after("]");
                        break;
                    case "\\":
                        char_after_escape("BbDdSsWw^${}[]():=!.|*+?");
                        break;
                    case "?":
                    case "+":
                    case "*":
                    case "}":
                    case "{":
                        warn_at(
                            "expected_a_before_b",
                            line,
                            column,
                            "\\",
                            char
                        );
                        char_after();
                        break;
                    case "`":
                        if (mode_mega) {

// cause: "`${/`/}`"

                            warn_at("unexpected_a", line, column, "`");
                        }
                        char_after();
                        break;
                    case " ":

// cause: "aa=/ /"

                        warn_at("expected_a_b", line, column, "\\s", " ");
                        char_after();
                        break;
                    case "$":
                        if (line_source[0] !== "/") {
                            mode_multi = true;
                        }
                        char_after();
                        break;
                    case "^":
                        if (snippet !== "^") {
                            mode_multi = true;
                        }
                        char_after();
                        break;
                    default:
                        char_after();
                    }

// RegExp
// Match an optional quantifier.

                    switch (char) {
                    case "?":
                    case "*":
                    case "+":
                        if (char_after() === "?") {
                            char_after("?");
                        }
                        break;
                    case "{":
                        if (read_some_digits(rx_digits, true) === 0) {

// cause: "aa=/aa{/"

                            warn_at(
                                "expected_a_before_b",
                                line,
                                column,
                                "0",
                                ","
                            );
                        }
                        if (char === ",") {

// cause: "aa=/.{,/"

                            read_some_digits(rx_digits, true);
                        }
                        if (char_after("}") === "?") {

// cause: "aa=/.{0}?/"

                            warn_at("unexpected_a", line, column, char);
                            char_after("?");
                        }
                        break;
                    }
                    follow = true;
                }
            }

// RegExp
// Scan the regexp literal. Give a warning if the first character is = because
// /= looks like a division assignment operator.

            snippet = "";
            char_after();
            if (char === "=") {

// cause: "aa=/=/"

                warn_at("expected_a_before_b", line, column, "\\", "=");
            }
            regexp_choice();

// RegExp
// Remove last character from snippet.

            snippet = snippet.slice(0, -1);

// RegExp
// Make sure there is a closing slash.

            value = snippet;
            char_after("/");

// RegExp
// Create flag.

            flag = empty();
            while (

// Regexp
// char is a letter.

                (char >= "a" && char <= "z\uffff")
                || (char >= "A" && char <= "Z\uffff")
            ) {

// RegExp
// Process dangling flag letters.

                switch (!flag[char] && char) {
                case "g":
                case "i":
                case "m":
                case "u":
                case "y":

// cause: "aa=/./gimuy"

                    break;
                default:

// cause: "aa=/./gg"
// cause: "aa=/./z"

                    warn_at("unexpected_a", line, column, char);
                }
                flag[char] = true;
                char_after();
            }
            char_before();
            if (char === "/" || char === "*") {

// cause: "aa=/.//"

                return stop_at("unexpected_a", line, from, char);
            }
            result = token_create("(regexp)", char);
            result.flag = flag;
            result.value = value;
            if (mode_multi && !flag.m) {

// cause: "aa=/$^/"

                warn_at("missing_m", line, column);
            }
            return result;
        }

        function string(quote) {

// Create a string token.

            let the_token;
            snippet = "";
            char_after();

// Parse/loop through each character in "...".

            while (true) {
                switch (char) {
                case quote:

// Remove last character from snippet.

                    snippet = snippet.slice(0, -1);
                    the_token = token_create("(string)", snippet);
                    the_token.quote = quote;
                    return the_token;
                case "":

// cause: "\""

                    return stop_at("unclosed_string", line, column);
                case "\\":
                    char_after_escape(quote);
                    break;
                case "`":
                    if (mode_mega) {

// cause: "`${\"`\"}`"

                        warn_at("unexpected_a", line, column, "`");
                    }
                    char_after("`");
                    break;
                default:
                    char_after();
                }
            }
        }

        function frack() {
            if (char === ".") {
                read_some_digits(rx_digits);
            }
            if (char === "E" || char === "e") {
                char_after();
                if (char !== "+" && char !== "-") {
                    char_before();
                }
                read_some_digits(rx_digits);
            }
        }

        function number() {
            if (snippet === "0") {
                char_after();
                if (char === ".") {
                    frack();
                } else if (char === "b") {
                    read_some_digits(rx_bits);
                } else if (char === "o") {
                    read_some_digits(rx_octals);
                } else if (char === "x") {
                    read_some_digits(rx_hexs);
                }
            } else {
                char_after();
                frack();
            }

// If the next character after a number is a digit or letter, then something
// unexpected is going on.

            if (
                (char >= "0" && char <= "9")
                || (char >= "a" && char <= "z")
                || (char >= "A" && char <= "Z")
            ) {

// cause: "0a"

                return stop_at(
                    "unexpected_a_after_b",
                    line,
                    column,
                    snippet.slice(-1),
                    snippet.slice(0, -1)
                );
            }
            char_before();
            return token_create("(number)", snippet);
        }

        function lex() {
            let comment_array;
            let i = 0;
            let j = 0;
            let result;
            let the_token;

// This should properly be a tail recursive function, but sadly, conformant
// implementations of ES6 are still rare. This is the ideal code:

//      if (!line_source) {
//          line_source = line_next();
//          from = 0;
//          return (
//              line_source === undefined
//              ? (
//                  mode_mega
//                  ? stop_at("unclosed_mega", line_mega, from_mega)
//                  : token_create("(end)")
//              )
//              : lex()
//          );
//      }

// Unfortunately, incompetent JavaScript engines will sometimes fail to execute
// it correctly. So for now, we do it the old fashioned way.

// Loop through blank lines.

            while (!line_source) {
                line_source = line_next();
                from = 0;
                if (line_source === undefined) {
                    return (
                        mode_mega

// cause: "`${//}`"

                        ? stop_at("unclosed_mega", line_mega, from_mega)
                        : line_disable !== undefined

// cause: "/*jslint-disable*/"

                        ? stop_at("unclosed_disable", line_disable)
                        : token_create("(end)")
                    );
                }
            }

            from = column;
            result = line_source.match(rx_token);

// result[1] token
// result[2] whitespace
// result[3] identifier
// result[4] number
// result[5] rest

            if (!result) {

// cause: "#"

                return stop_at(
                    "unexpected_char_a",
                    line,
                    column,
                    line_source[0]
                );
            }

            snippet = result[1];
            column += snippet.length;
            line_source = result[5];

// Whitespace was matched. Call lex again to get more.

            if (result[2]) {
                return lex();
            }

// The token is an identifier.

            if (result[3]) {
                return token_create(snippet, undefined, true);
            }

// Create token from number.

            if (result[4]) {
                return number(snippet);
            }

// Create token from string.

            if (snippet === "\"") {
                return string(snippet);
            }
            if (snippet === "'") {
                if (!option_object.single) {

// cause: "''"

                    warn_at("use_double", line, column);
                }
                return string(snippet);
            }

// The token is a megastring. We don't allow any kind of mega nesting.

            if (snippet === "`") {
                if (mode_mega) {

// cause: "`${`"

                    return stop_at("expected_a_b", line, column, "}", "`");
                }
                snippet = "";
                from_mega = from;
                line_mega = line;
                mode_mega = true;

// Parsing a mega literal is tricky. First create a ` token.

                token_create("`");
                from += 1;

// Then loop, building up a string, possibly from many lines, until seeing
// the end of file, a closing `, or a ${ indicting an expression within the
// string.

                (function part() {
                    const at = line_source.search(rx_mega);

// If neither ` nor ${ is seen, then the whole line joins the snippet.

                    if (at < 0) {
                        snippet += line_source + "\n";
                        return (
                            line_next() === undefined

// cause: "`"

                            ? stop_at("unclosed_mega", line_mega, from_mega)
                            : part()
                        );
                    }
                    snippet += line_source.slice(0, at);
                    column += at;
                    line_source = line_source.slice(at);
                    if (line_source[0] === "\\") {
                        snippet += line_source.slice(0, 2);
                        line_source = line_source.slice(2);
                        column += 2;
                        return part();
                    }

// if either ` or ${ was found, then the preceding joins the snippet to become
// a string token.

                    token_create("(string)", snippet).quote = "`";
                    snippet = "";

// If ${, then create tokens that will become part of an expression until
// a } token is made.

                    if (line_source[0] === "$") {
                        column += 2;
                        token_create("${");
                        line_source = line_source.slice(2);
                        (function expr() {
                            const id = lex().id;
                            if (id === "{") {

// cause: "`${{"

                                return stop_at(
                                    "expected_a_b",
                                    line,
                                    column,
                                    "}",
                                    "{"
                                );
                            }
                            if (id !== "}") {
                                return expr();
                            }
                        }());
                        return part();
                    }
                }());
                line_source = line_source.slice(1);
                column += 1;
                mode_mega = false;
                return token_create("`");
            }

// The token is a // comment.

            if (snippet === "//") {
                snippet = line_source;
                line_source = "";
                the_token = comment(snippet);
                if (mode_mega) {

// cause: "`${//}`"

                    warn("unexpected_comment", the_token, "`");
                }
                return the_token;
            }

// The token is a /* comment.

            if (snippet === "/*") {
                comment_array = [];
                if (line_source[0] === "/") {

// cause: "/*/"

                    warn_at("unexpected_a", line, column + i, "/");
                }
                (function next() {
                    if (line_source > "") {
                        i = line_source.search(rx_star_slash);
                        if (i >= 0) {
                            return;
                        }
                        j = line_source.search(rx_slash_star);
                        if (j >= 0) {

// cause: "/*/*"

                            warn_at("nested_comment", line, column + j);
                        }
                    }
                    comment_array.push(line_source);
                    line_source = line_next();
                    if (line_source === undefined) {

// cause: "/*"

                        return stop_at("unclosed_comment", line, column);
                    }
                    return next();
                }());
                snippet = line_source.slice(0, i);
                j = snippet.search(rx_slash_star_or_slash);
                if (j >= 0) {

// cause: "/*/**/"

                    warn_at("nested_comment", line, column + j);
                }
                comment_array.push(snippet);
                column += i + 2;
                line_source = line_source.slice(i + 2);
                return comment(comment_array);
            }

// The token is a slash.

            if (snippet === "/") {

// The / can be a division operator or the beginning of a regular expression
// literal. It is not possible to know which without doing a complete parse.
// We want to complete the tokenization before we begin to parse, so we will
// estimate. This estimator can fail in some cases. For example, it cannot
// know if "}" is ending a block or ending an object literal, so it can
// behave incorrectly in that case; it is not meaningful to divide an
// object, so it is likely that we can get away with it. We avoided the worst
// cases by eliminating automatic semicolon insertion.

                if (token_before_slash.identifier) {
                    if (!token_before_slash.dot) {
                        if (token_before_slash.id === "return") {
                            return regexp();
                        }
                        if (
                            token_before_slash.id === "(begin)"
                            || token_before_slash.id === "case"
                            || token_before_slash.id === "delete"
                            || token_before_slash.id === "in"
                            || token_before_slash.id === "instanceof"
                            || token_before_slash.id === "new"
                            || token_before_slash.id === "typeof"
                            || token_before_slash.id === "void"
                            || token_before_slash.id === "yield"
                        ) {
                            the_token = regexp();

// cause: "/./"
// cause: "case /./"
// cause: "delete /./"
// cause: "in /./"
// cause: "instanceof /./"
// cause: "new /./"
// cause: "typeof /./"
// cause: "void /./"
// cause: "yield /./"

                            return stop("unexpected_a", the_token);
                        }
                    }
                } else {
                    if ("(,=:?[".indexOf(
                        token_before_slash.id.slice(-1)
                    ) >= 0) {
                        return regexp();
                    }
                    if ("!&|{};~+-*%/^<>".indexOf(
                        token_before_slash.id.slice(-1)
                    ) >= 0) {
                        the_token = regexp();

// cause: "!/./"

                        warn("wrap_regexp", the_token);
                        return the_token;
                    }
                }
                if (line_source[0] === "=") {
                    column += 1;
                    line_source = line_source.slice(1);
                    snippet = "/=";
                    warn_at("unexpected_a", line, column, "/=");
                }
            }
            return token_create(snippet);
        }

// Scan first line for "#!" and ignore it.

        if (line_array[line_fudge].line_source.startsWith("#!")) {
            line += 1;
            mode_shebang = true;
        }
        token_1 = lex();
        mode_json = token_1.id === "{" || token_1.id === "[";

// This loop will be replaced with a recursive call to lex when ES6 has been
// finished and widely deployed and adopted.

        while (true) {
            if (lex().id === "(end)") {
                break;
            }
        }
    }


    function phase3_parse() {

// PHASE 3. Parse <token_array> into <token_tree> using Pratt parsing.

// Parsing:

// Parsing weaves the tokens into an abstract syntax tree. During that process,
// a token may be given any of these properties:

//      arity       string
//      label       identifier
//      name        identifier
//      expression  expressions
//      block       statements
//      else        statements (else, default, catch)

// Specialized tokens may have additional properties.

// The guessed name for anonymous functions.
        let anon = "anonymous";
// The current function.
        let functionage = global;
// The number of the next token.
        let token_array_ii = 0;
// The current token being examined in the parse.
        let token_now = global;

        function advance(id, match) {

// Produce the next token.

// Attempt to give helpful names to anonymous functions.

            if (token_now.identifier && token_now.id !== "function") {
                anon = token_now.id;
            } else if (
                token_now.id === "(string)"
                && rx_identifier.test(token_now.value)
            ) {
                anon = token_now.value;
            }

// Attempt to match token_nxt with an expected id.

            if (id !== undefined && token_nxt.id !== id) {
                return (
                    match === undefined

// cause: "()"

                    ? stop("expected_a_b", token_nxt, id, artifact())

// cause: "{\"aa\":0"

                    : stop(
                        "expected_a_b_from_c_d",
                        token_nxt,
                        id,
                        artifact(match),
                        match.line,
                        artifact(token_nxt)
                    )
                );
            }

// Promote the tokens, skipping comments.

            token_now = token_nxt;
            while (true) {
                token_nxt = token_array[token_array_ii];
                token_array_ii += 1;
                if (token_nxt.id !== "(comment)") {
                    if (token_nxt.id === "(end)") {
                        token_array_ii -= 1;
                    }
                    break;
                }
                if (mode_json) {

// cause: "[//]"

                    warn("unexpected_a", token_nxt);
                }
            }
        }

        function lookahead() {

// Look ahead one token without advancing, skipping comments.

            let cadet;
            let ii = token_array_ii;
            while (true) {
                cadet = token_array[ii];
                if (cadet.id !== "(comment)") {
                    return cadet;
                }
                ii += 1;
            }
        }

// Now we parse JavaScript.

        function enroll(name, role, readonly) {

// Enroll a name into the current function context. The role can be exception,
// function, label, parameter, or variable. We look for variable redefinition
// because it causes confusion.

            const id = name.id;

// Reserved words may not be enrolled.

            if (syntax_object[id] !== undefined && id !== "ignore") {

// cause: "let undefined"

                warn("reserved_a", name);
            } else {

// Has the name been enrolled in this context?

                let earlier = functionage.context[id];
                if (earlier) {

// cause: "let aa;let aa"

                    warn(
                        "redefinition_a_b",
                        name,
                        name.id,
                        earlier.line
                    );

// Has the name been enrolled in an outer context?

                } else {
                    function_stack.forEach(function (value) {
                        const item = value.context[id];
                        if (item !== undefined) {
                            earlier = item;
                        }
                    });
                    if (earlier) {
                        if (id === "ignore") {
                            if (earlier.role === "variable") {

// cause: "let ignore;function aa(ignore){}"

                                warn("unexpected_a", name);
                            }
                        } else {
                            if (
                                (
                                    role !== "exception"
                                    || earlier.role !== "exception"
                                )
                                && role !== "parameter"
                                && role !== "function"
                            ) {

// cause: "function aa(){try{aa();}catch(aa){aa();}}"
// cause: "function aa(){var aa;}"

                                warn(
                                    "redefinition_a_b",
                                    name,
                                    name.id,
                                    earlier.line
                                );
                            }
                        }
                    }

// Enroll it.

                    functionage.context[id] = name;
                    name.dead = true;
                    name.parent = functionage;
                    name.init = false;
                    name.role = role;
                    name.used = 0;
                    name.writable = !readonly;
                }
            }
        }

        function parse_expression(rbp, initial) {

// This is the heart of the Pratt parser. I retained Pratt's nomenclature.
// They are elements of the parsing method called Top Down Operator Precedence.

// nud     Null denotation
// led     Left denotation
// lbp     Left binding power
// rbp     Right binding power

// It processes a nud (variable, constant, prefix operator). It will then
// process leds (infix operators) until the bind powers cause it to stop. It
// returns the expression's parse tree.

            let left;
            let the_symbol;

// Statements will have already advanced, so advance now only if the token is
// not the first of a statement,

            if (!initial) {
                advance();
            }
            the_symbol = syntax_object[token_now.id];
            if (the_symbol !== undefined && the_symbol.nud !== undefined) {

// cause: "0"

                left = the_symbol.nud();
            } else if (token_now.identifier) {

// cause: "aa"

                left = token_now;
                left.arity = "variable";
            } else {

// cause: "!"
// cause: "let aa=`${}`;"

                return stop("unexpected_a", token_now);
            }

// Parse/loop through each symbol in expression.

            while (true) {
                the_symbol = syntax_object[token_nxt.id];
                if (
                    the_symbol === undefined
                    || the_symbol.led === undefined
                    || the_symbol.lbp <= rbp
                ) {
                    break;
                }
                advance();
                left = the_symbol.led(left);
            }
            return left;
        }

        function condition() {

// Parse the condition part of a do, if, while.

            const the_paren = token_nxt;
            let the_value;

// cause: "do{}while()"
// cause: "if(){}"
// cause: "while(){}"

            the_paren.free = true;
            advance("(");
            the_value = parse_expression(0);
            advance(")");
            if (the_value.wrapped === true) {

// cause: "while((0)){}"

                warn("unexpected_a", the_paren);
            }

// Check for anticondition.

            switch (the_value.id) {
            case "%":
            case "&":
            case "(number)":
            case "(string)":
            case "*":
            case "+":
            case "-":
            case "/":
            case "<<":
            case ">>":
            case ">>>":
            case "?":
            case "^":
            case "typeof":
            case "|":
            case "~":

// cause: "if(\"aa\"){}"
// cause: "if(0%0){}"
// cause: "if(0&0){}"
// cause: "if(0){}"
// cause: "if(0*0){}"
// cause: "if(0+0){}"
// cause: "if(0-0){}"
// cause: "if(0/0){}"
// cause: "if(0<<0){}"
// cause: "if(0>>0){}"
// cause: "if(0>>>0){}"
// cause: "if(0?0:0){}"
// cause: "if(0^0){}"
// cause: "if(0|0){}"
// cause: "if(typeof 0){}"
// cause: "if(~0){}"

                warn("unexpected_a", the_value);
                break;
            }
            return the_value;
        }

        function semicolon() {

// Try to match a semicolon.

            if (token_nxt.id === ";") {
                advance(";");
            } else {

// cause: "0"

                warn_at(
                    "expected_a_b",
                    token_now.line,
                    token_now.thru + 1,
                    ";",
                    artifact(token_nxt)
                );
            }
            anon = "anonymous";
        }

        function parse_statement() {

// Parse a statement. Any statement may have a label, but only four statements
// have use for one. A statement can be one of the standard statements, or
// an assignment expression, or an invocation expression.

            let first;
            let the_label;
            let the_statement;
            let the_symbol;
            advance();
            if (token_now.identifier && token_nxt.id === ":") {
                the_label = token_now;
                if (the_label.id === "ignore") {

// cause: "ignore:"

                    warn("unexpected_a", the_label);
                }
                advance(":");
                if (
                    token_nxt.id === "do"
                    || token_nxt.id === "for"
                    || token_nxt.id === "switch"
                    || token_nxt.id === "while"
                ) {
                    enroll(the_label, "label", true);
                    the_label.init = true;
                    the_label.dead = false;
                    the_statement = parse_statement();
                    the_statement.label = the_label;
                    the_statement.statement = true;
                    return the_statement;
                }
                advance();

// cause: "aa:"

                warn("unexpected_label_a", the_label);
            }

// Parse the statement.

            first = token_now;
            first.statement = true;
            the_symbol = syntax_object[first.id];
            if (
                the_symbol !== undefined
                && the_symbol.fud !== undefined

// Fixes issues #316, #317 - dynamic-import().

                && !(the_symbol.id === "import" && token_nxt.id === "(")
            ) {
                the_symbol.disrupt = false;
                the_symbol.statement = true;
                the_statement = the_symbol.fud();
            } else {

// It is an expression statement.

                the_statement = parse_expression(0, true);
                if (the_statement.wrapped && the_statement.id !== "(") {

// cause: "(0)"

                    warn("unexpected_a", first);
                }
                semicolon();
            }
            if (the_label !== undefined) {
                the_label.dead = true;
            }
            return the_statement;
        }

        function parse_statements() {

// Parse a list of statements. Give a warning if an unreachable statement
// follows a disruptive statement.

            const statement_array = [];
            let a_statement;
            let disrupt = false;

// Parse/loop each statement until a statement-terminator is reached.

            while (true) {
                switch (token_nxt.id) {
                case "}":
                case "case":
                case "default":
                case "else":
                case "(end)":
                    return statement_array;
                }
                a_statement = parse_statement();
                statement_array.push(a_statement);
                if (disrupt) {

// cause: "while(0){break;0;}"

                    warn("unreachable_a", a_statement);
                }
                disrupt = a_statement.disrupt;
            }
        }

        function not_top_level(thing) {

// Some features should not be at the outermost level.

            if (functionage === global) {

// cause: "while(0){}"

                warn("unexpected_at_top_level_a", thing);
            }
        }

        function block(special) {

// Parse a block, a sequence of statements wrapped in braces.
//  special "body"      The block is a function body.
//          "ignore"    No warning on an empty block.
//          "naked"     No advance.
//          undefined   An ordinary block.

            let stmts;
            let the_block;
            if (special !== "naked") {
                advance("{");
            }
            the_block = token_now;
            the_block.arity = "statement";
            the_block.body = special === "body";

// Top level function bodies may include the "use strict" pragma.

            if (
                special === "body"
                && function_stack.length === 1
                && token_nxt.value === "use strict"
            ) {
                token_nxt.statement = true;
                advance("(string)");
                advance(";");
            }
            stmts = parse_statements();
            the_block.block = stmts;
            if (stmts.length === 0) {
                if (!option_object.devel && special !== "ignore") {

// cause: "function aa(){}"

                    warn("empty_block", the_block);
                }
                the_block.disrupt = false;
            } else {
                the_block.disrupt = stmts[stmts.length - 1].disrupt;
            }
            advance("}");
            return the_block;
        }

        function mutation_check(the_thing) {

// The only expressions that may be assigned to are
//      e.b
//      e[b]
//      v
//      [destructure]
//      {destructure}

            if (
                the_thing.arity !== "variable"
                && the_thing.id !== "."
                && the_thing.id !== "["
                && the_thing.id !== "{"
            ) {

// cause: "0=0"

                warn("bad_assignment_a", the_thing);
                return false;
            }
            return true;
        }

        function left_check(left, right) {

// Warn if the left is not one of these:
//      ?.
//      ?:
//      e()
//      e.b
//      e[b]
//      identifier

            const id = left.id;
            if (
                !left.identifier
                && (
                    left.arity !== "ternary"
                    || (
                        !left_check(left.expression[1])
                        && !left_check(left.expression[2])
                    )
                )
                && (
                    left.arity !== "binary"
                    || (id !== "." && id !== "?." && id !== "(" && id !== "[")
                )
            ) {
                warn("unexpected_a", right);
                return false;
            }
            return true;
        }

// These functions are used to specify the grammar of our language:

        function symbol(id, bp) {

// Create a symbol if it does not already exist in the language's syntax.

            let the_symbol = syntax_object[id];
            if (the_symbol === undefined) {
                the_symbol = empty();
                the_symbol.id = id;
                the_symbol.lbp = bp || 0;
                syntax_object[id] = the_symbol;
            }
            return the_symbol;
        }

        function assignment(id) {

// Create an assignment operator. The one true assignment is different because
// its left side, when it is a variable, is not treated as an expression.
// That case is special because that is when a variable gets initialized. The
// other assignment operators can modify, but they cannot initialize.

            const the_symbol = symbol(id, 20);
            the_symbol.led = function (left) {
                const the_token = token_now;
                let right;
                the_token.arity = "assignment";
                right = parse_expression(20 - 1);
                if (id === "=" && left.arity === "variable") {
                    the_token.names = left;
                    the_token.expression = right;
                } else {
                    the_token.expression = [left, right];
                }
                if (
                    right.arity === "assignment"
                    || right.arity === "pre"
                    || right.arity === "post"
                ) {
                    warn("unexpected_a", right);
                }
                mutation_check(left);
                return the_token;
            };
            return the_symbol;
        }

        function constant(id, type, value) {

// Create a constant symbol.

            const the_symbol = symbol(id);
            the_symbol.constant = true;
            the_symbol.nud = (
                typeof value === "function"
                ? value
                : function () {
                    token_now.constant = true;
                    if (value !== undefined) {
                        token_now.value = value;
                    }
                    return token_now;
                }
            );
            the_symbol.type = type;
            the_symbol.value = value;
            return the_symbol;
        }

        function infix(id, bp, f) {

// Create an infix operator.

            const the_symbol = symbol(id, bp);
            the_symbol.led = function (left) {
                const the_token = token_now;
                the_token.arity = "binary";
                if (f !== undefined) {
                    return f(left);
                }
                the_token.expression = [left, parse_expression(bp)];
                return the_token;
            };
            return the_symbol;
        }

        function infixr(id, bp) {

// Create a right associative infix operator.

            const the_symbol = symbol(id, bp);
            the_symbol.led = function (left) {

// cause: "0**0"

                const the_token = token_now;
                the_token.arity = "binary";
                the_token.expression = [left, parse_expression(bp - 1)];
                return the_token;
            };
            return the_symbol;
        }

        function post(id) {

// Create one of the post operators.

            const the_symbol = symbol(id, 150);
            the_symbol.led = function (left) {
                token_now.expression = left;
                token_now.arity = "post";
                mutation_check(token_now.expression);
                return token_now;
            };
            return the_symbol;
        }

        function pre(id) {

// Create one of the pre operators.

            const the_symbol = symbol(id);
            the_symbol.nud = function () {
                const the_token = token_now;
                the_token.arity = "pre";
                the_token.expression = parse_expression(150);
                mutation_check(the_token.expression);
                return the_token;
            };
            return the_symbol;
        }

        function prefix(id, f) {

// Create a prefix operator.

            const the_symbol = symbol(id);
            the_symbol.nud = function () {
                const the_token = token_now;
                the_token.arity = "unary";
                if (typeof f === "function") {
                    return f();
                }
                the_token.expression = parse_expression(150);
                return the_token;
            };
            return the_symbol;
        }

        function stmt(id, f) {

// Create a statement.

            const the_symbol = symbol(id);
            the_symbol.fud = function () {
                token_now.arity = "statement";
                return f();
            };
            return the_symbol;
        }

        function survey(name) {
            let id = name.id;

// Tally the property name. If it is a string, only tally strings that conform
// to the identifier rules.

            if (id === "(string)") {
                id = name.value;
                if (!rx_identifier.test(id)) {
                    return id;
                }
            } else if (id === "`") {
                if (name.value.length === 1) {
                    id = name.value[0].value;
                    if (!rx_identifier.test(id)) {
                        return id;
                    }
                }
            } else if (!name.identifier) {

// cause: "let aa={0:0}"

                return stop("expected_identifier_a", name);
            }

// If we have seen this name before, increment its count.

            if (typeof property[id] === "number") {
                property[id] += 1;

// If this is the first time seeing this property name, and if there is a
// tenure list, then it must be on the list. Otherwise, it must conform to
// the rules for good property names.

            } else {
                if (tenure !== undefined) {
                    if (tenure[id] !== true) {

// cause: "/*property aa*/\naa.bb"

                        warn("unregistered_property_a", name);
                    }
                } else if (
                    !option_object.name
                    && name.identifier
                    && (
                        // rx_bad_property
                        /^_|\$|Sync$|_$/m
                    ).test(id)
                ) {

// cause: "aa.$"
// cause: "aa._"
// cause: "aa._aa"
// cause: "aa.aaSync"
// cause: "aa.aa_"

                    warn("bad_property_a", name);
                }
                property[id] = 1;
            }
            return id;
        }

        function ternary(id1, id2) {

// Create a ternary operator.

            const the_symbol = symbol(id1, 30);
            the_symbol.led = function (left) {
                const the_token = token_now;
                const second = parse_expression(20);
                advance(id2);
                token_now.arity = "ternary";
                the_token.arity = "ternary";
                the_token.expression = [left, second, parse_expression(10)];
                if (token_nxt.id !== ")") {

// cause: "0?0:0"

                    warn("use_open", the_token);
                }
                return the_token;
            };
            return the_symbol;
        }

// Begin defining the language.

        symbol("}");
        symbol(")");
        symbol("]");
        symbol(",");
        symbol(";");
        symbol(":");
        symbol("*/");
        symbol("async");
        symbol("await");
        symbol("case");
        symbol("catch");
        symbol("class");
        symbol("default");
        symbol("else");
        symbol("enum");
        symbol("finally");
        symbol("implements");
        symbol("interface");
        symbol("package");
        symbol("private");
        symbol("protected");
        symbol("public");
        symbol("static");
        symbol("super");
        symbol("void");
        symbol("yield");

        constant("(number)", "number");
        constant("(regexp)", "regexp");
        constant("(string)", "string");
        constant("arguments", "object", function () {

// cause: "arguments"

            warn("unexpected_a", token_now);
            return token_now;
        });
        constant("eval", "function", function () {
            if (!option_object.eval) {

// cause: "eval"

                warn("unexpected_a", token_now);
            } else if (token_nxt.id !== "(") {

// cause: "/*jslint eval*/\neval"

                warn("expected_a_before_b", token_nxt, "(", artifact());
            }
            return token_now;
        });
        constant("false", "boolean", false);
        constant("Function", "function", function () {
            if (!option_object.eval) {

// cause: "Function()"

                warn("unexpected_a", token_now);
            } else if (token_nxt.id !== "(") {

// cause: "/*jslint eval*/\nFunction"

                warn("expected_a_before_b", token_nxt, "(", artifact());
            }
            return token_now;
        });
        constant("ignore", "undefined", function () {

// cause: "ignore"

            warn("unexpected_a", token_now);
            return token_now;
        });
        constant("Infinity", "number", Infinity);
        constant("isFinite", "function", function () {

// cause: "isFinite"

            warn("expected_a_b", token_now, "Number.isFinite", "isFinite");
            return token_now;
        });
        constant("isNaN", "function", function () {

// cause: "isNaN(0)"

            warn("number_isNaN", token_now);
            return token_now;
        });
        constant("NaN", "number", NaN);
        constant("null", "null", null);
        constant("this", "object", function () {
            if (!option_object.this) {

// cause: "this"

                warn("unexpected_a", token_now);
            }
            return token_now;
        });
        constant("true", "boolean", true);
        constant("undefined", "undefined");

        assignment("=");
        assignment("+=");
        assignment("-=");
        assignment("*=");
        assignment("/=");
        assignment("%=");
        assignment("&=");
        assignment("|=");
        assignment("^=");
        assignment("<<=");
        assignment(">>=");
        assignment(">>>=");

        infix("??", 35);
        infix("||", 40);
        infix("&&", 50);
        infix("|", 70);
        infix("^", 80);
        infix("&", 90);
        infix("==", 100);
        infix("===", 100);
        infix("!=", 100);
        infix("!==", 100);
        infix("<", 110);
        infix(">", 110);
        infix("<=", 110);
        infix(">=", 110);
        infix("in", 110);
        infix("instanceof", 110);
        infix("<<", 120);
        infix(">>", 120);
        infix(">>>", 120);
        infix("+", 130);
        infix("-", 130);
        infix("*", 140);
        infix("/", 140);
        infix("%", 140);
        infixr("**", 150);
        infix("(", 160, function (left) {
            const the_paren = token_now;
            let ellipsis;
            let the_argument;
            if (left.id !== "function") {

// cause: "(0?0:0)()"
// cause: "0()"

                left_check(left, the_paren);
            }
            if (functionage.arity === "statement" && left.identifier) {
                functionage.name.calls[left.id] = left;
            }
            the_paren.expression = [left];
            if (token_nxt.id !== ")") {

// Parse/loop through each token in expression (...).

                while (true) {
                    if (token_nxt.id === "...") {
                        ellipsis = true;
                        advance("...");
                    }
                    the_argument = parse_expression(10);
                    if (ellipsis) {
                        the_argument.ellipsis = true;
                    }
                    the_paren.expression.push(the_argument);
                    if (token_nxt.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance(")", the_paren);
            if (the_paren.expression.length === 2) {

// cause: "aa(0)"

                the_paren.free = true;
                if (the_argument.wrapped === true) {

// cause: "aa((0))"

                    warn("unexpected_a", the_paren);
                }
                if (the_argument.id === "(") {
                    the_argument.wrapped = true;
                }
            } else {

// cause: "aa()"
// cause: "aa(0,0)"

                the_paren.free = false;
            }
            return the_paren;
        });
        infix(".", 170, function (left) {
            const the_token = token_now;
            const name = token_nxt;
            if (
                (
                    left.id !== "(string)"
                    || (name.id !== "indexOf" && name.id !== "repeat")
                )
                && (
                    left.id !== "["
                    || (
                        name.id !== "concat"
                        && name.id !== "forEach"
                        && name.id !== "join"
                        && name.id !== "map"
                    )
                )
                && (left.id !== "+" || name.id !== "slice")
                && (
                    left.id !== "(regexp)"
                    || (name.id !== "exec" && name.id !== "test")
                )
            ) {

// cause: "\"\".aa"

                left_check(left, the_token);
            }
            if (!name.identifier) {

// cause: "aa.0"

                stop("expected_identifier_a");
            }
            advance();
            survey(name);

// The property name is not an expression.

            the_token.name = name;
            the_token.expression = left;
            return the_token;
        });
        infix("?.", 170, function (left) {
            const the_token = token_now;
            const name = token_nxt;
            if (
                (
                    left.id !== "(string)"
                    || (name.id !== "indexOf" && name.id !== "repeat")
                )
                && (
                    left.id !== "["
                    || (
                        name.id !== "concat"
                        && name.id !== "forEach"
                        && name.id !== "join"
                        && name.id !== "map"
                    )
                )

// cause: "(0+0)?.0"

                && (left.id !== "+" || name.id !== "slice")
                && (
                    left.id !== "(regexp)"
                    || (name.id !== "exec" && name.id !== "test")
                )
            ) {

// cause: "\"aa\"?.0"
// cause: "(/./)?.0"
// cause: "aa=[]?.aa"

                left_check(left, the_token);
            }
            if (!name.identifier) {

// cause: "aa?.0"

                stop("expected_identifier_a");
            }
            advance();
            survey(name);

// The property name is not an expression.

            the_token.name = name;
            the_token.expression = left;
            return the_token;
        });
        infix("[", 170, function (left) {
            const the_token = token_now;
            const the_subscript = parse_expression(0);
            if (the_subscript.id === "(string)" || the_subscript.id === "`") {
                const name = survey(the_subscript);
                if (rx_identifier.test(name)) {

// cause: "aa[`aa`]"

                    warn("subscript_a", the_subscript, name);
                }
            }

// cause: "0[0]"

            left_check(left, the_token);
            the_token.expression = [left, the_subscript];
            advance("]");
            return the_token;
        });
        infix("=>", 170, function (left) {

// cause: "aa=>0"

            return stop("wrap_parameter", left);
        });

        function do_tick() {
            const the_tick = token_now;
            the_tick.value = [];
            the_tick.expression = [];
            if (token_nxt.id !== "`") {

// Parse/loop through each token in `${...}`.

                while (true) {
                    advance("(string)");
                    the_tick.value.push(token_now);
                    if (token_nxt.id !== "${") {
                        break;
                    }
                    advance("${");

// cause: "let aa=`${}`;"

                    the_tick.expression.push(parse_expression(0));
                    advance("}");
                }
            }
            advance("`");
            return the_tick;
        }

        infix("`", 160, function (left) {
            const the_tick = do_tick();

// cause: "0``"

            left_check(left, the_tick);
            the_tick.expression = [left].concat(the_tick.expression);
            return the_tick;
        });

        post("++");
        post("--");
        pre("++");
        pre("--");

        prefix("+");
        prefix("-");
        prefix("~");
        prefix("!");
        prefix("!!");
        prefix("[", function () {
            const the_token = token_now;
            let element;
            let ellipsis;
            the_token.expression = [];
            if (token_nxt.id !== "]") {

// Parse/loop through each element in [...].

                while (true) {
                    ellipsis = false;
                    if (token_nxt.id === "...") {
                        ellipsis = true;
                        advance("...");
                    }
                    element = parse_expression(10);
                    if (ellipsis) {
                        element.ellipsis = true;
                    }
                    the_token.expression.push(element);
                    if (token_nxt.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("]");
            return the_token;
        });
        prefix("/=", function () {

// cause: "/="

            stop("expected_a_b", token_now, "/\\=", "/=");
        });
        prefix("=>", function () {

// cause: "=>0"

            return stop("expected_a_before_b", token_now, "()", "=>");
        });
        prefix("new", function () {
            const the_new = token_now;
            const right = parse_expression(160);
            if (token_nxt.id !== "(") {

// cause: "new aa"

                warn(
                    "expected_a_before_b",
                    token_nxt,
                    "()",
                    artifact(token_nxt)
                );
            }
            the_new.expression = right;
            return the_new;
        });
        prefix("typeof");
        prefix("void", function () {
            const the_void = token_now;

// cause: "void"
// cause: "void 0"

            warn("unexpected_a", the_void);
            the_void.expression = parse_expression(0);
            return the_void;
        });

        function parameter_list() {
            const list = [];
            const signature = ["("];
            let optional;
            if (token_nxt.id !== ")" && token_nxt.id !== "(end)") {
                (function parameter() {
                    let ellipsis = false;
                    let param;
                    if (token_nxt.id === "{") {
                        let artifact_now;
                        let artifact_nxt = "";
                        if (optional !== undefined) {

// cause: "function aa(aa=0,{}){}"

                            warn(
                                "required_a_optional_b",
                                token_nxt,
                                token_nxt.id,
                                optional.id
                            );
                        }
                        param = token_nxt;
                        param.names = [];
                        advance("{");
                        signature.push("{");
                        (function subparameter() {
                            let subparam = token_nxt;
                            if (!subparam.identifier) {

// cause: "function aa(aa=0,{}){}"
// cause: "function aa({0}){}"

                                return stop("expected_identifier_a");
                            }
                            survey(subparam);
                            artifact_now = artifact_nxt;
                            artifact_nxt = artifact(subparam);
                            if (
                                !option_object.unordered
                                && artifact_now > artifact_nxt
                            ) {

// cause: "function aa({bb,aa}){}"

                                warn(
                                    "expected_a_before_b",
                                    subparam,
                                    artifact_nxt,
                                    artifact_now
                                );
                            }
                            advance();
                            signature.push(subparam.id);
                            if (token_nxt.id === ":") {
                                advance(":");
                                advance();
                                token_now.label = subparam;
                                subparam = token_now;
                                if (!subparam.identifier) {

// cause: "function aa({aa:0}){}"

                                    return stop("expected_identifier_a");
                                }
                            }

// cause: "function aa({aa=aa},aa){}"

                            if (token_nxt.id === "=") {
                                advance("=");
                                subparam.expression = parse_expression();
                                param.open = true;
                            }
                            param.names.push(subparam);
                            if (token_nxt.id === ",") {
                                advance(",");
                                signature.push(", ");
                                return subparameter();
                            }
                        }());
                        list.push(param);
                        advance("}");
                        signature.push("}");
                        if (token_nxt.id === ",") {
                            advance(",");
                            signature.push(", ");
                            return parameter();
                        }
                    } else if (token_nxt.id === "[") {
                        if (optional !== undefined) {

// cause: "function aa(aa=0,[]){}"

                            warn(
                                "required_a_optional_b",
                                token_nxt,
                                token_nxt.id,
                                optional.id
                            );
                        }
                        param = token_nxt;
                        param.names = [];
                        advance("[");
                        signature.push("[]");
                        (function subparameter() {
                            const subparam = token_nxt;
                            if (!subparam.identifier) {

// cause: "function aa(aa=0,[]){}"

                                return stop("expected_identifier_a");
                            }
                            advance();
                            param.names.push(subparam);

// cause: "function aa([aa=aa],aa){}"

                            if (token_nxt.id === "=") {
                                advance("=");
                                subparam.expression = parse_expression();
                                param.open = true;
                            }
                            if (token_nxt.id === ",") {
                                advance(",");
                                return subparameter();
                            }
                        }());
                        list.push(param);
                        advance("]");
                        if (token_nxt.id === ",") {
                            advance(",");
                            signature.push(", ");
                            return parameter();
                        }
                    } else {
                        if (token_nxt.id === "...") {
                            ellipsis = true;
                            signature.push("...");
                            advance("...");
                            if (optional !== undefined) {

// cause: "function aa(aa=0,...){}"

                                warn(
                                    "required_a_optional_b",
                                    token_nxt,
                                    token_nxt.id,
                                    optional.id
                                );
                            }
                        }
                        if (!token_nxt.identifier) {

// cause: "function aa(0){}"

                            return stop("expected_identifier_a");
                        }
                        param = token_nxt;
                        list.push(param);
                        advance();
                        signature.push(param.id);
                        if (ellipsis) {
                            param.ellipsis = true;
                        } else {
                            if (token_nxt.id === "=") {
                                optional = param;
                                advance("=");
                                param.expression = parse_expression(0);
                            } else {
                                if (optional !== undefined) {

// cause: "function aa(aa=0,bb){}"

                                    warn(
                                        "required_a_optional_b",
                                        param,
                                        param.id,
                                        optional.id
                                    );
                                }
                            }
                            if (token_nxt.id === ",") {
                                advance(",");
                                signature.push(", ");
                                return parameter();
                            }
                        }
                    }
                }());
            }
            advance(")");
            signature.push(")");
            return [list, signature.join("")];
        }

        function do_function(the_function) {
            let name = the_function && the_function.name;
            if (the_function === undefined) {
                the_function = token_now;

// A function statement must have a name that will be in the parent's scope.

                if (the_function.arity === "statement") {
                    if (!token_nxt.identifier) {

// cause: "function(){}"
// cause: "function*aa(){}"

                        return stop("expected_identifier_a", token_nxt);
                    }
                    name = token_nxt;
                    enroll(name, "variable", true);
                    the_function.name = Object.assign(name, {
                        calls: empty(),
                        init: true
                    });
                    advance();
                } else if (name === undefined) {

// A function expression may have an optional name.

                    the_function.name = anon;
                    if (token_nxt.identifier) {
                        name = token_nxt;
                        the_function.name = name;
                        advance();
                    }
                }
            }
            the_function.level = functionage.level + 1;
            assert_or_throw(!mode_mega, `Expected !mode_mega.`);
//  Probably deadcode.
//  if (mode_mega) {
//      warn("unexpected_a", the_function);
//  }

// Don't create functions in loops. It is inefficient, and it can lead to
// scoping errors.

            if (functionage.loop > 0) {

// cause: "while(0){aa.map(function(){});}"

                warn("function_in_loop", the_function);
            }

// Give the function properties for storing its names and for observing the
// depth of loops and switches.

            Object.assign(the_function, {
                async: the_function.async || 0,
                context: empty(),
                finally: 0,
                loop: 0,
                switch: 0,
                try: 0
            });

// Push the current function context and establish a new one.

            function_stack.push(functionage);
            function_array.push(the_function);
            functionage = the_function;
            if (
                the_function.arity !== "statement"
                && typeof name === "object"
            ) {

// cause: "let aa=function bb(){return;};"

                enroll(name, "function", true);
                name.dead = false;
                name.init = true;
                name.used = 1;
            }

// Parse the parameter list.

            advance("(");

// cause: "function(){}"

            token_now.free = false;
            token_now.arity = "function";
            [functionage.parameters, functionage.signature] = parameter_list();
            functionage.parameters.forEach(function enroll_parameter(name) {
                if (name.identifier) {
                    enroll(name, "parameter", false);
                } else {
                    name.names.forEach(enroll_parameter);
                }
            });

// The function's body is a block.

            the_function.block = block("body");
            if (
                the_function.arity === "statement"
                && token_nxt.line === token_now.line
            ) {

// cause: "function aa(){}0"

                return stop("unexpected_a", token_nxt);
            }
            if (
                token_nxt.id === "."
                || token_nxt.id === "?."
                || token_nxt.id === "["
            ) {

// cause: "function aa(){}\n[]"

                warn("unexpected_a");
            }

// Restore the previous context.

            functionage = function_stack.pop();
            return the_function;
        }

        function do_async() {
            let the_async;
            let the_function;
            the_async = token_now;
            advance("function");
            the_function = Object.assign(token_now, {
                arity: the_async.arity,
                async: 1
            });
            do_function();
            if (the_function.async === 1) {

// cause: "async function aa(){}"

                warn("missing_await_statement", the_function);
            }
            return the_function;
        }

        function do_await() {
            const the_await = token_now;
            if (functionage.async === 0) {

// cause: "await"
// cause: "function aa(){aa=await 0;}"
// cause: "function aa(){await 0;}"

                warn("unexpected_a", the_await);
            } else {
                functionage.async += 1;
            }
            if (the_await.arity === "statement") {
                the_await.block = parse_expression();
                semicolon();
            } else {
                the_await.expression = parse_expression();
            }
            return the_await;
        }

        prefix("async", do_async);
        prefix("await", do_await);
        prefix("function", do_function);

        function fart(pl) {
            let the_fart;
            advance("=>");
            the_fart = token_now;
            the_fart.arity = "binary";
            the_fart.name = "=>";
            the_fart.level = functionage.level + 1;
            function_array.push(the_fart);
            if (functionage.loop > 0) {

// cause: "while(0){aa.map(()=>0);}"

                warn("function_in_loop", the_fart);
            }

// Give the function properties storing its names and for observing the depth
// of loops and switches.

            the_fart.context = empty();
            the_fart.finally = 0;
            the_fart.loop = 0;
            the_fart.switch = 0;
            the_fart.try = 0;

// Push the current function context and establish a new one.

            function_stack.push(functionage);
            functionage = the_fart;
            the_fart.parameters = pl[0];
            the_fart.signature = pl[1];
            the_fart.parameters.forEach(function (name) {

// cause: "(aa)=>{}"

                enroll(name, "parameter", true);
            });
            if (token_nxt.id === "{") {

// cause: "()=>{}"

                warn("expected_a_b", the_fart, "function", "=>");
                the_fart.block = block("body");
            } else {
                the_fart.expression = parse_expression(0);
            }
            functionage = function_stack.pop();
            return the_fart;
        }

        prefix("(", function () {
            const cadet = lookahead().id;
            const the_paren = token_now;
            let the_value;

// We can distinguish between a parameter list for => and a wrapped expression
// with one token of lookahead.

            if (
                token_nxt.id === ")"
                || token_nxt.id === "..."
                || (token_nxt.identifier && (cadet === "," || cadet === "="))
            ) {

// cause: "()=>0"

                the_paren.free = false;
                return fart(parameter_list());
            }

// cause: "(0)"

            the_paren.free = true;
            the_value = parse_expression(0);
            if (the_value.wrapped === true) {

// cause: "((0))"

                warn("unexpected_a", the_paren);
            }
            the_value.wrapped = true;
            advance(")", the_paren);
            if (token_nxt.id === "=>") {
                if (the_value.arity !== "variable") {
                    if (the_value.id === "{" || the_value.id === "[") {

// cause: "([])=>0"
// cause: "({})=>0"

                        warn("expected_a_before_b", the_paren, "function", "(");

// cause: "([])=>0"
// cause: "({})=>0"

                        return stop("expected_a_b", token_nxt, "{", "=>");
                    }

// cause: "(0)=>0"

                    return stop("expected_identifier_a", the_value);
                }
                the_paren.expression = [the_value];
                return fart([the_paren.expression, "(" + the_value.id + ")"]);
            }
            return the_value;
        });
        prefix("`", do_tick);
        prefix("{", function () {
            const seen = empty();
            const the_brace = token_now;
            the_brace.expression = [];
            if (token_nxt.id !== "}") {
                let artifact_now;
                let artifact_nxt = "";

// Parse/loop through each property in {...}.

                while (true) {
                    let extra;
                    let full;
                    let id;
                    let name = token_nxt;
                    let value;
                    advance();
                    artifact_now = artifact_nxt;
                    artifact_nxt = artifact(name);
                    if (
                        !option_object.unordered
                        && artifact_now > artifact_nxt
                    ) {

// cause: "aa={bb,aa}"

                        warn(
                            "expected_a_before_b",
                            name,
                            artifact_nxt,
                            artifact_now
                        );
                    }
                    if (
                        (name.id === "get" || name.id === "set")
                        && token_nxt.identifier
                    ) {
                        if (!option_object.getset) {

// cause: "aa={get aa(){}}"

                            warn("unexpected_a", name);
                        }
                        extra = name.id;
                        full = extra + " " + token_nxt.id;
                        name = token_nxt;
                        advance();
                        id = survey(name);
                        if (seen[full] === true || seen[id] === true) {

// cause: "aa={get aa(){},get aa(){}}"

                            warn("duplicate_a", name);
                        }
                        seen[id] = false;
                        seen[full] = true;
                    } else {
                        id = survey(name);
                        if (typeof seen[id] === "boolean") {

// cause: "aa={aa,aa}"

                            warn("duplicate_a", name);
                        }
                        seen[id] = true;
                    }
                    if (name.identifier) {
                        if (token_nxt.id === "}" || token_nxt.id === ",") {
                            if (typeof extra === "string") {

// cause: "aa={get aa}"

                                advance("(");
                            }
                            value = parse_expression(Infinity, true);
                        } else if (token_nxt.id === "(") {
                            value = do_function({
                                arity: "unary",
                                from: name.from,
                                id: "function",
                                line: name.line,
                                name: (
                                    typeof extra === "string"

// cause: "aa={get aa(){}}"

                                    ? extra

// cause: "aa={aa()}"

                                    : id
                                ),
                                thru: name.from
                            });
                        } else {
                            if (typeof extra === "string") {

// cause: "aa={get aa.aa}"

                                advance("(");
                            }
                            let the_colon = token_nxt;
                            advance(":");
                            value = parse_expression(0);
                            if (
                                value.id === name.id
                                && value.id !== "function"
                            ) {

// cause: "aa={aa:aa}"

                                warn("unexpected_a", the_colon, ": " + name.id);
                            }
                        }
                        value.label = name;
                        if (typeof extra === "string") {
                            value.extra = extra;
                        }
                        the_brace.expression.push(value);
                    } else {

// cause: aa={"aa":0}

                        advance(":");
                        value = parse_expression(0);
                        value.label = name;
                        the_brace.expression.push(value);
                    }
                    if (token_nxt.id !== ",") {
                        break;
                    }

// cause: aa={"aa":0,"bb":0}

                    advance(",");
                }
            }
            advance("}");
            return the_brace;
        });

        stmt(";", function () {

// cause: ";"

            warn("unexpected_a", token_now);
            return token_now;
        });
        stmt("{", function () {

// cause: ";{}"
// cause: "class aa{}"

            warn("naked_block", token_now);
            return block("naked");
        });
        stmt("async", do_async);
        stmt("await", do_await);
        stmt("break", function () {
            const the_break = token_now;
            let the_label;
            if (
                (functionage.loop < 1 && functionage.switch < 1)
                || functionage.finally > 0
            ) {

// cause: "break"

                warn("unexpected_a", the_break);
            }
            the_break.disrupt = true;
            if (token_nxt.identifier && token_now.line === token_nxt.line) {
                the_label = functionage.context[token_nxt.id];
                if (
                    the_label === undefined
                    || the_label.role !== "label"
                    || the_label.dead
                ) {
                    if (the_label !== undefined && the_label.dead) {

// cause: "aa:{function aa(aa){break aa;}}"

                        warn("out_of_scope_a");
                    } else {

// cause: "aa:{break aa;}"

                        warn("not_label_a");
                    }
                } else {
                    the_label.used += 1;
                }
                the_break.label = token_nxt;
                advance();
            }
            advance(";");
            return the_break;
        });

        function do_var() {
            const the_statement = token_now;
            const mode_const = the_statement.id === "const";
            the_statement.names = [];

// A program may use var or let, but not both.

            if (!mode_const) {
                if (mode_var === undefined) {
                    mode_var = the_statement.id;
                } else if (the_statement.id !== mode_var) {

// cause: "let aa;var aa"

                    warn(
                        "expected_a_b",
                        the_statement,
                        mode_var,
                        the_statement.id
                    );
                }
            }

// We don't expect to see variables created in switch statements.

            if (functionage.switch > 0) {

// cause: "switch(0){case 0:var aa}"

                warn("var_switch", the_statement);
            }
            if (functionage.loop > 0 && the_statement.id === "var") {

// cause: "while(0){var aa;}"

                warn("var_loop", the_statement);
            }
            (function next() {
                if (token_nxt.id === "{" && the_statement.id !== "var") {
                    let artifact_now;
                    let artifact_nxt = "";
                    const the_brace = token_nxt;
                    advance("{");
                    (function pair() {
                        if (!token_nxt.identifier) {

// cause: "let {0}"

                            return stop("expected_identifier_a", token_nxt);
                        }
                        const name = token_nxt;
                        survey(name);
                        artifact_now = artifact_nxt;
                        artifact_nxt = artifact(name);
                        if (
                            !option_object.unordered
                            && artifact_now > artifact_nxt
                        ) {

// cause: "let{bb,aa}"

                            warn(
                                "expected_a_before_b",
                                name,
                                artifact_nxt,
                                artifact_now
                            );
                        }
                        advance();
                        if (token_nxt.id === ":") {
                            advance(":");
                            if (!token_nxt.identifier) {

// cause: "let {aa:0}"
// cause: "let {aa:{aa}}"

                                return stop("expected_identifier_a", token_nxt);
                            }
                            token_nxt.label = name;
                            the_statement.names.push(token_nxt);
                            enroll(token_nxt, "variable", mode_const);
                            advance();
                            the_brace.open = true;
                        } else {
                            the_statement.names.push(name);
                            enroll(name, "variable", mode_const);
                        }
                        name.dead = false;
                        name.init = true;
                        if (token_nxt.id === "=") {

// cause: "let {aa=0}"

                            advance("=");
                            name.expression = parse_expression();
                            the_brace.open = true;
                        }
                        if (token_nxt.id === ",") {
                            advance(",");
                            return pair();
                        }
                    }());
                    advance("}");
                    advance("=");
                    the_statement.expression = parse_expression(0);
                } else if (token_nxt.id === "[" && the_statement.id !== "var") {
                    const the_bracket = token_nxt;
                    advance("[");
                    (function element() {
                        let ellipsis;
                        if (token_nxt.id === "...") {
                            ellipsis = true;
                            advance("...");
                        }
                        if (!token_nxt.identifier) {

// cause: "let[]"

                            return stop("expected_identifier_a", token_nxt);
                        }
                        const name = token_nxt;
                        advance();
                        the_statement.names.push(name);
                        enroll(name, "variable", mode_const);
                        name.dead = false;
                        name.init = true;
                        if (ellipsis) {
                            name.ellipsis = true;
                        } else {
                            if (token_nxt.id === "=") {
                                advance("=");
                                name.expression = parse_expression();
                                the_bracket.open = true;
                            }
                            if (token_nxt.id === ",") {
                                advance(",");
                                return element();
                            }
                        }
                    }());
                    advance("]");
                    advance("=");
                    the_statement.expression = parse_expression(0);
                } else if (token_nxt.identifier) {
                    const name = token_nxt;
                    advance();
                    if (name.id === "ignore") {

// cause: "let ignore;function aa(ignore) {}"

                        warn("unexpected_a", name);
                    }
                    enroll(name, "variable", mode_const);
                    if (token_nxt.id === "=" || mode_const) {
                        advance("=");
                        name.dead = false;
                        name.init = true;
                        name.expression = parse_expression(0);
                    }
                    the_statement.names.push(name);
                } else {

// cause: "let 0"
// cause: "var{aa:{aa}}"

                    return stop("expected_identifier_a", token_nxt);
                }
            }());
            semicolon();
            return the_statement;
        }

        stmt("const", do_var);
        stmt("continue", function () {
            const the_continue = token_now;
            if (functionage.loop < 1 || functionage.finally > 0) {

// cause: "continue"
// cause: "function aa(){while(0){try{}finally{continue}}}"

                warn("unexpected_a", the_continue);
            }
            not_top_level(the_continue);
            the_continue.disrupt = true;
            warn("unexpected_a", the_continue);
            advance(";");
            return the_continue;
        });
        stmt("debugger", function () {
            const the_debug = token_now;
            if (!option_object.devel) {

// cause: "debugger"

                warn("unexpected_a", the_debug);
            }
            semicolon();
            return the_debug;
        });
        stmt("delete", function () {
            const the_token = token_now;
            const the_value = parse_expression(0);
            if (
                (the_value.id !== "." && the_value.id !== "[")
                || the_value.arity !== "binary"
            ) {

// cause: "delete 0"

                stop("expected_a_b", the_value, ".", artifact(the_value));
            }
            the_token.expression = the_value;
            semicolon();
            return the_token;
        });
        stmt("do", function () {
            const the_do = token_now;
            not_top_level(the_do);
            functionage.loop += 1;
            the_do.block = block();
            advance("while");
            the_do.expression = condition();
            semicolon();
            if (the_do.block.disrupt === true) {

// cause: "function aa(){do{break;}while(0)}"

                warn("weird_loop", the_do);
            }
            functionage.loop -= 1;
            return the_do;
        });
        stmt("export", function () {
            const the_export = token_now;
            let the_id;
            let the_name;
            let the_thing;

            function export_id() {
                if (!token_nxt.identifier) {

// cause: "export {}"

                    stop("expected_identifier_a");
                }
                the_id = token_nxt.id;
                the_name = global.context[the_id];
                if (the_name === undefined) {

// cause: "export {aa}"

                    warn("unexpected_a");
                } else {
                    the_name.used += 1;
                    if (export_object[the_id] !== undefined) {

// cause: "let aa;export{aa,aa}"

                        warn("duplicate_a");
                    }
                    export_object[the_id] = the_name;
                }
                advance();
                the_export.expression.push(the_thing);
            }

            the_export.expression = [];
            if (token_nxt.id === "default") {
                if (export_object.default !== undefined) {

// cause: "export default 0;export default 0"

                    warn("duplicate_a");
                }
                advance("default");
                the_thing = parse_expression(0);
                if (
                    the_thing.id !== "("
                    || the_thing.expression[0].id !== "."
                    || the_thing.expression[0].expression.id !== "Object"
                    || the_thing.expression[0].name.id !== "freeze"
                ) {

// cause: "export default {}"

                    warn("freeze_exports", the_thing);

// Fixes issues #282 - optional-semicolon.

                } else {

// cause: "export default Object.freeze({})"

                    semicolon();
                }
                export_object.default = the_thing;
                the_export.expression.push(the_thing);
            } else {
                if (token_nxt.id === "function") {

// cause: "export function aa(){}"

                    warn("freeze_exports");
                    the_thing = parse_statement();
                    the_name = the_thing.name;
                    the_id = the_name.id;
                    the_name.used += 1;

// cause: "let aa;export{aa};export function aa(){}"

                    if (export_object[the_id] !== undefined) {
                        warn("duplicate_a", the_name);
                    }
                    export_object[the_id] = the_thing;
                    the_export.expression.push(the_thing);
                    the_thing.statement = false;
                    the_thing.arity = "unary";
                } else if (
                    token_nxt.id === "var"
                    || token_nxt.id === "let"
                    || token_nxt.id === "const"
                ) {

// cause: "export const"
// cause: "export let"
// cause: "export var"

                    warn("unexpected_a", token_nxt);
                    parse_statement();
                } else if (token_nxt.id === "{") {

// cause: "export {}"

                    advance("{");
                    (function loop() {
                        export_id();
                        if (token_nxt.id === ",") {
                            advance(",");
                            return loop();
                        }
                    }());
                    advance("}");
                    semicolon();
                } else {

// cause: "export"

                    stop("unexpected_a");
                }
            }
            mode_module = true;
            return the_export;
        });
        stmt("for", function () {
            const the_for = token_now;
            let first;
            if (!option_object.for) {

// cause: "for"

                warn("unexpected_a", the_for);
            }
            not_top_level(the_for);
            functionage.loop += 1;
            advance("(");

// cause: "for(){}"

            token_now.free = true;
            if (token_nxt.id === ";") {

// cause: "for(;;){}"

                return stop("expected_a_b", the_for, "while (", "for (;");
            }
            if (
                token_nxt.id === "var"
                || token_nxt.id === "let"
                || token_nxt.id === "const"
            ) {

// cause: "for(const aa in aa){}"

                return stop("unexpected_a");
            }
            first = parse_expression(0);
            if (first.id === "in") {
                if (first.expression[0].arity !== "variable") {

// cause: "for(0 in aa){}"

                    warn("bad_assignment_a", first.expression[0]);
                }
                the_for.name = first.expression[0];
                the_for.expression = first.expression[1];
                warn("expected_a_b", the_for, "Object.keys", "for in");
            } else {
                the_for.initial = first;
                advance(";");
                the_for.expression = parse_expression(0);
                advance(";");
                the_for.inc = parse_expression(0);
                if (the_for.inc.id === "++") {

// cause: "for(aa;aa;aa++){}"

                    warn("expected_a_b", the_for.inc, "+= 1", "++");
                }
            }
            advance(")");
            the_for.block = block();
            if (the_for.block.disrupt === true) {

// cause: "/*jslint for*/\nfunction aa(bb,cc){for(0;0;0){break;}}"

                warn("weird_loop", the_for);
            }
            functionage.loop -= 1;
            return the_for;
        });
        stmt("function", do_function);
        stmt("if", function () {
            const the_if = token_now;
            let the_else;
            the_if.expression = condition();
            the_if.block = block();
            if (token_nxt.id === "else") {
                advance("else");
                the_else = token_now;
                the_if.else = (
                    token_nxt.id === "if"

// cause: "if(0){0}else if(0){0}"

                    ? parse_statement()

// cause: "if(0){0}else{0}"

                    : block()
                );
                if (the_if.block.disrupt === true) {
                    if (the_if.else.disrupt === true) {

// cause: "if(0){break;}else{break;}"

                        the_if.disrupt = true;
                    } else {

// cause: "if(0){break;}else{}"

                        warn("unexpected_a", the_else);
                    }
                }
            }
            return the_if;
        });
        stmt("import", function () {
            const the_import = token_now;
            let name;
            if (typeof mode_module === "object") {

// cause: "/*global aa*/\nimport aa from \"aa\""

                warn(
                    "unexpected_directive_a",
                    mode_module,
                    mode_module.directive
                );
            }
            mode_module = true;
            if (token_nxt.identifier) {
                name = token_nxt;
                advance();
                if (name.id === "ignore") {

// cause: "import ignore from \"aa\""

                    warn("unexpected_a", name);
                }
                enroll(name, "variable", true);
                the_import.name = name;
            } else {
                const names = [];
                advance("{");
                if (token_nxt.id !== "}") {
                    while (true) {
                        if (!token_nxt.identifier) {

// cause: "import {"

                            stop("expected_identifier_a");
                        }
                        name = token_nxt;
                        advance();
                        if (name.id === "ignore") {

// cause: "import {ignore} from \"aa\""

                            warn("unexpected_a", name);
                        }
                        enroll(name, "variable", true);
                        names.push(name);
                        if (token_nxt.id !== ",") {
                            break;
                        }
                        advance(",");
                    }
                }
                advance("}");
                the_import.name = names;
            }
            advance("from");
            advance("(string)");
            the_import.import = token_now;
            if (!rx_module.test(token_now.value)) {

// cause: "import aa from \"!aa\""

                warn("bad_module_name_a", token_now);
            }
            import_array.push(token_now.value);
            semicolon();
            return the_import;
        });
        stmt("let", do_var);
        stmt("return", function () {
            const the_return = token_now;
            not_top_level(the_return);
            if (functionage.finally > 0) {

// cause: "function aa(){try{}finally{return;}}"

                warn("unexpected_a", the_return);
            }
            the_return.disrupt = true;
            if (token_nxt.id !== ";" && the_return.line === token_nxt.line) {
                the_return.expression = parse_expression(10);
            }
            advance(";");
            return the_return;
        });
        stmt("switch", function () {
            const the_cases = [];
            const the_switch = token_now;
            let dups = [];
            let last;
            let stmts;
            let the_disrupt = true;
            not_top_level(the_switch);
            if (functionage.finally > 0) {

// cause: "function aa(){try{}finally{switch(0){}}}"

                warn("unexpected_a", the_switch);
            }
            functionage.switch += 1;
            advance("(");

// cause: "switch(){}"

            token_now.free = true;
            the_switch.expression = parse_expression(0);
            the_switch.block = the_cases;
            advance(")");
            advance("{");
            (function major() {
                const the_case = token_nxt;
                the_case.arity = "statement";
                the_case.expression = [];
                (function minor() {
                    advance("case");
                    token_now.switch = true;
                    const exp = parse_expression(0);
                    if (dups.some(function (thing) {
                        return are_similar(thing, exp);
                    })) {

// cause: "switch(0){case 0:break;case 0:break}"

                        warn("unexpected_a", exp);
                    }
                    dups.push(exp);
                    the_case.expression.push(exp);
                    advance(":");
                    if (token_nxt.id === "case") {
                        return minor();
                    }
                }());
                stmts = parse_statements();
                if (stmts.length < 1) {

// cause: "switch(0){case 0:}"

                    warn("expected_statements_a");
                    return;
                }
                the_case.block = stmts;
                the_cases.push(the_case);
                last = stmts[stmts.length - 1];
                if (last.disrupt) {
                    if (last.id === "break" && last.label === undefined) {
                        the_disrupt = false;
                    }
                } else {
                    warn(
                        "expected_a_before_b",
                        token_nxt,
                        "break;",
                        artifact(token_nxt)
                    );
                }
                if (token_nxt.id === "case") {
                    return major();
                }
            }());
            dups = undefined;
            if (token_nxt.id === "default") {
                const the_default = token_nxt;
                advance("default");
                token_now.switch = true;
                advance(":");
                the_switch.else = parse_statements();
                if (the_switch.else.length < 1) {

// cause: "switch(0){case 0:break;default:}"

                    warn("unexpected_a", the_default);
                    the_disrupt = false;
                } else {
                    const the_last = the_switch.else[
                        the_switch.else.length - 1
                    ];
                    if (
                        the_last.id === "break"
                        && the_last.label === undefined
                    ) {

// cause: "switch(0){case 0:break;default:break;}"

                        warn("unexpected_a", the_last);
                        the_last.disrupt = false;
                    }
                    the_disrupt = the_disrupt && the_last.disrupt;
                }
            } else {
                the_disrupt = false;
            }
            advance("}", the_switch);
            functionage.switch -= 1;
            the_switch.disrupt = the_disrupt;
            return the_switch;
        });
        stmt("throw", function () {
            const the_throw = token_now;
            the_throw.disrupt = true;
            the_throw.expression = parse_expression(10);
            semicolon();
            if (functionage.try > 0) {

// cause: "try{throw 0}catch(){}"

                warn("unexpected_a", the_throw);
            }
            return the_throw;
        });
        stmt("try", function () {
            const the_try = token_now;
            let ignored;
            let the_catch;
            let the_disrupt;
            if (functionage.try > 0) {

// cause: "try{try{}catch(){}}catch(){}"

                warn("unexpected_a", the_try);
            }
            functionage.try += 1;
            the_try.block = block();
            the_disrupt = the_try.block.disrupt;
            if (token_nxt.id === "catch") {
                advance("catch");
                the_catch = token_nxt;
                the_catch.context = empty();
                the_catch.async = functionage.async;
                the_try.catch = the_catch;

// Create new function-scope for catch-parameter.

                function_stack.push(functionage);
                functionage = the_catch;
                ignored = "ignore";
                if (token_nxt.id === "(") {
                    advance("(");
                    if (!token_nxt.identifier) {

// cause: "try{}catch(){}"

                        return stop("expected_identifier_a", token_nxt);
                    }
                    if (token_nxt.id !== "ignore") {
                        ignored = undefined;
                        the_catch.name = token_nxt;
                        enroll(token_nxt, "exception", true);
                    }
                    advance();
                    advance(")");
                }
                the_catch.block = block(ignored);
                if (the_catch.block.disrupt !== true) {
                    the_disrupt = false;
                }

// Restore previous function-scope after catch-block.

                functionage = function_stack.pop();
                functionage.async = Math.max(
                    functionage.async,
                    the_catch.async
                );
            } else {

// cause: "try{}finally{break;}"

                warn(
                    "expected_a_before_b",
                    token_nxt,
                    "catch",
                    artifact(token_nxt)
                );

            }
            if (token_nxt.id === "finally") {
                functionage.finally += 1;
                advance("finally");
                the_try.else = block();
                the_disrupt = the_try.else.disrupt;
                functionage.finally -= 1;
            }
            the_try.disrupt = the_disrupt;
            functionage.try -= 1;
            return the_try;
        });
        stmt("var", do_var);
        stmt("while", function () {
            const the_while = token_now;
            not_top_level(the_while);
            functionage.loop += 1;
            the_while.expression = condition();
            the_while.block = block();
            if (the_while.block.disrupt === true) {

// cause: "function aa(){while(0){break;}}"

                warn("weird_loop", the_while);
            }
            functionage.loop -= 1;
            return the_while;
        });
        stmt("with", function () {

// cause: "with"

            stop("unexpected_a", token_now);
        });

        ternary("?", ":");

        advance();

// Parsing of JSON is simple:

        if (mode_json) {
            token_tree = (function parse_json() {
                let negative;
                switch (token_nxt.id) {
                case "{":
                    return (function json_object() {
                        const brace = token_nxt;

// Explicit empty-object required to detect "__proto__".

                        const object = empty();
                        const properties = [];
                        brace.expression = properties;
                        advance("{");
                        if (token_nxt.id !== "}") {

// JSON
// Parse/loop through each property in {...}.

                            while (true) {
                                let name;
                                let value;
                                if (token_nxt.quote !== "\"") {

// cause: "{0:0}"

                                    warn(
                                        "unexpected_a",
                                        token_nxt,
                                        token_nxt.quote
                                    );
                                }
                                name = token_nxt;
                                advance("(string)");
                                if (object[token_now.value] !== undefined) {

// cause: "{\"aa\":0,\"aa\":0}"

                                    warn("duplicate_a", token_now);
                                } else if (token_now.value === "__proto__") {

// cause: "{\"__proto__\":0}"

                                    warn("bad_property_a", token_now);
                                } else {
                                    object[token_now.value] = token_now;
                                }
                                advance(":");
                                value = parse_json();
                                value.label = name;
                                properties.push(value);
                                if (token_nxt.id !== ",") {
                                    break;
                                }
                                advance(",");
                            }
                        }
                        advance("}", brace);
                        return brace;
                    }());
                case "[":

// cause: "[]"

                    return (function json_array() {
                        const bracket = token_nxt;
                        const elements = [];
                        bracket.expression = elements;
                        advance("[");
                        if (token_nxt.id !== "]") {
                            while (true) {
                                elements.push(parse_json());
                                if (token_nxt.id !== ",") {

// cause: "[0,0]"

                                    break;
                                }
                                advance(",");
                            }
                        }
                        advance("]", bracket);
                        return bracket;
                    }());
                case "true":
                case "false":
                case "null":

// cause: "[false]"
// cause: "[null]"
// cause: "[true]"

                    advance();
                    return token_now;
                case "(number)":
                    if (!rx_JSON_number.test(token_nxt.value)) {

// cause: "[0x0]"

                        warn("unexpected_a");
                    }
                    advance();
                    return token_now;
                case "(string)":
                    if (token_nxt.quote !== "\"") {

// cause: "['']"

                        warn("unexpected_a", token_nxt, token_nxt.quote);
                    }
                    advance();
                    return token_now;
                case "-":
                    negative = token_nxt;
                    negative.arity = "unary";
                    advance("-");
                    advance("(number)");
                    if (!rx_JSON_number.test(token_now.value)) {

// cause: "[-0x0]"

                        warn("unexpected_a", token_now);
                    }
                    negative.expression = token_now;
                    return negative;
                default:

// cause: "[undefined]"

                    stop("unexpected_a");
                }
            }());
            advance("(end)");
            return;
        }

// Because browsers encourage combining of script files, the first token might
// be a semicolon to defend against a missing semicolon in the preceding file.

        if (option_object.browser) {
            if (token_nxt.id === ";") {
                advance(";");
            }
            token_tree = parse_statements();
            advance("(end)");
            return;
        }

// If we are not in a browser, then the file form of strict pragma may be used.

        if (
            token_nxt.value === "use strict"
        ) {
            advance("(string)");
            advance(";");
        }
        token_tree = parse_statements();
        advance("(end)");
    }


    function phase4_walk() {

// PHASE 4. Walk <token_tree>, traversing all of the nodes of the tree. It is a
//          recursive traversal. Each node may be processed on the way down
//          (preaction) and on the way up (postaction).

// The stack of blocks.
        const block_stack = [];
        const posts = empty();
        const pres = empty();
// The current block.
        let blockage = global;
// The current function.
        let functionage = global;
        let postaction;
        let postamble;
        let preaction;
        let preamble;

// Ambulation of the parse tree.

        function action(when) {

// Produce a function that will register task functions that will be called as
// the tree is traversed.

            return function (arity, id, task) {
                let a_set = when[arity];
                let i_set;

// The id parameter is optional. If excluded, the task will be applied to all
// ids.

                if (typeof id !== "string") {
                    task = id;
                    id = "(all)";
                }

// If this arity has no registrations yet, then create a set object to hold
// them.

                if (a_set === undefined) {
                    a_set = empty();
                    when[arity] = a_set;
                }

// If this id has no registrations yet, then create a set array to hold them.

                i_set = a_set[id];
                if (i_set === undefined) {
                    i_set = [];
                    a_set[id] = i_set;
                }

// Register the task with the arity and the id.

                i_set.push(task);
            };
        }

        function amble(when) {

// Produce a function that will act on the tasks registered by an action
// function while walking the tree.

            return function (the_token) {

// Given a task set that was built by an action function, run all of the
// relevant tasks on the token.

                let a_set = when[the_token.arity];
                let i_set;

// If there are tasks associated with the token's arity...

                if (a_set !== undefined) {

// If there are tasks associated with the token's id...

                    i_set = a_set[the_token.id];
                    if (i_set !== undefined) {
                        i_set.forEach(function (task) {
                            return task(the_token);
                        });
                    }

// If there are tasks for all ids.

                    i_set = a_set["(all)"];
                    if (i_set !== undefined) {
                        i_set.forEach(function (task) {
                            return task(the_token);
                        });
                    }
                }
            };
        }

        function top_level_only(the_thing) {

// Some features must be at the most outermost level.

            if (blockage !== global) {

// cause: "if(0){import aa from \"aa\";}"

                warn("misplaced_a", the_thing);
            }
        }

        function walk_expression(thing) {
            if (thing) {
                if (Array.isArray(thing)) {

// cause: "(function(){}())"
// cause: "0&&0"

                    thing.forEach(walk_expression);
                } else {
                    preamble(thing);
                    walk_expression(thing.expression);
                    if (thing.id === "function") {

// cause: "aa=function(){}"

                        walk_statement(thing.block);
                    }
                    if (thing.arity === "pre" || thing.arity === "post") {

// cause: "aa=++aa"
// cause: "aa=--aa"

                        warn("unexpected_a", thing);
                    } else if (

// cause: "aa=0"

                        thing.arity === "statement"
                        || thing.arity === "assignment"
                    ) {

// cause: "aa[aa=0]"

                        warn("unexpected_statement_a", thing);
                    }
                    postamble(thing);
                }
            }
        }

        function walk_statement(thing) {
            if (thing) {
                if (Array.isArray(thing)) {

// cause: "+[]"

                    thing.forEach(walk_statement);
                } else {
                    preamble(thing);
                    walk_expression(thing.expression);
                    if (thing.arity === "binary") {
                        if (thing.id !== "(") {

// cause: "0&&0"

                            warn("unexpected_expression_a", thing);
                        }
                    } else if (
                        thing.arity !== "statement"
                        && thing.arity !== "assignment"
                        && thing.id !== "import"
                    ) {

// cause: "!0"
// cause: "+[]"
// cause: "+new aa()"
// cause: "0"
// cause: "async function aa(){await 0;}"
// cause: "typeof 0"

                        warn("unexpected_expression_a", thing);
                    }
                    walk_statement(thing.block);
                    walk_statement(thing.else);
                    postamble(thing);
                }
            }
        }

        function lookup(thing) {
            if (thing.arity === "variable") {

// Look up the variable in the current context.

                let the_variable = functionage.context[thing.id];

// If it isn't local, search all the other contexts. If there are name
// collisions, take the most recent.

                if (the_variable === undefined) {
                    function_stack.forEach(function (outer) {
                        const a_variable = outer.context[thing.id];
                        if (
                            a_variable !== undefined
                            && a_variable.role !== "label"
                        ) {
                            the_variable = a_variable;
                        }
                    });

// If it isn't in any of those either, perhaps it is a predefined global.
// If so, add it to the global context.

                    if (the_variable === undefined) {
                        if (global_array[thing.id] === undefined) {

// cause: "aa"
// cause: "class aa{}"
// cause: "let aa=0;try{aa();}catch(bb){bb();}bb();"

                            warn("undeclared_a", thing);
                            return;
                        }
                        the_variable = {
                            dead: false,
                            id: thing.id,
                            init: true,
                            parent: global,
                            role: "variable",
                            used: 0,
                            writable: false
                        };
                        global.context[thing.id] = the_variable;
                    }
                    the_variable.closure = true;
                    functionage.context[thing.id] = the_variable;
                } else if (the_variable.role === "label") {

// cause: "aa:while(0){aa;}"

                    warn("label_a", thing);
                }
                if (
                    the_variable.dead
                    && (
                        the_variable.calls === undefined
                        || functionage.name === undefined
                        || the_variable.calls[functionage.name.id] === undefined
                    )
                ) {

// cause: "function aa(){bb();}\nfunction bb(){}"

                    warn("out_of_scope_a", thing);
                }
                return the_variable;
            }
        }

        function subactivate(name) {
            name.init = true;
            name.dead = false;
            blockage.live.push(name);
        }

        function preaction_function(thing) {

// cause: "()=>0"
// cause: "(function (){}())"
// cause: "function aa(){}"

            if (thing.arity === "statement" && blockage.body !== true) {

// cause: "if(0){function aa(){}\n}"

                warn("unexpected_a", thing);
            }
            function_stack.push(functionage);
            block_stack.push(blockage);
            functionage = thing;
            blockage = thing;
            thing.live = [];
            if (typeof thing.name === "object") {
                thing.name.dead = false;
                thing.name.init = true;
            }
            if (thing.extra === "get") {
                if (thing.parameters.length !== 0) {

// cause: "/*jslint getset*/\naa={get aa(aa){}}"

                    warn("bad_get", thing);
                }
            } else if (thing.extra === "set") {
                if (thing.parameters.length !== 1) {

// cause: "/*jslint getset*/\naa={set aa(){}}"

                    warn("bad_set", thing);
                }
            }
            thing.parameters.forEach(function (name) {
                walk_expression(name.expression);
                if (name.id === "{" || name.id === "[") {
                    name.names.forEach(subactivate);
                } else {
                    name.dead = false;
                    name.init = true;
                }
            });
        }

        function bitwise_check(thing) {

// These are the bitwise operators.

            switch (!option_object.bitwise && thing.id) {
            case "&":
            case "&=":
            case "<<":
            case "<<=":
            case ">>":
            case ">>=":
            case ">>>":
            case ">>>=":
            case "^":
            case "^=":
            case "|":
            case "|=":
            case "~":

// cause: "0&0"
// cause: "0&=0"
// cause: "0<<0"
// cause: "0<<=0"
// cause: "0>>0"
// cause: "0>>=0"
// cause: "0>>>0"
// cause: "0>>>=0"
// cause: "0^0"
// cause: "0^=0"
// cause: "0|0"
// cause: "0|=0"
// cause: "~0"

                warn("unexpected_a", thing);
                break;
            }
            if (
                thing.id !== "("
                && thing.id !== "&&"
                && thing.id !== "||"
                && thing.id !== "="
                && Array.isArray(thing.expression)
                && thing.expression.length === 2
                && (
                    relationop[thing.expression[0].id] === true
                    || relationop[thing.expression[1].id] === true
                )
            ) {

// cause: "0<0<0"

                warn("unexpected_a", thing);
            }
        }

        function pop_block() {
            blockage.live.forEach(function (name) {
                name.dead = true;
            });
            delete blockage.live;
            blockage = block_stack.pop();
        }

        function action_var(thing) {
            thing.names.forEach(function (name) {
                name.dead = false;
                if (name.expression !== undefined) {
                    walk_expression(name.expression);
                    assert_or_throw(
                        !(name.id === "{" || name.id === "["),
                        `Expected !(name.id === "{" || name.id === "[").`
                    );
//          Probably deadcode.
//          if (name.id === "{" || name.id === "[") {
//              name.names.forEach(subactivate);
//          } else {
//              name.init = true;
//          }
                    name.init = true;
                }
                blockage.live.push(name);
            });
        }

        function init_variable(name) {
            const the_variable = lookup(name);
            if (the_variable !== undefined) {
                if (the_variable.writable) {
                    the_variable.init = true;
                    return;
                }
            }
            warn("bad_assignment_a", name);
        }

        function postaction_function(thing) {
            delete functionage.finally;
            delete functionage.loop;
            delete functionage.switch;
            delete functionage.try;
            functionage = function_stack.pop();
            if (thing.wrapped) {

// cause: "aa=(function(){})"

                warn("unexpected_parens", thing);
            }
            return pop_block();
        }

        preaction = action(pres);
        postaction = action(posts);
        preamble = amble(pres);
        postamble = amble(posts);

        preaction("assignment", bitwise_check);
        preaction("binary", bitwise_check);
        preaction("binary", function (thing) {
            if (relationop[thing.id] === true) {
                const left = thing.expression[0];
                const right = thing.expression[1];
                if (left.id === "NaN" || right.id === "NaN") {

// cause: "NaN===NaN"

                    warn("number_isNaN", thing);
                } else if (left.id === "typeof") {
                    if (right.id !== "(string)") {
                        if (right.id !== "typeof") {

// cause: "typeof 0===0"

                            warn("expected_string_a", right);
                        }
                    } else {
                        const value = right.value;
                        if (value === "null" || value === "undefined") {

// cause: "typeof aa===\"undefined\""

                            warn("unexpected_typeof_a", right, value);
                        } else if (
                            value !== "boolean"
                            && value !== "function"
                            && value !== "number"
                            && value !== "object"
                            && value !== "string"
                            && value !== "symbol"
                        ) {

// cause: "typeof 0===\"aa\""

                            warn("expected_type_string_a", right, value);
                        }
                    }
                }
            }
        });
        preaction("binary", "==", function (thing) {

// cause: "0==0"

            warn("expected_a_b", thing, "===", "==");
        });
        preaction("binary", "!=", function (thing) {

// cause: "0!=0"

            warn("expected_a_b", thing, "!==", "!=");
        });
        preaction("binary", "=>", preaction_function);
        preaction("binary", "||", function (thing) {
            thing.expression.forEach(function (thang) {
                if (thang.id === "&&" && !thang.wrapped) {

// cause: "0&&0||0"

                    warn("and", thang);
                }
            });
        });
        preaction("binary", "(", function (thing) {
            const left = thing.expression[0];
            if (
                left.identifier
                && functionage.context[left.id] === undefined
                && typeof functionage.name === "object"
            ) {
                const parent = functionage.name.parent;
                if (parent) {
                    const left_variable = parent.context[left.id];
                    if (
                        left_variable !== undefined
                        && left_variable.dead
                        && left_variable.parent === parent
                        && left_variable.calls !== undefined
                        && left_variable.calls[functionage.name.id]
                        !== undefined
                    ) {
                        left_variable.dead = false;
                    }
                }
            }
        });
        preaction("binary", "in", function (thing) {

// cause: "aa in aa"

            warn("infix_in", thing);
        });
        preaction("binary", "instanceof", function (thing) {

// cause: "0 instanceof 0"

            warn("unexpected_a", thing);
        });
        preaction("statement", "{", function (thing) {
            block_stack.push(blockage);
            blockage = thing;
            thing.live = [];
        });
        preaction("statement", "for", function (thing) {
            if (thing.name !== undefined) {
                const the_variable = lookup(thing.name);
                if (the_variable !== undefined) {
                    the_variable.init = true;
                    if (!the_variable.writable) {

// cause: "const aa=0;for(aa in aa){}"

                        warn("bad_assignment_a", thing.name);
                    }
                }
            }
            walk_statement(thing.initial);
        });
        preaction("statement", "function", preaction_function);
        preaction("statement", "try", function (thing) {
            if (thing.catch !== undefined) {

// Create new function-scope for catch-parameter.

                function_stack.push(functionage);
                functionage = thing.catch;
            }
        });
        preaction("unary", "~", bitwise_check);
        preaction("unary", "function", preaction_function);
        preaction("variable", function (thing) {
            const the_variable = lookup(thing);
            if (the_variable !== undefined) {
                thing.variable = the_variable;
                the_variable.used += 1;
            }
        });

        postaction("assignment", "+=", function (thing) {
            let right = thing.expression[1];
            if (right.constant) {
                if (
                    right.value === ""
                    || (right.id === "(number)" && right.value === "0")
                    || right.id === "(boolean)"
                    || right.id === "null"
                    || right.id === "undefined"
                    || Number.isNaN(right.value)
                ) {
                    warn("unexpected_a", right);
                }
            }
        });
        postaction("assignment", function (thing) {

// Assignment using = sets the init property of a variable. No other assignment
// operator can do this. A = token keeps that variable (or array of variables
// in case of destructuring) in its name property.

            const lvalue = thing.expression[0];
            if (thing.id === "=") {
                if (thing.names !== undefined) {

// cause: "if(0){aa=0}"

                    assert_or_throw(
                        !Array.isArray(thing.names),
                        `Expected !Array.isArray(thing.names).`
                    );
//          Probably deadcode.
//          if (Array.isArray(thing.names)) {
//              thing.names.forEach(init_variable);
//          } else {
//              init_variable(thing.names);
//          }
                    init_variable(thing.names);
                } else {
                    if (lvalue.id === "[" || lvalue.id === "{") {
                        lvalue.expression.forEach(function (thing) {
                            if (thing.variable) {
                                thing.variable.init = true;
                            }
                        });
                    } else if (
                        lvalue.id === "."
                        && thing.expression[1].id === "undefined"
                    ) {

// cause: "aa.aa=undefined"

                        warn(
                            "expected_a_b",
                            lvalue.expression,
                            "delete",
                            "undefined"
                        );
                    }
                }
            } else {
                if (lvalue.arity === "variable") {
                    if (!lvalue.variable || lvalue.variable.writable !== true) {
                        warn("bad_assignment_a", lvalue);
                    }
                }
                const right = syntax_object[thing.expression[1].id];
                if (
                    right !== undefined
                    && (
                        right.id === "function"
                        || right.id === "=>"
                        || (
                            right.constant
                            && right.id !== "(number)"
                            && (right.id !== "(string)" || thing.id !== "+=")
                        )
                    )
                ) {

// cause: "aa+=undefined"

                    warn("unexpected_a", thing.expression[1]);
                }
            }
        });

        postaction("binary", function (thing) {
            let right;
            if (relationop[thing.id]) {
                if (
                    is_weird(thing.expression[0])
                    || is_weird(thing.expression[1])
                    || are_similar(thing.expression[0], thing.expression[1])
                    || (
                        thing.expression[0].constant === true
                        && thing.expression[1].constant === true
                    )
                ) {

// cause: "if(0===0){0}"

                    warn("weird_relation_a", thing);
                }
            }
            if (thing.id === "+") {
                if (!option_object.convert) {
                    if (thing.expression[0].value === "") {

// cause: "\"\"+0"

                        warn("expected_a_b", thing, "String(...)", "\"\" +");
                    } else if (thing.expression[1].value === "") {

// cause: "0+\"\""

                        warn("expected_a_b", thing, "String(...)", "+ \"\"");
                    }
                }
            } else if (thing.id === "[") {
                if (thing.expression[0].id === "window") {

// cause: "aa=window[0]"

                    warn("weird_expression_a", thing, "window[...]");
                }
                if (thing.expression[0].id === "self") {

// cause: "aa=self[0]"

                    warn("weird_expression_a", thing, "self[...]");
                }
            } else if (thing.id === "." || thing.id === "?.") {
                if (thing.expression.id === "RegExp") {

// cause: "aa=RegExp.aa"

                    warn("weird_expression_a", thing);
                }
            } else if (thing.id !== "=>" && thing.id !== "(") {
                right = thing.expression[1];
                if (
                    (thing.id === "+" || thing.id === "-")
                    && right.id === thing.id
                    && right.arity === "unary"
                    && !right.wrapped
                ) {

// cause: "0- -0"

                    warn("wrap_unary", right);
                }
                if (
                    thing.expression[0].constant === true
                    && right.constant === true
                ) {
                    thing.constant = true;
                }
            }
        });
        postaction("binary", "&&", function (thing) {
            if (
                is_weird(thing.expression[0])
                || are_similar(thing.expression[0], thing.expression[1])
                || thing.expression[0].constant === true
                || thing.expression[1].constant === true
            ) {

// cause: "aa=(``?``:``)&&(``?``:``)"
// cause: "aa=0&&0"
// cause: "aa=`${0}`&&`${0}`"

                warn("weird_condition_a", thing);
            }
        });
        postaction("binary", "||", function (thing) {
            if (
                is_weird(thing.expression[0])
                || are_similar(thing.expression[0], thing.expression[1])
                || thing.expression[0].constant === true
            ) {

// cause: "aa=0||0"

                warn("weird_condition_a", thing);
            }
        });
        postaction("binary", "=>", postaction_function);
        postaction("binary", "(", function (thing) {
            let left = thing.expression[0];
            let the_new;
            let arg;
            if (left.id === "new") {
                the_new = left;
                left = left.expression;
            }
            if (left.id === "function") {
                if (!thing.wrapped) {

// cause: "aa=function(){}()"

                    warn("wrap_immediate", thing);
                }
            } else if (left.identifier) {
                if (the_new !== undefined) {
                    if (
                        left.id[0] > "Z"
                        || left.id === "Boolean"
                        || left.id === "Number"
                        || left.id === "String"
                        || left.id === "Symbol"
                    ) {

// cause: "new Boolean()"
// cause: "new Number()"
// cause: "new String()"
// cause: "new Symbol()"
// cause: "new aa()"

                        warn("unexpected_a", the_new);
                    } else if (left.id === "Function") {
                        if (!option_object.eval) {

// cause: "new Function()"

                            warn("unexpected_a", left, "new Function");
                        }
                    } else if (left.id === "Array") {
                        arg = thing.expression;
                        if (arg.length !== 2 || arg[1].id === "(string)") {

// cause: "new Array()"

                            warn("expected_a_b", left, "[]", "new Array");
                        }
                    } else if (left.id === "Object") {

// cause: "new Object()"

                        warn(
                            "expected_a_b",
                            left,
                            "Object.create(null)",
                            "new Object"
                        );
                    }
                } else {
                    if (
                        left.id[0] >= "A"
                        && left.id[0] <= "Z"
                        && left.id !== "Boolean"
                        && left.id !== "Number"
                        && left.id !== "String"
                        && left.id !== "Symbol"
                    ) {

// cause: "let Aa=Aa()"

                        warn(
                            "expected_a_before_b",
                            left,
                            "new",
                            artifact(left)
                        );
                    }
                }
            } else if (left.id === ".") {
                let cack = the_new !== undefined;
                if (left.expression.id === "Date" && left.name.id === "UTC") {

// cause: "new Date.UTC()"

                    cack = !cack;
                }
                if (rx_cap.test(left.name.id) !== cack) {
                    if (the_new !== undefined) {

// cause: "new Date.UTC()"

                        warn("unexpected_a", the_new);
                    } else {

// cause: "let Aa=Aa.Aa()"

                        warn(
                            "expected_a_before_b",
                            left.expression,
                            "new",
                            left.name.id
                        );
                    }
                }
                if (left.name.id === "getTime") {
                    const paren = left.expression;
                    if (paren.id === "(") {
                        const array = paren.expression;
                        if (array.length === 1) {
                            const new_date = array[0];
                            if (
                                new_date.id === "new"
                                && new_date.expression.id === "Date"
                            ) {

// cause: "new Date().getTime()"

                                warn(
                                    "expected_a_b",
                                    new_date,
                                    "Date.now()",
                                    "new Date().getTime()"
                                );
                            }
                        }
                    }
                }
            }
        });
        postaction("binary", "[", function (thing) {
            if (thing.expression[0].id === "RegExp") {

// cause: "aa=RegExp[0]"

                warn("weird_expression_a", thing);
            }
            if (is_weird(thing.expression[1])) {

// cause: "aa[[0]]"

                warn("weird_expression_a", thing.expression[1]);
            }
        });
        postaction("statement", "{", pop_block);
        postaction("statement", "const", action_var);
        postaction("statement", "export", top_level_only);
        postaction("statement", "for", function (thing) {
            walk_statement(thing.inc);
        });
        postaction("statement", "function", postaction_function);
        postaction("statement", "import", function (the_thing) {
            const name = the_thing.name;
            if (name) {
                if (Array.isArray(name)) {
                    name.forEach(function (name) {
                        name.dead = false;
                        name.init = true;
                        blockage.live.push(name);
                    });
                } else {
                    name.dead = false;
                    name.init = true;
                    blockage.live.push(name);
                }
                return top_level_only(the_thing);
            }
        });
        postaction("statement", "let", action_var);
        postaction("statement", "try", function (thing) {
            if (thing.catch !== undefined) {
                const the_name = thing.catch.name;
                if (the_name !== undefined) {
                    const the_variable = functionage.context[the_name.id];
                    the_variable.dead = false;
                    the_variable.init = true;
                }
                walk_statement(thing.catch.block);

// Restore previous function-scope after catch-block.

                functionage = function_stack.pop();
            }
        });
        postaction("statement", "var", action_var);
        postaction("ternary", function (thing) {
            if (
                is_weird(thing.expression[0])
                || thing.expression[0].constant === true
                || are_similar(thing.expression[1], thing.expression[2])
            ) {
                warn("unexpected_a", thing);
            } else if (are_similar(thing.expression[0], thing.expression[1])) {

// cause: "aa?aa:0"

                warn("expected_a_b", thing, "||", "?");
            } else if (are_similar(thing.expression[0], thing.expression[2])) {

// cause: "aa?0:aa"

                warn("expected_a_b", thing, "&&", "?");
            } else if (
                thing.expression[1].id === "true"
                && thing.expression[2].id === "false"
            ) {

// cause: "aa?true:false"

                warn("expected_a_b", thing, "!!", "?");
            } else if (
                thing.expression[1].id === "false"
                && thing.expression[2].id === "true"
            ) {

// cause: "aa?false:true"

                warn("expected_a_b", thing, "!", "?");
            } else if (
                thing.expression[0].wrapped !== true
                && (
                    thing.expression[0].id === "||"
                    || thing.expression[0].id === "&&"
                )
            ) {

// cause: "(aa&&!aa?0:1)"

                warn("wrap_condition", thing.expression[0]);
            }
        });
        postaction("unary", function (thing) {
            if (thing.id === "`") {
                if (thing.expression.every(function (thing) {
                    return thing.constant;
                })) {
                    thing.constant = true;
                }
            } else if (thing.id === "!") {
                if (thing.expression.constant === true) {
                    warn("unexpected_a", thing);
                }
            } else if (thing.id === "!!") {
                if (!option_object.convert) {

// cause: "!!0"

                    warn("expected_a_b", thing, "Boolean(...)", "!!");
                }
            } else if (
                thing.id !== "["
                && thing.id !== "{"
                && thing.id !== "function"
                && thing.id !== "new"
            ) {
                if (thing.expression.constant === true) {
                    thing.constant = true;
                }
            }
        });
        postaction("unary", "function", postaction_function);
        postaction("unary", "+", function (thing) {
            const right = thing.expression;
            if (!option_object.convert) {

// cause: "aa=+0"

                warn("expected_a_b", thing, "Number(...)", "+");
            }
            if (right.id === "(" && right.expression[0].id === "new") {
                warn("unexpected_a_before_b", thing, "+", "new");
            } else if (
                right.constant
                || right.id === "{"
                || (right.id === "[" && right.arity !== "binary")
            ) {
                warn("unexpected_a", thing, "+");
            }
        });

        walk_statement(token_tree);
    }


    function phase5_whitage() {

// PHASE 5. Check whitespace between tokens in <token_array>.

        let closer = "(end)";

// free = false

// cause: "()=>0"
// cause: "aa()"
// cause: "aa(0,0)"
// cause: "function(){}"

        let free = false;

// cause: "(0)"
// cause: "(aa)"
// cause: "aa(0)"
// cause: "do{}while()"
// cause: "for(){}"
// cause: "if(){}"
// cause: "switch(){}"
// cause: "while(){}"

        // let free = true;

        let left = global;
        let margin = 0;
        let nr_comments_skipped = 0;
        let open = true;
        let opening = true;
        let right;

        function expected_at(at) {
            assert_or_throw(
                !(right === undefined),
                `Expected !(right === undefined).`
            );
//      Probably deadcode.
//      if (right === undefined) {
//          right = token_nxt;
//      }
            warn(
                "expected_a_at_b_c",
                right,
                artifact(right),

// Fudge column numbers in warning message.

                at + line_fudge,
                right.from + line_fudge
            );
        }

        function at_margin(fit) {
            const at = margin + fit;
            if (right.from !== at) {
                return expected_at(at);
            }
        }

        function delve(the_function) {
            Object.keys(the_function.context).forEach(function (id) {
                if (id !== "ignore") {
                    const name = the_function.context[id];
                    if (name.parent === the_function) {

// cause: "let aa=function bb(){return;};"

                        if (
                            name.used === 0
                            && assert_or_throw(
                                name.role !== "function",
                                `Expected name.role !== "function".`
                            )
//                  Probably deadcode.
//                  && (
//                      name.role !== "function"
//                      || name.parent.arity !== "unary"
//                  )
                        ) {

// cause: "/*jslint node*/\nlet aa;"
// cause: "function aa(aa){return;}"

                            warn("unused_a", name);
                        } else if (!name.init) {

// cause: "/*jslint node*/\nlet aa;aa();"

                            warn("uninitialized_a", name);
                        }
                    }
                }

// cause: "function aa(ignore){return;}"

            });
        }

        function no_space() {
            if (left.line === right.line) {

// from:
//                  if (left.line === right.line) {
//                      no_space();
//                  } else {

                if (left.thru !== right.from && nr_comments_skipped === 0) {

// cause: "let aa = aa( );"

                    warn(
                        "unexpected_space_a_b",
                        right,
                        artifact(left),
                        artifact(right)
                    );
                }
            } else {

// from:
//                  } else if (
//                      right.arity === "binary"
//                      && right.id === "("
//                      && free
//                  ) {
//                      no_space();
//                  } else if (

                assert_or_throw(open, `Expected open.`);
                assert_or_throw(free, `Expected free.`);
//          Probably deadcode.
//          if (open) {
//              const at = (
//                  free
//                  ? margin
//                  : margin + 8
//              );
//              if (right.from < at) {
//                  expected_at(at);
//              }
//          } else {
//              if (right.from !== margin + 8) {
//                  expected_at(margin + 8);
//              }
//          }
                if (right.from < margin) {

// cause:
// let aa = aa(
//     aa
// ()
// );

                    expected_at(margin);
                }
            }
        }

        function no_space_only() {
            if (
                left.id !== "(global)"
                && left.nr + 1 === right.nr
                && (
                    left.line !== right.line
                    || left.thru !== right.from
                )
            ) {
                warn(
                    "unexpected_space_a_b",
                    right,
                    artifact(left),
                    artifact(right)
                );
            }
        }

        function one_space() {
            if (left.line === right.line || !open) {
                if (left.thru + 1 !== right.from && nr_comments_skipped === 0) {
                    warn(
                        "expected_space_a_b",
                        right,
                        artifact(left),
                        artifact(right)
                    );
                }
            } else {
                if (right.from !== margin) {
                    expected_at(margin);
                }
            }
        }

        function one_space_only() {
            if (left.line !== right.line || left.thru + 1 !== right.from) {
                warn(
                    "expected_space_a_b",
                    right,
                    artifact(left),
                    artifact(right)
                );
            }
        }

        function pop() {
            const previous = function_stack.pop();
            closer = previous.closer;
            free = previous.free;
            margin = previous.margin;
            open = previous.open;
            opening = previous.opening;
        }

        function push() {
            function_stack.push({
                closer,
                free,
                margin,
                open,
                opening
            });
        }

// Delve into the functions looking for variables that were not initialized
// or used. If the file imports or exports, then its global object is also
// delved.

//      uninitialized_and_unused();
        if (mode_module === true || option_object.node) {
            delve(global);
        }
        function_array.forEach(delve);

        if (option_object.white) {
            return;
        }

// Go through the token list, looking at usage of whitespace.

//      whitage();
        function_stack = [];
        token_array.forEach(function (the_token) {
            right = the_token;
            if (right.id === "(comment)" || right.id === "(end)") {
                nr_comments_skipped += 1;
            } else {

// If left is an opener and right is not the closer, then push the previous
// state. If the token following the opener is on the next line, then this is
// an open form. If the tokens are on the same line, then it is a closed form.
// Open form is more readable, with each item (statement, argument, parameter,
// etc) starting on its own line. Closed form is more compact. Statement blocks
// are always in open form.

// The open and close pairs.

                switch (left.id) {
                case "${":
                case "(":
                case "[":
                case "{":

// cause: "let aa=("
// cause: "let aa=["
// cause: "let aa=`${"
// cause: "let aa={"

                    assert_or_throw(
                        !(left.id + right.id === "${}"),
                        "Expected !(left.id + right.id === \"${}\")."
                    );
//                  Probably deadcode.
//                  case "${}":
                    switch (left.id + right.id) {
                    case "()":
                    case "[]":
                    case "{}":

// If left and right are opener and closer, then the placement of right depends
// on the openness. Illegal pairs (like '{]') have already been detected.

// cause: "let aa=[];"
// cause: "let aa=aa();"
// cause: "let aa={};"

                        if (left.line === right.line) {

// cause: "let aa = aa( );"

                            no_space();
                        } else {

// cause: "let aa = aa(\n );"

                            at_margin(0);
                        }
                        break;
                    default:

// cause: "let aa=(0"
// cause: "let aa=[0"
// cause: "let aa=`${0"
// cause: "let aa={0"

                        opening = left.open || (left.line !== right.line);
                        push();
                        switch (left.id) {
                        case "${":
                            closer = "}";
                            break;
                        case "(":
                            closer = ")";
                            break;
                        case "[":
                            closer = "]";
                            break;
                        case "{":
                            closer = "}";
                            break;
                        }
                        if (opening) {

// cause: "function aa(){\nreturn;\n}"
// cause: "let aa=(\n0\n)"
// cause: "let aa=[\n0\n]"
// cause: "let aa=`${\n0\n}`"

                            free = closer === ")" && left.free;
                            open = true;
                            margin += 4;
                            if (right.role === "label") {
                                if (right.from !== 0) {

// cause:
// function aa() {
//  bb:
//     while (aa) {
//         if (aa) {
//             break bb;
//         }
//     }
// }

                                    expected_at(0);
                                }
                            } else if (right.switch) {
                                at_margin(-4);
                            } else {
                                at_margin(0);
                            }
                        } else {
                            if (right.statement || right.role === "label") {

// cause:
// function aa() {bb:
//     while (aa) {aa();
//     }
// }

                                warn(
                                    "expected_line_break_a_b",
                                    right,
                                    artifact(left),
                                    artifact(right)
                                );
                            }

// cause: "${0}"
// cause: "(0)"
// cause: "[0]"
// cause: "{0}"

                            free = false;
                            open = false;

// cause: "let aa = ( 0 );"

                            no_space_only();
                        }
                    }
                    break;
                default:
                    if (right.statement === true) {
                        if (left.id === "else") {

// cause:
// let aa = 0;
// if (aa) {
//     aa();
// } else  if (aa) {
//     aa();
// }

                            one_space_only();
                        } else {

// cause: " let aa = 0;"

                            at_margin(0);
                            open = false;
                        }

// If right is a closer, then pop the previous state.

                    } else if (right.id === closer) {
                        pop();
                        if (opening && right.id !== ";") {
                            at_margin(0);
                        } else {
                            no_space_only();
                        }
                    } else {

// Left is not an opener, and right is not a closer.
// The nature of left and right will determine the space between them.

// If left is ',' or ';' or right is a statement then if open,
// right must go at the margin, or if closed, a space between.

                        if (right.switch) {
                            at_margin(-4);
                        } else if (right.role === "label") {
                            if (right.from !== 0) {

// cause:
// function aa() {
//     aa();cc:
//     while (aa) {
//         if (aa) {
//             break cc;
//         }
//     }
// }

                                expected_at(0);
                            }
                        } else if (left.id === ",") {
                            if (!open || (
                                (free || closer === "]")
                                && left.line === right.line
                            )) {

// cause: "let {aa,bb} = 0;"

                                one_space();
                            } else {

// cause:
// function aa() {
//     aa(
//         0,0
//     );
// }

                                at_margin(0);
                            }

// If right is a ternary operator, line it up on the margin.

                        } else if (right.arity === "ternary") {
                            if (open) {

// cause:
// let aa = (
//     aa
//     ? 0
// : 1
// );

                                at_margin(0);
                            } else {

// cause: "let aa = (aa ? 0 : 1);"

                                warn("use_open", right);
                            }
                        } else if (
                            right.arity === "binary"
                            && right.id === "("
                            && free
                        ) {

// cause:
// let aa = aa(
//     aa
// ()
// );

                            no_space();
                        } else if (
                            left.id === "."
                            || left.id === "?."
                            || left.id === "..."
                            || right.id === ","
                            || right.id === ";"
                            || right.id === ":"
                            || (
                                right.arity === "binary"
                                && (right.id === "(" || right.id === "[")
                            )
                            || (
                                right.arity === "function"
                                && left.id !== "function"
                            )
                        ) {

// cause: "let aa = 0 ;"

                            no_space_only();
                        } else if (right.id === "." || right.id === "?.") {

// cause: "let aa = aa ?.aa;"

                            no_space_only();
                        } else if (left.id === ";") {

// cause:
// /*jslint for*/
// function aa() {
//     for (
//         aa();
// aa;
//         aa()
//     ) {
//         aa();
//     }
// }

                            if (open) {
                                at_margin(0);
                            }
                        } else if (
                            left.arity === "ternary"
                            || left.id === "case"
                            || left.id === "catch"
                            || left.id === "else"
                            || left.id === "finally"
                            || left.id === "while"
                            || left.id === "await"
                            || right.id === "catch"
                            || right.id === "else"
                            || right.id === "finally"
                            || (right.id === "while" && !right.statement)
                            || (left.id === ")" && right.id === "{")
                        ) {

// cause:
// function aa() {
//     do {
//         aa();
//     } while(aa());
// }

                            one_space_only();
                        } else if (

// There is a space between left and right.

                            spaceop[left.id] === true
                            || spaceop[right.id] === true
                            || (
                                left.arity === "binary"
                                && (left.id === "+" || left.id === "-")
                            )
                            || (
                                right.arity === "binary"
                                && (right.id === "+" || right.id === "-")
                            )
                            || left.id === "function"
                            || left.id === ":"
                            || (
                                (
                                    left.identifier
                                    || left.id === "(string)"
                                    || left.id === "(number)"
                                )
                                && (
                                    right.identifier
                                    || right.id === "(string)"
                                    || right.id === "(number)"
                                )
                            )
                            || (left.arity === "statement" && right.id !== ";")
                        ) {

// cause: "let aa=0;"
// cause:
// let aa={
//     aa:
// 0
// };

                            one_space();
                        } else if (left.arity === "unary" && left.id !== "`") {
                            no_space_only();
                        }
                    }
                }
                nr_comments_skipped = 0;
                delete left.calls;
                delete left.dead;
                delete left.free;
                delete left.init;
                delete left.open;
                delete left.used;
                left = right;
            }
        });
    }

    try {

// tokenize takes a source and produces from it an array of token objects.
// JavaScript is notoriously difficult to tokenize because of the horrible
// interactions between automatic semicolon insertion, regular expression
// literals, and now megastring literals. JSLint benefits from eliminating
// automatic semicolon insertion and nested megastring literals, which allows
// full tokenization to precede parsing.

        option_object = Object.assign(empty(), option_object);
        global_array = Object.assign(empty(), global_array);
        populate(standard, global_array, false);
        Object.keys(option_object).forEach(function (name) {
            if (option_object[name] === true) {
                const allowed = allowed_option[name];
                if (Array.isArray(allowed)) {
                    populate(allowed, global_array, false);
                }
            }
        });

// PHASE 1. Split <source> by newlines into <line_array>.

        phase1_split();

// PHASE 2. Lex <line_array> into <token_array>.

        phase2_lex();

// PHASE 3. Parse <token_array> into <token_tree> using Pratt parsing.

        phase3_parse();

// PHASE 4. Walk <token_tree>, traversing all of the nodes of the tree. It is a
//          recursive traversal. Each node may be processed on the way down
//          (preaction) and on the way up (postaction).

        if (!mode_json) {
            phase4_walk();
        }

// PHASE 5. Check whitespace between tokens in <token_array>.

        if (!mode_json && warning_array.length === 0) {
            phase5_whitage();
        }
        if (!option_object.browser) {
            directives.forEach(function (comment) {
                if (comment.directive === "global") {

// cause: "/*global aa*/"

                    warn("missing_browser", comment);
                }
            });
        }
        if (option_object.test_internal_error) {
            assert_or_throw(undefined, "test_internal_error");
        }
        mode_stop = false;
    } catch (e) {
        e.mode_stop = true;
        e.message = "[JSLint was unable to finish]\n" + e.message;
        if (e.name !== "JSLintError") {
            warning_array.push(Object.assign(e, {
                column: line_fudge,
                line: line_fudge,
                line_source: "",
                stack_trace: e.stack
            }));
        }
    }

// Sort warning_array by mode_stop first, line, column respectively.

    warning_array.sort(function (a, b) {
        return (
            Boolean(b.mode_stop) - Boolean(a.mode_stop)
            || a.line - b.line
            || a.column - b.column
        );

// Update each warning with a formatted_message ready for use by cli.

    }).map(function ({
        column,
        line,
        line_source,
        message,
        stack_trace = ""
    }, ii, list) {
        list[ii].formatted_message = String(
            String(ii + 1).padStart(3, " ")
            + " \u001b[31m" + message + "\u001b[39m"
            + " \u001b[90m\/\/ line " + line + ", column " + column
            + "\u001b[39m\n"
            + ("    " + line_source.trim()).slice(0, 72) + "\n"
            + stack_trace
        ).trim();
    });

    return {
        directives,
        edition,
        exports: export_object,
        froms: import_array,
        functions: function_array,
        global,
        id: "(JSLint)",
        json: mode_json,
        lines: line_array,
        module: mode_module === true,
        ok: warning_array.length === 0 && !mode_stop,
        option: option_object,
        property,
        shebang: (
            mode_shebang
            ? line_array[line_fudge].line_source
            : undefined
        ),
        stop: mode_stop,
        tokens: token_array,
        tree: token_tree,
        warnings: warning_array
    };
}

async function cli({
    console_error,
    file,
    option,
    source
}) {

// This function will run jslint from nodejs-cli.

    const fs = await import("fs");
    const path = await import("path");
    let data;
    let exit_code;

    function string_line_count(code) {

// This function will count number of newlines in <code>.

        let cnt;
        let ii;

// https://jsperf.com/regexp-counting-2/8

        cnt = 0;
        ii = 0;
        while (true) {
            ii = code.indexOf("\n", ii) + 1;
            if (ii === 0) {
                break;
            }
            cnt += 1;
        }
        return cnt;
    }

    function jslint_from_file({
        code,
        file,
        line_offset = 0,
        option = {},
        warnings = []
    }) {
        option = Object.assign(empty(), option, {
            file
        });
        switch ((
            /\.\w+?$|$/m
        ).exec(file)[0]) {
        case ".html":

// Recursively jslint embedded "<script>\n...\n</script>".

            code.replace((
                /^<script>\n([\S\s]*?\n)<\/script>$/gm
            ), function (ignore, match1, ii) {
                jslint_from_file({
                    code: match1,
                    file: file + ".<script>.js",
                    line_offset: string_line_count(code.slice(0, ii)) + 1,
                    option: Object.assign({
                        browser: true
                    }, option)
                });
                return "";
            });
            return;
        case ".md":

// Recursively jslint embedded "```javascript\n...\n```".

            code.replace((
                /^```javascript\n([\S\s]*?\n)```$/gm
            ), function (ignore, match1, ii) {
                jslint_from_file({
                    code: match1,
                    file: file + ".<```javascript>.js",
                    line_offset: string_line_count(code.slice(0, ii)) + 1,
                    option
                });
                return "";
            });
            return;
        case ".sh":

// Recursively jslint embedded "node -e '\n...\n'".

            code.replace((
                /\bnode\u0020.*?-e\u0020'\n([\S\s]*?\n)'/gm
            ), function (ignore, match1, ii) {
                jslint_from_file({
                    code: match1,
                    file: file + ".<node -e>.js",
                    line_offset: string_line_count(code.slice(0, ii)) + 1,
                    option: Object.assign({
                        node: true
                    }, option)
                });
                return "";
            });
            return;
        default:
            warnings = jslint(
                "\n".repeat(line_offset) + code,
                option
            ).warnings;
        }

// Print only first 10 warnings to stderr.

        if (warnings.length > 0) {
            exit_code = 1;
            console_error(
                "\u001b[1mjslint " + file + "\u001b[22m\n"
                + warnings.slice(0, 10).map(function ({
                    formatted_message
                }) {
                    return formatted_message;
                }).join("\n")
            );
        }
    }

    console_error = console_error || console.error;

// Normalize file relative to process.cwd().

    file = path.resolve(file) + "/";
    if (file.startsWith(process.cwd() + "/")) {
        file = file.replace(process.cwd() + "/", "").slice(0, -1) || ".";
    }
    file = file.replace((
        /\\/g
    ), "/").replace((
        /\/$/g
    ), "");
    if (source) {
        jslint_from_file({
            code: source,
            file,
            option
        });
        return;
    }

// cli - jslint directory.

    try {
        data = await fs.promises.readdir(file, "utf8");
    } catch (ignore) {}
    if (data) {
        await Promise.all(data.map(async function (file2) {
            let code;
            let time_start = Date.now();
            file2 = file + "/" + file2;
            switch ((
                /\.\w+?$|$/m
            ).exec(file2)[0]) {
            case ".html":
            case ".js":
            case ".json":
            case ".md":
            case ".mjs":
            case ".sh":
                break;
            default:
                return;
            }
            try {
                code = await fs.promises.readFile(file2, "utf8");
            } catch (ignore) {
                return;
            }
            if (!(
                !(
                    /\b(?:lock|min|raw|rollup)\b/
                ).test(file2) && code && code.length < 1048576
            )) {
                return;
            }
            jslint_from_file({
                code,
                file: file2,
                option
            });
            console_error(
                "jslint - " + (Date.now() - time_start) + "ms - " + file2
            );
        }));
        return exit_code;
    }

// cli - jslint file.

    try {
        data = await fs.promises.readFile(file, "utf8");
    } catch (err) {
        console_error(err);
        return 1;
    }
    jslint_from_file({
        code: data,
        file,
        option
    });
    return exit_code;
}
jslint.cli = Object.freeze(cli);
jslint.jslint = Object.freeze(jslint.bind(undefined));
export default Object.freeze(jslint);

// feature-detect nodejs-cli

if (
    typeof process === "object"

//  uncomment when nodejs v12 is no longer used in ci
//  && typeof process?.versions?.node === "string"

    && process && process.versions
    && typeof process.versions.node === "string"
    && (
        (
            /[\/|\\]jslint\.m?js$/m
        ).test(process.argv[1])
        || process.env.JSLINT_CLI === "1"
    )
) {

// run cli

    cli({
        file: process.argv[2]
    }).then(function (exit_code) {
        process.exit(exit_code);
    });
}
