#!/usr/bin/env node
// eslint-disable-next-line strict
'use strict';

const fs = require('fs');
const esprima = require('esprima');
const walk = require('esprima-walk');
const colors = require('colors');

/**
 * Load the Abstract Syntax Tree from the javascript file given
 *
 * @param {String} file - The path to the javascript filename
 * @returns {ASTTree} Returns the AST tree
 */
function loadAST(file) {
  try {
    return esprima.parse(
      String(fs.readFileSync(file)),
      { comment: true }
    );

  } catch (e) {
    console.error('Unable to parse source:', e);

    return false;
  }
}

/**
 * Collect all comments from the AST
 *
 * @param {ASTTree} ast - The AST tree
 * @returns {Array<ASTNode>} Returns the comment AST nodes
 */
function loadComments(ast) {
  let comments = [];

  walk(ast, function (node) {
    if (node && node.comments) {
      comments = comments.concat(node.comments);
    }
  });

  return comments;
}

/**
 * Checks if the given comment is accepted
 *
 * @param {String} commentAst - The comment contents
 * @returns {Boolean} Returns `true` if the comment is accepted
 */
function isCommentAccepted(commentAst) {
  const value = commentAst.value;

  // Source map comments are accepted
  if (/^[@#]\s*sourceMappingURL=/.test(value)) {
    return true;
  }

  // Comments that are supposed to be perserved are accepted
  if (/^\*?!/.test(value) || /@(perserve|license)/.test(value)) {
    return true;
  }

  // Otherwise the comment is not accepted
  return false;
}

/**
 * Checks if the specified file is minified by processing the comment
 * nodes in the AST.
 *
 * @param {String} file - The path to the filename to check
 * @returns {Boolean} Returns `true` if the file is minified
 */
function isMinified(file) {
  const ast = loadAST(file);
  if (!ast) {
    return false;
  }

  const comments = loadComments(ast);
  if (comments.length === 0) {
    return true;
  }

  return comments.every(isCommentAccepted);
}

/**
 * Iterate over the command-line arguments (them being file names) and check
 * if the files given are minified.
 */
process.exit(
  process.argv.slice(2).reduce(function (code, file) {
    const isOk = isMinified(file);
    if (isOk) {
      console.error(
        colors.green('PASS') + ': ' + colors.bold(file) + ' is minified'
      );
    } else {
      console.error(
        colors.red('FAIL') + ': ' + colors.bold(file) + ' does not look minified'
      );

      return 1;
    }

    return code;
  }, 0)
);
