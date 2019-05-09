// const fs = require('fs');
// const path = require('path');
// const babel = require('babel-core');
// const babelGenerate = require('babel-generator').default;

// function discover(file, all) {
//     const stat = fs.fstatSync(file);
//     if (stat.isDirectory()) {
//         const child = fs.readdirSync(file);
//         for (const c of child) {
//             discover(path.join(file, c), all);
//         }
//     } else {
//         all.push(file);
//     }
// }

// const fileContent = fs.readFileSync('src/universal/store/modules/config.js').toString();

// const result = babel.transform(fileContent, {
//     plugins: [
//         {
//             visitor: {
//                 ImportDeclaration: {
//                     enter(p, state) {
//                         // if (p.node.)
//                         p.remove();
//                     },
//                 },
//                 ObjectProperty: {
//                     exit(p, state) {
//                         if (p.node.key.name === 'actions') p.remove();
//                     },
//                 },
//             },
//         },
//     ],
// });

// const generatedResult = babelGenerate(result.ast);
// console.log(generatedResult.code)
// console.log(result.ast);
