import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import pluginPromise from 'eslint-plugin-promise'


export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs}"],
        plugins: { js, pluginPromise },
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
        }
    },
    pluginPromise.configs['flat/recommended'],
]);
