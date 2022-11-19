import {sdk_service_definition} from "../../types";
import AbstractGraphQLSdkSourceCodeGenerator from "../../AbstractGraphQLSdkSourceCodeGenerator";

export class SwiftGraphqlSdkSourceCodeGenerator extends AbstractGraphQLSdkSourceCodeGenerator {
    public getLanguage() {
        return 'swift';
    }
    protected async buildDynamicFilesFromServiceDefAndVars(def: sdk_service_definition, vars: any, r: Function) {
        return {
            'LICENSE.md': r,
            'README.md': r,
            'Package.swift': r,
        };
    }
}

// noinspection JSUnusedGlobalSymbols
export default SwiftGraphqlSdkSourceCodeGenerator;