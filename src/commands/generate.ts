import {generate} from '../utils/generate';
import buildAvailableGenerators from "../utils/buildAvailableGenerators";

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
        availableCodeGenerators: buildAvailableGenerators(
            {
                graphql: [
                    'cpp', 'csharp', 'go', 'java', 'javascript', 'kotlin', 'php', 'python', 'ruby', 'rust',
                    'swift', 'typescript', 'scala', 'objc', 'dart', 'lua', 'r', 'elixir', 'haskell', 'erlang',
                ],
            },
            {
                graphql: 'typescript',
            },
        )
    });
}