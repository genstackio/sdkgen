import {existsSync} from 'fs';
import {resolve} from 'path';
import {sdk_service_definition} from "../../types";
import AbstractGraphQLSdkSourceCodeGenerator from "../../AbstractGraphQLSdkSourceCodeGenerator";

export class TypescriptGraphqlSdkSourceCodeGenerator extends AbstractGraphQLSdkSourceCodeGenerator {
    public getLanguage() {
        return 'typescript';
    }
    protected async buildDynamicFilesFromServiceDefAndVars(def: sdk_service_definition, vars: any, r: Function) {
        return  {
            'src/index.ts': r,
            'src/Sdk.ts': r,
            'src/BaseSdk.ts': r,
            'src/types/input.ts': r,
            'src/types/model.ts': r,
            'src/config.ts': r,
            'src/queries.ts': r,
            'LICENSE.md': r,
            'package.json': r,
            'README.md': r,
            'tsconfig.json': r,
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
                "build": "tsc",
                "test": "../../node_modules/.bin/jest -c ../../jest.config.js --rootDir=`pwd`"
            },
            standalone: {
                "preversion": "yarn test",
                "version": "yarn --silent build && git add -A .",
                "postversion": "git push && git push --tags",
                "build": "tsc",
                "test": "jest --config jest.config.js"
            }
        };
        return {
            "name": packageName,
            "version": packageVersion,
            "description": packageDescription,
            "license": "ISC",
            "main": "lib/index.js",
            "types": "lib/index.d.ts",
            "directories": {
                "lib": "lib",
                "test": "__tests__"
            },
            "files": [
                "lib"
            ],
            "repository": repository,
            "publishConfig": ('string' === typeof publishConfig) ? (('github' === publishConfig) ? {access: 'restricted', registry: 'https://npm.pkg.github.com/'} : undefined) : publishConfig,
            "scripts": scripts[repoType || 'default'] || scripts['default'],
            "dependencies": {
                "jwt-decode": "^3.1.2",
                '@genstackio/retry': '^0.1.1',
                ...dependencies,
            },
            "peerDependencies": {
                "cross-fetch": "^3.1.5",
                ...peerDependencies,
            },
            "devDependencies": {
                "@babel/core": "^7.18.10",
                "@babel/preset-env": "^7.18.10",
                "@babel/preset-typescript": "^7.18.6",
                "babel-loader": "^8.2.5",
                "cross-fetch": "^3.1.5",
                "source-map-loader": "^4.0.0",
                "jest": "^28.1.3",
                "typescript": "^4.7.4",
                "@types/node": "^16.11.51",
                "@types/jest": "^28.1.7",
                "ts-jest": "^28.0.8",
                "webpack": "^5.74.0",
                ...devDependencies,
            }
        }
    }
    protected async buildStaticFilesFromStaticTemplates(): Promise<{[key: string]: string|true}> {
        return {
            'src/types/index.ts': true,
            '__tests__/index.spec.ts': true,
        };
    }
    mapTypeName(name: string) {
        switch (name) {
            case 'string': return name;
            case 'boolean': return name;
            case 'unknown': return name;
            case 'float': return 'number';
            case 'int': return 'number';
            case 'long': return 'number';
            case 'bigint': return 'number';
            case 'byte': return 'any';
            case 'json': return 'any';
            case 'object': return 'any';
            case 'null': return 'null';
            case 'timestamp': return 'number';
            default: return name;
        }
    }
}

// noinspection JSUnusedGlobalSymbols
export default TypescriptGraphqlSdkSourceCodeGenerator;