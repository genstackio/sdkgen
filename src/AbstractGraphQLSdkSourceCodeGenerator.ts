import AbstractCodeGenerator from "./AbstractCodeGenerator";
import fetch from 'cross-fetch';
import {readFileSync} from 'fs';
import {
    code_generator_options,
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
    buildClientSchema,
    GraphQLEnumType,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLType
} from "graphql";

export abstract class AbstractGraphQLSdkSourceCodeGenerator extends AbstractCodeGenerator {
    protected definition: any|undefined;
    protected readonly defaultVars: any;
    protected readonly envs: any;
    constructor({vars, envs = {}, ...options}: code_generator_options & {vars?: any, envs?: any}) {
        super(options);
        this.definition = undefined;
        this.defaultVars = {envs, ...vars};
        this.envs = envs;
    }
    protected buildEndpointFromSource(source: string): string {
        return ((this.envs[source] || this.envs['default'] || {})['graphql'] || 'http://localhost:4000').replace(/\{\{source\}\}/g, source);
    }
    protected async buildDefaultVars(): Promise<{[key: string]: any}> {
        return this.defaultVars;
    }

    protected async fetchSource(): Promise<void> {
        const result = await (await fetch(this.buildEndpointFromSource(this.getOptions().source), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Accept': 'application/json;charset=utf-8',
            },
            body: JSON.stringify({
                operationName: 'IntrospectionQuery',
                variables:{},
                query: readFileSync(`${__dirname}/../resources/introspection.graphql`, 'utf-8'),
            })
        })).json();

        this.definition = {
            introspectionQuery: result.data.__schema,
            schema: buildClientSchema(result.data)
        };
    }
    protected async prepare(): Promise<void> {
        await this.fetchSource();
        await super.prepare();
    }
    abstract getLanguage(): string;
    protected async configureSdkDefinition(def: sdk_definition): Promise<void> {
        def.templatePath = `sdk/graphql/${this.getLanguage()}`;
    }
    protected async buildDynamicFiles(): Promise<sdk_definition_files> {
        const serviceDef = await this.buildSdkServiceDefinition();
        const vars = {
            ...(await this.buildVars()),
            ...serviceDef,
        }
        vars['repoType'] = vars['repoType'] || 'default';
        const r = ({render}) => render(vars);
        return {
            ...(await this.buildDynamicFilesFromServiceDefAndVars(serviceDef, vars, r)),
        };
    }
    protected async buildDynamicFilesFromServiceDefAndVars(def: sdk_service_definition, vars: any, r: Function) {
        return {};
    }
    protected async buildVars(): Promise<{[key: string]: any}> {
        // noinspection UnnecessaryLocalVariableJS
        const vars = {
            defaultEnv: 'prod',
            ...await this.buildDefaultVars(),
        }
        return vars;
    }
    protected async buildStaticFilesFromStaticTemplates(): Promise<{[key: string]: string|true}> {
        return {
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
            'Date', 'Time', 'DateTime', 'Timestamp', 'UtcOffset', 'Duration',
            'ISO8601Duration', 'LocalDate', 'LocalTime', 'LocalEndTime', 'EmailAddress',
            'NegativeFloat', 'NegativeInt', 'NonEmptyString', 'NonNegativeFloat', 'NonNegativeInt',
            'NonPositiveFloat', 'NonPositiveInt', 'PhoneNumber', 'PositiveFloat', 'PositiveInt', 'PostalCode',
            'UnsignedFloat', 'UnsignedInt', 'URL', 'Byte', 'Long', 'SafeInt', 'UUID', 'GUID', 'Hexadecimal',
            'HexColorCode', 'HSL', 'HSLA', 'IPv4', 'IPv6', 'ISBN', 'JWT', 'Latitude', 'Longitude', 'MAC', 'Port',
            'RGB', 'RGBA', 'USCurrency', 'Currency', 'JSON', 'JSONObject', 'IBAN', 'ObjectID', 'Void', 'DID',
            'TimeZone', 'CountryCode', 'Locale', 'RoutingNumber', 'AccountNumber', 'Cuid', 'Upload',
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
    getPrimitiveTypeMapping() {
        return {
            Int: 'number',
            String: 'string',
            BigInt: 'number',
            Boolean: 'boolean',
            Float: 'number',
            ID: 'string',
            unknown: 'unknown',
        };
    }
    buildPrimitiveTypeMapping(type: GraphQLScalarType): sdk_service_type {
        const mapping = this.getPrimitiveTypeMapping();
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

export default AbstractGraphQLSdkSourceCodeGenerator;