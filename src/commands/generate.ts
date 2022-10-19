import {generate} from '../utils/generate';
import GenericTypescriptSdkGraphQLSourceCodeGenerator from "../GenericTypescriptSdkGraphQLSourceCodeGenerator";
import GenericGoSdkGraphQLSourceCodeGenerator from "../GenericgoSdkGraphQLSourceCodeGenerator";

export const command = ['generate', '$0'];

export const describe = 'generate specified sdk source code in the specified target directory'

export const builder = {
    env: {
        default: 'prod',
    },
    config: {
        default: '<target>/.sdkgen.yml',
    },
    target: {
        default: '.',
    }
}

export const handler = async argv => {
    await generate({
        config: ('string' === typeof argv.config) ? argv.config.replace('<target>', argv.target) : argv.config,
        source: argv.env,
        target: argv.target,
        availableCodeGenerators: {
            default: GenericTypescriptSdkGraphQLSourceCodeGenerator,
            default__typescript: GenericTypescriptSdkGraphQLSourceCodeGenerator,
            default__go: GenericGoSdkGraphQLSourceCodeGenerator,
        }
    });
}