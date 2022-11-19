import {
    sdk_service_definition,
    sdk_service_definition_inputs,
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
        // @ts-ignore
        const sdkFileContent = await this.buildSdkFileContent(def, vars);
        return {
            'LICENSE.md': r,
            'README.md': r,
            '.gitignore': r,
            'go.mod': r,
            'cmd/main/queries.go': () => queriesFileContent,
            'cmd/main/types/inputs.go': () => inputsFileContent,
            'cmd/main/types/models.go': () => modelsFileContent,
            'cmd/main/sdk.go': () => sdkFileContent,
        };
    }
    // noinspection JSUnusedLocalSymbols
    protected async buildSdkFileContent(def: sdk_service_definition, vars: any) {
        const queries = this.sortQueries(def.queries!);
        return `
package main

import "github.com/gotombola/core-sdk-go/cmd/main/types"

type Sdk struct {
	Env string
}

${queries.map(([_, q]) => {
            return `func (s *Sdk) ${this.capitalizeFirstLetter(q.name)}(${this.buildSdkArgs(q.args)}) (bool, error) {
    Build${this.capitalizeFirstLetter(q.name)}.Query
    return true, nil
}`
        }).join("\n")}
`.trim();
    }

    protected async buildTypesFileContent(def: sdk_service_definition_inputs | sdk_service_definition_models) {
        return `
package types

${Object.entries(def).map(([_, q]) => {
            return `//goland:noinspection GoUnusedExportedType
type ${this.capitalizeFirstLetter(q.name)} struct {
    ${this.buildTypeFields(q.fields, q.name)}
}`;
        }).join("\n")}
`.trim();
    }
    protected buildFieldsNamesAndTypes(f, n) {
        switch (true) {
            case f.primitive:
                return `${this.capitalizeFirstLetter(f.name)} ${this.buildFieldTypes(f)} \`json:"${f.name}"\``;
            case f.list:
                return `${this.capitalizeFirstLetter(f.name)} ${this.buildFieldTypes(f)} \`json:"${f.name}"\``;
            case n === f.gqlType:
                return `${this.capitalizeFirstLetter(f.name)} *${this.buildFieldTypes(f)} \`json:"${f.name}"\``;
            default:
                return `${this.capitalizeFirstLetter(f.name)} ${this.buildFieldTypes(f)} \`json:"${f.name}"\``;
        }
    }
    // noinspection JSUnusedLocalSymbols
    protected async buildQueriesFileContent(def: sdk_service_definition, vars: any) {
        const queries = this.sortQueries(def.queries!);
        return `
package main

type QueryAndFields struct {
    Query string
    Fields []string
}

${queries.map(([_, q]) => {
            return `var Build${this.capitalizeFirstLetter(q.name)} = QueryAndFields{${this.buildsQueries(q)}, ${this.buildQueryFields(q.fields)}}`
        }).join("\n")}
`.trim();
    }
    // noinspection JSUnusedLocalSymbols
    protected async buildInputsFileContent(def: sdk_service_definition, vars: any) {
        return this.buildTypesFileContent(def.inputs || {});
    }
    // noinspection JSUnusedLocalSymbols
    protected async buildModelsFileContent(def: sdk_service_definition, vars: any) {
        return this.buildTypesFileContent(def.models || {});
    }
    protected capitalizeFirstLetter(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    protected buildTypeFields(o, n) {
        return `${Object.entries(o || {}).map(([_, f]) => this.buildFieldsNamesAndTypes(f, n)).join("\n\t")}`;
    }
    protected buildsQueries(o) {
        return `"${o.type}(${this.buildArgs(o.args, true)}) { ${o.name}(${this.buildArgs(o.args)}) { @selections@ } }"`;
    }
    protected buildArgs(o, first = false) {
        return first ? `${Object.entries(o || {}).map(([_, a]: any[]) => `$${a.name}: ${a.gqlType}${a.required ? '!' : ''}`).join(", ")}`
            : `${Object.entries(o || {}).map(([_, a]: any[]) => `${a.name}: $${a.name}`).join(", ")}`;
    }
    protected buildQueryFields(o) {
        return `[]string{${Object.entries(o || {}).map(([_, f]: any[]) => `"${f.name}"`).join(", ")}}`;
    }
    protected buildFieldTypes(f) {
        const primitives = {
            Int: 'int',
            String: 'string',
            BigInt: 'int',
            Boolean: 'bool',
            Float: 'float64',
            ID: 'string',
            unknown: 'unknown',
        }
        if (f.primitive) return primitives[f.gqlType]
        if (f.list) return `[]${f.gqlType}`
        return f.gqlType
    }
    protected buildSdkArgs(o) {
        return `${Object.entries(o || {}).map(([_, f]: any[]) => `${f.name} ${this.buildFieldTypes(f)}`).join(", ")}`;
    }
    protected sortQueries(q: sdk_service_definition_queries) {
        return Object.entries(q || {}).sort(([aS, a], [_, b]) => b.type.localeCompare(a.type) || a.name.localeCompare(b.name))
    }
}

// noinspection JSUnusedGlobalSymbols
export default GoGraphqlSdkSourceCodeGenerator;