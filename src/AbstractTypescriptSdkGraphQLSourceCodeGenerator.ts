import AbstractGraphQLSourceCodeGenerator from "./AbstractGraphQLSourceCodeGenerator";
import {
    sdk_definition,
    sdk_definition_files,
    sdk_service_definition,
    sdk_service_definition_ignored_models,
    sdk_service_definition_inputs,
    sdk_service_definition_method_arg,
    sdk_service_definition_models, sdk_service_definition_query_fields,
    sdk_service_definition_type,
    sdk_service_definition_type_field,
    sdk_service_definition_type_fields,
    sdk_service_definition_types,
    sdk_service_type
} from "./types";
import {
    GraphQLEnumType,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLType
} from "graphql";
import {existsSync} from 'fs';
import {resolve} from 'path';

export abstract class AbstractTypescriptSdkGraphQLSourceCodeGenerator extends AbstractGraphQLSourceCodeGenerator {
    protected async configureSdkDefinition(def: sdk_definition): Promise<void> {
        def.templatePath = 'graphql-sdk-typescript';
    }
    protected async buildDynamicFiles(): Promise<sdk_definition_files> {
        const serviceDef = await this.buildSdkServiceDefinition();
        const vars = {
            ...(await this.buildVars()),
            ...serviceDef,
        }
        const r = ({render}) => render(vars);
        return {
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
            defaultEnv: 'prod',
            ...await this.buildDefaultVars(),
        }
        vars['packageJson'] = await this.buildPackageJsonModel(vars);
        return vars;
    }
    protected async buildDefaultVars(): Promise<{[key: string]: any}> {
        return {
        };
    }
    protected async buildPackageJsonModel({packageName, packageVersion, packageDescription, repository, publishConfig, dependencies = {}, peerDependencies = {}, devDependencies = {}}: any): Promise<any> {
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
            "scripts": {
                "build": "tsc",
                "test": "../../node_modules/.bin/jest -c ../../jest.config.js --rootDir=`pwd`"
            },
            "dependencies": {
                "jwt-decode": "^3.1.2",
                ...dependencies,
            },
            "peerDependencies": {
                "cross-fetch": "^3.1.4",
                ...peerDependencies,
            },
            "devDependencies": {
                "@babel/core": "^7.15.5",
                "@babel/preset-env": "^7.15.6",
                "@babel/preset-typescript": "^7.15.0",
                "babel-loader": "^8.2.2",
                "cross-fetch": "^3.1.4",
                "source-map-loader": "^3.0.0",
                ...devDependencies,
            }
        }
    }
    protected async buildStaticFilesFromStaticTemplates(): Promise<{[key: string]: string|true}> {
        return {
            'src/types/index.ts': true,
            'tsconfig.json': true,
            '__tests__/index.spec.ts': true,
        };
    }
    protected async buildSdkServiceDefinition(): Promise<sdk_service_definition> {
        const def: sdk_service_definition = {};
        await this.buildSdkServiceDefinitionTypes(def);
        await this.buildSdkServiceDefinitionModels(def);
        await this.buildSdkServiceDefinitionInputs(def);
        await this.buildSdkServiceDefinitionQueries(def);
        return def;
    }
    protected async buildSdkServiceDefinitionTypes(def: sdk_service_definition): Promise<void> {
        def.types = this.sortObject(Object.entries(this.definition.schema.getTypeMap()).reduce((acc, [k, type]) => {
            acc[k] = {
                ...this.convertGraphQLTypeToType(type as any),
                name: k,
                fields: this.convertGraphQLTypeFields((type as any)._fields),
            };
            return acc;
        }, {} as sdk_service_definition_types));
    }
    protected async buildSdkServiceDefinitionModels(def: sdk_service_definition): Promise<void> {
        def.ignoredModels = [
            'BigInt', 'Boolean', 'Int', 'String', 'Float', 'ID',
        ].reduce((acc, k) => Object.assign(acc, {[k]: true}), {} as sdk_service_definition_ignored_models);
        def.models = this.sortObject(Object.entries(this.definition.schema.getTypeMap()).reduce((acc, [k]) => {
            if (/^.+Input$/.test(k)) return acc;
            acc[k] = def.types![k];
            return acc;
        }, {} as sdk_service_definition_models));
    }
    protected async buildSdkServiceDefinitionInputs(def: sdk_service_definition): Promise<void> {
        def.inputs = this.sortObject(Object.entries(this.definition.schema.getTypeMap()).reduce((acc, [k]) => {
            if (!/^.+Input$/.test(k)) return acc;
            acc[k] = def.types![k]
            return acc;
        }, {} as sdk_service_definition_inputs));
    }
    protected async buildSdkServiceDefinitionQueries(def: sdk_service_definition): Promise<void> {
        def.queries = def.queries || {};
        def.methods = def.methods || {};
        def.types = def.types || {};
        def.requiredModels = def.requiredModels || {};
        await this.buildSdkServiceDefinitionQueryQueries(def);
        await this.buildSdkServiceDefinitionMutationQueries(def);
    }
    protected async buildSdkServiceDefinitionMutationQueries(def: sdk_service_definition): Promise<void> {
        Object.entries(this.definition.schema.getMutationType()._fields).reduce((acc, [name, type]: [string, any]) => {
            def.queries![name] = {
                name,
                type: 'mutation',
                args: (type.args || []).map(arg => ({name: arg.name, ...this.convertGraphQLTypeToArg(arg.type)})),
                fields: this.convertGraphQLTypeFields((type as any).type._fields),
            };
            def.methods![name] = {
                name,
                args: (type.args || []).map(arg => ({name: arg.name, ...this.convertGraphQLTypeToArg(arg.type)})),
                returnType: this.convertGraphQLTypeToReturnType(type.type),
                async: true,
                type: 'mutation',
            };
            ((((def.methods![name] || {}).args) || []) as any[]).filter(a => !a.primitive).forEach(a => {
                def.types![a.type].required = true;
                def.requiredModels![a.type] = {name: a.type};
            })
            if (!def.methods![name].returnType.primitive) {
                def.types![def.methods![name].returnType.type as string].required = true;
                def.requiredModels![def.methods![name].returnType.type as string] = {name: def.methods![name].returnType.type as string};
            }
            return acc;
        }, def);
    }
    protected async buildSdkServiceDefinitionQueryQueries(def: sdk_service_definition): Promise<void> {
        Object.entries(this.definition.schema.getQueryType()._fields).reduce((acc, [name, type]: [string, any]) => {
            def.queries![name] = {
                name,
                type: 'query',
                args: (type.args || []).map(arg => ({name: arg.name, ...this.convertGraphQLTypeToArg(arg.type)})),
                fields: this.convertGraphQLTypeFields((type as any).type._fields),
            };
            def.methods![name] = {
                name,
                args: (type.args || []).map(arg => ({name: arg.name, ...this.convertGraphQLTypeToArg(arg.type)})),
                returnType: this.convertGraphQLTypeToReturnType(type.type),
                async: true,
                type: 'query',
            };
            ((((def.methods![name] || {}).args) || []) as any[]).filter(a => !a.primitive).forEach(a => {
                def.types![a.type].required = true;
                def.requiredModels![a.type] = {name: a.type};
            })
            if (!def.methods![name].returnType.primitive) {
                def.types![def.methods![name].returnType.type as string].required = true;
                def.requiredModels![def.methods![name].returnType.type as string] = {name: def.methods![name].returnType.type as string};
            }
            return acc;
        }, def);
    }
    protected sortObject(o: any) {
        const keys = Object.keys(o);
        keys.sort();
        return keys.reduce((acc, n) => Object.assign(acc, {[n]: o[n]}), {});
    }
    protected convertGraphQLTypeFields(types: {[key: string]: any}): sdk_service_definition_type_fields {
        return this.sortObject(Object.entries(types || {}).reduce((acc2, [kk, vv]) => {
            acc2[kk] = {...this.convertGraphQLTypeToField((vv as any).type), name: kk};
            return acc2;
        }, {} as sdk_service_definition_query_fields))
    }
    protected convertGraphQLTypeToField(type: GraphQLType): Omit<sdk_service_definition_type_field, 'name'> {
        return this.convertGraphQLType(type);
    }
    protected convertGraphQLTypeToArg(type: GraphQLType): Omit<sdk_service_definition_method_arg, 'name'> {
        return this.convertGraphQLType(type);
    }
    protected convertGraphQLTypeToReturnType(type: GraphQLType): Omit<sdk_service_definition_method_arg, 'name'> {
        return this.convertGraphQLType(type);
    }
    protected convertGraphQLTypeToType(type: GraphQLType): Omit<sdk_service_definition_type, 'name'> {
        return this.convertGraphQLType(type);
    }
    protected convertGraphQLType(type: GraphQLType): sdk_service_type {
        switch (true) {
            case type instanceof GraphQLScalarType:
                return this.buildPrimitiveTypeMapping(type as GraphQLScalarType);
            case type instanceof GraphQLEnumType:
                return this.buildEnumTypeMapping(type as GraphQLEnumType);
            case type instanceof GraphQLObjectType:
                return this.buildObjectTypeMapping(type as GraphQLObjectType);
            case type instanceof GraphQLInputObjectType:
                return this.buildInputObjectTypeMapping(type as GraphQLInputObjectType);
            case type instanceof GraphQLNonNull:
                return {...this.convertGraphQLType((type as GraphQLNonNull<any>).ofType), required: true};
            case type instanceof GraphQLList:
                const xxx: any = this.convertGraphQLType((type as GraphQLList<any>).ofType);
                xxx.required && (xxx.subRequired = true);
                return {...xxx, list: true};
            default:
                console.log(`warning: unknown graphql custom type '${(type as any).name}'`);
                return {type: (type as any).name, gqlType: (type as any).name};
        }
    }
    buildPrimitiveTypeMapping(type: GraphQLScalarType): sdk_service_type {
        const mapping = {
            Int: 'number',
            String: 'string',
            BigInt: 'number',
            Boolean: 'boolean',
            Float: 'number',
            ID: 'string',
            unknown: 'unknown',
        };
        if (mapping[type.name]) return {type: mapping[type.name], primitive: true, gqlType: type.name};
        console.warn(`unknown graphql scalar type '${(type as any).name}'`);
        return {type: mapping['unknown'], primitive: true, gqlType: type.name};
    }
    buildEnumTypeMapping(type: GraphQLEnumType): sdk_service_type {
        return {type: type.name, values: type.getValues().map(v => v.value), gqlType: type.name};
    }
    buildObjectTypeMapping(type: GraphQLObjectType): sdk_service_type {
        return {type: type.name, gqlType: type.name, ...((type as any)._fields.length ? {fields: this.convertGraphQLTypeFields((type as any)._fields)} : {})};
    }
    buildInputObjectTypeMapping(type: GraphQLInputObjectType): sdk_service_type {
        return {type: type.name, gqlType: type.name};
    }
}

export default AbstractTypescriptSdkGraphQLSourceCodeGenerator;