import {sdk_service_definition} from "../../types";
import AbstractGraphQLSdkSourceCodeGenerator from "../../AbstractGraphQLSdkSourceCodeGenerator";

export class RubyGraphqlSdkSourceCodeGenerator extends AbstractGraphQLSdkSourceCodeGenerator {
    public getLanguage() {
        return 'ruby';
    }
    protected async buildDynamicFilesFromServiceDefAndVars(def: sdk_service_definition, vars: any, r: Function) {
        return {
            'LICENSE.md': r,
            'README.md': r,
            'Gemfile': r,
        };
    }
}

// noinspection JSUnusedGlobalSymbols
export default RubyGraphqlSdkSourceCodeGenerator;