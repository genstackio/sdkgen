import AbstractGoSdkGraphQLSourceCodeGenerator from "./AbstractGoSdkGraphQLSourceCodeGenerator";
import {code_generator_options} from "./types";

export class GenericGoSdkGraphQLSourceCodeGenerator extends AbstractGoSdkGraphQLSourceCodeGenerator {
    protected readonly defaultVars: any;
    protected readonly envs: any;
    constructor({vars, envs = {}, ...options}: code_generator_options & {vars?: any, envs?: any}) {
        super(options);
        this.defaultVars = {envs, ...vars};
        this.envs = envs;
    }
    protected buildEndpointFromSource(source: string): string {
        return ((this.envs[source] || this.envs['default'] || {})['graphql'] || 'http://localhost:4000').replace(/\{\{source\}\}/g, source);
    }
    protected async buildDefaultVars(): Promise<{[key: string]: any}> {
        return this.defaultVars;
    }
}

// noinspection JSUnusedGlobalSymbols
export default GenericGoSdkGraphQLSourceCodeGenerator;