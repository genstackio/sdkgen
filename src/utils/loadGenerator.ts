import {code_generator_options} from '../types';
import ICodeGenerator from "../ICodeGenerator";

export async function loadGenerator(options: code_generator_options): Promise<ICodeGenerator> {
    const {template, language, availableCodeGenerators = {}} = options;

    const tries = [
        `${template}--${language}`.replace(/-/g, '_'),
        `default--${language}`.replace(/-/g, '_'),
        `${template}--default`.replace(/-/g, '_'),
        'default',
    ];

    const name = tries.find((k: string) => !!availableCodeGenerators[k]);

    if (!name) throw new Error(`Unknown code generator '${template}' for language '${language}'`);

    const g = availableCodeGenerators[name];

    const generator = new g(options);

    if (('undefined' === typeof generator.generate) || ('undefined' === typeof generator.getOptions)) {
        throw new Error(`Generator (name: ${name}, class: ${g}) is not an instance of ICodeGenerator`);
    }

    return generator;
}

// noinspection JSUnusedGlobalSymbols
export default loadGenerator;