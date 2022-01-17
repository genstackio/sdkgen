import {code_generator_options} from "./types";
import AbstractCodeGenerator from "./AbstractCodeGenerator";
import fetch from 'cross-fetch';
import {readFileSync} from 'fs';
import {buildClientSchema} from "graphql";

export abstract class AbstractGraphQLSourceCodeGenerator extends AbstractCodeGenerator {
    protected definition: any|undefined;
    constructor(options: code_generator_options) {
        super(options);
        this.definition = undefined;
    }
    protected abstract buildEndpointFromSource(source: string): string;
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
}

export default AbstractGraphQLSourceCodeGenerator;