import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/integration',workers:1,timeout:30000,retries:0,reporter:[['list'],['json',{outputFile:'evidence/browser-results.json'}]],use:{trace:'off',screenshot:'off',video:'off'}});
