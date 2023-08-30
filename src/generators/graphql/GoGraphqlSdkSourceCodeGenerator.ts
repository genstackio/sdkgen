import {
    sdk_service_definition,
    sdk_service_definition_inputs, sdk_service_definition_method, sdk_service_definition_methods,
    sdk_service_definition_models,
    sdk_service_definition_queries,
} from "../../types";
import AbstractGraphQLSdkSourceCodeGenerator from "../../AbstractGraphQLSdkSourceCodeGenerator";

export class GoGraphqlSdkSourceCodeGenerator extends AbstractGraphQLSdkSourceCodeGenerator {
    public getLanguage() {
        return 'go';
    }
    protected async buildDynamicFilesFromServiceDefAndVars(def: sdk_service_definition, vars: any, r: Function) {
        const queriesFileContent = await this.buildQueriesFileContent(def, vars);
        const inputsFileContent = await this.buildInputsFileContent(def, vars);
        const modelsFileContent = await this.buildModelsFileContent(def, vars);
        const responsesFileContent = await this.buildResponsesFileContent(def, vars);
        // @ts-ignore
        const sdkFileContent = await this.buildSdkFileContent(def, vars);
        return {
            'LICENSE.md': r,
            'README.md': r,
            '.gitignore': r,
            'go.mod': r,
            'cli/cli.go': r,
            'cli/commands/all.go': r,
            'queries.go': () => queriesFileContent,
            'types_utils.go': r,
            'types/input.go': () => inputsFileContent,
            'types/model.go': () => modelsFileContent,
            'types/response.go': () => responsesFileContent,
            [`${vars.packageName.replace(/^go/, '')}.go`]: () => sdkFileContent,
            'base_client.go': r,
            'config.go': r,
            'factories.go': r,
            'fields.go': r,
            'graphql.go': r,
            'retriers.go': r,
            'retry.go': r,
            'types.go': r,
            'utils.go': r,
        };
    }
    // noinspection JSUnusedLocalSymbols
    protected async buildResponsesFileContent(def: sdk_service_definition, vars: any) {
        const methods = this.sortMethods(def.methods!);
        return `
package types

${methods.map(([methodName, q]) => this.buildSdkMethodReturnTypeDefinition(methodName, q, def, vars)).join("\n")}
`.trim();
    }

    protected buildSdkMethodBody(q: sdk_service_definition_method, def, vars) {
        switch (q.type) {
            case 'mutation': return this.buildSdkMethodMutationBody(q, def, vars);
            case 'query': return this.buildSdkMethodQueryBody(q, def, vars);
            default: return '';
        }
    }
    protected buildSdkMethodMutationBody(q: sdk_service_definition_method, def, vars) {
        switch (true) {
            case 'delete' === q.name.slice(0, 6):
                return this.buildSdkMethodMutationDeleteBody(q, def, vars);
            case 'create' === q.name.slice(0, 6):
                return this.buildSdkMethodMutationCreateBody(q, def, vars);
            case 'update' === q.name.slice(0, 6):
                return this.buildSdkMethodMutationUpdateBody(q, def, vars);
            default:
                return this.buildSdkMethodMutationGenericBody(q, def, vars);
        }
    }
    protected buildSdkMethodQueryBody(q: sdk_service_definition_method, def, vars) {
        switch (true) {
            case 'get' === q.name.slice(0, 3):
                return this.buildSdkMethodQueryGetBody(q, def, vars);
            case 'find' === q.name.slice(0, 4):
                return this.buildSdkMethodQueryFindBody(q, def, vars);
            default:
                return this.buildSdkMethodQueryGenericBody(q, def, vars);
        }
    }
    protected buildSdkMethodMutationCreateBody(q: sdk_service_definition_method, def, vars) {
        const responseType = this.buildResponseStructNameFromMethod(q.name, vars);
        return `\tvar respData types.${responseType}
\tvariables := map[string]interface{}{${this.generateMapStringInterfaceContentFromArgs(q.args as any)}}
\treturn mutation[types.${responseType}, types.${q.returnType.type}](c, "${q.name}", variables, &respData, func(r *types.${responseType}) *types.${q.returnType.type} {
\t\treturn &r.${q.name.slice(0, 1).toUpperCase()}${q.name.slice(1)}
\t}, fields, "document_creation", map[string]interface{}{
\t\t"params": variables, "type": "${(q.returnType.type || '').slice(0, 1).toLowerCase()}${(q.returnType.type || '').slice(1)}",
\t})`;
    }
    protected buildSdkMethodMutationUpdateBody(q: sdk_service_definition_method, def, vars) {
        const responseType = this.buildResponseStructNameFromMethod(q.name, vars);
        return `\tvar respData types.${responseType}
\tvariables := map[string]interface{}{${this.generateMapStringInterfaceContentFromArgs(q.args as any)}}
\treturn mutation[types.${responseType}, types.${q.returnType.type}](c, "${q.name}", variables, &respData, func(r *types.${responseType}) *types.${q.returnType.type} {
\t\treturn &r.${q.name.slice(0, 1).toUpperCase()}${q.name.slice(1)}
\t}, fields, "document_update", map[string]interface{}{
\t\t"params": variables, "type": "${(q.returnType.type || '').slice(0, 1).toLowerCase()}${(q.returnType.type || '').slice(1)}",
\t})`;
    }
    protected convertVarName(name: string) {
        const map = {
            type: 'typeName',
            query: 'queryDef',
        }
        return map[name || ''] || name;
    }
    protected buildSdkMethodMutationDeleteBody(q: sdk_service_definition_method, def, vars) {
        const responseType = this.buildResponseStructNameFromMethod(q.name, vars);
        return `\tvar respData types.${responseType}
\tvariables := map[string]interface{}{${this.generateMapStringInterfaceContentFromArgs(q.args as any)}}
\treturn mutation[types.${responseType}, types.${q.returnType.type}](c, "${q.name}", variables, &respData, func(r *types.${responseType}) *types.${q.returnType.type} {
\t\treturn &r.${q.name.slice(0, 1).toUpperCase()}${q.name.slice(1)}
\t}, fields, "document_delete", map[string]interface{}{
\t\t"params": variables, "type": "${(q.returnType.type || '').slice(0, 1).toLowerCase()}${(q.returnType.type || '').slice(1)}",
\t})`;
    }
    protected generateMapStringInterfaceContentFromArgs(args: any[]) {
        return `${((args || []) as any[]).map(a => `"${a.name}": ${!a.primitive ? `gomarshall.V(${this.convertVarName(a.name)})` : this.convertVarName(a.name)}`).join(', ')}`;
    }
    protected buildSdkMethodMutationGenericBody(q: sdk_service_definition_method, def, vars) {
        const responseType = this.buildResponseStructNameFromMethod(q.name, vars);
        return `\tvar respData types.${responseType}
\tvariables := map[string]interface{}{${this.generateMapStringInterfaceContentFromArgs(q.args as any)}}
\treturn mutation[types.${responseType}, types.${q.returnType.type}](c, "${q.name}", variables, &respData, func(r *types.${responseType}) *types.${q.returnType.type} {
\t\treturn &r.${q.name.slice(0, 1).toUpperCase()}${q.name.slice(1)}
\t}, fields, "document_update", map[string]interface{}{
\t\t"params": variables,
\t})`;
    }
    protected buildSdkMethodQueryGetBody(q: sdk_service_definition_method, def, vars) {
        const key = ((q.args || []) as any)[0];
        const responseType = this.buildResponseStructNameFromMethod(q.name, vars);
        return `\tvar respData types.${responseType}
\tvariables := map[string]interface{}{${this.generateMapStringInterfaceContentFromArgs(q.args as any)}}
\treturn query[types.${responseType}, types.${q.returnType.type}](c, "${q.name}", variables, &respData, func(r *types.${responseType}) *types.${q.returnType.type} {
\t\treturn &r.${q.name.slice(0, 1).toUpperCase()}${q.name.slice(1)}
\t}, fields, "document_retrieve", map[string]interface{}{
\t\t"params": variables, ${key?.name ? `"key": "${key?.name}", "value": ${this.convertVarName(key?.name)}, ` :''}"type": "${(q.returnType.type || '').slice(0, 1).toLowerCase()}${(q.returnType.type || '').slice(1)}",
\t})`;
    }
    protected buildSdkMethodQueryFindBody(q: sdk_service_definition_method, def, vars) {
        let by = ((q.args || []) as any)[0];
        if (!by || ('offset' === by.name)) by = undefined;
        const responseType = this.buildResponseStructNameFromMethod(q.name, vars);
        return `\tvar respData types.${responseType}
\tvariables := map[string]interface{}{${this.generateMapStringInterfaceContentFromArgs(q.args as any)}}
\treturn query[types.${responseType}, types.${q.returnType.type}](c, "${q.name}", variables, &respData, func(r *types.${responseType}) *types.${q.returnType.type} {
\t\treturn &r.${q.name.slice(0, 1).toUpperCase()}${q.name.slice(1)}
\t}, fields, "documents_find", map[string]interface{}{
\t\t"variables": variables, "type": "${(q.returnType.type || '').slice(0, 1).toLowerCase()}${(q.returnType.type || '').slice(1).replace(/Page$/i, '')}", ${by?.name ? `"by": "${by?.name}",` :''}
\t})`;
    }
    protected buildSdkMethodQueryGenericBody(q: sdk_service_definition_method, def, vars) {
        const responseType = this.buildResponseStructNameFromMethod(q.name, vars);
        return `\tvar respData types.${responseType}
\tvariables := map[string]interface{}{${this.generateMapStringInterfaceContentFromArgs(q.args as any)}}
\treturn query[types.${responseType}, types.${q.returnType.type}](c, "${q.name}", variables, &respData, func(r *types.${responseType}) *types.${q.returnType.type} {
\t\treturn &r.${q.name.slice(0, 1).toUpperCase()}${q.name.slice(1)}
\t}, fields, "documents_find", map[string]interface{}{
\t\t"variables": variables,
\t})`;
    }
    protected buildSdkMethod(methodName, q: sdk_service_definition_method, def, vars) {
        return [
            '//goland:noinspection GoUnusedExportedFunction',
            `func (c *Client) ${this.capitalizeFirstLetter(methodName)}(${this.buildSdkArgs(q.args)}) ${this.buildSdkMethodReturnType(q.returnType)} {`,
            this.buildSdkMethodBody(q, def, vars),
            '}',
        ].join("\n");
    }
    protected async buildSdkFileContent(def: sdk_service_definition, vars: any) {
        const methods = this.sortMethods(def.methods!);
        return `
package ${vars.packageName}

import (
\t"${vars.moduleName}/types"
\t"github.com/genstackio/gomarshall"
)

${methods.map(([methodName, q]) => this.buildSdkMethod(methodName, q, def, vars)).join("\n\n")}
`.trim();
    }

    protected async buildTypesFileContent(def: sdk_service_definition_inputs | sdk_service_definition_models, inputMode = false) {
        return `
package types

${Object.entries(def).map(([_, q]) => {
            return `type ${this.capitalizeFirstLetter(q.name)} struct {
${this.buildTypeFields(q.fields, q.name, "\t", inputMode)}
}`;
        }).join("\n")}
`.trim();
    }
    protected buildFieldsNamesAndTypes(f, builtType, n, nameMaxLength, typeMaxLength, pointerMode = false) {
        switch (true) {
            case f.primitive:
                return `${this.capitalizeFirstLetter(f.name).padEnd(nameMaxLength, ' ')} ${pointerMode ? '*' : ''}${builtType.padEnd(typeMaxLength, ' ')} \`json:"${f.name},omitempty"\``;
            case f.list:
                return `${this.capitalizeFirstLetter(f.name).padEnd(nameMaxLength, ' ')} ${pointerMode ? '*' : ''}${builtType.padEnd(typeMaxLength, ' ')} \`json:"${f.name},omitempty"\``;
            case n === f.gqlType:
                return `${this.capitalizeFirstLetter(f.name).padEnd(nameMaxLength, ' ')} *${builtType.padEnd(typeMaxLength, ' ')} \`json:"${f.name},omitempty"\``;
            default:
                return `${this.capitalizeFirstLetter(f.name).padEnd(nameMaxLength, ' ')} ${pointerMode ? '*' : ''}${builtType.padEnd(typeMaxLength, ' ')} \`json:"${f.name},omitempty"\``;
        }
    }
    // noinspection JSUnusedLocalSymbols
    protected async buildQueriesFileContent(def: sdk_service_definition, vars: any) {
        const queries = this.sortQueries(def.queries!);
        return `
package ${vars.packageName}

type q struct {
\tquery      string
\tselections Selections
}

var Queries = map[string]q{
${queries.map(([_, q]) => {
            return `\t"${q.name}": {\n\t\t${this.buildsQueries(q)},\n\t\tSelections{Fields: ${this.buildQueryFields(q.fields)}},\n\t},`
        }).join("\n")}
}`.trim();
    }
    // noinspection JSUnusedLocalSymbols
    protected async buildInputsFileContent(def: sdk_service_definition, vars: any) {
        return this.buildTypesFileContent(def.inputs || {}, true);
    }
    // noinspection JSUnusedLocalSymbols
    protected async buildModelsFileContent(def: sdk_service_definition, vars: any) {
        return this.buildTypesFileContent(def.models || {});
    }
    protected capitalizeFirstLetter(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    protected buildTypeFields(o, n, prefix, pointerMode = false) {
        const entries = Object.entries(o || {});
        const mappedEntries = entries.map(([k, v]: [string, any]) => {
            const tt = this.buildFieldTypes(v);
            return [k, v, k.length, tt, tt.length]
        })
        const [nameMaxLength, typeMaxLength] = mappedEntries.reduce((acc, [k, v, kLen, tt, ttLen]) => {
            if (kLen > acc[0]) acc[0] = kLen;
            if (ttLen > acc[1]) acc[1] = ttLen;
            return acc;
        }, [0, 0]);
        return `${mappedEntries.map(([_, f, __, tt]) => this.buildFieldsNamesAndTypes(f, tt, n, nameMaxLength, typeMaxLength, pointerMode)).map(x => `${prefix || ''}${x}`).join("\n")}`;
    }
    protected buildsQueries(o) {
        return `"${o.type}(${this.buildArgs(o.args, true)}) { ${o.name}(${this.buildArgs(o.args)}) { @selections@ } }"`;
    }
    protected buildArgs(o, first = false) {
        return first ? `${Object.entries(o || {}).map(([_, a]: any[]) => `$${a.name}: ${a.gqlType}${a.required ? '!' : ''}`).join(", ")}`
            : `${Object.entries(o || {}).map(([_, a]: any[]) => `${a.name}: $${a.name}`).join(", ")}`;
    }
    protected buildQueryFields(o) {
        return `[]string{${Object.entries(o || {}).filter(([_, f]: any[]) => !!f.primitive).map(([_, f]: any[]) => `"${f.name}"`).join(", ")}}`;
    }
    protected buildFieldTypes(f, nonPrimitivePrefix = '') {
        const primitives = {
            Int: 'int',
            String: 'string',
            BigInt: 'int64',
            Boolean: 'bool',
            Float: 'float64',
            ID: 'string',
            unknown: 'interface{}',
        }
        if (f.primitive) {
            if (f.list) {
                return `[]${primitives[f.gqlType] || primitives['unknown']}`;
            }
            return primitives[f.gqlType] || primitives['unknown'];
        }
        if (f.list) return `[]${nonPrimitivePrefix || ''}${f.gqlType}`
        return `${nonPrimitivePrefix || ''}${f.gqlType}`;
    }
    protected buildSdkArgs(o) {
        const args = Object.entries(o || {}).map(([_, f]: any[]) => `${this.convertVarName(f.name)} ${this.buildFieldTypes(f, 'types.')}`);
        return `${args.join(", ")}${args.length ? ', ' : ''}fields Selections`;
    }
    protected buildSdkMethodReturnType(o) {
        return `(*${this.buildFieldTypes(o, 'types.')}, error)`;
    }
    protected buildResponseStructNameFromMethod(methodName, vars) {
        let structName = `${methodName.slice(0, 1).toUpperCase()}${methodName.slice(1)}Response`;
        const forcedName: string|undefined = vars?.methodResponseMap?.[structName];
        return forcedName || structName;
    }
    protected buildSdkMethodReturnTypeDefinition(methodName, q: sdk_service_definition_method, def: sdk_service_definition, vars) {
        const prefix = `${methodName.slice(0, 1).toUpperCase()}${methodName.slice(1)}`;
        const structName = this.buildResponseStructNameFromMethod(methodName, vars);
        return `type ${structName} struct {
\t${prefix} ${q.returnType.type} \`json:"${methodName}"\`
}`;
    }
    protected sortQueries(q: sdk_service_definition_queries) {
        return Object.entries(q || {}).sort(([aS, a], [_, b]) => a.name.localeCompare(b.name))
    }
    protected sortMethods(q: sdk_service_definition_methods) {
        return Object.entries(q || {}).sort(([aS, a], [_, b]) => a.name.localeCompare(b.name))
    }
}

// noinspection JSUnusedGlobalSymbols
export default GoGraphqlSdkSourceCodeGenerator;