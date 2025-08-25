import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import pluginPromise from 'eslint-plugin-promise'
import pluginJsdoc from 'eslint-plugin-jsdoc';


export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs}"],
        plugins: { js, pluginPromise, pluginJsdoc },
        extends: ["js/recommended"],
        languageOptions: {
            globals: { ...globals.browser, ...globals.webextensions, ...globals.jest },
        },
        rules: {
            "no-unused-vars": [
                "error", {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_"
                }],
            // 'jsdoc/require-description': 'warn'
        }
    },
    pluginPromise.configs['flat/recommended'],
    pluginJsdoc.configs['flat/recommended'],
]);
