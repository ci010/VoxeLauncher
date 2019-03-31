// http://eslint.org/docs/user-guide/configuring
const path = require('path')
module.exports = {
    root: true,
    // parser: 'babel-eslint',
    parserOptions: {
        parser: "babel-eslint",
        sourceType: 'module'
    },
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        jquery: true,
        node: true
    },
    extends: ['airbnb-base',
        'plugin:vue/recommended'
    ],
    // required to lint *.vue files
    plugins: [
        'html'
    ],
    // check if imports actually resolve
    'settings': {
        'import/resolver': {
            'webpack': {
                'config': 'scripts/webpack.resolve.config.js'
            }
        }
    },
    // add your custom rules here
    'rules': {
        // don't require .vue extension when importing
        'import/extensions': ['error', 'always', {
            'js': 'never',
            'vue': 'never'
        }],
        'vue/valid-v-if': 'error',
        // allow optionalDependencies
        'import/no-extraneous-dependencies': ['error', {
        }],
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "space-before-function-paren": ["warn", "never"],
        "prefer-destructuring": 0,
        "no-console": 0,
        "no-shadow": 0,
        "no-use-before-define": 0,
        "no-await-in-loop": 0,
        "no-alert": 1,
        "func-names": 0,
        "no-underscore-dangle": 0,
        "object-curly-new-line": 0,
        "no-restricted-syntax": 0,
        "no-prototype-builtins": 0,
        "no-param-reassign": 0,
        "global-require": 0,
        "no-trailing-spaces": 0,
        "no-unused-vars": 0,
        "wrap-iife": 0,
        "max-len": 0,
        "no-mixed-operators": 0,
        "no-plusplus": 0,
        "space-before-function-paren": 0,
    }
}
