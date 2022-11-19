import {sdk_service_definition} from "../../types";
import AbstractGraphQLSdkSourceCodeGenerator from "../../AbstractGraphQLSdkSourceCodeGenerator";

export class HaskellGraphqlSdkSourceCodeGenerator extends AbstractGraphQLSdkSourceCodeGenerator {
    public getLanguage() {
        return 'haskell';
    }
    protected async buildDynamicFilesFromServiceDefAndVars(def: sdk_service_definition, vars: any, r: Function) {
        return {
            'LICENSE.md': r,
            'README.md': r,
        };
    }
}

// noinspection JSUnusedGlobalSymbols
export default HaskellGraphqlSdkSourceCodeGenerator;