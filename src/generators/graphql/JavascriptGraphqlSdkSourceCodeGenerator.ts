import {existsSync} from 'fs';
import {resolve} from 'path';
import {sdk_service_definition} from "../../types";
import AbstractGraphQLSdkSourceCodeGenerator from "../../AbstractGraphQLSdkSourceCodeGenerator";

export class JavascriptGraphqlSdkSourceCodeGenerator extends AbstractGraphQLSdkSourceCodeGenerator {
    public getLanguage() {
        return 'javascript';
    }
    protected async buildDynamicFilesFromServiceDefAndVars(def: sdk_service_definition, vars: any, r: Function) {
        return  {
            'src/index.js': r,
            'src/Sdk.js': r,
            'src/BaseSdk.js': r,
            'src/config.js': r,
            'src/queries.js': r,
            'LICENSE.md': r,
            'package.json': r,
            'README.md': r,
            '.nvmrc': r,
        };
    }
    protected async buildVars(): Promise<{[key: string]: any}> {
        const existingPackageJsonFullPath = `${this.getOptions().target}/package.json`;
        let previousPackageJsonModel = {};
        if (existsSync(existingPackageJsonFullPath)) {
            previousPackageJsonModel = require(resolve(existingPackageJsonFullPath));
        }
        const vars = {
            packageVersion: previousPackageJsonModel['version'] || '0.0.0',
            ...await super.buildVars(),
        }
        vars['packageJson'] = await this.buildPackageJsonModel(vars);
        return vars;
    }
    protected async buildPackageJsonModel({packageName, packageVersion, packageDescription, repository, publishConfig, dependencies = {}, peerDependencies = {}, devDependencies = {}, repoType = 'default'}: any): Promise<any> {
        const scripts = {
            default: {
                "build": "true",
                "test": "../../node_modules/.bin/jest -c ../../jest.config.js --rootDir=`pwd`"
            },
            standalone: {
                "preversion": "yarn test",
                "version": "yarn --silent build && git add -A .",
                "postversion": "git push && git push --tags",
                "build": "true",
                "test": "jest --config jest.config.js"
            }
        };
        return {
            "name": packageName,
            "version": packageVersion,
            "description": packageDescription,
            "license": "ISC",
            "main": "src/index.js",
            "directories": {
                "src": "src",
                "test": "__tests__"
            },
            "files": [
                "src"
            ],
            "repository": repository,
            "publishConfig": ('string' === typeof publishConfig) ? (('github' === publishConfig) ? {access: 'restricted', registry: 'https://npm.pkg.github.com/'} : undefined) : publishConfig,
            "scripts": scripts[repoType || 'default'] || scripts['default'],
            "dependencies": {
                "jwt-decode": "^3.1.2",
                ...dependencies,
            },
            "peerDependencies": {
                "cross-fetch": "^3.1.5",
                ...peerDependencies,
            },
            "devDependencies": {
                "@babel/core": "^7.18.10",
                "@babel/preset-env": "^7.18.10",
                "babel-loader": "^8.2.5",
                "cross-fetch": "^3.1.5",
                "source-map-loader": "^4.0.0",
                "jest": "^28.1.3",
                "webpack": "^5.74.0",
                ...devDependencies,
            }
        }
    }
    protected async buildStaticFilesFromStaticTemplates(): Promise<{[key: string]: string|true}> {
        return {
            '__tests__/index.test.js': true,
        };
    }
}

// noinspection JSUnusedGlobalSymbols
export default JavascriptGraphqlSdkSourceCodeGenerator;