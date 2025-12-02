/**
 * Tree command - Show command hierarchy tree
 */

const { renderTree } = require('../utils/tree');

async function treeCommand() {
    console.log(renderTree());
}

module.exports = treeCommand;
