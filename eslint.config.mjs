import _import from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";
import node from "eslint-plugin-node";
import unicorn from "eslint-plugin-unicorn";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("prettier"), {
    plugins: {
        import: fixupPluginRules(_import),
        jsdoc,
        node,
        unicorn,
        "@typescript-eslint": typescriptEslint,
    },

    files: ["**/*.ts"],

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    settings: {
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"],
        },

        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
                project: ["lib/tsconfig.json", "test/tsconfig.json"],
            },
        },
    },

    rules: {
        "@typescript-eslint/adjacent-overload-signatures": "error",

        "@typescript-eslint/array-type": ["error", {
            default: "array",
        }],

        "@typescript-eslint/ban-types": ["error", {
            types: {
                Object: {
                    message: "Avoid using the `Object` type. Did you mean `object`?",
                },

                Function: {
                    message: "Avoid using the `Function` type. Prefer a specific function type, like `() => void`.",
                },

                Boolean: {
                    message: "Avoid using the `Boolean` type. Did you mean `boolean`?",
                },

                Number: {
                    message: "Avoid using the `Number` type. Did you mean `number`?",
                },

                String: {
                    message: "Avoid using the `String` type. Did you mean `string`?",
                },

                Symbol: {
                    message: "Avoid using the `Symbol` type. Did you mean `symbol`?",
                },

                Buffer: {
                    message: "Do not use Node.js specific Buffer type, use Uint8Array",
                },
            },
        }],

        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/dot-notation": "error",

        "@typescript-eslint/indent": ["error", 2, {
            ObjectExpression: "first",

            FunctionDeclaration: {
                parameters: "first",
            },

            FunctionExpression: {
                parameters: "first",
            },

            SwitchCase: 1,
        }],

        "@typescript-eslint/naming-convention": "off",

        "@typescript-eslint/no-empty-function": ["error", {
            allow: ["constructors"],
        }],

        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-parameter-properties": "off",

        "@typescript-eslint/no-shadow": ["error", {
            hoist: "all",
        }],

        "@typescript-eslint/no-this-alias": "error",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-for-of": "off",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/quotes": ["error", "single"],
        "@typescript-eslint/semi": ["error", "always"],

        "@typescript-eslint/triple-slash-reference": ["error", {
            path: "always",
            types: "prefer-import",
            lib: "always",
        }],

        "@typescript-eslint/unified-signatures": "error",
        "arrow-parens": ["error", "as-needed"],
        "comma-dangle": "error",
        complexity: "off",
        "constructor-super": "error",
        curly: "off",
        "default-case": "off",
        "dot-notation": "error",
        eqeqeq: ["error", "smart"],
        "guard-for-in": "off",

        "id-denylist": [
            "error",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
            "undefined",
        ],

        "id-match": "error",

        "import/no-extraneous-dependencies": ["error", {
            devDependencies: true,
        }],

        "import/no-internal-modules": "off",
        "import/order": "off",

        "import/no-unresolved": ["error", {
            caseSensitiveStrict: true,
        }],

        indent: "off",
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "error",
        "jsdoc/tag-lines": ["error", "never"],
        "max-classes-per-file": "off",

        "max-len": ["error", {
            code: 200,
        }],

        "new-parens": "error",
        "no-bitwise": "off",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "error",
        "no-debugger": "error",
        "no-duplicate-case": "error",
        "no-duplicate-imports": "error",
        "no-empty": "error",
        "no-empty-function": "off",
        "no-eval": "error",
        "no-extra-bind": "error",
        "no-fallthrough": "off",
        "no-invalid-this": "off",
        "no-new-func": "error",
        "no-new-wrappers": "error",
        "no-redeclare": "error",
        "no-return-await": "error",
        "no-restricted-globals": ["error", "Buffer"],

        "no-restricted-imports": ["error", {
            paths: ["node:buffer"],
        }],

        "no-sequences": "error",
        "no-shadow": "off",
        "no-sparse-arrays": "error",
        "no-template-curly-in-string": "error",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "off",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "error",
        "no-unused-labels": "error",
        "no-use-before-define": "off",
        "no-var": "error",
        "node/file-extension-in-import": ["off"],
        "node/no-extraneous-import": "error",
        "object-shorthand": "error",
        "one-var": ["error", "never"],
        "prefer-const": "error",
        "prefer-object-spread": "error",
        "quote-props": ["error", "as-needed"],
        quotes: "off",
        radix: "error",
        semi: "error",
        "space-in-parens": ["error", "never"],

        "spaced-comment": ["error", "always", {
            markers: ["/"],
        }],

        "unicorn/prefer-ternary": "error",
        "use-isnan": "error",
        "valid-typeof": "off",
    },
}];